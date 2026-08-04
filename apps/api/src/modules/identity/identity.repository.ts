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

  /** Email bo'yicha — rollar va bog'langan mijoz bilan. */
  findByEmail(email: string): Promise<UserWithAuth | null> {
    return this.prisma.user.findFirst({
      where: { deletedAt: null, email },
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

  /** Kod tasdiqlangach: hisob faol + email tasdiqlangan. */
  async activateUser(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE', emailVerified: true },
    });
  }

  /**
   * Ro'yxatdan o'tish (1-qadam) — User (PENDING_VERIFICATION) + CUSTOMER roli +
   * Customer profil. Tasdiqlangan email band → 409. TasdiqlanMAGAN email qayta
   * ro'yxatdan o'tsa — parol/ism yangilanadi (kod yana yuboriladi).
   */
  async upsertPendingCustomer(input: {
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
  }): Promise<UserWithAuth> {
    const existing = await this.prisma.user.findFirst({
      where: { email: input.email, deletedAt: null },
      include: { roles: true, customer: { select: { id: true } } },
    });

    if (existing !== null) {
      if (existing.status !== 'PENDING_VERIFICATION') {
        throw new ConflictError('Bu email allaqachon ro‘yxatdan o‘tgan');
      }
      return await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash: input.passwordHash,
          customer: {
            update: {
              ...(input.firstName !== undefined && { firstName: input.firstName }),
              ...(input.lastName !== undefined && { lastName: input.lastName }),
            },
          },
        },
        include: { roles: true, customer: { select: { id: true } } },
      });
    }

    try {
      return await this.prisma.user.create({
        data: {
          email: input.email,
          passwordHash: input.passwordHash,
          status: 'PENDING_VERIFICATION',
          emailVerified: false,
          roles: { create: { role: 'CUSTOMER' } },
          customer: {
            create: {
              email: input.email,
              ...(input.firstName !== undefined && { firstName: input.firstName }),
              ...(input.lastName !== undefined && { lastName: input.lastName }),
            },
          },
        },
        include: { roles: true, customer: { select: { id: true } } },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictError('Bu email allaqachon ro‘yxatdan o‘tgan');
      }
      throw err;
    }
  }
}
