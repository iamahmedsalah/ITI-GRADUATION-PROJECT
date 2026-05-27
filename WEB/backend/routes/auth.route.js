import express from "express";
import {loginLimiter, forgotPasswordLimiter } from "../utils/rateLimiter.js" 

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
router.post("/signup", signupValidation, signupUniquenessValidation, signup);
router.post("/verify-email", verifyEmailValidation, verifyEmail);
router.post("/login", loginLimiter, loginValidation, login);
router.post("/forgot-password", forgotPasswordLimiter, forgetPasswordValidation, forgetPassword);
router.post("/reset-password/:token", resetPasswordValidation, resetPassword);


// PROTECTED ROUTES (Requires authentication)
router.post("/logout", protect , logout);
router.get("/check-auth", protect ,checkAuth);

export default router;
