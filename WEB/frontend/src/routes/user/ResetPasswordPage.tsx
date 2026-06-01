import SharedResetPasswordPage from '../../components/common/SharedResetPasswordPage'

export default function ResetPasswordPage() {
  return (
    <SharedResetPasswordPage
      resetPathBuilder={(token) => `/auth/reset-password/${token}`}
      successRedirectPath={(language) => `/${language}/login`}
      badgeKey="reset.badge"
      titleKey="reset.title"
      subtitleKey="reset.subtitle"
      resendPath="/auth/resend-reset-password"
      showLoginCta
    />
  )
}
