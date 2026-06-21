import express from "express";
import {
  loginLimiter,
  signupLimiter,
  forgotPasswordLimiter,
  resendVerificationLimiter,
} from "../utils/rateLimiter.js";

import { protect } from "../middleware/protectsRoutes.js";
import { validateRequest } from "../middleware/validate.js";
import {
  signupSchema,
  verifyEmailSchema,
  loginSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
  profileUpdateSchema,
  updatePasswordSchema,
  avatarUpdateSchema,
  preferencesUpdateSchema,
  accountPasswordActionSchema,
  accountDeleteCodeSchema,
  accountDeleteUndoRequestSchema,
} from "../validation/auth.schemas.js";
import { signupUniquenessValidation } from "../middleware/authValidators.js";
import {
  signup,
  verifyEmail,
  resendVerificationEmail,
  login,
  logout,
  forgetPassword,
  resendPasswordReset,
  resetPassword,
  checkAuth,
  refreshAuth,
  getPreferences,
  getDashboardSummary,
  deleteUserActivity,
  updateProfile,
  updatePassword,
  updateAvatar,
  updatePreferences,
  deactivateCurrentAccount,
  requestAccountDeletion,
  confirmAccountDeletion,
  requestAccountDeletionUndo,
  confirmAccountDeletionUndo,
  startSocialAuth,
  handleSocialAuthCallback,
} from "../controllers/auth.controller.js";

const router = express.Router();

// PUBLIC ROUTES (Anyone can access these)
/**
 * @openapi
 * /auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Create a user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthSignupRequest'
 *           example:
 *             username: student_test
 *             Fname: Test
 *             Lname: Student
 *             email: student_test@example.com
 *             password: Password@123
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/signup", signupLimiter, validateRequest(signupSchema), signupUniquenessValidation, signup);
/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify a user email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthVerifyEmailRequest'
 *           example:
 *             code: "123456"
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/verify-email", validateRequest(verifyEmailSchema), verifyEmail);
/**
 * @openapi
 * /auth/resend-verification-code:
 *   post:
 *     tags: [Auth]
 *     summary: Resend a verification code to the user's email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *           example:
 *             email: student_test@example.com
 *     responses:
 *       200:
 *         description: Verification code resend attempted
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/resend-verification-code",
  resendVerificationLimiter,
  validateRequest(forgetPasswordSchema),
  resendVerificationEmail,
);
/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLoginRequest'
 *           example:
 *             identifier: student1@test.com
 *             password: Password@123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/login", loginLimiter, validateRequest(loginSchema), login);
/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh the access token using the refresh cookie
 *     responses:
 *       200:
 *         description: Access token refreshed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/refresh", refreshAuth);
/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *           example:
 *             email: student_test@example.com
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validateRequest(forgetPasswordSchema),
  forgetPassword,
);
/**
 * @openapi
 * /auth/resend-reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Resend a password reset link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *           example:
 *             email: student_test@example.com
 *     responses:
 *       200:
 *         description: Password reset resend attempted
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/resend-reset-password",
  forgotPasswordLimiter,
  validateRequest(forgetPasswordSchema),
  resendPasswordReset,
);

router.get("/oauth/login/google", startSocialAuth("google", "login"));
router.get("/oauth/signup/google", startSocialAuth("google", "signup"));
router.get("/oauth/google", startSocialAuth("google", "signup"));
router.get("/oauth/google/callback", handleSocialAuthCallback("google"));
/**
 * @openapi
 * /auth/reset-password/{token}:
 *   post:
 *     tags: [Auth]
 *     summary: Reset the account password
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[a-fA-F0-9]{40}$"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *           example:
 *             password: NewPassword@123
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/reset-password/:token", validateRequest(resetPasswordSchema), resetPassword);
router.post(
  "/account/delete/undo/request",
  loginLimiter,
  validateRequest(accountDeleteUndoRequestSchema),
  requestAccountDeletionUndo,
);
router.post(
  "/account/delete/undo/confirm",
  validateRequest(accountDeleteCodeSchema),
  confirmAccountDeletionUndo,
);

// PROTECTED ROUTES (Requires authentication)
/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout the current user
 *     security:
 *       - bearerAuth: []
 */
router.post("/logout", protect, logout);
/**
 * @openapi
 * /auth/check-auth:
 *   get:
 *     tags: [Auth]
 *     summary: Check current authentication state
 *     security:
 *       - bearerAuth: []
 */
router.get("/check-auth", protect, checkAuth);
router.get("/preferences", protect, getPreferences);
router.patch("/preferences", protect, validateRequest(preferencesUpdateSchema), updatePreferences);
router.get("/dashboard-summary", protect, getDashboardSummary);
router.delete("/activities/:activityId", protect, deleteUserActivity);
router.patch("/profile", protect, validateRequest(profileUpdateSchema), updateProfile);
router.patch("/profile/avatar", protect, validateRequest(avatarUpdateSchema), updateAvatar);
router.patch("/password", protect, validateRequest(updatePasswordSchema), updatePassword);
router.post("/account/deactivate", protect, validateRequest(accountPasswordActionSchema), deactivateCurrentAccount);
router.post("/account/delete/request", protect, validateRequest(accountPasswordActionSchema), requestAccountDeletion);
router.post("/account/delete/confirm", protect, validateRequest(accountDeleteCodeSchema), confirmAccountDeletion);

export default router;
