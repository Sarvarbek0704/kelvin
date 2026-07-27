/**
 * Narx dvigateli — sof tiplar. docs/07 §7 (CANON §9.5).
 *
 * ⚠️ Sof TypeScript (ADR-0001): NestJS'ni ham, Prisma'ni ham bilmaydi.
 * ⚠️ Pul TIYINDA (BigInt) — Float HECH QACHON (ADR-0003).
 */
import { type Currency } from '../money/money';

/**
 * Chegirma qo'llash bosqichlari. Bu tartib QAT'IY (docs/07 §7.2) — har bosqich
 * oldingisining natijasiga qo'llanadi. Raqamlar orasida bo'sh joy (10,20,...)
 * kelajakda oraliq bosqich qo'shish uchun.
 */
export enum DiscountStage {
  BASE = 10,
  BUNDLE = 20,
  PRODUCT_PROMOTION = 30,
  CATEGORY_PROMOTION = 40,
  CUSTOMER_SEGMENT = 50,
  PROMO_CODE = 60,
  CART_LEVEL = 70,
  ROUNDING = 80,
}

/** Savat qatori — bazaviy narx allaqachon yechilgan (service PriceList'dan oladi). */
export interface PricingCartLine {
  readonly variantId: string;
  readonly quantity: number;
  /** Bazaviy birlik narxi, tiyin. */
  readonly unitPrice: bigint;
}

export interface PricingCart {
  readonly lines: readonly PricingCartLine[];
  readonly currency: Currency;
}

/**
 * Baholash konteksti. ⚠️ Sana SHU YERDA (`now()` dan EMAS) — determinizm va
 * qayta hisoblash (audit) uchun (docs/07 §7.2).
 */
export interface PricingContext {
  readonly at: Date;
  readonly promoCode?: string;
  readonly customerSegment?: string;
  /** variantId → categoryId (kategoriya aksiyalari uchun). */
  readonly categoryIdByVariant?: Readonly<Record<string, string>>;
}

/** Har qadam izi — nizoni hal qiladi, audit talabini qondiradi (docs/07 §7.4). */
export interface PricingTraceEntry {
  readonly ruleId: string;
  readonly stage: DiscountStage;
  readonly before: bigint;
  readonly after: bigint;
  readonly delta: bigint;
}

export interface PricedLine {
  readonly variantId: string;
  readonly quantity: number;
  readonly unitPrice: bigint;
  readonly lineTotal: bigint;
}

export interface PricedCart {
  readonly lines: readonly PricedLine[];
  readonly subtotal: bigint;
  readonly discountTotal: bigint;
  readonly totalAmount: bigint;
  readonly trace: readonly PricingTraceEntry[];
}
