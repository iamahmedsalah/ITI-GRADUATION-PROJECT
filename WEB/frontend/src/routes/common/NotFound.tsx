import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

function languageFromPath(pathname: string) {
  return pathname.startsWith('/ar') ? 'ar' : 'en'
}

export default function NotFound() {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const language = languageFromPath(pathname)

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-6 py-10 text-(--text-h)">
      <motion.section
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-(--border) bg-(--surface) p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <motion.div
          aria-hidden="true"
          className="absolute -left-24 -top-24 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(29,185,84,0.26)_0%,rgba(29,185,84,0.08)_48%,rgba(29,185,84,0)_72%)] blur-2xl"
          animate={{ scale: [1, 1.18, 1], rotate: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(var(--glow-neutral-rgb),0.18)_0%,rgba(var(--glow-neutral-rgb),0.06)_52%,rgba(var(--glow-neutral-rgb),0)_78%)] blur-2xl"
          animate={{ scale: [1.08, 0.95, 1.08], rotate: [0, -12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative mx-auto mb-6 flex h-44 w-44 items-center justify-center">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-dashed border-(--gd-primary)"
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute h-28 w-28 rounded-squircle border border-(--border) bg-(--surface-soft)"
            animate={{ rotate: [0, -4, 4, 0], y: [0, -8, 0] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.p
            className="relative bg-linear-to-r from-(--gd-primary) to-(--gd-secondary) bg-clip-text text-5xl font-black tracking-tight text-transparent"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            404
          </motion.p>
          <motion.span
            aria-hidden="true"
            className="absolute right-5 top-7 h-3 w-3 rounded-full bg-(--gd-primary)"
            animate={{ y: [0, 12, 0], opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.span
            aria-hidden="true"
            className="absolute bottom-8 left-6 h-2.5 w-2.5 rounded-full bg-(--gd-secondary)"
            animate={{ y: [0, -10, 0], opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <p className="relative text-xs uppercase tracking-[0.2em] text-(--text)">404</p>
        <h1 className="relative mt-3 text-3xl font-semibold text-(--text-h)">{t('notFound.title')}</h1>
        <p className="relative mt-3 text-sm leading-6 text-(--text)">{t('notFound.description')}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to={`/${language}`}
            className="rounded-squircle border border-(--border) bg-(--surface-soft) px-4 py-2 text-sm text-(--text-h) transition-colors hover:bg-(--surface-soft-hover)"
          >
            {t('notFound.home')}
          </Link>
          <Link
            to={`/${language}/dashboard`}
            className="rounded-squircle border border-(--border) bg-(--gd-primary) px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            {t('notFound.dashboard')}
          </Link>
        </div>
      </motion.section>
    </main>
  )
}
