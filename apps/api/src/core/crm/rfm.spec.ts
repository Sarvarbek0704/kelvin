import fc from 'fast-check';

import { computeRfm, type CustomerRfmInput } from './rfm';

describe('RFM (SOF, docs/10 §9.3)', () => {
  it('bo‘sh → bo‘sh', () => {
    expect(computeRfm([])).toEqual([]);
  });

  it('eng yaqin/tez-tez/ko‘p sarflagan → yuqori skor', () => {
    const input: CustomerRfmInput[] = [
      { customerId: 'best', recencyDays: 1, frequency: 20, monetary: 1_000_000_000n },
      { customerId: 'worst', recencyDays: 300, frequency: 1, monetary: 10_000_000n },
      { customerId: 'mid', recencyDays: 60, frequency: 5, monetary: 200_000_000n },
    ];
    const scores = computeRfm(input);
    const best = scores.find((s) => s.customerId === 'best')!;
    const worst = scores.find((s) => s.customerId === 'worst')!;
    expect(best.r).toBeGreaterThan(worst.r); // yaqinroq xarid → yuqori R
    expect(best.f).toBeGreaterThan(worst.f);
    expect(best.m).toBeGreaterThan(worst.m);
  });

  it('⚠️ property: har skor 1-5 oralig‘ida', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            customerId: fc.uuid(),
            recencyDays: fc.integer({ min: 0, max: 365 }),
            frequency: fc.integer({ min: 1, max: 100 }),
            monetary: fc.bigInt({ min: 0n, max: 10_000_000_000n }),
          }),
          { minLength: 1, maxLength: 50 },
        ),
        (customers) => {
          const scores = computeRfm(customers);
          expect(scores).toHaveLength(customers.length);
          for (const s of scores) {
            for (const dim of [s.r, s.f, s.m]) {
              expect(dim).toBeGreaterThanOrEqual(1);
              expect(dim).toBeLessThanOrEqual(5);
            }
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});
