import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Actor, anyRoleHasPermission, type Permission } from '@kelvin/contracts';

import { IS_PUBLIC_KEY, REQUIRED_PERMISSIONS_KEY } from '../../../shared/auth/auth.decorators';

/**
 * Avtorizatsiya guard (global) — DENY BY DEFAULT.
 *
 * - `@Public()` → o'tkaziladi.
 * - `@RequirePermission(a, b)` → aktor rollaridan biri a YOKI b ga ega bo'lsa.
 * - `@Authenticated()` → bo'sh ro'yxat, faqat autentifikatsiya yetarli.
 * - Hech qanday belgi yo'q → **RAD ETILADI** (403). Endpoint ochiq qolib
 *   ketmasligi kafolatlanadi. docs/01-product-spec.md §4.5
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<Permission[] | undefined>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Belgisiz endpoint — deny by default.
    if (required === undefined) {
      throw new ForbiddenException({ code: 'PERMISSION_DENIED' });
    }

    // Bo'sh ro'yxat (@Authenticated) — autentifikatsiya JwtAuthGuard'da bo'lgan.
    if (required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ actor?: Actor }>();
    const roles = request.actor?.roles ?? [];

    const allowed = required.some((permission) => anyRoleHasPermission(roles, permission));
    if (!allowed) {
      throw new ForbiddenException({ code: 'PERMISSION_DENIED' });
    }
    return true;
  }
}
