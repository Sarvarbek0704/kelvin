import { Injectable } from '@nestjs/common';

import { NotFoundError } from '../../core/errors/domain.error';
import { type Currency } from '../../core/money/money';
import {
  DiscountStage,
  PricingEngine,
  type PricedCart,
  type PricingCart,
  type PricingContext,
  fixedDiscountRule,
  percentageDiscountRule,
  type PricingRule,
} from '../../core/pricing';
import { PriceRepository, type DiscountRow } from './price.repository';
import { type PriceCartInput, type PricingPort } from './pricing.port';

interface DiscountConditions {
  readonly minSubtotal?: number;
  readonly categoryIds?: readonly string[];
}

/**
 * pricing — narx dvigateli (docs/07 §7). Bazaviy narxni PriceList'dan yechadi,
 * Discount qatorlarini SOF PricingRule'ga aylantiradi va core PricingEngine'ni
 * chaqiradi. ⚠️ Determinizm dvigatelda kafolatlanadi (§7.2).
 */
@Injectable()
export class PricingService implements PricingPort {
  constructor(private readonly repo: PriceRepository) {}

  async priceCart(input: PriceCartInput): Promise<PricedCart> {
    const at = input.at ?? new Date();

    // 1. Bazaviy narxlar (PriceList priority + validity + ulgurji tier).
    let currency: Currency = 'UZS';
    const lines = await Promise.all(
      input.lines.map(async (line) => {
        const prices = await this.repo.findApplicablePrices(line.variantId, line.quantity, at);
        const winner = prices[0];
        if (winner === undefined) {
          throw new NotFoundError('Narx', line.variantId);
        }
        currency = winner.currency as Currency;
        return { variantId: line.variantId, quantity: line.quantity, unitPrice: winner.amount };
      }),
    );

    const cart: PricingCart = { lines, currency };
    const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * BigInt(l.quantity), 0n);

    // 2. Chegirmalarni qoidalarga aylantirish (shartlar subtotalga bog'liq).
    const discounts = await this.repo.findActiveDiscounts(at);
    const rules = discounts
      .map((d) => this.toRule(d, subtotal, input.categoryIdByVariant))
      .filter((r): r is PricingRule => r !== null);

    // 3. Sof dvigatel.
    const ctx: PricingContext = {
      at,
      ...(input.promoCode !== undefined && { promoCode: input.promoCode }),
      ...(input.customerSegment !== undefined && { customerSegment: input.customerSegment }),
      ...(input.categoryIdByVariant !== undefined && {
        categoryIdByVariant: input.categoryIdByVariant,
      }),
    };
    return new PricingEngine(rules).calculate(cart, ctx);
  }

  /**
   * Discount → PricingRule. Faqat PERCENTAGE/FIXED_AMOUNT (FREE_SHIPPING/
   * BUY_X_GET_Y bu bosqichda emas). Shartlar (minSubtotal/categoryIds) bu yerda
   * tekshiriladi — mos kelmasa null (qoida yaratilmaydi).
   */
  private toRule(
    d: DiscountRow,
    subtotal: bigint,
    categoryIdByVariant?: Readonly<Record<string, string>>,
  ): PricingRule | null {
    if (d.kind !== 'PERCENTAGE' && d.kind !== 'FIXED_AMOUNT') {
      return null;
    }
    const cond = (d.conditions ?? {}) as DiscountConditions;

    // Shart: minimal subtotal.
    if (cond.minSubtotal !== undefined && subtotal < BigInt(cond.minSubtotal)) {
      return null;
    }

    // Shart: kategoriya — savatda shu kategoriyadan biror qator bo'lishi kerak.
    const categoryIds = cond.categoryIds ?? [];
    const hasCategoryCond = categoryIds.length > 0;
    if (hasCategoryCond) {
      const cats = new Set(Object.values(categoryIdByVariant ?? {}));
      if (!categoryIds.some((c) => cats.has(c))) {
        return null;
      }
    }

    // Bosqich: promokod → PROMO_CODE (kod mos kelsagina); kategoriya →
    // CATEGORY_PROMOTION; aks holda savat darajasi → CART_LEVEL.
    const isPromoCode = d.code !== null;
    const stage = isPromoCode
      ? DiscountStage.PROMO_CODE
      : hasCategoryCond
        ? DiscountStage.CATEGORY_PROMOTION
        : DiscountStage.CART_LEVEL;

    const base = {
      id: d.id,
      stage,
      priority: d.priority,
      exclusive: !d.isStackable,
      ...(isPromoCode && { matches: (ctx: PricingContext): boolean => ctx.promoCode === d.code }),
    };

    return d.kind === 'PERCENTAGE'
      ? percentageDiscountRule({ ...base, basisPoints: d.value })
      : fixedDiscountRule({ ...base, amount: d.value });
  }
}
