import { useTranslation } from 'react-i18next'
import AuthIntroPanel from '../../components/auth/AuthIntroPanel'
import AuthShell from '../../components/auth/AuthShell'
import VerifyEmailForm from '../../components/auth/VerifyEmailForm'
import { useVerifyEmailPage } from '../../hooks/useVerifyEmailPage'

function VerifyEmailPage() {
  const { t } = useTranslation()
  const verifyPage = useVerifyEmailPage()

  return (
    <AuthShell
      direction={verifyPage.direction}
      aside={
        <AuthIntroPanel
          badge={t('verify.badge')}
          title={verifyPage.verifyTitle}
          subtitle={verifyPage.verifySubtitle}
          organizeTitle={t('verify.organizeTitle')}
          helper={t('verify.helper')}
        />
      }
    >
      <VerifyEmailForm
        form={verifyPage.form}
        direction={verifyPage.direction}
        codeValue={verifyPage.codeValue}
        oauthVerified={verifyPage.oauthVerified}
        oauthProvider={verifyPage.oauthProvider}
        isSubmitting={verifyPage.isSubmitting}
        isResending={verifyPage.isResending}
        canResend={verifyPage.canResend}
        isCoolingDown={verifyPage.isCoolingDown}
        cooldownLabel={verifyPage.cooldownLabel}
        onResendCode={verifyPage.onResendCode}
        onContinue={verifyPage.continueToDashboard}
        onSubmit={verifyPage.onSubmit}
      />
    </AuthShell>
  )
}

export default VerifyEmailPage
