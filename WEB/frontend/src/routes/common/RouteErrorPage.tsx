import { Link, isRouteErrorResponse, useLocation, useRouteError } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function getLanguageFromPath(pathname: string) {
  return pathname.startsWith('/ar') ? 'ar' : 'en'
}

export default function RouteErrorPage() {
  const error = useRouteError()
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const language = getLanguageFromPath(pathname)

  const status = isRouteErrorResponse(error) ? error.status : 500
  const message = isRouteErrorResponse(error) ? error.statusText : t('errors.generic')

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10 text-(--text-h)">
      <section className="w-full max-w-2xl rounded-3xl border border-(--border) bg-(--surface) p-8 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
        <p className="text-xs uppercase tracking-[0.2em] text-(--text)">{t('errors.label')}</p>
        <h1 className="mt-3 text-3xl font-semibold text-(--text-h)">{t('errors.title')}</h1>
        <p className="mt-3 text-sm leading-6 text-(--text)">
          {t('errors.description')} ({status}: {message})
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={`/${language}`} className="rounded-squircle border border-(--border) px-4 py-2 text-sm text-(--text-h)">
            {t('errors.home')}
          </Link>
          <Link to={`/${language}/login`} className="rounded-squircle border border-(--border) px-4 py-2 text-sm text-(--text-h)">
            {t('errors.login')}
          </Link>
        </div>
      </section>
    </main>
  )
}
