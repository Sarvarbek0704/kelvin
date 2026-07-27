import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserStatus } from '@prisma/client';
import { type Role } from '@kelvin/contracts';
import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { type AppConfig } from '../../../config/configuration';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { AuditService } from '../../../shared/audit/audit.service';
import { parseTtlSeconds } from './access-token.service';

export interface RefreshContext {
  readonly ip?: string | undefined;
  readonly userAgent?: string | undefined;
}

/** Access token yasash uchun kerakli da'volar + yangi xom refresh token. */
export interface RotationResult {
  readonly userId: string;
  readonly roles: readonly Role[];
  readonly familyId: string;
  readonly customerId?: string | undefined;
  readonly rawRefreshToken: string;
}

/**
 * Rotatsiya natijasi — tranzaksiya ICHIDA throw QILMAYMIZ (rollback oila
 * bekorini yo'qotadi). Marker qaytariladi, tashqarida hal qilinadi.
 */
type RotateOutcome =
  | { kind: 'ok'; result: RotationResult }
  | { kind: 'invalid' }
  | { kind: 'expired' }
  | { kind: 'inactive'; familyId: string }
  | {
      kind: 'reuse';
      familyId: string;
      tokenId: string;
      userId: string;
      originallyUsedAt: string | null;
      alreadyRevoked: boolean;
    };

/**
 * Refresh token — rotation + reuse detection.
 *
 * ⚠️ SERIALIZABLE tranzaksiya SHART: `READ COMMITTED` da ikki parallel so'rov
 *    bir tokenni ishlatsa IKKALASI ham o'tadi va reuse ANIQLANMAYDI.
 *    docs/11-security.md §2.4
 *
 * ⚠️ 40001 (serialization failure) da KO'R-KO'RONA RETRY QILINMAYDI — bu reuse
 *    hujumining o'zi bo'lishi mumkin. → 401, mijoz qayta login qiladi.
 */
@Injectable()
export class RefreshTokenRepository {
  private readonly ttlSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    config: ConfigService<AppConfig, true>,
  ) {
    this.ttlSeconds = parseTtlSeconds(config.get('jwt', { infer: true }).refreshTtl);
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generate(): string {
    // 32 bayt CSPRNG = 256 bit entropiya.
    return randomBytes(32).toString('base64url');
  }

  private expiryDate(): Date {
    return new Date(Date.now() + this.ttlSeconds * 1000);
  }

  private mapRoles(roles: { role: Role }[]): Role[] {
    return roles.map((r) => r.role);
  }

  /** Yangi login — yangi OILA (familyId) ochadi, birinchi tokenni yozadi. */
  async issueForLogin(
    userId: string,
    roles: readonly Role[],
    customerId: string | undefined,
    ctx: RefreshContext,
  ): Promise<RotationResult> {
    const familyId = randomUUID();
    const raw = this.generate();
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hash(raw),
        userId,
        familyId,
        expiresAt: this.expiryDate(),
        ...(ctx.ip !== undefined && { ipAddress: ctx.ip }),
        ...(ctx.userAgent !== undefined && { userAgent: ctx.userAgent }),
      },
    });
    return {
      userId,
      roles,
      familyId,
      ...(customerId !== undefined && { customerId }),
      rawRefreshToken: raw,
    };
  }

  async rotate(rawToken: string, ctx: RefreshContext): Promise<RotationResult> {
    const tokenHash = this.hash(rawToken);

    let outcome: RotateOutcome;
    try {
      outcome = await this.prisma.$transaction(
        async (tx): Promise<RotateOutcome> => {
          const existing = await tx.refreshToken.findUnique({
            where: { tokenHash },
            include: { user: { include: { roles: true, customer: { select: { id: true } } } } },
          });

          // 1. Umuman mavjud emas — soxta token yoki tozalangan.
          if (!existing) {
            return { kind: 'invalid' };
          }

          // 2. REUSE DETECTION — ishlatilgan/bekor qilingan token qayta keldi.
          //    ⚠️ Bu yerda YOZMAYMIZ va THROW QILMAYMIZ: throw tranzaksiyani
          //       rollback qiladi va oila bekori yo'qoladi. Revoke + audit
          //       tranzaksiyadan TASHQARIDA (durable) bajariladi.
          if (existing.usedAt !== null || existing.revokedAt !== null) {
            return {
              kind: 'reuse',
              familyId: existing.familyId,
              tokenId: existing.id,
              userId: existing.userId,
              originallyUsedAt: existing.usedAt?.toISOString() ?? null,
              alreadyRevoked: existing.revokedAt !== null,
            };
          }

          // 3. Muddati o'tgan.
          if (existing.expiresAt <= new Date()) {
            return { kind: 'expired' };
          }

          // 4. Foydalanuvchi o'chirilgan / faol emas.
          if (existing.user.deletedAt !== null || existing.user.status !== UserStatus.ACTIVE) {
            return { kind: 'inactive', familyId: existing.familyId };
          }

          // 5. Normal rotatsiya — oila MEROS QILINADI (atomik: yangi + eski).
          const newRaw = this.generate();
          await tx.refreshToken.create({
            data: {
              tokenHash: this.hash(newRaw),
              userId: existing.userId,
              familyId: existing.familyId,
              expiresAt: this.expiryDate(),
              ...(ctx.ip !== undefined && { ipAddress: ctx.ip }),
              ...(ctx.userAgent !== undefined && { userAgent: ctx.userAgent }),
            },
          });
          await tx.refreshToken.update({
            where: { id: existing.id },
            data: { usedAt: new Date(), revokedAt: new Date() },
          });

          const customerId = existing.user.customer?.id;
          return {
            kind: 'ok',
            result: {
              userId: existing.userId,
              roles: this.mapRoles(existing.user.roles),
              familyId: existing.familyId,
              ...(customerId !== undefined && { customerId }),
              rawRefreshToken: newRaw,
            },
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 5_000 },
      );
    } catch (err) {
      // Serialization failure (P2034) — parallel refresh. RETRY QILINMAYDI → 401.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
        throw new UnauthorizedException({ code: 'TOKEN_INVALID' });
      }
      throw err;
    }

    // --- Tranzaksiyadan tashqari: durable revoke + audit + xato -------------
    switch (outcome.kind) {
      case 'ok':
        return outcome.result;
      case 'invalid':
        throw new UnauthorizedException({ code: 'TOKEN_INVALID' });
      case 'expired':
        throw new UnauthorizedException({ code: 'TOKEN_EXPIRED' });
      case 'inactive':
        await this.revokeFamily(this.prisma, outcome.familyId);
        throw new UnauthorizedException({ code: 'TOKEN_INVALID' });
      case 'reuse':
        // Butun oila bekor qilinadi — hujumchi ham, foydalanuvchi ham chiqadi.
        await this.revokeFamily(this.prisma, outcome.familyId);
        await this.audit.record({
          action: 'AUTH_REFRESH_REUSE_DETECTED',
          resourceType: 'RefreshToken',
          resourceId: outcome.tokenId,
          actorUserId: outcome.userId,
          after: {
            familyId: outcome.familyId,
            originallyUsedAt: outcome.originallyUsedAt,
            alreadyRevoked: outcome.alreadyRevoked,
          },
        });
        throw new UnauthorizedException({ code: 'REFRESH_TOKEN_REUSED' });
    }
  }

  /** Bitta tokenni bekor qilish (logout). Topilmasa — jim (idempotent). */
  async revokeByToken(rawToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hash(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Foydalanuvchining barcha aktiv tokenlari (logout-all). */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async revokeFamily(
    client: PrismaService | Prisma.TransactionClient,
    familyId: string,
  ): Promise<void> {
    await client.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
