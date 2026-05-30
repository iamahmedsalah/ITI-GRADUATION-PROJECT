import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import i18n from '../libs/i18n'

export type LanguagePref = 'en' | 'ar'

type LanguageContextValue = {
  language: LanguagePref
  setLanguage: (language: LanguagePref) => void
  direction: 'ltr' | 'rtl'
}

type LanguageProviderProps = {
  children: ReactNode
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

function normalizeLanguage(language?: string): LanguagePref {
  return language?.startsWith('ar') ? 'ar' : 'en'
}

function applyDocumentLanguage(language: LanguagePref) {
  if (typeof document === 'undefined') return

  document.documentElement.lang = language
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
}

function applyDocumentTitle() {
  if (typeof document === 'undefined') return

  document.title = i18n.t('siteTitle')
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<LanguagePref>(() =>
    normalizeLanguage(localStorage.getItem('i18nextLng') ?? i18n.resolvedLanguage ?? i18n.language),
  )

  const setLanguage = useCallback((nextLanguage: LanguagePref) => {
    setLanguageState(nextLanguage)
    localStorage.setItem('i18nextLng', nextLanguage)
    void i18n.changeLanguage(nextLanguage)
    applyDocumentLanguage(nextLanguage)
    applyDocumentTitle()
  }, [])

  useEffect(() => {
    const normalized = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)
    applyDocumentLanguage(normalized)
    applyDocumentTitle()

    const handleLanguageChanged = (nextLanguage: string) => {
      const resolved = normalizeLanguage(nextLanguage)
      setLanguageState(resolved)
      localStorage.setItem('i18nextLng', resolved)
      applyDocumentLanguage(resolved)
      applyDocumentTitle()
    }

    i18n.on('languageChanged', handleLanguageChanged)

    return () => {
      i18n.off('languageChanged', handleLanguageChanged)
    }
  }, [])

  const direction = useMemo(() => (language === 'ar' ? 'rtl' : 'ltr'), [language])

  const value: LanguageContextValue = {
    language,
    setLanguage,
    direction,
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }

  return context
}
