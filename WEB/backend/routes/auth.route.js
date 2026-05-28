import express from "express";
import { loginLimiter, forgotPasswordLimiter } from "../utils/rateLimiter.js";

import { protect } from "../middleware/protectsRoutes.js";
import {
  signupValidation,
  signupUniquenessValidation,
  verifyEmailValidation,
  loginValidation,
  forgetPasswordValidation,
  resetPasswordValidation,
} from "../middleware/authValidators.js";
import {
  signup,
  verifyEmail,
  login,
  logout,
  forgetPassword,
  resetPassword,
  checkAuth,
} from "../services/users.service.js";

const router = express.Router();

// PUBLIC ROUTES (Anyone can access these)
/**
 * @openapi
 * /auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Create a user account
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post("/signup", signupValidation, signupUniquenessValidation, signup);
/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify a user email address
 */
router.post("/verify-email", verifyEmailValidation, verifyEmail);
/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login a user
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", loginLimiter, loginValidation, login);
/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset link
 */
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  forgetPasswordValidation,
  forgetPassword,
);
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
 */
router.post("/reset-password/:token", resetPasswordValidation, resetPassword);

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

export default router;
