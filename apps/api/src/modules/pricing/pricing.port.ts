import { type PricedCart } from '../../core/pricing';

/**
 * pricing modulining PUBLIC porti (docs/02 §6.1). Boshqa modullar FAQAT shu
 * fayl orqali murojaat qiladi (arch:check majburlaydi — service.ts import
 * qilinmaydi).
 */

export interface PriceCartLineInput {
  readonly variantId: string;
  readonly quantity: number;
}

export interface PriceCartInput {
  readonly lines: readonly PriceCartLineInput[];
  /** ⚠️ Sana — determinizm/qayta hisoblash uchun. Berilmasa hozir. */
  readonly at?: Date;
  readonly promoCode?: string;
  readonly customerSegment?: string;
  readonly categoryIdByVariant?: Readonly<Record<string, string>>;
}

/** DI tokeni — implementatsiya PricingModule'da bog'lanadi. */
export const PRICING_PORT = Symbol('PricingPort');

export interface PricingPort {
  priceCart(input: PriceCartInput): Promise<PricedCart>;
}
