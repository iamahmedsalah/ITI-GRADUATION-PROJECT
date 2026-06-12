import { useEffect, useState, type ReactNode } from 'react'
import { Outlet, useLoaderData, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { LanguageProvider, useLanguage } from '../../context/LanguageContext'
import { ThemeProvider, useTheme } from '../../context/ThemeContext'
import Navbar from '../../components/ui/navbar'
import SiteFooter from '../../components/ui/SiteFooter'
import AdminSidebar, { AdminMenuToggleIcon } from '../../components/ui/AdminSidebar'
import { Toaster } from 'sonner'
import type { RouteLanguageData } from '../../utils/route-utils'
import { fetchAdminOverview } from '../../libs/admin-api'
import { adminAuthQueryKey, fetchAdminCurrentUser, logoutAdminUser } from '../../libs/react-query'

type RootLayoutProps = {
  children?: ReactNode
}

type NavItem = {
  label: string
  to: string
  exact?: boolean
  count?: number
  kind: 'dashboard' | 'users' | 'roadmaps' | 'courses' | 'contact'
}

function localizedPath(language: string, pathname: string) {
  if (!pathname || pathname === '/') {
    return `/${language}`
  }

  return `/${language}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
}

function ShellGradient() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[linear-gradient(to_bottom,var(--bg),var(--bg))]">
      <span className="admin-spark left-[12%] top-[12%]" />
      <span className="admin-spark left-[62%] top-[20%] delay-300" />
      <span className="admin-spark left-[78%] top-[68%] delay-700" />
      <span className="admin-spark left-[28%] top-[76%] delay-1000" />
    </div>
  )
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
          {
            label: t('navbar.roadmap'),
            to: localizedPath(language, '/roadmaps'),
            dropdown: true,
            dropdownItems: [
              { label: t('landing.roleRoadmaps'), to: localizedPath(language, '/roadmaps?type=roleBased') },
              { label: t('landing.skillRoadmaps'), to: localizedPath(language, '/roadmaps?type=skillBased') },
            ],
          },
          {
            label: t('navbar.ai'),
            to: localizedPath(language, '/ai'),
            dropdown: true,
            dropdownItems: [
              { label: t('navbar.aiRoadmapBuilder'), to: localizedPath(language, '/ai') },
              { label: t('navbar.aiChatbot'), disabled: true },
            ],
          },
          { label: t('navbar.upgrade', 'Upgrade'), to: localizedPath(language, '/upgrade') },
        ]}
      />

      <main className="flex-1">
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  )
}

export function AdminLayout() {
  const { language } = useLanguage()
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isMobileSidebarMounted, setIsMobileSidebarMounted] = useState(false)
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

  const { data: adminUser } = useQuery({
    queryKey: adminAuthQueryKey,
    queryFn: fetchAdminCurrentUser,
    staleTime: 60_000,
    enabled: !isAuthRoute,
  })

  const sidebarItems: NavItem[] = [
    { label: t('adminUi.nav.dashboard'), to: localizedPath(language, '/admin'), exact: true, kind: 'dashboard' },
    { label: t('adminUi.nav.users'), to: localizedPath(language, '/admin/users'), count: overview?.users.total ?? 0, kind: 'users' },
    { label: t('adminUi.nav.roadmaps'), to: localizedPath(language, '/admin/roadmaps'), count: overview?.roadmaps.templatesTotal ?? 0, kind: 'roadmaps' },
    { label: t('adminUi.nav.courses'), to: localizedPath(language, '/admin/courses'), count: overview?.courses.total ?? 0, kind: 'courses' },
    { label: t('adminUi.nav.contactMessages'), to: localizedPath(language, '/admin/contact-messages'), count: overview?.contactMessages?.unread ?? 0, kind: 'contact' },
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

  const openMobileSidebar = () => {
    setIsMobileSidebarMounted(true)
    window.requestAnimationFrame(() => {
      setIsMobileSidebarOpen(true)
    })
  }

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false)
  }

  useEffect(() => {
    if (isMobileSidebarOpen) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setIsMobileSidebarMounted(false)
    }, 260)

    return () => window.clearTimeout(timeoutId)
  }, [isMobileSidebarOpen])

  const sidebarProps = {
    items: sidebarItems,
    language,
    brandLabel: t('logo'),
    consoleLabel: t('adminUi.nav.console'),
    logoutLabel: t('adminUi.logout.cta'),
    closeLabel: t('adminUi.nav.closeSidebar'),
    adminName: adminUser?.name || adminUser?.username || t('adminUi.nav.console'),
    adminEmail: adminUser?.email,
    adminAvatarUrl: adminUser?.avatarUrl,
    lastLogin: adminUser?.lastLogin,
    onlineLabel: t('adminUi.nav.online'),
    lastLoginLabel: t('adminUi.nav.lastLogin'),
    collapseLabel: t('adminUi.nav.collapseSidebar'),
    expandLabel: t('adminUi.nav.expandSidebar'),
    collapsed: isSidebarCollapsed,
    onClose: closeMobileSidebar,
    onToggleCollapse: () => setIsSidebarCollapsed((previous) => !previous),
    onLogout: () => void handleAdminLogout(),
  }

  return (
    <div className="relative flex min-h-screen text-(--text-h)">
      <ShellGradient />

      {!isAuthRoute ? (
        <div className="sticky top-0 hidden h-screen shrink-0 lg:block">
          <AdminSidebar {...sidebarProps} />
        </div>
      ) : null}

      {!isAuthRoute && isMobileSidebarMounted ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className={[
              'absolute inset-0 bg-black/60 transition-opacity duration-300 ease-out',
              isMobileSidebarOpen ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
            aria-label={t('adminUi.nav.closeSidebar')}
            onClick={closeMobileSidebar}
          />
          <div
            className={[
              'relative h-full w-72 transition-transform duration-300 ease-out',
              isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
            ].join(' ')}
          >
            <AdminSidebar {...sidebarProps} mobile />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {!isAuthRoute ? (
          <header className="border-b border-(--border) bg-(--surface)/90 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={openMobileSidebar}
                  className="grid size-10 cursor-pointer place-items-center rounded-squircle border border-(--border) text-(--text-h) lg:hidden"
                  aria-label={t('adminUi.nav.openSidebar')}
                >
                  <AdminMenuToggleIcon open={false} />
                </button>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.24em] text-(--text)">{t('adminUi.header.overline')}</p>
                  <h1 className="text-base font-semibold text-(--text-h)">{t('adminUi.header.title')}</h1>
                </div>
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
