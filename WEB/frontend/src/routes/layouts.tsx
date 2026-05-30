import { useEffect, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLoaderData, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageProvider, useLanguage } from '../context/LanguageContext'
import { ThemeProvider, useTheme } from '../context/ThemeContext'
import LangToggleButton from '../components/common/lang-toggle'
import ThemeToggleButton from '../components/common/theme-toggle'
import Navbar from '../components/ui/navbar'
import { Toaster } from 'sonner'
import type { RouteLanguageData } from '../utils/route-utils'

type RootLayoutProps = {
  children?: ReactNode
}

type NavItem = {
  label: string
  to: string
  exact?: boolean
}

function localizedPath(language: string, pathname: string) {
  if (!pathname || pathname === '/') {
    return `/${language}`
  }

  return `/${language}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
}

function navClassName({ isActive }: { isActive: boolean }) {
  return [
    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-(--gd-primary) text-white' : 'text-(--text-h) hover:bg-(--surface-soft-hover)',
  ].join(' ')
}

function ShellGradient() {
  return <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(29,185,84,0.08),transparent_35%),linear-gradient(to_bottom,var(--bg),var(--bg))]" />
}

function AppToaster() {
  const { resolvedTheme } = useTheme()
  const { direction } = useLanguage()

  return (
    <Toaster
      position="bottom-right"
      theme={resolvedTheme}
      dir={direction}
      richColors
      closeButton
      style={{ fontFamily: 'var(--sans)' }}
      toastOptions={{
        style: { fontFamily: 'var(--sans)' },
      }}
    />
  )
}

export function RootLayout({ children }: RootLayoutProps) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AppToaster />
        {children ?? <Outlet />}
      </ThemeProvider>
    </LanguageProvider>
  )
}

export function LanguageLayout() {
  const { language: routeLanguage } = useLoaderData() as RouteLanguageData
  const { language, setLanguage } = useLanguage()

  useEffect(() => {
    if (language !== routeLanguage) {
      setLanguage(routeLanguage)
    }
  }, [language, routeLanguage, setLanguage])

  return <Outlet />
}

export function ClientLayout() {
  const { language } = useLanguage()
  const { t } = useTranslation()

  return (
    <div className="relative flex min-h-screen flex-col text-(--text-h)">
      <ShellGradient />

      <Navbar
        language={language}
        links={[
          { label: t('navbar.roadmap'), to: localizedPath(language, '/roadmaps/frontend'), dropdown: true },
          { label: t('navbar.ai'), to: localizedPath(language, '/dashboard'), dropdown: true },
        ]}
      />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-(--border) bg-(--surface)/80 backdrop-blur-xl">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-8 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <h2 className="text-lg font-semibold text-(--text-h)">ILMA</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-(--text)">{t('layout.footerDescription')}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-(--text)">{t('layout.explore')}</h3>
            <div className="mt-3 flex flex-col gap-2 text-sm text-(--text-h)">
              <Link to={localizedPath(language, '/login')}>{t('navbar.login')}</Link>
              <Link to={localizedPath(language, '/signup')}>{t('navbar.signup')}</Link>
              <Link to={localizedPath(language, '/dashboard')}>{t('layout.dashboard')}</Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-(--text)">{t('layout.preferences')}</h3>
            <p className="mt-3 text-sm leading-6 text-(--text)">{t('layout.preferencesDescription')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export function AdminLayout() {
  const { language } = useLanguage()
  const location = useLocation()
  const isLoginRoute = location.pathname.endsWith('/login')
  const sidebarItems: NavItem[] = [
    { label: 'Dashboard', to: localizedPath(language, '/admin'), exact: true },
    { label: 'Login', to: localizedPath(language, '/admin/login') },
  ]

  return (
    <div className="relative flex min-h-screen text-(--text-h)">
      <ShellGradient />

      {!isLoginRoute ? (
        <aside className="hidden w-72 border-r border-(--border) bg-(--surface)/90 px-5 py-6 backdrop-blur-xl lg:flex lg:flex-col">
          <Link to={localizedPath(language, '/admin')} className="flex items-center gap-3 text-xl font-semibold text-(--text-h)">
            <span className="grid size-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--gd-primary),var(--gd-secondary))] text-white shadow-lg shadow-[rgba(29,185,84,0.25)]">
              A
            </span>
            <span>Admin</span>
          </Link>

          <nav className="mt-10 flex flex-col gap-2">
            {sidebarItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.exact ?? false} className={navClassName}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-(--border) bg-(--surface) p-4 text-sm text-(--text)">
            Admin sidebar is ready for future management sections.
          </div>
        </aside>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-(--border) bg-(--surface)/90 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-(--text)">Admin area</p>
              <h1 className="text-lg font-semibold text-(--text-h)">Management console</h1>
            </div>
            <div className="flex items-center gap-2">
              <LangToggleButton />
              <ThemeToggleButton />
            </div>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
