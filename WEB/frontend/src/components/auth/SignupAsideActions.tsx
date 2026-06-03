import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import SocialAuthButton from './SocialAuthButton'

type SignupAsideActionsProps = {
  onSocialSignup: () => void
}

export default function SignupAsideActions({ onSocialSignup }: SignupAsideActionsProps) {
  const { language } = useLanguage()
  const { t } = useTranslation()

  return (
    <div className="mt-3 grid gap-3">
      <SocialAuthButton
        dividerLabel={t('signup.socialDivider')}
        buttonLabel={t('signup.social.google')}
        onClick={onSocialSignup}
      />

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
