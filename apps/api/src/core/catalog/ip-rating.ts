/**
 * IP himoya darajasi — QISMAN TARTIB (partial order), sof raqam EMAS.
 *
 * "Vannaxona uchun" = IP44 talabi. IP65 uni QANOATLANTIRADI (himoyaliroq).
 * Ya'ni `ip_rating = 'IP44'` NOTO'G'RI filtr; to'g'risi "kamida IP44".
 *
 * ⚠️ Suv shkalasi to'liq tartiblangan EMAS: IPx7 (botirish) IPx5 (suv oqimi)
 *    ni QAMRAMAYDI — turli sinovlar. Shuning uchun sanoatda IP65/IP67 qo'sh
 *    belgilash ishlatiladi. Sof `rank >= N` JIMGINA noto'g'ri javob beradi.
 *
 * Bu fayl sof TypeScript — framework/Prisma bilmaydi (ADR-0001). DB'siz
 * testlanadi.
 *
 * @see docs/05-catalog-and-search.md §2.2
 * @see docs/03-data-model.md §3.3
 */

/**
 * IP suv himoyasi darajalari orasidagi "qanoatlantiradi" munosabati.
 * Kalit — nomzod suv darajasi; qiymat — u qanoatlantiradigan talab darajalari.
 *
 * ⚠️ IEC 60529 matni bo'yicha TEKSHIRILISHI KERAK — bu sanoat amaliyotidan,
 *    standart iqtibosi emas (docs/05 §13 #4).
 */
const WATER_IMPLIES: Readonly<Record<number, readonly number[]>> = Object.freeze({
  0: [0],
  1: [1, 0],
  2: [2, 1, 0],
  3: [3, 2, 1, 0],
  4: [4, 3, 2, 1, 0],
  5: [5, 4, 3, 2, 1, 0],
  6: [6, 5, 4, 3, 2, 1, 0],
  // 7/8 — botirish sinovi. Ular 5/6 (oqim sinovi) ni QAMRAMAYDI.
  7: [7, 4, 3, 2, 1, 0],
  8: [8, 7, 4, 3, 2, 1, 0],
});

const MAX_SOLID = 6;
const MAX_WATER = 8;

export interface IpRating {
  readonly solid: number;
  readonly water: number;
}

export class InvalidIpCodeError extends Error {
  constructor(code: string) {
    super(`Yaroqsiz IP kodi: ${code}`);
    this.name = 'InvalidIpCodeError';
  }
}

const IP_PATTERN = /^IP([0-6])([0-8])$/;

export function parseIp(code: string): IpRating {
  const match = IP_PATTERN.exec(code);
  if (!match) {
    throw new InvalidIpCodeError(code);
  }
  return { solid: Number(match[1]), water: Number(match[2]) };
}

export function formatIp(rating: IpRating): string {
  return `IP${String(rating.solid)}${String(rating.water)}`;
}

export function isValidIpCode(code: string): boolean {
  return IP_PATTERN.test(code);
}

/** `candidate` `required` talabini qanoatlantiradimi? */
export function satisfies(candidate: IpRating, required: IpRating): boolean {
  if (candidate.solid < required.solid) {
    return false;
  }
  return WATER_IMPLIES[candidate.water]?.includes(required.water) ?? false;
}

/**
 * MATERIALIZATSIYA: `candidate` qanoatlantiradigan BARCHA IP kodlari.
 *
 * Meilisearch/GIN qisman tartibni bilmaydi → indexlashda bu massiv yoziladi
 * va filtr oddiy `contains` ga aylanadi (ProductVariant.ipSatisfies).
 *
 * Misol: IP65 → ["IP00","IP10",...,"IP44","IP54","IP65"] (IP67 CHIQMAYDI).
 */
export function computeIpSatisfies(candidateCode: string): string[] {
  const candidate = parseIp(candidateCode);
  const result: string[] = [];
  for (let solid = 0; solid <= MAX_SOLID; solid++) {
    for (let water = 0; water <= MAX_WATER; water++) {
      const required = { solid, water };
      if (satisfies(candidate, required)) {
        result.push(formatIp(required));
      }
    }
  }
  return result;
}
