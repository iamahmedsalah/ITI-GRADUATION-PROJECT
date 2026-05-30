import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function languageFromPath(pathname: string) {
  return pathname.startsWith('/ar') ? 'ar' : 'en'
}

export default function NotFound() {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const language = languageFromPath(pathname)

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-10 text-(--text-h)">
      <section className="w-full max-w-xl rounded-3xl border border-(--border) bg-(--surface) p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <p className="text-xs uppercase tracking-[0.2em] text-(--text)">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-(--text-h)">{t('notFound.title')}</h1>
        <p className="mt-3 text-sm leading-6 text-(--text)">{t('notFound.description')}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to={`/${language}`} className="rounded-full border border-(--border) px-4 py-2 text-sm text-(--text-h)">
            {t('notFound.home')}
          </Link>
          <Link to={`/${language}/dashboard`} className="rounded-full border border-(--border) px-4 py-2 text-sm text-(--text-h)">
            {t('notFound.dashboard')}
          </Link>
        </div>
      </section>
    </main>
  )
}
