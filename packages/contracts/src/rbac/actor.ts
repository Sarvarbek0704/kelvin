/**
 * Aktor — so'rovni bajarayotgan sub'ekt.
 *
 * ⚠️ Ruxsat (`hasPermission`) faqat "bu rol umuman qila oladimi" savoliga
 *    javob beradi. "Aynan shu obyektga qila oladimi" — alohida ownership
 *    tekshiruvi (docs/01-product-spec.md §4.5). Ikkisini aralashtirish —
 *    klassik IDOR zaifligi.
 *
 * @see docs/01-product-spec.md §4.5
 * @see docs/11-security.md §3
 */
import type { Role } from './permissions';

export interface Actor {
  readonly userId: string;
  /** Foydalanuvchining barcha rollari (Prisma `UserRole[]`). */
  readonly roles: readonly Role[];
  readonly customerId?: string | undefined;
  readonly courierId?: string | undefined;
  readonly installerId?: string | undefined;
}

/** Anonim (mehmon) aktor — GUEST roli. */
export const GUEST_ACTOR: Actor = { userId: '__guest__', roles: ['GUEST'] };

export type AccessDecision =
  | { readonly allowed: true }
  /** `notFound: true` → `403` emas, `404` qaytariladi (04-api-spec.md §4). */
  | { readonly allowed: false; readonly notFound: boolean };
