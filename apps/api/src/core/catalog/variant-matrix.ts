/**
 * Variant matritsasi — dekart ko'paytmasi generatori.
 *
 * CANON §4.1: 1 × 4 rang × 3 o'lcham × 2 lampa = 24 SKU. Admin buni qo'lda
 * kiritmaydi. Bu fayl faqat REJANI (kombinatsiyalar) hisoblaydi — DB'ga
 * yozmaydi. Faqat MAVJUD kombinatsiyalar keyin saqlanadi.
 *
 * Sof TypeScript — framework/Prisma bilmaydi (ADR-0001).
 *
 * @see docs/05-catalog-and-search.md §1.3
 */

/** Product.variantAxes JSONB ichidagi struktura. */
export interface VariantAxis {
  /** "color", "bulb_count" — Attribute.code */
  readonly attributeCode: string;
  /** AttributeValue kodlari; tartib = UI tartibi */
  readonly valueCodes: readonly string[];
}

export interface AxisCombination {
  /** attributeCode -> valueCode */
  readonly values: Readonly<Record<string, string>>;
}

/** Guard rail: admin 15×10×4 = 600 SKU yaratmasin. */
export const MAX_COMBINATIONS = 200;

export class TooManyCombinationsError extends Error {
  constructor(count: number) {
    super(
      `Kombinatsiyalar soni juda ko'p: ${String(count)} > ${String(MAX_COMBINATIONS)}. ` +
        `O'qlar yoki qiymatlar sonini kamaytiring.`,
    );
    this.name = 'TooManyCombinationsError';
  }
}

export class DuplicateAxisError extends Error {
  constructor(code: string) {
    super(`Bir xil o'q ikki marta: ${code}`);
    this.name = 'DuplicateAxisError';
  }
}

export class EmptyAxisError extends Error {
  constructor(code: string) {
    super(`O'q "${code}" da qiymat yo'q`);
    this.name = 'EmptyAxisError';
  }
}

function validateAxes(axes: readonly VariantAxis[]): void {
  const seen = new Set<string>();
  for (const axis of axes) {
    if (seen.has(axis.attributeCode)) {
      throw new DuplicateAxisError(axis.attributeCode);
    }
    seen.add(axis.attributeCode);
    if (axis.valueCodes.length === 0) {
      throw new EmptyAxisError(axis.attributeCode);
    }
    const dupValues = new Set<string>();
    for (const value of axis.valueCodes) {
      if (dupValues.has(value)) {
        throw new DuplicateAxisError(`${axis.attributeCode}:${value}`);
      }
      dupValues.add(value);
    }
  }
}

/** Kombinatsiyalar soni — dekart ko'paytmasi kattaligi. */
export function combinationCount(axes: readonly VariantAxis[]): number {
  if (axes.length === 0) {
    return 0;
  }
  return axes.reduce((product, axis) => product * axis.valueCodes.length, 1);
}

/**
 * O'qlardan dekart ko'paytmasi. Faqat REJA — DB'ga yozmaydi.
 *
 * `MAX_COMBINATIONS` dan oshsa xato tashlaydi (guard rail).
 */
export function buildCombinations(axes: readonly VariantAxis[]): AxisCombination[] {
  if (axes.length === 0) {
    return [];
  }
  validateAxes(axes);

  const count = combinationCount(axes);
  if (count > MAX_COMBINATIONS) {
    throw new TooManyCombinationsError(count);
  }

  return axes.reduce<AxisCombination[]>(
    (acc, axis) =>
      acc.flatMap((partial) =>
        axis.valueCodes.map((valueCode) => ({
          values: { ...partial.values, [axis.attributeCode]: valueCode },
        })),
      ),
    [{ values: {} }],
  );
}

/**
 * SKU generatsiyasi: base + har o'q qiymatining tokeni.
 * Misol: base="AUR", {color:"GLD", size:"600", bulb_count:"8"} → "AUR-GLD-600-8".
 *
 * ⚠️ `axisOrder` — o'qlar tartibi (barqaror SKU uchun). Tokenlar chaqiruvchi
 *    tomonidan beriladi (AttributeValue.skuToken yoki value kodi).
 */
export function buildSku(
  base: string,
  combination: AxisCombination,
  axisOrder: readonly string[],
  tokenFor: (attributeCode: string, valueCode: string) => string,
): string {
  const parts = axisOrder.map((code) => {
    const valueCode = combination.values[code];
    if (valueCode === undefined) {
      throw new Error(`Kombinatsiyada "${code}" o'qi yo'q`);
    }
    return tokenFor(code, valueCode);
  });
  return [base, ...parts].join('-').toUpperCase();
}

/**
 * Kombinatsiya kaliti — ikki kombinatsiya bir xilligini aniqlash uchun
 * (regeneratsiyada mavjudlarni tegmaslik). O'qlar tartiblanadi → barqaror.
 */
export function combinationKey(combination: AxisCombination): string {
  return Object.keys(combination.values)
    .sort()
    .map((code) => `${code}=${combination.values[code] ?? ''}`)
    .join('|');
}
