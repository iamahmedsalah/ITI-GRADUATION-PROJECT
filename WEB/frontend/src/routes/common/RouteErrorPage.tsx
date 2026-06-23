import { Link, isRouteErrorResponse, useLocation, useRouteError } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon } from '@hugeicons/core-free-icons'

function getLanguageFromPath(pathname: string) {
  return pathname.startsWith('/ar') ? 'ar' : 'en'
}

const REASON_MESSAGES: Record<string, { title: string; message: string }> = {
  REFRESH_MISSING: {
    title: 'Authentication Session Missing',
    message: 'Your active session details could not be found. This happens if you signed out or your local tokens were cleared. Please log in again.',
  },
  REFRESH_INVALID: {
    title: 'Invalid Authentication Token',
    message: 'The session token provided is invalid or corrupted. Please sign in again to obtain a valid session.',
  },
  REFRESH_MISMATCH: {
    title: 'Session Mismatch',
    message: 'A security mismatch was detected in your login credentials. Please sign in again to secure your account.',
  },
  REFRESH_PASSWORD_CHANGED: {
    title: 'Password Changed',
    message: 'Your password was recently changed. All active sessions have been signed out. Please sign in with your new password.',
  },
  REFRESH_EXPIRED: {
    title: 'Session Expired',
    message: 'Your login session has expired for security reasons. Please log in again to continue learning.',
  },
  REFRESH_SESSION_EXPIRED: {
    title: 'Session Expired',
    message: 'Your login session has expired. Please sign in again to access your dashboard.',
  },
}

const REASON_MESSAGES_AR: Record<string, { title: string; message: string }> = {
  REFRESH_MISSING: {
    title: 'جلسة المصادقة مفقودة',
    message: 'تعذر العثور على تفاصيل جلستك النشطة. يحدث هذا إذا قمت بتسجيل الخروج أو تم مسح الرموز المحلية الخاصة بك. يرجى تسجيل الدخول مرة أخرى.',
  },
  REFRESH_INVALID: {
    title: 'رمز مصادقة غير صالح',
    message: 'رمز الجلسة المقدم غير صالح أو تالف. يرجى تسجيل الدخول مرة أخرى للحصول على جلسة صالحة.',
  },
  REFRESH_MISMATCH: {
    title: 'عدم تطابق الجلسة',
    message: 'تم الكشف عن عدم تطابق أمني في بيانات تسجيل الدخول الخاصة بك. يرجى تسجيل الدخول مرة أخرى لتأمين حسابك.',
  },
  REFRESH_PASSWORD_CHANGED: {
    title: 'تم تغيير كلمة المرور',
    message: 'تم تغيير كلمة المرور الخاصة بك مؤخراً. تم تسجيل خروج جميع الجلسات النشطة. يرجى تسجيل الدخول باستخدام كلمة المرور الجديدة.',
  },
  REFRESH_EXPIRED: {
    title: 'انتهت صلاحية الجلسة',
    message: 'انتهت صلاحية جلسة تسجيل الدخول الخاصة بك لأسباب أمنية. يرجى تسجيل الدخول مرة أخرى لمواصلة التعلم.',
  },
  REFRESH_SESSION_EXPIRED: {
    title: 'انتهت صلاحية الجلسة',
    message: 'انتهت صلاحية جلسة تسجيل الدخول الخاصة بك. يرجى تسجيل الدخول مرة أخرى للوصول إلى لوحة التحكم الخاصة بك.',
  },
}

export default function RouteErrorPage() {
  const error = useRouteError()
  const location = useLocation()
  const { t } = useTranslation()
  const pathname = location.pathname
  const language = getLanguageFromPath(pathname)
  const isRtl = language === 'ar'

  const searchParams = new URLSearchParams(location.search)
  const reason = searchParams.get('reason')

  // Resolve status code and message
  const status = isRouteErrorResponse(error) ? error.status : 500
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : (error instanceof Error ? error.message : t('errors.generic'))

  // Custom localized title and message based on the reason code from URL
  let errorTitle = t('errors.title')
  let errorDesc = t('errors.description')

  if (reason) {
    const reasonsMap = isRtl ? REASON_MESSAGES_AR : REASON_MESSAGES
    if (reasonsMap[reason]) {
      errorTitle = reasonsMap[reason].title
      errorDesc = reasonsMap[reason].message
    } else {
      // Format arbitrary reason string nicely
      const formattedReason = reason.replace(/_/g, ' ').toLowerCase()
      errorTitle = isRtl ? `خطأ: ${reason}` : `Error: ${formattedReason}`
      errorDesc = isRtl
        ? `تعذر إكمال طلبك بسبب رمز الخطأ: ${reason}.`
        : `We couldn't finish your request due to the following reason: ${formattedReason}.`
    }
  }

  const isDev = import.meta.env.DEV

  // Determine appropriate gradient/color for status badge
  let statusBadgeClass = 'bg-gradient-to-r from-rose-500 to-red-600 text-white'
  if (status === 404) {
    statusBadgeClass = 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
  } else if (status === 403 || status === 401) {
    statusBadgeClass = 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
  }

  return (
    <main
      dir={isRtl ? 'rtl' : 'ltr'}
      className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6"
    >
      <section className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-(--border) bg-(--surface)/90 backdrop-blur-md p-6 shadow-[0_24px_70px_rgba(0,0,0,0.25)] sm:p-8">
        {/* Glow effect at top */}
        <div className="absolute -top-24 left-1/2 h-48 w-80 -translate-x-1/2 rounded-full bg-red-500/10 blur-[80px]" />

        <div className="flex flex-col items-center text-center">
          {/* Main Icon */}
          <div className="flex size-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 mb-5">
            <HugeiconsIcon icon={Alert02Icon} size={28} />
          </div>

          {/* Status Badge */}
          <div className={`inline-flex rounded-full px-4 py-1 text-xs font-semibold tracking-wider uppercase ${statusBadgeClass} mb-4`}>
            {t('errors.label')} {status}
          </div>

          {/* Custom / Detailed Title */}
          <h1 className="text-2xl font-bold tracking-tight text-(--text-h) sm:text-3xl">
            {errorTitle}
          </h1>

          {/* Detailed Message */}
          <p className="mt-4 text-sm leading-6 text-(--text) max-w-md">
            {errorDesc}
          </p>

          {/* Technical Info Divider */}
          <div className="my-6 w-full border-t border-(--border)" />

          {/* Technical Details */}
          <div className="w-full text-start rounded-2xl bg-(--surface-2) p-4 text-xs">
            <span className="block font-semibold text-(--text-h) uppercase tracking-wider mb-2">
              {isRtl ? 'تفاصيل الخطأ الفنية:' : 'Technical Error Details:'}
            </span>
            <div className="grid gap-1 font-mono text-(--text)">
              <div className="flex justify-between">
                <span>{isRtl ? 'رمز الحالة:' : 'Status Code:'}</span>
                <span className="font-semibold text-(--text-h)">{status}</span>
              </div>
              <div className="flex justify-between">
                <span>{isRtl ? 'رسالة الخطأ:' : 'Error Message:'}</span>
                <span className="font-semibold text-(--text-h) break-all">{message}</span>
              </div>
              {reason && (
                <div className="flex justify-between">
                  <span>{isRtl ? 'رمز السبب:' : 'Reason Code:'}</span>
                  <span className="font-semibold text-red-400 font-mono">{reason}</span>
                </div>
              )}
            </div>

            {/* Stack trace for development */}
            {isDev && error instanceof Error && error.stack && (
              <details className="mt-3 cursor-pointer text-(--text) hover:text-(--text-h)">
                <summary className="font-semibold select-none">{isRtl ? 'عرض سجل تتبع الخطأ (Stack Trace)' : 'View Error Stack Trace'}</summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-(--surface-3) p-3 font-mono text-[10px] leading-4 text-(--text) whitespace-pre-wrap break-all">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex w-full justify-center">
            <Link
              to={`/${language}`}
              className="w-full sm:w-auto rounded-squircle bg-(--gd-primary) px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover) shadow-[0_4px_12px_rgba(29,185,84,0.2)]"
            >
              {t('errors.home')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
