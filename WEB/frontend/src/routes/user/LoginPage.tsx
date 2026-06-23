import { useTranslation } from 'react-i18next'
import AuthIntroPanel from '../../components/auth/AuthIntroPanel'
import AuthShell from '../../components/auth/AuthShell'
import LoginForm from '../../components/auth/LoginForm'
import GoogleIdentityButton from '../../components/auth/GoogleIdentityButton'
import ContinueAsGoogleButton from '../../components/auth/ContinueAsGoogleButton'
import { useLoginPage } from '../../hooks/useLoginPage'
import { isChromeBrowser } from '../../utils/browserCheck'

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
          {loginPage.savedAccount ? (
            <div className="grid gap-3 pt-2">
              {!isChromeBrowser() && (
                <>
                  <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-(--text)">
                    <span className="h-px flex-1 bg-(--border)" />
                    <span>{t('login.socialDivider')}</span>
                    <span className="h-px flex-1 bg-(--border)" />
                  </div>
                  <ContinueAsGoogleButton
                    account={loginPage.savedAccount}
                    onClick={() => void loginPage.handleSocialLogin(loginPage.savedAccount?.email)}
                  />
                </>
              )}
              <GoogleIdentityButton
                mode="login"
                dividerLabel={isChromeBrowser() ? t('login.socialDivider') : t('auth.googleConfirmUseDifferent', 'Use a different account')}
                fallbackLabel={t('login.social.google')}
                loginHint={loginPage.savedAccount.email}
                onFallback={loginPage.handleSocialLogin}
              />
            </div>
          ) : (
            <GoogleIdentityButton
              mode="login"
              dividerLabel={t('login.socialDivider')}
              fallbackLabel={t('login.social.google')}
              onFallback={loginPage.handleSocialLogin}
            />
          )}
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
