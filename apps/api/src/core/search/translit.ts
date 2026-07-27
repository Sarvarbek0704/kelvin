/**
 * Transliteratsiya va normalizatsiya — ko'p tilli qidiruv uchun.
 *
 * O'zbekistonda bitta mahsulot kamida uch xil yoziladi: o'zbek lotin (qandil),
 * o'zbek kirill (қандил), rus (люстра). + klaviatura haqiqati: rus klaviaturada
 * o'zbekcha (кандил), lotin klaviaturada ruscha (lyustra).
 *
 * ⚠️ DOKUMENTNI KENGAYTIRISH tanlangan (so'rovni emas): indexlash offline
 *    (BullMQ), qidiruv online. Narxni offline tomonga surish to'g'ri almashuv.
 *
 * ⚠️ TARTIB MUHIM: ko'p belgili grafemalar BIRINCHI (o'→ў, sh→ш), aks holda
 *    sh → сҳ bo'lib ketadi.
 *
 * Sof TypeScript — framework bilmaydi (ADR-0001). Jadvallar to'liq emas va
 * tekshirilishi kerak (docs/05 §13 #3).
 *
 * @see docs/05-catalog-and-search.md §4.2
 */

/** O'zbek lotin → kirill. Ko'p belgililar BIRINCHI. */
const UZ_LAT_TO_CYR: readonly (readonly [string, string])[] = [
  ["o'", 'ў'],
  ["g'", 'ғ'],
  ['sh', 'ш'],
  ['ch', 'ч'],
  ['ng', 'нг'],
  ['ya', 'я'],
  ['yo', 'ё'],
  ['yu', 'ю'],
  ['ts', 'ц'],
  ['a', 'а'],
  ['b', 'б'],
  ['d', 'д'],
  ['e', 'е'],
  ['f', 'ф'],
  ['g', 'г'],
  ['h', 'ҳ'],
  ['i', 'и'],
  ['j', 'ж'],
  ['k', 'к'],
  ['l', 'л'],
  ['m', 'м'],
  ['n', 'н'],
  ['o', 'о'],
  ['p', 'п'],
  ['q', 'қ'],
  ['r', 'р'],
  ['s', 'с'],
  ['t', 'т'],
  ['u', 'у'],
  ['v', 'в'],
  ['x', 'х'],
  ['y', 'й'],
  ['z', 'з'],
];

/** Rus kirill → lotin. */
const RU_CYR_TO_LAT: readonly (readonly [string, string])[] = [
  ['ш', 'sh'],
  ['ч', 'ch'],
  ['я', 'ya'],
  ['ё', 'yo'],
  ['ю', 'yu'],
  ['ц', 'ts'],
  ['ж', 'j'],
  ['х', 'x'],
  ['а', 'a'],
  ['б', 'b'],
  ['в', 'v'],
  ['г', 'g'],
  ['д', 'd'],
  ['е', 'e'],
  ['з', 'z'],
  ['и', 'i'],
  ['й', 'y'],
  ['к', 'k'],
  ['л', 'l'],
  ['м', 'm'],
  ['н', 'n'],
  ['о', 'o'],
  ['п', 'p'],
  ['р', 'r'],
  ['с', 's'],
  ['т', 't'],
  ['у', 'u'],
  ['ф', 'f'],
  ['ы', 'i'],
  ['э', 'e'],
];

function applyMap(input: string, map: readonly (readonly [string, string])[]): string {
  let out = input;
  for (const [from, to] of map) {
    out = out.split(from).join(to);
  }
  return out;
}

export const uzLatinToCyrillic = (s: string): string => applyMap(s.toLowerCase(), UZ_LAT_TO_CYR);
export const ruCyrillicToLatin = (s: string): string => applyMap(s.toLowerCase(), RU_CYR_TO_LAT);

/** "қандил" → "кандил": o'zbek kirill belgilarini "oddiy" ruscha shaklga. */
export const foldUzbekCyrillic = (s: string): string =>
  s
    .toLowerCase()
    .split('қ')
    .join('к')
    .split('ғ')
    .join('г')
    .split('ҳ')
    .join('х')
    .split('ў')
    .join('у');

/** So'rov tomonida — faqat minimal normalizatsiya (apostrof, bo'sh joy). */
export const normalizeQuery = (q: string): string =>
  q
    .trim()
    .toLowerCase()
    .replace(/[‘’ʻʼ`]/g, "'")
    .replace(/\s+/g, ' ');

/**
 * Indexlash paytida chaqiriladi (so'rov paytida EMAS): matnning barcha yozilish
 * variantlarini qaytaradi (searchable_tokens uchun).
 */
export function expandWritingVariants(text: string): string[] {
  const base = normalizeQuery(text);
  if (base.length === 0) {
    return [];
  }
  return [
    ...new Set([
      base,
      uzLatinToCyrillic(base),
      ruCyrillicToLatin(base),
      foldUzbekCyrillic(base),
      foldUzbekCyrillic(uzLatinToCyrillic(base)),
      base.split("'").join(''), // mijoz apostrof yozmaydi
    ]),
  ].filter((v) => v.length > 0);
}
