import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { type Request } from 'express';
import { type Actor, GUEST_ACTOR, type Role } from '@kelvin/contracts';

import { RedisService } from '../../../shared/redis/redis.service';
import { CLS_ACTOR, CLS_IP, CLS_USER_AGENT } from '../../../shared/context/request-context';
import { AccessTokenService } from '../token/access-token.service';
import { IS_OPTIONAL_AUTH_KEY, IS_PUBLIC_KEY } from '../../../shared/auth/auth.decorators';

/**
 * Autentifikatsiya guard (global).
 *
 * - `@Public()` → aktor = GUEST, token talab qilinmaydi.
 * - Aks holda: `Authorization: Bearer <jwt>` majburiy.
 *
 * ⚠️ Privilegiyali rollar (OWNER/ADMIN/ACCOUNTANT) uchun Redis deny-list
 *    tekshiriladi — `logout-all` va reuse'dan keyin access token'ning qolgan
 *    15 daqiqasini yopish uchun. Oddiy mijoz uchun tekshirilmaydi (ataylab —
 *    docs/11-security.md §2.5 trade-off).
 */
const PRIVILEGED_ROLES: ReadonlySet<Role> = new Set<Role>(['OWNER', 'ADMIN', 'ACCOUNTANT']);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly access: AccessTokenService,
    private readonly cls: ClsService,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { actor?: Actor }>();
    this.captureContext(request);

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.setActor(request, GUEST_ACTOR);
      return true;
    }

    const token = this.extractBearer(request);
    if (!token) {
      // Ixtiyoriy auth: token yo'q → mehmon sifatida davom etadi (401 emas).
      const isOptional = this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_AUTH_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (isOptional) {
        this.setActor(request, GUEST_ACTOR);
        return true;
      }
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED' });
    }

    const payload = await this.access.verify(token);

    if (await this.isRevoked(payload.sub, payload.roles, payload.iat)) {
      throw new UnauthorizedException({ code: 'TOKEN_INVALID' });
    }

    this.setActor(request, {
      userId: payload.sub,
      roles: payload.roles,
      ...(payload.cid !== undefined && { customerId: payload.cid }),
    });
    return true;
  }

  private setActor(request: { actor?: Actor }, actor: Actor): void {
    request.actor = actor;
    this.cls.set(CLS_ACTOR, actor);
  }

  private captureContext(request: Request): void {
    const ip = request.ip ?? request.socket.remoteAddress;
    const userAgent = request.headers['user-agent'];
    if (ip !== undefined) {
      this.cls.set(CLS_IP, ip);
    }
    if (typeof userAgent === 'string') {
      this.cls.set(CLS_USER_AGENT, userAgent);
    }
  }

  private extractBearer(request: Request): string | null {
    const header = request.headers.authorization;
    if (typeof header !== 'string') {
      return null;
    }
    const [scheme, value] = header.split(' ');
    return scheme === 'Bearer' && value ? value : null;
  }

  private async isRevoked(
    userId: string,
    roles: readonly Role[],
    issuedAt: number | undefined,
  ): Promise<boolean> {
    if (issuedAt === undefined || !roles.some((r) => PRIVILEGED_ROLES.has(r))) {
      return false;
    }
    const cutoff = await this.redis.get(`denylist:user:${userId}`);
    return cutoff !== null && issuedAt < Number(cutoff);
  }
}
