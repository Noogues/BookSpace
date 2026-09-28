import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './locales/es.json'
import en from './locales/en.json'

const STORAGE_KEY = 'books-lang'

function getInitialLanguage(): string {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'es' || stored === 'en') return stored
  return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en'
}

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
})

function syncLanguage(lng: string): void {
  localStorage.setItem(STORAGE_KEY, lng)
  document.documentElement.lang = lng
}

i18n.on('languageChanged', syncLanguage)
syncLanguage(i18n.resolvedLanguage ?? getInitialLanguage())

export default i18n