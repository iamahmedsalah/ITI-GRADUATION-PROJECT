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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthSignupRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/signup", signupValidation, signupUniquenessValidation, signup);
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
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/verify-email", verifyEmailValidation, verifyEmail);
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
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/login", loginLimiter, loginValidation, login);
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
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
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
 *           pattern: "^[a-fA-F0-9]{40}$"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
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
