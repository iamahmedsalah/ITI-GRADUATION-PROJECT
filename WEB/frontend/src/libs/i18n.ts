import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import enTranslation from '../locales/en/translation.json'
import arTranslation from '../locales/ar/translation.json'

const resources = {
  en: {
    translation: enTranslation,
  },
  ar: {
    translation: arTranslation,
  },
}

function normalizeLanguage(lng?: string) {
  return lng?.startsWith('ar') ? 'ar' : 'en'
}

function applyDocumentLanguage(lng?: string) {
  if (typeof document === 'undefined') return

  const normalized = normalizeLanguage(lng)
  document.documentElement.lang = normalized
  document.documentElement.dir = normalized === 'ar' ? 'rtl' : 'ltr'
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  })

applyDocumentLanguage(i18n.resolvedLanguage ?? i18n.language)
i18n.on('languageChanged', applyDocumentLanguage)

export default i18n