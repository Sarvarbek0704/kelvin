import {
  DiscountStage,
  type PricedCart,
  type PricingCart,
  type PricingContext,
  type PricingTraceEntry,
} from './pricing.types';
import { PricingState } from './pricing-state';
import { type PricingRule } from './pricing-rule';

/**
 * ⚠️ Yakuniy himoya: chegirma bazaviy narxning N% dan oshmasin (docs/07 §7.3).
 *    Bir necha chegirma qo'shilib narxni nolga tushirmasin.
 *    Bu raqam BIZNES tomonidan tasdiqlanishi kerak (§12).
 */
export const MAX_TOTAL_DISCOUNT_PERCENT = 50n;

/** Determinizm uchun QAT'IY tartib: stage → priority → id (docs/07 §7.2). */
function compareRules(a: PricingRule, b: PricingRule): number {
  if (a.stage !== b.stage) {
    return a.stage - b.stage;
  }
  if (a.priority !== b.priority) {
    return a.priority - b.priority;
  }
  return a.id.localeCompare(b.id); // ← oxirgi tie-break (UUID v7 barqaror)
}

/**
 * Narx dvigateli — SOF. Qoidalar konstruktorda beriladi (kirish tartibi
 * AHAMIYATSIZ — ichida saralaydi).
 *
 * Determinizm kafolati (docs/07 §7.2):
 *  1. Qoidalar (stage, priority, id) bo'yicha saralanadi — id oxirgi tie-break.
 *  2. Sana kontekstdan (`ctx.at`), `now()` dan EMAS.
 *  3. Har qadam trace'ga yoziladi.
 */
export class PricingEngine {
  constructor(private readonly rules: readonly PricingRule[]) {}

  calculate(cart: PricingCart, ctx: PricingContext): PricedCart {
    const applicable = this.rules.filter((r) => r.matches(ctx)).sort(compareRules);

    let state = PricingState.fromCart(cart);
    const trace: PricingTraceEntry[] = [
      {
        ruleId: 'base',
        stage: DiscountStage.BASE,
        before: state.subtotal,
        after: state.subtotal,
        delta: 0n,
      },
    ];
    const usedExclusiveStages = new Set<DiscountStage>();

    for (const rule of applicable) {
      if (usedExclusiveStages.has(rule.stage)) {
        continue;
      }
      const before = state.total;
      state = rule.apply(state);
      trace.push({
        ruleId: rule.id,
        stage: rule.stage,
        before,
        after: state.total,
        delta: state.total - before,
      });
      if (rule.exclusive) {
        usedExclusiveStages.add(rule.stage);
      }
    }

    // Yakuniy himoya: umumiy chegirma cheklovi.
    const maxDiscount = (state.subtotal * MAX_TOTAL_DISCOUNT_PERCENT) / 100n;
    if (state.discountTotal > maxDiscount) {
      const before = state.total;
      state = state.capDiscount(maxDiscount);
      trace.push({
        ruleId: 'MAX_DISCOUNT_CAP',
        stage: DiscountStage.ROUNDING,
        before,
        after: state.total,
        delta: state.total - before,
      });
    }

    return state.toPricedCart(trace);
  }
}
