import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { LanguagePref } from '../../context/LanguageContext'
import LangToggleButton from '../common/lang-toggle'
import ThemeToggleButton from '../common/theme-toggle'

type NavbarLink = {
  label: string
  to: string
  exact?: boolean
  dropdown?: boolean
}

type NavbarProps = {
  language: LanguagePref
  links?: NavbarLink[]
}

function navClassName({ isActive }: { isActive: boolean }) {
  return [
    'inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-(--surface-3) text-(--text-h)' : 'text-(--text-secondary) hover:bg-(--surface-soft-hover) hover:text-(--text-h)',
  ].join(' ')
}

function logoPath(language: LanguagePref) {
  return `/${language}`
}

export default function Navbar({ language, links = [] }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const primaryLinks = links.length > 0 ? links : []
  const { t } = useTranslation()

  return (
    <header className="border-b border-(--border) bg-(--surface-header) text-(--text-h) shadow-[0_1px_0_var(--surface-header-line)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to={logoPath(language)}
          className="flex shrink-0 items-center gap-3 rounded-2xl px-1 py-1 text-(--text-h) transition-transform hover:scale-[1.02]"
          aria-label={t('navbar.logo')}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <img src="/logo.png" alt={t('navbar.logo')} className="size-10 object-contain" />
          <span className="text-xl font-semibold tracking-[0.06em] text-(--text-h) sm:text-2xl" style={{ fontFamily: 'var(--heading)' }}>
            {t('navbar.logo')}
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 lg:flex">
          {primaryLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.exact ?? false} className={navClassName}>
              <span>{link.label}</span>
              {link.dropdown ? <span className="text-[10px] leading-none opacity-80">&#9662;</span> : null}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LangToggleButton />
          <ThemeToggleButton />
        </div>

        <button
          type="button"
          className="grid size-10 place-items-center rounded-2xl border border-(--border) bg-(--surface) text-(--text-secondary) transition-colors hover:bg-(--surface-2) hover:text-(--text-h) lg:hidden"
          aria-label={isMobileMenuOpen ? t('navbar.closeMenu') : t('navbar.openMenu')}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          <span className="flex w-4 flex-col gap-1.5">
            <span className="block h-0.5 rounded-full bg-current" />
            <span className="block h-0.5 rounded-full bg-current" />
            <span className="block h-0.5 rounded-full bg-current" />
          </span>
        </button>

        <div className="hidden items-center gap-2 lg:flex">
          <Link to={`/${language}/login`} className="rounded-full px-3 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--surface-soft-hover) hover:text-(--text-h)">
            {t('navbar.login')}
          </Link>
          <Link
            to={`/${language}/signup`}
            className="inline-flex items-center rounded-full bg-(--gd-primary) px-6 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(29,185,84,0.24)] transition-transform hover:-translate-y-0.5 hover:bg-(--gd-primary-hover)"
          >
            {t('navbar.signup')}
          </Link>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="border-t border-(--border) px-4 pb-4 pt-3 lg:hidden">
          <nav className="grid gap-2">
            {primaryLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact ?? false}
                className={navClassName}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>{link.label}</span>
                {link.dropdown ? <span className="text-[10px] leading-none opacity-80">&#9662;</span> : null}
              </NavLink>
            ))}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              to={`/${language}/login`}
              className="rounded-full border border-(--border) px-4 py-2 text-center text-sm font-medium text-(--text-h)"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('navbar.login')}
            </Link>
            <Link
              to={`/${language}/signup`}
              className="rounded-full bg-(--gd-primary) px-4 py-2 text-center text-sm font-semibold text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('navbar.signup')}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}
