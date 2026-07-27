import {
  buildCombinations,
  buildSku,
  combinationCount,
  combinationKey,
  DuplicateAxisError,
  EmptyAxisError,
  MAX_COMBINATIONS,
  TooManyCombinationsError,
  type VariantAxis,
} from './variant-matrix';

const AXES: VariantAxis[] = [
  { attributeCode: 'color', valueCodes: ['gold', 'chrome', 'black', 'nickel'] },
  { attributeCode: 'size', valueCodes: ['d600', 'd800', 'd1000'] },
  { attributeCode: 'bulb_count', valueCodes: ['6', '8'] },
];

describe('Variant matritsasi', () => {
  it('dekart ko‘paytmasi = 4×3×2 = 24', () => {
    expect(combinationCount(AXES)).toBe(24);
    const combos = buildCombinations(AXES);
    expect(combos).toHaveLength(24);
  });

  it('har kombinatsiyada har o‘qdan AYNAN bitta qiymat', () => {
    const combos = buildCombinations(AXES);
    for (const combo of combos) {
      expect(Object.keys(combo.values).sort()).toEqual(['bulb_count', 'color', 'size']);
    }
  });

  it('barcha kombinatsiyalar noyob', () => {
    const combos = buildCombinations(AXES);
    const keys = new Set(combos.map(combinationKey));
    expect(keys.size).toBe(24);
  });

  it('bo‘sh o‘qlar → bo‘sh natija', () => {
    expect(buildCombinations([])).toEqual([]);
    expect(combinationCount([])).toBe(0);
  });

  it('MAX_COMBINATIONS dan oshsa — xato (guard rail)', () => {
    const huge: VariantAxis[] = [
      { attributeCode: 'a', valueCodes: Array.from({ length: 15 }, (_, i) => `a${String(i)}`) },
      { attributeCode: 'b', valueCodes: Array.from({ length: 15 }, (_, i) => `b${String(i)}`) },
    ];
    expect(combinationCount(huge)).toBeGreaterThan(MAX_COMBINATIONS);
    expect(() => buildCombinations(huge)).toThrow(TooManyCombinationsError);
  });

  it('takroriy o‘q — xato', () => {
    expect(() =>
      buildCombinations([
        { attributeCode: 'color', valueCodes: ['a'] },
        { attributeCode: 'color', valueCodes: ['b'] },
      ]),
    ).toThrow(DuplicateAxisError);
  });

  it('bo‘sh qiymatli o‘q — xato', () => {
    expect(() => buildCombinations([{ attributeCode: 'color', valueCodes: [] }])).toThrow(
      EmptyAxisError,
    );
  });

  describe('buildSku', () => {
    const tokens: Record<string, Record<string, string>> = {
      color: { gold: 'GLD', chrome: 'CHR' },
      size: { d600: '600' },
      bulb_count: { '8': '8' },
    };
    const tokenFor = (attr: string, val: string): string => tokens[attr]?.[val] ?? val;

    it('barqaror SKU yasaydi', () => {
      const sku = buildSku(
        'AUR',
        { values: { color: 'gold', size: 'd600', bulb_count: '8' } },
        ['color', 'size', 'bulb_count'],
        tokenFor,
      );
      expect(sku).toBe('AUR-GLD-600-8');
    });
  });
});
