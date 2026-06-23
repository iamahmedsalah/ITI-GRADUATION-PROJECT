import { useTranslation } from 'react-i18next'
import AuthIntroPanel from '../../components/auth/AuthIntroPanel'
import AuthShell from '../../components/auth/AuthShell'
import SignupAsideActions from '../../components/auth/SignupAsideActions'
import SignupForm from '../../components/auth/SignupForm'
import { useSignupPage } from '../../hooks/useSignupPage'

function SignupPage() {
  const { t } = useTranslation()
  const signupPage = useSignupPage()

  return (
    <AuthShell
      direction={signupPage.direction}
      aside={
        <AuthIntroPanel
          badge={t('signup.badge')}
          title={t('signup.title')}
          subtitle={t('signup.subtitle', { language: signupPage.languageLabel })}
          organizeTitle={t('signup.organizeTitle')}
          helper={t('signup.helper')}
        >
          <SignupAsideActions
            onSocialSignup={signupPage.handleSocialSignup}
            savedAccount={signupPage.savedAccount}
          />
        </AuthIntroPanel>
      }
    >
      <SignupForm
        form={signupPage.form}
        values={signupPage.values}
        isSubmitting={signupPage.isSubmitting}
        showPassword={signupPage.showPassword}
        isPasswordCopied={signupPage.isPasswordCopied}
        onTogglePassword={() => signupPage.setShowPassword((previous) => !previous)}
        onGeneratePassword={signupPage.handleGeneratePassword}
        onCopyPassword={signupPage.handleCopyPassword}
        onSubmit={signupPage.onSubmit}
      />
    </AuthShell>
  )
}

export default SignupPage
