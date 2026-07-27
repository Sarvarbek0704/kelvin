import fc from 'fast-check';

import { DiscountStage, type PricingCart, type PricingContext } from './pricing.types';
import { PricingEngine } from './pricing.engine';
import {
  applyPercentDiscount,
  fixedDiscountRule,
  percentageDiscountRule,
  type PricingRule,
} from './pricing-rule';

const CTX: PricingContext = { at: new Date('2026-01-15T10:00:00Z') };

// 1 200 000 so'm = 120 000 000 tiyin.
const cart: PricingCart = {
  currency: 'UZS',
  lines: [{ variantId: 'v1', quantity: 1, unitPrice: 120_000_000n }],
};

describe('applyPercentDiscount (yaxlitlash — mijoz zarariga truncate)', () => {
  it('butun natija', () => {
    expect(applyPercentDiscount(120_000_000n, 1000n)).toBe(12_000_000n); // 10%
  });

  it('kasr → truncate (kamroq chegirma)', () => {
    // 123 456 700 * 700 / 10000 = 8 641 969.0 → 8 641 969
    expect(applyPercentDiscount(123_456_700n, 700n)).toBe(8_641_969n);
  });

  it('manfiy/nol summa → 0 chegirma', () => {
    expect(applyPercentDiscount(0n, 1000n)).toBe(0n);
    expect(applyPercentDiscount(-5n, 1000n)).toBe(0n);
  });
});

describe('PricingEngine', () => {
  it('chegirmasiz — subtotal = total', () => {
    const priced = new PricingEngine([]).calculate(cart, CTX);
    expect(priced.subtotal).toBe(120_000_000n);
    expect(priced.totalAmount).toBe(120_000_000n);
    expect(priced.discountTotal).toBe(0n);
    expect(priced.trace).toHaveLength(1); // faqat base
  });

  it('ustma-ust (compound): -10% keyin -5% joriy total’ga qo‘llanadi', () => {
    const rules: PricingRule[] = [
      percentageDiscountRule({ id: 'cat-10', stage: DiscountStage.CATEGORY_PROMOTION, basisPoints: 1000n }),
      percentageDiscountRule({ id: 'vip-5', stage: DiscountStage.CUSTOMER_SEGMENT, basisPoints: 500n }),
    ];
    const priced = new PricingEngine(rules).calculate(cart, CTX);
    // 120 000 000 → -10% = 108 000 000 → -5% = 102 600 000
    expect(priced.totalAmount).toBe(102_600_000n);
  });

  it('exclusive — bir bosqichda faqat bitta qoida qo‘llanadi', () => {
    const rules: PricingRule[] = [
      percentageDiscountRule({ id: 'code-a', stage: DiscountStage.PROMO_CODE, priority: 1, exclusive: true, basisPoints: 1000n }),
      percentageDiscountRule({ id: 'code-b', stage: DiscountStage.PROMO_CODE, priority: 2, exclusive: true, basisPoints: 5000n }),
    ];
    const priced = new PricingEngine(rules).calculate(cart, CTX);
    // Faqat code-a (priority 1 avval) — 10%; code-b (50%) o'tkazib yuboriladi.
    expect(priced.totalAmount).toBe(108_000_000n);
    const applied = priced.trace.filter((t) => t.stage === DiscountStage.PROMO_CODE);
    expect(applied).toHaveLength(1);
    expect(applied[0]?.ruleId).toBe('code-a');
  });

  it('MAX 50% cap — chegirmalar yig‘indisi bazaning 50% dan oshmaydi', () => {
    const rules: PricingRule[] = [
      percentageDiscountRule({ id: 'a', stage: DiscountStage.CATEGORY_PROMOTION, basisPoints: 4000n }),
      percentageDiscountRule({ id: 'b', stage: DiscountStage.CUSTOMER_SEGMENT, basisPoints: 4000n }),
    ];
    const priced = new PricingEngine(rules).calculate(cart, CTX);
    // 40% + 40% compound = 64% chegirma → 50% ga kesiladi.
    expect(priced.totalAmount).toBe(60_000_000n); // 50% of 120M
    expect(priced.discountTotal).toBe(60_000_000n);
    expect(priced.trace.some((t) => t.ruleId === 'MAX_DISCOUNT_CAP')).toBe(true);
  });

  it('fixed chegirma total’dan ayiriladi (cap ostida)', () => {
    const rules: PricingRule[] = [
      fixedDiscountRule({ id: 'fix', stage: DiscountStage.PROMO_CODE, amount: 30_000_000n }),
    ];
    const priced = new PricingEngine(rules).calculate(cart, CTX);
    expect(priced.totalAmount).toBe(90_000_000n); // 120M - 30M
  });

  it('juda katta fixed chegirma ham MAX 50% cap bilan cheklanadi (manfiyga tushmaydi)', () => {
    const rules: PricingRule[] = [
      fixedDiscountRule({ id: 'big', stage: DiscountStage.PROMO_CODE, amount: 999_000_000n }),
    ];
    const priced = new PricingEngine(rules).calculate(cart, CTX);
    expect(priced.totalAmount).toBe(60_000_000n); // 50% cap
    expect(priced.totalAmount >= 0n).toBe(true);
  });

  it('matches=false qoida qo‘llanmaydi', () => {
    const rules: PricingRule[] = [
      percentageDiscountRule({
        id: 'promo',
        stage: DiscountStage.PROMO_CODE,
        basisPoints: 1000n,
        matches: (ctx) => ctx.promoCode === 'KELVIN2024',
      }),
    ];
    expect(new PricingEngine(rules).calculate(cart, CTX).totalAmount).toBe(120_000_000n);
    const withCode = new PricingEngine(rules).calculate(cart, { ...CTX, promoCode: 'KELVIN2024' });
    expect(withCode.totalAmount).toBe(108_000_000n);
  });
});

describe('PricingEngine — DETERMINIZM (docs/07 §11.5)', () => {
  const ALL_RULES: PricingRule[] = [
    percentageDiscountRule({ id: 'cat-10', stage: DiscountStage.CATEGORY_PROMOTION, basisPoints: 1000n }),
    fixedDiscountRule({ id: 'code-50k', stage: DiscountStage.PROMO_CODE, exclusive: true, amount: 5_000_000n }),
    percentageDiscountRule({ id: 'vip-5', stage: DiscountStage.CUSTOMER_SEGMENT, basisPoints: 500n }),
    percentageDiscountRule({ id: 'prod-3', stage: DiscountStage.PRODUCT_PROMOTION, basisPoints: 300n }),
    percentageDiscountRule({ id: 'cart-2', stage: DiscountStage.CART_LEVEL, basisPoints: 200n }),
  ];

  it('bir xil savat → bir xil narx (100 marta)', () => {
    const results = Array.from({ length: 100 }, () =>
      new PricingEngine(ALL_RULES).calculate(cart, CTX),
    );
    const first = results[0]!.totalAmount;
    for (const r of results) {
      expect(r.totalAmount).toBe(first);
      expect(r.trace.map((t) => t.ruleId)).toEqual(results[0]!.trace.map((t) => t.ruleId));
    }
  });

  it('qoidalar tartibi o‘zgarsa ham natija bir xil (property)', () => {
    fc.assert(
      fc.property(fc.shuffledSubarray(ALL_RULES, { minLength: ALL_RULES.length }), (shuffled) => {
        const a = new PricingEngine(shuffled).calculate(cart, CTX);
        const b = new PricingEngine([...shuffled].reverse()).calculate(cart, CTX);
        expect(a.totalAmount).toBe(b.totalAmount);
        expect(a.trace.map((t) => t.ruleId)).toEqual(b.trace.map((t) => t.ruleId));
      }),
      { numRuns: 100 },
    );
  });

  it('chegirma narxni manfiyga tushira olmaydi (property)', () => {
    const ruleArb = fc.record({
      pct: fc.integer({ min: 0, max: 9000 }),
      fixed: fc.bigInt({ min: 0n, max: 500_000_000n }),
      stage: fc.constantFrom(
        DiscountStage.PRODUCT_PROMOTION,
        DiscountStage.CATEGORY_PROMOTION,
        DiscountStage.CUSTOMER_SEGMENT,
        DiscountStage.CART_LEVEL,
      ),
    });
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1n, max: 1_000_000_000n }),
        fc.array(ruleArb, { maxLength: 6 }),
        (unitPrice, specs) => {
          const c: PricingCart = { currency: 'UZS', lines: [{ variantId: 'v', quantity: 1, unitPrice }] };
          const rules = specs.map((s, i) =>
            i % 2 === 0
              ? percentageDiscountRule({ id: `p${String(i)}`, stage: s.stage, basisPoints: BigInt(s.pct) })
              : fixedDiscountRule({ id: `f${String(i)}`, stage: s.stage, amount: s.fixed }),
          );
          const priced = new PricingEngine(rules).calculate(c, CTX);
          expect(priced.totalAmount >= 0n).toBe(true);
          expect(priced.discountTotal <= priced.subtotal).toBe(true);
          // MAX 50% cap invariantи
          expect(priced.discountTotal * 100n <= priced.subtotal * 50n).toBe(true);
        },
      ),
      { numRuns: 300 },
    );
  });
});
