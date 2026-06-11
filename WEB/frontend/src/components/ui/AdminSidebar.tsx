import { Link, NavLink } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CourseIcon,
  DashboardSquare03Icon,
  Login03Icon,
  Mail01Icon,
  Route03Icon,
  UserEdit01Icon,
} from '@hugeicons/core-free-icons';
import LangToggleButton from '../common/lang-toggle'
import ThemeToggleButton from '../common/theme-toggle'
import { useTranslation } from 'react-i18next'

type AdminSidebarItem = {
  label: string
  to: string
  exact?: boolean
  count?: number
  kind: 'dashboard' | 'users' | 'roadmaps' | 'courses' | 'contact'
}

type AdminSidebarProps = {
  items: AdminSidebarItem[]
  language: string
  consoleLabel: string
  logoutLabel: string
  closeLabel: string
  brandLabel?: string
  collapsed: boolean
  adminName?: string
  adminEmail?: string
  adminAvatarUrl?: string | null
  lastLogin?: string | number | null
  onlineLabel?: string
  lastLoginLabel?: string
  collapseLabel?: string
  expandLabel?: string
  mobile?: boolean
  onClose?: () => void
  onToggleCollapse?: () => void
  onLogout: () => void
}

const iconByKind = {
  dashboard: DashboardSquare03Icon,
  users: UserEdit01Icon,
  roadmaps: Route03Icon,
  courses: CourseIcon,
  contact: Mail01Icon,
}

function localizedPath(language: string, pathname: string) {
  if (!pathname || pathname === '/') return `/${language}`
  return `/${language}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
}

function MenuToggleIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block size-5" aria-hidden="true">
      <span className={`absolute left-0 top-1 h-0.5 w-5 rounded-full bg-current transition ${open ? 'translate-y-1.5 rotate-45' : ''}`} />
      <span className={`absolute left-0 top-2.5 h-0.5 w-5 rounded-full bg-current transition ${open ? 'opacity-0' : ''}`} />
      <span className={`absolute left-0 top-4 h-0.5 w-5 rounded-full bg-current transition ${open ? '-translate-y-1.5 -rotate-45' : ''}`} />
    </span>
  )
}

export function AdminMenuToggleIcon({ open }: { open: boolean }) {
  return <MenuToggleIcon open={open} />
}

export default function AdminSidebar({
  items,
  language,
  consoleLabel,
  logoutLabel,
  closeLabel,
  brandLabel = 'ILMA',
  collapsed,
  adminName = 'Admin',
  adminEmail,
  adminAvatarUrl,
  lastLogin,
  onlineLabel = 'Online',
  lastLoginLabel = 'Last login',
  collapseLabel = 'Collapse sidebar',
  expandLabel = 'Expand sidebar',
  mobile = false,
  onClose,
  onToggleCollapse,
  onLogout,
}: AdminSidebarProps) {
  const isCollapsed = collapsed && !mobile
  const avatarLetter = (adminName || adminEmail || 'A').trim().charAt(0).toUpperCase()
  const parsedLastLogin = lastLogin ? new Date(lastLogin) : null
  const hasValidLastLogin = parsedLastLogin !== null && !Number.isNaN(parsedLastLogin.getTime())
  const formattedLastLoginDate = hasValidLastLogin ? parsedLastLogin.toLocaleDateString() : '-'
  const formattedLastLoginTime = hasValidLastLogin
    ? parsedLastLogin.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      })
    : '-'

  const adminProfilePath = localizedPath(language, '/admin/profile')
  const avatar = (
    <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-squircle bg-(--gd-primary) text-white shadow-[0_14px_28px_rgba(29,185,84,0.24)]">
      {adminAvatarUrl ? (
        <img src={adminAvatarUrl} alt={adminName || consoleLabel} className="size-full object-cover" />
      ) : (
        avatarLetter
      )}
    </span>
  )


    const { t } = useTranslation()

  return (
    <aside
      className={[
        'admin-sidebar flex h-full flex-col border-e border-(--border) bg-(--surface) px-4 py-4 shadow-(--shadow) transition-[width,transform,opacity] duration-300 ease-out',
        mobile ? 'w-72' : isCollapsed ? 'w-20' : 'w-72',
      ].join(' ')}
    >
      <div className={['flex items-center gap-3', isCollapsed ? 'justify-center' : 'justify-between'].join(' ')}>
        {!isCollapsed ? (
          <Link
            to={localizedPath(language, '/admin')}
            className="flex min-w-0 items-center gap-3 text-lg font-semibold text-(--text-h)"
            onClick={onClose}
          >
            <span className="grid size-10 shrink-0 place-items-center">
              <img src="/logo.png" alt={brandLabel} className="size-9 object-contain" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-bold leading-5 text-(--text-h)">{brandLabel}</span>
                              <p className="text-xs font-black uppercase tracking-tight text-(--text)">
              {t('footer.brandPrefix')}
              <span className="text-(--gd-primary)">{t('footer.brandHighlight')}</span>
              {t('footer.brandSuffix')}
            </p>
            </span>
          </Link>
        ) : null}

        {mobile ? (
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 cursor-pointer place-items-center rounded-squircle border border-(--border) text-(--text-h)"
            aria-label={closeLabel}
          >
            <MenuToggleIcon open />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="grid size-10 cursor-pointer place-items-center rounded-squircle border border-(--border) text-(--text-h) transition hover:bg-(--surface-soft)"
            aria-label={isCollapsed ? expandLabel : collapseLabel}
          >
            <MenuToggleIcon open={!isCollapsed} />
          </button>
        )}
      </div>

      <nav className="mt-7 flex flex-col gap-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact ?? false}
            title={isCollapsed ? item.label : undefined}
            onClick={onClose}
            className={({ isActive }) => [
              'flex items-center gap-3 rounded-squircle px-3 py-2.5 text-sm font-semibold transition-colors duration-200',
              isCollapsed ? 'justify-center' : 'justify-between',
              isActive
                ? 'bg-(--gd-primary) text-white shadow-[0_12px_24px_rgba(29,185,84,0.22)]'
                : 'text-(--text-h) hover:bg-(--surface-soft-hover)',
            ].join(' ')}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid size-7 shrink-0 place-items-center">
                <HugeiconsIcon icon={iconByKind[item.kind]} size={18} />
              </span>
              {!isCollapsed ? <span className="truncate">{item.label}</span> : null}
            </span>
            {typeof item.count === 'number' && !isCollapsed ? (
              <span className="rounded-squircle bg-(--surface-2) px-2 py-0.5 text-xs text-(--text)">
                {item.count}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto grid gap-3">
        <div className={['flex items-center gap-2', isCollapsed ? 'justify-center flex-col' : 'justify-between'].join(' ')}>
          <LangToggleButton />
          <ThemeToggleButton />
        </div>
        {!isCollapsed ? (
          <Link
            to={adminProfilePath}
            onClick={onClose}
            className="flex items-start gap-3 rounded-squircle border border-(--border) bg-(--surface-2) p-4 transition hover:border-(--accent-border) hover:bg-(--surface-soft-hover)"
          >
            {avatar}
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-(--text-h)">{adminName || consoleLabel}</span>
              <span className="mt-1 flex items-center gap-1.5 text-xs font-medium text-(--text)">
                <span className="size-1.5 rounded-full bg-(--gd-primary-hover)" />
                {onlineLabel}
              </span>
              <span className="mt-1 block text-xs font-medium text-(--text)">
                <span className="block truncate">
                  {lastLoginLabel}: {formattedLastLoginDate}
                </span>
                <span className="block truncate">{formattedLastLoginTime}</span>
              </span>
            </span>
          </Link>
        ) : (
          <Link to={adminProfilePath} onClick={onClose} className="flex justify-center" title={adminName || consoleLabel}>
            {avatar}
          </Link>
        )}
        <button
          type="button"
          onClick={onLogout}
          title={isCollapsed ? logoutLabel : undefined}
          className={[
            'group inline-flex cursor-pointer items-center justify-center gap-2 rounded-squircle border border-(--border) bg-transparent px-4 py-2.5 text-sm font-semibold text-(--text-h) transition-all duration-200 hover:border-[rgba(226,33,52,0.25)] hover:bg-[rgba(226,33,52,0.08)] hover:text-(--error)',
            isCollapsed ? 'px-2 py-2.5' : 'justify-start',
          ].join(' ')}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-squircle text-(--text-h) transition-colors group-hover:bg-[linear-gradient(135deg,rgba(226,33,52,0.18),rgba(226,33,52,0.06))] group-hover:text-(--error)">
            <HugeiconsIcon icon={Login03Icon} size={18} />
          </span>
          {!isCollapsed ? logoutLabel : null}
        </button>
      </div>
    </aside>
  )
}
