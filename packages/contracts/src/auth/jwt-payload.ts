/**
 * Access token payload.
 *
 * JWT — base64, SHIFRLANMAGAN. Kim ko'rsa o'qiy oladi → shaxsiy ma'lumot
 * (telefon, ism, email) BU YERGA TUSHMAYDI (docs/11-security.md §2.3).
 *
 * Huquqlar (permissions) ham saqlanmaydi — faqat `roles`. Sabab: huquq
 * o'zgarsa, token'dagi ro'yxat 15 daqiqa eskirgan bo'ladi. Huquqlar
 * serverda rol'dan hisoblanadi.
 *
 * @see docs/11-security.md §2.3
 * @see docs/04-api-spec.md §5
 */
import type { Role } from '../rbac/permissions';

export interface AccessTokenPayload {
  /** User.id (UUID v7) */
  readonly sub: string;
  /** Foydalanuvchi rollari (Prisma `UserRole[]`). */
  readonly roles: readonly Role[];
  /** Refresh oila identifikatori — reuse detection uchun (docs/11 §2.4). */
  readonly fid: string;
  /** Bog'langan Customer.id (agar mavjud bo'lsa). */
  readonly cid?: string | undefined;
  readonly iat?: number;
  readonly exp?: number;
}

/** `/auth/*` javoblaridagi foydalanuvchi ko'rinishi (UI qulayligi uchun). */
export interface AuthUserView {
  readonly id: string;
  readonly roles: readonly Role[];
  /** UI tugmalarini yashirish uchun. Server BUNGA ISHONMAYDI. */
  readonly permissions: readonly string[];
}

export interface AuthTokensResponse {
  readonly accessToken: string;
  readonly expiresIn: number;
  readonly user: AuthUserView;
}

/**
 * Kod yuborilgandagi javob (`/auth/register`, `/auth/otp/resend`). Email
 * mavjudligidan QAT'I NAZAR bir xil — enumeration himoyasi (docs/11 §2.7).
 * ⚠️ Kod javobda HECH QACHON qaytmaydi — faqat email orqali.
 */
export interface OtpRequestResponse {
  /** Kod amal qilish muddati (soniya). */
  readonly expiresIn: number;
  /** Qayta yuborishgacha kutish (soniya). */
  readonly resendAfter: number;
}
