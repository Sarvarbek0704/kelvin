import {
  expandWritingVariants,
  foldUzbekCyrillic,
  normalizeQuery,
  ruCyrillicToLatin,
  uzLatinToCyrillic,
} from './translit';

describe('Transliteratsiya', () => {
  describe('uzLatinToCyrillic — ko‘p belgili grafemalar birinchi', () => {
    it('sh → ш (сҳ EMAS)', () => {
      expect(uzLatinToCyrillic('shisha')).toBe('шиша');
    });
    it("o' → ў, g' → ғ", () => {
      expect(uzLatinToCyrillic("qo'ng'iroq")).toBe('қўнғироқ');
    });
    it('qandil → қандил', () => {
      expect(uzLatinToCyrillic('qandil')).toBe('қандил');
    });
  });

  describe('ruCyrillicToLatin', () => {
    it('люстра → lyustra', () => {
      expect(ruCyrillicToLatin('люстра')).toBe('lyustra');
    });
  });

  describe('foldUzbekCyrillic', () => {
    it('қандил → кандил (klaviatura haqiqati)', () => {
      expect(foldUzbekCyrillic('қандил')).toBe('кандил');
    });
  });

  describe('normalizeQuery', () => {
    it('apostrof variantlarini birlashtiradi + trim + lowercase', () => {
      expect(normalizeQuery("  Qo‘ng'iroq  ")).toBe("qo'ng'iroq");
    });
  });

  describe('expandWritingVariants — indexlash', () => {
    it('barcha yozilish variantlarini qamrab oladi', () => {
      const variants = expandWritingVariants('qandil');
      expect(variants).toContain('qandil'); // lotin
      expect(variants).toContain('қандил'); // uz kirill
      expect(variants).toContain('кандил'); // rus klaviatura (folded)
    });
    it("apostrofsiz variant qo'shiladi", () => {
      const variants = expandWritingVariants("o'rnatiladigan");
      expect(variants).toContain('ornatiladigan'.replace('o', 'o')); // apostrofsiz
      expect(variants.some((v) => !v.includes("'"))).toBe(true);
    });
    it('bo‘sh matn → bo‘sh massiv', () => {
      expect(expandWritingVariants('   ')).toEqual([]);
    });
    it('takrorlar yo‘q (Set)', () => {
      const variants = expandWritingVariants('e27');
      expect(new Set(variants).size).toBe(variants.length);
    });
  });
});
