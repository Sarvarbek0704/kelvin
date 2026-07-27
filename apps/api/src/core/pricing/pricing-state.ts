import { type PricedCart, type PricedLine, type PricingCart, type PricingTraceEntry } from './pricing.types';

/**
 * Baholash holati — IMMUTABLE. Har qoida yangi PricingState qaytaradi.
 *
 * - `subtotal` — bazaviy qatorlar yig'indisi (BASE'dan keyin o'zgarmaydi).
 * - `total`    — joriy (chegirmalardan keyingi) summa. Chegirmalar `total`ga
 *                ustma-ust qo'llanadi (docs/07 §7.2).
 * - `total` HECH QACHON manfiy emas (withTotal 0'ga kesadi; DB CHECK ham bor).
 */
export class PricingState {
  private constructor(
    readonly lines: readonly PricedLine[],
    readonly subtotal: bigint,
    readonly total: bigint,
  ) {
    Object.freeze(this);
  }

  static fromCart(cart: PricingCart): PricingState {
    const lines: PricedLine[] = cart.lines.map((l) => ({
      variantId: l.variantId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.unitPrice * BigInt(l.quantity),
    }));
    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0n);
    return new PricingState(lines, subtotal, subtotal);
  }

  get discountTotal(): bigint {
    return this.subtotal - this.total;
  }

  /** Yangi total bilan (manfiy → 0). */
  withTotal(total: bigint): PricingState {
    return new PricingState(this.lines, this.subtotal, total < 0n ? 0n : total);
  }

  /** Umumiy chegirmani maxDiscount bilan cheklaydi (docs/07 §7.3). */
  capDiscount(maxDiscount: bigint): PricingState {
    const minTotal = this.subtotal - maxDiscount;
    return this.total < minTotal ? new PricingState(this.lines, this.subtotal, minTotal) : this;
  }

  toPricedCart(trace: readonly PricingTraceEntry[]): PricedCart {
    return {
      lines: this.lines,
      subtotal: this.subtotal,
      discountTotal: this.discountTotal,
      totalAmount: this.total,
      trace,
    };
  }
}
