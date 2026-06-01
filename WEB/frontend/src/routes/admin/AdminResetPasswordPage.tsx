import SharedResetPasswordPage from '../../components/common/SharedResetPasswordPage'

export default function AdminResetPasswordPage() {
  return (
    <SharedResetPasswordPage
      resetPathBuilder={(token) => `/admin/auth/reset-password/${token}`}
      successRedirectPath={(language) => `/${language}/admin/login`}
      badgeKey="adminUi.reset.badge"
      titleKey="adminUi.reset.title"
      subtitleKey="adminUi.reset.subtitle"
      forgotLinkPath={(language) => `/${language}/admin/forgot-password`}
      forgotLinkLabelKey="reset.requestAnother"
      backToLoginPath={(language) => `/${language}/admin/login`}
      backToLoginLabelKey="adminUi.reset.backToAdminLogin"
    />
  )
}
