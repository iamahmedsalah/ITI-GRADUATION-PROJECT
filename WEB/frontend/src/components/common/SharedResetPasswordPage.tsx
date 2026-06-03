import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthIntroPanel from '../auth/AuthIntroPanel'
import AuthShell from '../auth/AuthShell'
import ResetPasswordForm from '../auth/ResetPasswordForm'
import { useResetPasswordPage } from '../../hooks/useResetPasswordPage'

type SharedResetPasswordPageProps = {
  resetPathBuilder: (token: string) => string
  successRedirectPath: (language: string) => string
  badgeKey: string
  titleKey: string
  subtitleKey: string
  forgotLinkPath?: (language: string) => string
  forgotLinkLabelKey?: string
  backToLoginPath?: (language: string) => string
  backToLoginLabelKey?: string
  resendPath?: string
  showLoginCta?: boolean
  loginCtaTextKey?: string
  loginCtaLinkLabelKey?: string
}

export default function SharedResetPasswordPage({
  resetPathBuilder,
  successRedirectPath,
  badgeKey,
  titleKey,
  subtitleKey,
  forgotLinkPath,
  forgotLinkLabelKey,
  backToLoginPath,
  backToLoginLabelKey,
  resendPath,
  showLoginCta = false,
  loginCtaTextKey = 'signup.haveAccount',
  loginCtaLinkLabelKey = 'signup.loginCta',
}: SharedResetPasswordPageProps) {
  const { t } = useTranslation()
  const resetPage = useResetPasswordPage({
    resetPathBuilder,
    successRedirectPath,
    resendPath,
  })

  return (
    <AuthShell
      direction={resetPage.direction}
      aside={
        <AuthIntroPanel
          badge={t(badgeKey)}
          title={t(titleKey)}
          subtitle={t(subtitleKey)}
          organizeTitle={t('reset.organizeTitle')}
          helper={t('reset.helper')}
        >
          {resendPath ? (
            <div className="mt-4 grid gap-3 rounded-2xl border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text)">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
                <div>
                  <p className="font-medium text-(--text-h)">{t('reset.resendTitle')}</p>
                  <p className="text-xs text-(--text)">
                    {resetPage.email
                      ? resetPage.isCoolingDown
                        ? t('reset.resendWait', { time: resetPage.cooldownLabel })
                        : t('reset.resendPrompt')
                      : t('reset.missingEmailHint')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void resetPage.onResendResetLink()}
                  disabled={!resetPage.email || resetPage.isCoolingDown || resetPage.isResending}
                  className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-(--gd-primary) px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resetPage.isResending ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    t('reset.resendButton')
                  )}
                </button>
              </div>
            </div>
          ) : null}

          {forgotLinkPath && forgotLinkLabelKey ? (
            <div className="mt-5 rounded-2xl border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text)">
              <Link to={forgotLinkPath(resetPage.language)} className="font-semibold text-(--gd-primary) hover:underline">
                {t(forgotLinkLabelKey)}
              </Link>
            </div>
          ) : null}

          {showLoginCta ? (
            <>
              <div className="mt-3 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-(--text)">
                <span className="h-px flex-1 bg-(--border)" />
              </div>
              <div className="mt-3 rounded-2xl border border-(--border) bg-(--surface-muted) px-4 py-3 text-center text-sm text-(--text) sm:px-5">
                {t(loginCtaTextKey)}{' '}
                <Link to={`/${resetPage.language}/login`} className="font-semibold text-(--gd-primary) hover:underline">
                  {t(loginCtaLinkLabelKey)}
                </Link>
              </div>
            </>
          ) : null}
        </AuthIntroPanel>
      }
    >
      <ResetPasswordForm
        form={resetPage.form}
        direction={resetPage.direction}
        language={resetPage.language}
        values={resetPage.values}
        isSubmitting={resetPage.isSubmitting}
        isPasswordCopied={resetPage.isPasswordCopied}
        showPassword={resetPage.showPassword}
        showConfirmPassword={resetPage.showConfirmPassword}
        backToLoginPath={backToLoginPath}
        backToLoginLabelKey={backToLoginLabelKey}
        onTogglePassword={() => resetPage.setShowPassword((previous) => !previous)}
        onToggleConfirmPassword={() => resetPage.setShowConfirmPassword((previous) => !previous)}
        onGeneratePassword={resetPage.handleGeneratePassword}
        onCopyPassword={resetPage.handleCopyPassword}
        onSubmit={resetPage.onSubmit}
      />
    </AuthShell>
  )
}
