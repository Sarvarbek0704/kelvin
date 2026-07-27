import fc from 'fast-check';

import { computeInstallment } from './installment-calc';

describe('installment-calc (SOF, docs/08 §7)', () => {
  it('5 mln so‘m 3 oyga, foizsiz — SUM(grafik) === totalPayable', () => {
    const r = computeInstallment({ orderTotal: 500_000_000n, downPayment: 0n, interestRateBp: 0, termMonths: 3 });
    expect(r.principal).toBe(500_000_000n);
    expect(r.totalPayable).toBe(500_000_000n);
    const sum = r.lines.reduce((s, l) => s + l.amount, 0n);
    expect(sum).toBe(r.totalPayable); // tiyin yo'qolmadi
    expect(r.lines).toHaveLength(3);
  });

  it('foiz truncate (12% = 1200bp)', () => {
    const r = computeInstallment({ orderTotal: 100_000_000n, downPayment: 0n, interestRateBp: 1200, termMonths: 6 });
    expect(r.interest).toBe(12_000_000n); // 100M * 0.12
    expect(r.totalPayable).toBe(112_000_000n);
  });

  it('boshlang‘ich badal — principal kamayadi', () => {
    const r = computeInstallment({ orderTotal: 300_000_000n, downPayment: 100_000_000n, interestRateBp: 0, termMonths: 4 });
    expect(r.principal).toBe(200_000_000n);
  });

  it('⚠️ INVARIANT (property): har qanday summa/muddat/foizda SUM(grafik) === totalPayable', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 100_000n, max: 10_000_000_000n }),
        fc.integer({ min: 0, max: 5000 }),
        fc.integer({ min: 1, max: 36 }),
        (orderTotal, bp, months) => {
          const r = computeInstallment({ orderTotal, downPayment: 0n, interestRateBp: bp, termMonths: months });
          const sum = r.lines.reduce((s, l) => s + l.amount, 0n);
          expect(sum).toBe(r.totalPayable);
          expect(r.lines).toHaveLength(months);
        },
      ),
      { numRuns: 300 },
    );
  });

  it('noto‘g‘ri kirish — throw', () => {
    expect(() => computeInstallment({ orderTotal: 100n, downPayment: 100n, interestRateBp: 0, termMonths: 3 })).toThrow();
    expect(() => computeInstallment({ orderTotal: 100n, downPayment: 0n, interestRateBp: 0, termMonths: 0 })).toThrow();
  });
});
