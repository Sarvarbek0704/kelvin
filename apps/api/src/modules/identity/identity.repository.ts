import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { ConflictError } from '../../core/errors/domain.error';

/** Auth uchun kerakli foydalanuvchi ko'rinishi — rollar va mijoz bilan. */
export type UserWithAuth = Prisma.UserGetPayload<{
  include: { roles: true; customer: { select: { id: true } } };
}>;

/**
 * Foydalanuvchi o'qish — Prisma faqat repository qatlamida
 * (docs/02-architecture.md §4, dependency-cruiser `prisma-only-in-infrastructure`).
 */
@Injectable()
export class IdentityRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Email yoki telefon bo'yicha — rollar va bog'langan mijoz bilan. */
  findByIdentifier(identifier: string): Promise<UserWithAuth | null> {
    return this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ email: identifier }, { phone: identifier }],
      },
      include: { roles: true, customer: { select: { id: true } } },
    });
  }

  findById(userId: string): Promise<UserWithAuth | null> {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { roles: true, customer: { select: { id: true } } },
    });
  }

  /** Global rolga ega FAOL foydalanuvchilar (tanlash ro'yxatlari — masalan sotuvchi). */
  findActiveUsersByRole(role: string): Promise<{ id: string; email: string | null; phone: string | null }[]> {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        roles: { some: { role: role as Prisma.UserRoleCreateInput['role'], scopeType: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } },
      },
      select: { id: true, email: true, phone: true },
      orderBy: { email: 'asc' },
    });
  }

  async touchLogin(userId: string, ip: string | undefined): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date(), ...(ip !== undefined && { lastLoginIp: ip }) },
    });
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  /**
   * Mijoz ro'yxatdan o'tishi — User (ACTIVE) + CUSTOMER roli + Customer profil,
   * bitta tranzaksiya. Telefon/email band → ConflictError (P2002).
   */
  async createCustomerUser(input: {
    phone: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  }): Promise<UserWithAuth> {
    try {
      return await this.prisma.user.create({
        data: {
          phone: input.phone,
          passwordHash: input.passwordHash,
          status: 'ACTIVE',
          phoneVerified: false,
          ...(input.email !== undefined && { email: input.email }),
          roles: { create: { role: 'CUSTOMER' } },
          customer: {
            create: {
              phone: input.phone,
              ...(input.firstName !== undefined && { firstName: input.firstName }),
              ...(input.lastName !== undefined && { lastName: input.lastName }),
              ...(input.email !== undefined && { email: input.email }),
            },
          },
        },
        include: { roles: true, customer: { select: { id: true } } },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictError('Bu telefon yoki email allaqachon ro‘yxatdan o‘tgan');
      }
      throw err;
    }
  }
}
