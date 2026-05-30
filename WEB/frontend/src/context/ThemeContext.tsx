import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { applyThemeFavicon } from '../utils/favicon'

export type ThemePref = 'light' | 'dark' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
}

type ThemeContextValue = {
  theme: ThemePref
  setTheme: (t: ThemePref) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function normalizeTheme(theme: string | null): ThemePref {
  return theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system'
}

function applyTheme(pref: ThemePref) {
  if (typeof document === 'undefined') return
  if (pref === 'system') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', pref)
  }
}

function getResolvedTheme(pref: ThemePref): 'light' | 'dark' {
  if (pref === 'system') {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  return pref === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemePref>(() => {
    if (typeof window === 'undefined') {
      return 'system'
    }

    return normalizeTheme(window.localStorage.getItem('theme'))
  })

  const setTheme = useCallback((t: ThemePref) => {
    setThemeState(t)
    localStorage.setItem('theme', t)
    applyTheme(t)
  }, [])

  useEffect(() => {
    applyTheme(theme)
    applyThemeFavicon(getResolvedTheme(theme))

    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => {
      // when system changes and user prefers system, re-apply
      if (theme === 'system') {
        applyTheme('system')
        applyThemeFavicon(getResolvedTheme('system'))
      }
    }

    if (mql.addEventListener) mql.addEventListener('change', listener)
    else mql.addListener(listener)

    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', listener)
      else mql.removeListener(listener)
    }
  }, [theme])

  const resolvedTheme = getResolvedTheme(theme)

  const value: ThemeContextValue = {
    theme,
    setTheme,
    resolvedTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export default ThemeContext
