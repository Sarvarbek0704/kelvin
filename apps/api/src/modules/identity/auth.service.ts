import { Injectable, UnauthorizedException } from '@nestjs/common';
import { type AuthUserView, type Role, permissionsFor } from '@kelvin/contracts';

import { AuditService } from '../../shared/audit/audit.service';
import { RedisService } from '../../shared/redis/redis.service';
import { PasswordService } from './password/password.service';
import { AccessTokenService } from './token/access-token.service';
import { RefreshTokenRepository, type RefreshContext } from './token/refresh-token.repository';
import { IdentityRepository, type UserWithAuth } from './identity.repository';

/** Servis natijasi — controller `rawRefreshToken` ni cookie'ga o'tkazadi. */
export interface AuthResult {
  readonly accessToken: string;
  readonly expiresIn: number;
  readonly rawRefreshToken: string;
  readonly user: AuthUserView;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly identity: IdentityRepository,
    private readonly password: PasswordService,
    private readonly access: AccessTokenService,
    private readonly refresh: RefreshTokenRepository,
    private readonly audit: AuditService,
    private readonly redis: RedisService,
  ) {}

  private rolesOf(user: UserWithAuth): Role[] {
    return user.roles.map((r) => r.role);
  }

  /** Rolga ega faol foydalanuvchilar — tanlash ro'yxatlari (masalan lidga sotuvchi). */
  async listUsersByRole(role: Role): Promise<{ id: string; name: string }[]> {
    const users = await this.identity.findActiveUsersByRole(role);
    return users.map((u) => ({ id: u.id, name: u.email ?? u.phone ?? u.id }));
  }

  private userView(userId: string, roles: readonly Role[]): AuthUserView {
    return {
      id: userId,
      roles,
      permissions: [...permissionsFor(roles)],
    };
  }

  /**
   * Parol bilan kirish.
   *
   * ⚠️ Enumeration himoyasi: "foydalanuvchi yo'q" va "parol xato" — bir xil
   *    javob (401 UNAUTHENTICATED). docs/11-security.md §2.7
   */
  async login(identifier: string, plainPassword: string, ctx: RefreshContext): Promise<AuthResult> {
    const user = await this.identity.findByIdentifier(identifier);

    // Vaqt bo'yicha sizishni kamaytirish uchun: user bo'lmasa ham xesh tekshiramiz.
    const hash = user?.passwordHash ?? DUMMY_HASH;
    const passwordOk = await this.password.verify(hash, plainPassword);

    if (!user?.passwordHash || !passwordOk) {
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED' });
    }

    // user.status — Prisma enum (string literal union). Qiymat importi kerak
    // emas: arxitektura qoidasi (Prisma faqat repository qatlamida).
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED' });
    }

    // Parametrlar oshgan bo'lsa — login paytida (plain qo'limizda) qayta xeshlash.
    if (this.password.needsRehash(user.passwordHash)) {
      const rehashed = await this.password.hash(plainPassword);
      await this.identity.updatePasswordHash(user.id, rehashed);
    }

    const roles = this.rolesOf(user);
    const rotation = await this.refresh.issueForLogin(user.id, roles, user.customer?.id, ctx);

    const accessToken = await this.access.sign({
      sub: user.id,
      roles,
      fid: rotation.familyId,
      ...(user.customer?.id !== undefined && { cid: user.customer.id }),
    });

    await this.identity.touchLogin(user.id, ctx.ip);
    await this.audit.record({
      action: 'AUTH_LOGIN',
      resourceType: 'User',
      resourceId: user.id,
      actorUserId: user.id,
    });

    return {
      accessToken,
      expiresIn: this.access.expiresInSeconds,
      rawRefreshToken: rotation.rawRefreshToken,
      user: this.userView(user.id, roles),
    };
  }

  /**
   * Mijoz ro'yxatdan o'tishi (self-service) — User(ACTIVE)+CUSTOMER+Customer
   * yaratadi va DARHOL kirgizadi (token qaytaradi). Telefon band → 409.
   */
  async register(
    input: { phone: string; password: string; firstName?: string; lastName?: string; email?: string },
    ctx: RefreshContext,
  ): Promise<AuthResult> {
    const passwordHash = await this.password.hash(input.password);
    const user = await this.identity.createCustomerUser({
      phone: input.phone,
      passwordHash,
      ...(input.firstName !== undefined && { firstName: input.firstName }),
      ...(input.lastName !== undefined && { lastName: input.lastName }),
      ...(input.email !== undefined && { email: input.email }),
    });

    const roles = this.rolesOf(user);
    const rotation = await this.refresh.issueForLogin(user.id, roles, user.customer?.id, ctx);
    const accessToken = await this.access.sign({
      sub: user.id,
      roles,
      fid: rotation.familyId,
      ...(user.customer?.id !== undefined && { cid: user.customer.id }),
    });

    await this.audit.record({
      action: 'AUTH_REGISTER',
      resourceType: 'User',
      resourceId: user.id,
      actorUserId: user.id,
    });

    return {
      accessToken,
      expiresIn: this.access.expiresInSeconds,
      rawRefreshToken: rotation.rawRefreshToken,
      user: this.userView(user.id, roles),
    };
  }

  /** Refresh — rotatsiya (eski bekor, yangi juftlik). */
  async refreshTokens(rawToken: string, ctx: RefreshContext): Promise<AuthResult> {
    const rotation = await this.refresh.rotate(rawToken, ctx);
    const accessToken = await this.access.sign({
      sub: rotation.userId,
      roles: rotation.roles,
      fid: rotation.familyId,
      ...(rotation.customerId !== undefined && { cid: rotation.customerId }),
    });
    return {
      accessToken,
      expiresIn: this.access.expiresInSeconds,
      rawRefreshToken: rotation.rawRefreshToken,
      user: this.userView(rotation.userId, rotation.roles),
    };
  }

  async logout(rawToken: string): Promise<void> {
    await this.refresh.revokeByToken(rawToken);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refresh.revokeAllForUser(userId);
    // Privilegiyali rollarning qolgan access tokenlarini yopish uchun
    // deny-list — bu vaqtdan oldin berilgan token rad etiladi (§2.5).
    const nowSeconds = Math.floor(Date.now() / 1000);
    await this.redis.set(`denylist:user:${userId}`, nowSeconds, 'EX', this.access.expiresInSeconds);
    await this.audit.record({
      action: 'AUTH_LOGOUT_ALL',
      resourceType: 'User',
      resourceId: userId,
      actorUserId: userId,
    });
  }

  async me(userId: string): Promise<AuthUserView> {
    const user = await this.identity.findById(userId);
    if (!user) {
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED' });
    }
    return this.userView(user.id, this.rolesOf(user));
  }
}

/**
 * Foydalanuvchi topilmaganda ham argon2.verify chaqirish uchun — vaqt
 * bo'yicha sizishni kamaytiradi. Bu real "password123" xeshi EMAS, hech
 * qachon mos kelmaydi.
 */
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$RdescudvJCsgt3ub+b+dWRWJTmaaJObGVJjY5PxXqXk';
