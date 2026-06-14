import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import i18n from '../libs/i18n'
import LanguageSwitchOverlay from '../components/ui/LanguageSwitchOverlay'

export type LanguagePref = 'en' | 'ar'

type LanguageContextValue = {
  language: LanguagePref
  setLanguage: (language: LanguagePref) => Promise<void>
  direction: 'ltr' | 'rtl'
  isLanguageChanging: boolean
}

type LanguageProviderProps = {
  children: ReactNode
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

const SEO_IMAGE =
  'https://res.cloudinary.com/dkocrxpu4/image/upload/w_1200,h_630,c_pad,f_auto,q_auto,b_rgb:0C2331/v1770685642/logo_k8bbtk.webp'

function normalizeLanguage(language?: string | null): LanguagePref {
  return language?.startsWith('ar') ? 'ar' : 'en'
}

function getStoredLanguage() {
  if (typeof localStorage === 'undefined') return null

  return localStorage.getItem('i18nextLng')
}

function setStoredLanguage(language: LanguagePref) {
  if (typeof localStorage === 'undefined') return

  localStorage.setItem('i18nextLng', language)
}

function setMeta(selector: string, content: string) {
  if (typeof document === 'undefined') return

  const element = document.head.querySelector<HTMLMetaElement>(selector)

  if (element) {
    element.content = content
  }
}

function applyDocumentSeo(language: LanguagePref) {
  if (typeof document === 'undefined') return

  const title = i18n.t('siteTitle')
  const description = i18n.t('siteDescription')
  const siteName = i18n.t('siteName')
  const imageAlt = i18n.t('ogImageAlt')

  document.documentElement.lang = language
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  document.title = title

  setMeta('meta[name="description"]', description)

  setMeta('meta[property="og:title"]', title)
  setMeta('meta[property="og:description"]', description)
  setMeta('meta[property="og:site_name"]', siteName)
  setMeta('meta[property="og:image"]', SEO_IMAGE)
  setMeta('meta[property="og:image:alt"]', imageAlt)

  setMeta('meta[name="twitter:title"]', title)
  setMeta('meta[name="twitter:description"]', description)
  setMeta('meta[name="twitter:image"]', SEO_IMAGE)
  setMeta('meta[name="twitter:image:alt"]', imageAlt)
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<LanguagePref>(() =>
    normalizeLanguage(getStoredLanguage() ?? i18n.resolvedLanguage ?? i18n.language),
  )
  const [isLanguageChanging, setIsLanguageChanging] = useState(false)
  const languageChangeIdRef = useRef(0)

  const setLanguage = useCallback(async (nextLanguage: LanguagePref) => {
    if (nextLanguage === normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)) {
      setLanguageState(nextLanguage)
      setStoredLanguage(nextLanguage)
      applyDocumentSeo(nextLanguage)
      return
    }

    const changeId = languageChangeIdRef.current + 1
    languageChangeIdRef.current = changeId
    setIsLanguageChanging(true)
    setLanguageState(nextLanguage)
    setStoredLanguage(nextLanguage)

    try {
      await i18n.changeLanguage(nextLanguage)
      await wait(2000)
    } finally {
      if (languageChangeIdRef.current === changeId) {
        setIsLanguageChanging(false)
      }
    }
  }, [])

  useEffect(() => {
    const normalized = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)

    applyDocumentSeo(normalized)

    const handleLanguageChanged = (nextLanguage: string) => {
      const resolved = normalizeLanguage(nextLanguage)

      setLanguageState(resolved)
      setStoredLanguage(resolved)
      applyDocumentSeo(resolved)
    }

    i18n.on('languageChanged', handleLanguageChanged)

    return () => {
      i18n.off('languageChanged', handleLanguageChanged)
    }
  }, [])

  const direction = language === 'ar' ? 'rtl' : 'ltr'

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      direction,
      isLanguageChanging,
    }),
    [language, setLanguage, direction, isLanguageChanging],
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
      {isLanguageChanging ? <LanguageSwitchOverlay /> : null}
    </LanguageContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }

  return context
}
