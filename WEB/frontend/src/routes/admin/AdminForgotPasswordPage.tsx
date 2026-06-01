import SharedForgotPasswordPage from '../../components/common/SharedForgotPasswordPage'

export default function AdminForgotPasswordPage() {
  return (
    <SharedForgotPasswordPage
      requestPath="/admin/auth/forgot-password"
      badgeKey="adminUi.reset.badge"
      titleKey="adminUi.reset.forgotTitle"
      subtitleKey="adminUi.reset.forgotSubtitle"
      emailPlaceholderKey="adminUi.reset.emailPlaceholder"
      backToLoginLabelKey="adminUi.reset.backToAdminLogin"
      successRedirectPath={(language) => `/${language}/admin/login`}
      backToLoginPath={(language) => `/${language}/admin/login`}
    />
  )
}
