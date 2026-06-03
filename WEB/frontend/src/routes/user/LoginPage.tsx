import { useTranslation } from 'react-i18next'
import AuthIntroPanel from '../../components/auth/AuthIntroPanel'
import AuthShell from '../../components/auth/AuthShell'
import LoginForm from '../../components/auth/LoginForm'
import SocialAuthButton from '../../components/auth/SocialAuthButton'
import { useLoginPage } from '../../hooks/useLoginPage'

function LoginPage() {
  const { t } = useTranslation()
  const loginPage = useLoginPage()

  return (
    <AuthShell
      direction={loginPage.direction}
      gridClassName="lg:grid-cols-2"
      aside={
        <AuthIntroPanel
          badge={t('login.badge')}
          title={t('login.title')}
          subtitle={t('login.subtitle', { language: loginPage.languageLabel })}
          organizeTitle={t('login.organizeTitle')}
          helper={t('login.helper')}
          gradientTitle={false}
        >
          <SocialAuthButton
            dividerLabel={t('login.socialDivider')}
            buttonLabel={t('login.social.google')}
            onClick={() => void loginPage.handleSocialLogin()}
          />
        </AuthIntroPanel>
      }
    >
      <LoginForm
        form={loginPage.form}
        identifierValue={loginPage.identifierValue}
        passwordValue={loginPage.passwordValue}
        isSubmitting={loginPage.isSubmitting}
        showPassword={loginPage.showPassword}
        onTogglePassword={() => loginPage.setShowPassword((previous) => !previous)}
        onSubmit={loginPage.onSubmit}
      />
    </AuthShell>
  )
}

export default LoginPage
