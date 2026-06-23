import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import GoogleIdentityButton from './GoogleIdentityButton'
import ContinueAsGoogleButton from './ContinueAsGoogleButton'
import { isChromeBrowser } from '../../utils/browserCheck'

type SignupAsideActionsProps = {
  onSocialSignup: (email?: string) => void | Promise<void>
  savedAccount: {
    name: string
    email: string
    avatarUrl: string
  } | null
}

export default function SignupAsideActions({
  onSocialSignup,
  savedAccount,
}: SignupAsideActionsProps) {
  const { language } = useLanguage()
  const { t } = useTranslation()

  return (
    <div className="mt-3 grid gap-3">
      {savedAccount ? (
        <div className="grid gap-3 pt-2">
          {!isChromeBrowser() && (
            <>
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-(--text)">
                <span className="h-px flex-1 bg-(--border)" />
                <span>{t('signup.socialDivider')}</span>
                <span className="h-px flex-1 bg-(--border)" />
              </div>
              <ContinueAsGoogleButton
                account={savedAccount}
                onClick={() => void onSocialSignup(savedAccount.email)}
              />
            </>
          )}
          <GoogleIdentityButton
            mode="signup"
            dividerLabel={isChromeBrowser() ? t('signup.socialDivider') : t('auth.googleConfirmUseDifferent', 'Use a different account')}
            fallbackLabel={t('signup.social.google')}
            loginHint={savedAccount.email}
            onFallback={onSocialSignup}
          />
        </div>
      ) : (
        <GoogleIdentityButton
          mode="signup"
          dividerLabel={t('signup.socialDivider')}
          fallbackLabel={t('signup.social.google')}
          onFallback={onSocialSignup}
        />
      )}

      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-(--text)">
        <span className="h-px flex-1 bg-(--border)" />
      </div>

      <div className="rounded-2xl border border-(--border) bg-(--surface-muted) px-4 py-3 text-center text-sm text-(--text) sm:px-5">
        {t('signup.haveAccount')}{' '}
        <Link to={`/${language}/login`} className="font-semibold text-(--gd-primary) hover:underline">
          {t('signup.loginCta')}
        </Link>
      </div>
    </div>
  )
}
