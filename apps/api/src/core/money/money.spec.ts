import fc from 'fast-check';

import { CurrencyMismatchError, Money } from './money';

/**
 * Money — testlar.
 *
 * Bu fayl bir vaqtda ikki narsani ko'rsatadi:
 *  1. Money'ning to'g'riligi
 *  2. Property-based testing qanday ishlatilishi (docs/14-testing-strategy.md §5)
 *
 * Property test misol-asosidagi testdan kuchli: u minglab tasodifiy
 * input sinab ko'radi va yiqilgan holatni MINIMALLASHTIRADI (shrinking).
 *
 * Pul, reyting va juftlashtirish — property test MAJBURIY bo'lgan uch joy.
 */
describe('Money', () => {
  describe('konstruktorlar', () => {
    it("fromMajor so'mni tiyinga o'giradi", () => {
      expect(Money.fromMajor(50_000, 'UZS').amount).toBe(5_000_000n);
    });

    it("fromMinor tiyinni to'g'ridan-to'g'ri qabul qiladi", () => {
      expect(Money.fromMinor(5_000_000n, 'UZS').amount).toBe(5_000_000n);
    });

    // Aynan shu yerdan float xatosi kirishi mumkin edi — yo'l yopilgan.
    it('fromMajor kasr `number` ni RAD ETADI', () => {
      expect(() => Money.fromMajor(50.5, 'UZS')).toThrow(TypeError);
    });
  });

  describe('valyuta xavfsizligi', () => {
    it("turli valyutani qo'shishga ruxsat bermaydi", () => {
      const uzs = Money.fromMajor(100, 'UZS');
      const usd = Money.fromMajor(100, 'USD');

      expect(() => uzs.add(usd)).toThrow(CurrencyMismatchError);
    });
  });

  describe('float xatosi — asosiy sabab', () => {
    /**
     * Bu test ADR-0003 ning butun mavjudligini asoslaydi.
     *
     * `number` bilan: 0.1 + 0.2 !== 0.3
     * `bigint` bilan: xato tuzilmaviy jihatdan IMKONSIZ.
     */
    it("1000 marta 0.1 so'm qo'shish ANIQ 100 so'm beradi", () => {
      let total = Money.zero('UZS');
      const tenTiyin = Money.fromMinor(10n, 'UZS'); // 0.1 so'm

      for (let i = 0; i < 1000; i++) {
        total = total.add(tenTiyin);
      }

      expect(total.amount).toBe(10_000n); // 100 so'm — aniq
      expect(total.equals(Money.fromMajor(100, 'UZS'))).toBe(true);
    });

    it('taqqoslash uchun: `number` bilan xuddi shu hisob YIQILADI', () => {
      let floatTotal = 0;
      for (let i = 0; i < 1000; i++) {
        floatTotal += 0.1;
      }

      // Bu test `number` ning ISHONCHSIZLIGINI hujjatlashtiradi.
      expect(floatTotal).not.toBe(100);
      expect(floatTotal).toBeCloseTo(100, 10);
    });
  });

  describe("allocate — tiyin yo'qolmasligi", () => {
    it("100 tiyinni 3 ga bo'lganda hech narsa yo'qolmaydi", () => {
      const shares = Money.fromMinor(100n, 'UZS').allocate([1n, 1n, 1n]);

      expect(shares.map((s) => s.amount)).toEqual([34n, 33n, 33n]);
      // 34 + 33 + 33 = 100 — bitta ham tiyin yo'qolmadi
      expect(shares.reduce((sum, s) => sum + s.amount, 0n)).toBe(100n);
    });

    it("nisbat bo'yicha taqsimlaydi", () => {
      const shares = Money.fromMajor(1000, 'UZS').allocate([70n, 20n, 10n]);

      expect(shares[0]?.amount).toBe(70_000n);
      expect(shares[1]?.amount).toBe(20_000n);
      expect(shares[2]?.amount).toBe(10_000n);
    });

    /**
     * ENG MUHIM TEST.
     *
     * Marketplace split payment'da (murabbiy komissiyasi) summa bir necha
     * tomonga bo'linadi. Agar bitta tiyin yo'qolsa — ledger balansi buziladi
     * va `SUM(debit) === SUM(credit)` invarianti yiqiladi.
     *
     * Property: HAR QANDAY summa va HAR QANDAY nisbatlar uchun
     *           qismlar yig'indisi = asl summa.
     *
     * 1000 ta tasodifiy holat sinaladi.
     */
    it("[property] taqsimlangan qismlar yig'indisi HAR DOIM asl summaga teng", () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: 0n, max: 10n ** 15n }),
          fc.array(fc.bigInt({ min: 1n, max: 1000n }), { minLength: 1, maxLength: 20 }),
          (amount, ratios) => {
            const money = Money.fromMinor(amount, 'UZS');
            const shares = money.allocate(ratios);

            const sum = shares.reduce((acc, s) => acc + s.amount, 0n);
            expect(sum).toBe(amount);
            expect(shares).toHaveLength(ratios.length);
          },
        ),
        { numRuns: 1000 },
      );
    });
  });

  describe('percentage', () => {
    it("2.5% ni to'g'ri hisoblaydi", () => {
      // 1 000 000 so'm ning 2.5% i = 25 000 so'm
      const fee = Money.fromMajor(1_000_000, 'UZS').percentage(250n);
      expect(fee.amount).toBe(2_500_000n); // tiyinda
    });

    it('YUQORIGA yaxlitlaydi — komissiya platforma foydasiga', () => {
      // 1 tiyin ning 50% i = 0.5 tiyin → yuqoriga → 1 tiyin
      expect(Money.fromMinor(1n, 'UZS').percentage(5000n).amount).toBe(1n);
    });

    it('manfiy summani rad etadi', () => {
      expect(() => Money.fromMinor(-100n, 'UZS').percentage(250n)).toThrow(RangeError);
    });
  });

  describe('immutability', () => {
    it("add asl obyektni O'ZGARTIRMAYDI", () => {
      const original = Money.fromMajor(100, 'UZS');
      const result = original.add(Money.fromMajor(50, 'UZS'));

      expect(original.amount).toBe(10_000n); // o'zgarmadi
      expect(result.amount).toBe(15_000n);
      expect(Object.isFrozen(original)).toBe(true);
    });
  });

  describe('serializatsiya', () => {
    /**
     * Pul API'da STRING sifatida qaytadi.
     *
     * Nega: JS `Number` 2^53 dan katta butun sonni YO'QOTADI.
     * 2^53 tiyin ≈ 90 trillion so'm. Bugun yetarli, lekin bu
     * "yetarli" ga tayanish kerak emas.
     */
    it("JSON'da string sifatida chiqadi", () => {
      const money = Money.fromMajor(50_000, 'UZS');
      expect(JSON.parse(JSON.stringify(money))).toEqual({
        amount: '5000000',
        currency: 'UZS',
      });
    });
  });

  /**
   * ═══════════════════════════════════════════════════════════════════════
   *  RASSROCHKA — Kelvin uchun `allocate()` ning asosiy ishlatilishi.
   *
   *  O'zbekistonda qimmat tovar (qandil 2-5 mln so'm) bo'lib to'lash bilan
   *  sotiladi. Grafik hisobida bitta tiyin yo'qolsa, mijoz oxirgi to'lovni
   *  to'lagach qarzi "1 tiyin" bo'lib qoladi — va u hech qachon yopilmaydi.
   *
   *  docs/08-payments-and-installments.md §3
   * ═══════════════════════════════════════════════════════════════════════
   */
  describe('rassrochka grafigi', () => {
    it("5 000 000 so'm 3 oyga — tiyin yo'qolmaydi", () => {
      const principal = Money.fromMajor(5_000_000, 'UZS');
      const schedule = principal.allocate([1n, 1n, 1n]);

      // 500 000 000 tiyin / 3 = 166 666 666.67 → qoldiq taqsimlanadi
      expect(schedule).toHaveLength(3);
      expect(schedule[0]?.amount).toBe(166_666_667n);
      expect(schedule[1]?.amount).toBe(166_666_667n);
      expect(schedule[2]?.amount).toBe(166_666_666n);

      // ENG MUHIM: yig'indi ANIQ asl summaga teng
      const sum = schedule.reduce((acc, m) => acc + m.amount, 0n);
      expect(sum).toBe(principal.amount);
    });

    it("boshlang'ich badal bilan: qolgani teng bo'linadi", () => {
      const total = Money.fromMajor(3_000_000, 'UZS');
      const downPayment = Money.fromMajor(600_000, 'UZS'); // 20%
      const remaining = total.subtract(downPayment);

      const schedule = remaining.allocate([1n, 1n, 1n, 1n, 1n, 1n]); // 6 oy
      const sum = schedule.reduce((acc, m) => acc + m.amount, 0n);

      expect(sum).toBe(remaining.amount);
      // Boshlang'ich badal + grafik = umumiy summa. Tiyin yo'qolmadi.
      expect(downPayment.amount + sum).toBe(total.amount);
    });

    it('12% foiz bilan umumiy to\'lanadigan summa', () => {
      const principal = Money.fromMajor(2_000_000, 'UZS');
      const interest = principal.percentage(1200n); // 1200 bp = 12%
      const totalPayable = principal.add(interest);

      expect(interest.amount).toBe(24_000_000n); // 240 000 so'm
      expect(totalPayable.amount).toBe(224_000_000n); // 2 240 000 so'm
    });

    /**
     * Property: HAR QANDAY summa va HAR QANDAY muddat uchun grafik
     * yig'indisi asl summaga teng bo'lishi SHART. 500 tasodifiy holat.
     */
    it("[property] har qanday summa va muddat uchun grafik yig'indisi teng", () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: 10_000_000n, max: 10_000_000_000n }),
          fc.constantFrom(3, 6, 9, 12, 18, 24),
          (amountTiyin, months) => {
            const principal = Money.fromMinor(amountTiyin, 'UZS');
            const ratios = Array.from({ length: months }, () => 1n);
            const schedule = principal.allocate(ratios);

            const sum = schedule.reduce((acc, m) => acc + m.amount, 0n);
            expect(sum).toBe(amountTiyin);
            expect(schedule).toHaveLength(months);
            for (const m of schedule) {
              expect(m.isNegative()).toBe(false);
            }
          },
        ),
        { numRuns: 500 },
      );
    });
  });
});
