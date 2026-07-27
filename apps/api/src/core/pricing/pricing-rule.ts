import { type DiscountStage, type PricingContext } from './pricing.types';
import { type PricingState } from './pricing-state';

/**
 * Baholash qoidasi. `matches` — qo'llash sharti; `apply` — SOF o'zgartirish
 * (yangi PricingState qaytaradi, mutatsiya yo'q).
 */
export interface PricingRule {
  readonly id: string;
  readonly stage: DiscountStage;
  /** Bir bosqichda bir necha qoida bo'lsa — kichik raqam avval. */
  readonly priority: number;
  /** true → bu qoida qo'llansa, shu bosqichda boshqasi qo'llanmaydi. */
  readonly exclusive: boolean;
  matches(ctx: PricingContext): boolean;
  apply(state: PricingState): PricingState;
}

/**
 * Foizli chegirma — basis point'da (1000 = 10%).
 *
 * ⚠️ BigInt bo'lish TRUNCATE qiladi → chegirma MIJOZ ZARARIGA yaxlitlanadi
 *    (kamroq chegirma). docs/07 §7.5. Foiz `number` bo'lishi mumkin (pul emas),
 *    lekin darhol basis point'ga (butun) aylanadi va keyin faqat BigInt.
 */
export function applyPercentDiscount(amount: bigint, basisPoints: bigint): bigint {
  if (amount <= 0n || basisPoints <= 0n) {
    return 0n;
  }
  return (amount * basisPoints) / 10_000n;
}

export interface RuleBase {
  readonly id: string;
  readonly stage: DiscountStage;
  readonly priority?: number;
  readonly exclusive?: boolean;
  readonly matches?: (ctx: PricingContext) => boolean;
}

/** Foizli chegirma qoidasi (joriy total'ning basisPoints foizi). */
export function percentageDiscountRule(opts: RuleBase & { basisPoints: bigint }): PricingRule {
  return {
    id: opts.id,
    stage: opts.stage,
    priority: opts.priority ?? 0,
    exclusive: opts.exclusive ?? false,
    matches: opts.matches ?? ((): boolean => true),
    apply: (state): PricingState => {
      const delta = applyPercentDiscount(state.total, opts.basisPoints);
      return state.withTotal(state.total - delta);
    },
  };
}

/** Qat'iy summali chegirma qoidasi (tiyin). */
export function fixedDiscountRule(opts: RuleBase & { amount: bigint }): PricingRule {
  return {
    id: opts.id,
    stage: opts.stage,
    priority: opts.priority ?? 0,
    exclusive: opts.exclusive ?? false,
    matches: opts.matches ?? ((): boolean => true),
    apply: (state): PricingState => state.withTotal(state.total - opts.amount),
  };
}
