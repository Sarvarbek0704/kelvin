import {
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
  applyDecorators,
} from '@nestjs/common';
import { type Actor, type Permission } from '@kelvin/contracts';

/**
 * Auth dekoratorlari — KESUVCHI (cross-cutting), shuning uchun `shared/` da.
 * Har modul controlleri bulardan foydalanadi (dependency-cruiser: modullar
 * bir-birining ichini import qila olmaydi, lekin shared'ni mumkin).
 */

/** Ochiq endpoint — authn/authz o'tkazib yuboriladi (aktor = GUEST). */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Ixtiyoriy autentifikatsiya: token bo'lsa — tekshiriladi va aktor o'rnatiladi;
 * token bo'lmasa — aktor = GUEST (401 emas). Savat/istaklar kabi mehmon ham,
 * mijoz ham kira oladigan endpointlar uchun. ⚠️ Noto'g'ri token BARIBIR 401.
 */
export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth';
export const OptionalAuth = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_OPTIONAL_AUTH_KEY, true);

/** Kerakli ruxsatlar. Ro'yxatdagilardan KAMIDA BITTASI yetarli (any-of). */
export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';
export const RequirePermission = (...permissions: Permission[]): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);

/**
 * Faqat autentifikatsiya kerak, aniq ruxsat emas (masalan, /auth/me).
 * Deny-by-default'dan chiqarish uchun ochiq belgi.
 */
export const Authenticated = (): MethodDecorator & ClassDecorator =>
  applyDecorators(SetMetadata(REQUIRED_PERMISSIONS_KEY, []));

/** Joriy aktorni handler argumentiga inject qiladi. */
export const CurrentActor = createParamDecorator((_data: unknown, ctx: ExecutionContext): Actor => {
  const request = ctx.switchToHttp().getRequest<{ actor?: Actor }>();
  if (!request.actor) {
    throw new Error('CurrentActor: aktor topilmadi — JwtAuthGuard ishlamagan');
  }
  return request.actor;
});
