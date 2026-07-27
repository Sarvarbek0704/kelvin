/**
 * Ko'p tilli matn — O'zbekiston konteksti: uz-Latn / uz-Cyrl / ru.
 *
 * DB'da JSON: { "uz-Latn": "Qandil", "uz-Cyrl": "Қандил", "ru": "Люстра" }.
 *
 * @see docs/03-data-model.md §1
 */
export const LOCALES = ['uz-Latn', 'uz-Cyrl', 'ru'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'uz-Latn';

/** Kamida bitta til bo'lishi kutiladi (validatsiya DTO darajasida). */
export type LocalizedText = Partial<Record<Locale, string>>;

/** Berilgan til, yoki fallback zanjiri bo'yicha matn tanlash. */
export function pickLocale(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text[DEFAULT_LOCALE] ?? text.ru ?? firstValue(text) ?? '';
}

function firstValue(text: LocalizedText): string | undefined {
  for (const locale of LOCALES) {
    const value = text[locale];
    if (value !== undefined && value !== '') {
      return value;
    }
  }
  return undefined;
}

export function hasAnyLocale(text: LocalizedText): boolean {
  return LOCALES.some((locale) => {
    const value = text[locale];
    return typeof value === 'string' && value.trim() !== '';
  });
}
