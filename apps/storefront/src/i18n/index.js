import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ru from './ru.json';
import uz from './uz.json';

/**
 * i18n — ikki til: ru (birlamchi dizayn tili) va uz (lotin).
 *
 * ⚠️ Katalog matnlari (mahsulot/kategoriya nomlari) API'dan ko'p tilli keladi —
 *    ular `label()` orqali joriy tilga moslanadi (lib/api.js). Bu yerdagi `common`
 *    namespace faqat CHROME (navigatsiya, tugmalar) uchun; sahifa matnlari
 *    bosqichma-bosqich ko'chiriladi. docs/13 §7.
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { common: ru },
      uz: { common: uz },
    },
    fallbackLng: 'ru',
    supportedLngs: ['ru', 'uz'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'kelvin-lang',
      caches: ['localStorage'],
    },
  });

// <html lang> ni til bilan sinxronlash (screen reader + SEO — docs/13 §2 (a)).
document.documentElement.lang = i18n.language.startsWith('uz') ? 'uz' : 'ru';
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng.startsWith('uz') ? 'uz' : 'ru';
});

export default i18n;
