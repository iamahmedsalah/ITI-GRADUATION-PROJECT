import SharedForgotPasswordPage from '../../components/common/SharedForgotPasswordPage'

export default function ForgotPasswordPage() {
  return (
    <SharedForgotPasswordPage
      requestPath="/auth/forgot-password"
      badgeKey="forgot.badge"
      titleKey="forgot.title"
      subtitleKey="forgot.subtitle"
      helperTitleKey="forgot.organizeTitle"
      helperTextKey="forgot.helper"
      backToLoginLabelKey="forgot.backToLogin"
      successRedirectPath={(language) => `/${language}/login`}
      backToLoginPath={(language) => `/${language}/login`}
    />
  )
}
