import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import translationEN from './locales/en/translation.json';
import translationZU from './locales/zu/translation.json';
import translationXH from './locales/xh/translation.json';
import translationAF from './locales/af/translation.json';

const resources = {
  en: {
    translation: translationEN
  },
  zu: {
    translation: translationZU
  },
  xh: {
    translation: translationXH
  },
  af: {
    translation: translationAF
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n; 