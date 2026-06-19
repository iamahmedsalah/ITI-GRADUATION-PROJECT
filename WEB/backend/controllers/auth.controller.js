export {
  checkAuth,
  forgetPassword,
  login,
  logout,
  refreshAuth,
  resendPasswordReset,
  resendVerificationEmail,
  resetPassword,
  signup,
  verifyEmail,
} from "../services/auth.service.js";

export {
  handleSocialAuthCallback,
  startSocialAuth,
} from "../services/oauth.service.js";

export {
  confirmAccountDeletion,
  confirmAccountDeletionUndo,
  deactivateCurrentAccount,
  requestAccountDeletion,
  requestAccountDeletionUndo,
} from "../services/account.service.js";

export {
  deleteUserActivity,
  getDashboardSummary,
  getPreferences,
  updateAvatar,
  updatePassword,
  updatePreferences,
  updateProfile,
} from "../services/user.service.js";
