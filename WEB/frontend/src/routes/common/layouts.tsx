import { useEffect, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLoaderData, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { LanguageProvider, useLanguage } from '../../context/LanguageContext'
import { ThemeProvider, useTheme } from '../../context/ThemeContext'
import LangToggleButton from '../../components/common/lang-toggle'
import ThemeToggleButton from '../../components/common/theme-toggle'
import Navbar from '../../components/ui/navbar'
import { Toaster } from 'sonner'
import type { RouteLanguageData } from '../../utils/route-utils'
import { fetchAdminOverview } from '../../libs/admin-api'
import { adminAuthQueryKey, logoutAdminUser } from '../../libs/react-query'

type RootLayoutProps = {
  children?: ReactNode
}

type NavItem = {
  label: string
  to: string
  exact?: boolean
  count?: number
  icon?: React.ReactNode
}

function localizedPath(language: string, pathname: string) {
  if (!pathname || pathname === '/') {
    return `/${language}`
  }

  return `/${language}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
}

function navClassName({ isActive }: { isActive: boolean }) {
  return [
    'flex items-center justify-between rounded-full px-4 py-2.5 text-sm font-semibold transition-transform duration-200',
    isActive
      ? 'bg-(--gd-primary) text-white'
      : 'text-(--text-h) hover:scale-[1.03] hover:bg-(--surface-soft-hover)',
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
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isAuthRoute =
    location.pathname.endsWith('/login') ||
    location.pathname.endsWith('/forgot-password') ||
    location.pathname.includes('/reset-password/')

  const { data: overview } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: fetchAdminOverview,
    staleTime: 60_000,
    enabled: !isAuthRoute,
  })

  const sidebarItems: NavItem[] = [
    { label: t('adminUi.nav.dashboard'), to: localizedPath(language, '/admin'), exact: true },
    { label: t('adminUi.nav.users'), to: localizedPath(language, '/admin/users'), count: overview?.users.total ?? 0 },
    { label: t('adminUi.nav.roadmaps'), to: localizedPath(language, '/admin/roadmaps'), count: overview?.roadmaps.templatesTotal ?? 0 },
    { label: t('adminUi.nav.courses'), to: localizedPath(language, '/admin/courses'), count: overview?.courses.total ?? 0 },
  ]

  const handleAdminLogout = async () => {
    try {
      await logoutAdminUser()
      queryClient.setQueryData(adminAuthQueryKey, null)
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
      toast.success(t('adminUi.logout.success'))
      navigate(`/${language}/admin/login`, { replace: true })
    } catch {
      toast.error(t('adminUi.logout.error'))
    }
  }

  return (
    <div className="relative flex min-h-screen text-(--text-h)">
      <ShellGradient />

      {!isAuthRoute ? (
        <aside className="hidden w-72 bg-black px-5 py-6 lg:flex lg:flex-col">
          <Link to={localizedPath(language, '/admin')} className="flex items-center gap-3 text-xl font-semibold text-(--text-h)">
            <span className="grid size-11 place-items-center rounded-2xl bg-(--gd-primary) text-white shadow-lg shadow-[rgba(29,185,84,0.35)]">
              A
            </span>
            <span>{t('adminUi.nav.console')}</span>
          </Link>

          <nav className="mt-10 flex flex-col gap-2">
            {sidebarItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.exact ?? false} className={navClassName}>
                <span>{item.label}</span>
                {typeof item.count === 'number' ? (
                  <span className="rounded-full bg-(--surface-2) px-2 py-0.5 text-xs text-(--text)">
                    {item.count}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto grid gap-3">
            <p className="rounded-2xl bg-(--surface) p-4 text-sm text-(--text)">
              {t('adminUi.nav.hint')}
            </p>
            <button
              type="button"
              onClick={() => void handleAdminLogout()}
              className="cursor-pointer rounded-full border border-(--border) bg-transparent px-4 py-2.5 text-sm font-semibold text-(--text-h) transition-transform duration-200 hover:scale-[1.04] hover:bg-(--surface-soft)"
            >
              {t('adminUi.logout.cta')}
            </button>
          </div>
        </aside>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {!isAuthRoute ? (
          <header className="border-b border-(--border) bg-(--surface)/90 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-(--text)">{t('adminUi.header.overline')}</p>
                <h1 className="text-lg font-semibold text-(--text-h)">{t('adminUi.header.title')}</h1>
              </div>
              <div className="flex items-center gap-2">
                <LangToggleButton />
                <ThemeToggleButton />
              </div>
            </div>
          </header>
        ) : null}

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}


