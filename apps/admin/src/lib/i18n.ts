import type { LocalizedText } from '@kelvin/contracts';

/** Ko'p tilli matndan ko'rsatish uchun (uz-Latn → ru → birinchi). */
export function label(text: LocalizedText | null | undefined): string {
  if (!text) return '';
  return text['uz-Latn'] ?? text.ru ?? text['uz-Cyrl'] ?? Object.values(text)[0] ?? '';
}
