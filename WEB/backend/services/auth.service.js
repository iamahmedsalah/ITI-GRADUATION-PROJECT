import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/user/userAccountModel.js";
import UserActivity from "../models/user/userActivityModel.js";
import UserAiUsage from "../models/user/userAiUsageModel.js";
import UserCourseProgress from "../models/user/userCourseProgressModel.js";
import UserPreference from "../models/user/userPreferenceModel.js";
import UserProfile from "../models/user/userProfileModel.js";
import UserRoadmap from "../models/user/userRoadmapModel.js";
import UserRoadmapStepProgress from "../models/user/userRoadmapStepProgressModel.js";
import {
  sendPasswordResetEmail,
  sendResetSuccessEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../mails/emails.js";
import generateTokenSetCookie, {
  clearAuthCookies,
  hashRefreshToken,
  issueAccessToken,
  issueRefreshToken,
} from "../utils/generateTokenSetCookie.js";
import {
  REFRESH_TOKEN_MAX_AGE_MS,
  generateVerificationToken,
  toPublicUser,
  updateLoginStreak,
} from "../helpers/auth.helpers.js";

const recordLoginActivity = async (req, user) => {
  try {
    await UserActivity.create({
      user: user._id,
      type: "login",
      device: req?.headers?.["user-agent"] || "Unknown",
      ipAddress:
        req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req?.socket?.remoteAddress ||
        req?.ip ||
        "Unknown",
      occurredAt: new Date(),
    });
  } catch (error) {
    console.warn("Unable to record login activity:", error.message);
  }
};

const parseOrigins = (...values) =>
  values
    .filter(Boolean)
    .join(",")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean)
    .filter((origin) => {
      try {
        const parsedOrigin = new URL(origin);
        return parsedOrigin.protocol === "http:" || parsedOrigin.protocol === "https:";
      } catch {
        return false;
      }
    });

const isLocalOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
};

const getFrontendOrigin = (req = null) => {
  const configuredOrigins = parseOrigins(
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    process.env.PRODUCTION_URL,
  );

  if (process.env.NODE_ENV !== "production") {
    return configuredOrigins.find(isLocalOrigin) || "http://localhost:5173";
  }

  if (configuredOrigins.length > 0) {
    const requestOrigin = req?.get?.("origin")?.replace(/\/$/, "");
    if (requestOrigin && configuredOrigins.includes(requestOrigin)) {
      return requestOrigin;
    }

    return configuredOrigins.find((origin) => !isLocalOrigin(origin)) || configuredOrigins[0];
  }

  return req ? buildBackendOrigin(req) : "http://localhost:5173";
};

const buildFrontendUrl = (req, path) => {
  return new URL(path, getFrontendOrigin(req)).toString();
};

const buildBackendOrigin = (req) => {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.get("host");

  return `${protocol}://${host}`;
};

const buildResetPasswordUrl = (token, email) => {
  const baseUrl = buildFrontendUrl(null, `/reset-password/${token}`);
  return `${baseUrl}?email=${encodeURIComponent(email)}`;
};

const issueVerificationEmail = async (user) => {
  const verificationToken = generateVerificationToken();

  user.verificationToken = verificationToken;
  user.verificationTokenExpireAt = Date.now() + 24 * 60 * 60 * 1000;
  await user.save();

  await sendVerificationEmail(
    user.email,
    verificationToken,
    `${user.Fname} ${user.Lname}`,
  );

  return verificationToken;
};

const issuePasswordResetEmail = async (user) => {
  const resetToken = crypto.randomBytes(20).toString("hex");
  const hashedResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordToken = hashedResetToken;
  user.resetPasswordExpireAt = Date.now() + 60 * 60 * 1000;
  await user.save();

  const resetURL = buildResetPasswordUrl(resetToken, user.email);

  await sendPasswordResetEmail(
    user.email,
    resetURL,
    `${user.Fname} ${user.Lname}`,
  );

  return resetToken;
};

const deleteUserOwnedData = async (userId) => {
  await Promise.all([
    UserProfile.deleteMany({ user: userId }),
    UserPreference.deleteMany({ user: userId }),
    UserActivity.deleteMany({ user: userId }),
    UserAiUsage.deleteMany({ user: userId }),
    UserCourseProgress.deleteMany({ user: userId }),
    UserRoadmapStepProgress.deleteMany({ user: userId }),
    UserRoadmap.deleteMany({ user: userId }),
  ]);

  await User.findByIdAndDelete(userId);
};

const purgeDueDeletedAccounts = async () => {
  const dueUsers = await User.find({
    "accountDeletion.status": "scheduled",
    "accountDeletion.scheduledFor": { $lte: new Date() },
  })
    .select("_id")
    .limit(20)
    .lean();

  for (const user of dueUsers) {
    await deleteUserOwnedData(user._id);
  }
};

const buildSignupConflictResponse = (field) => ({
  success: false,
  message: "Validation failed.",
  errors: [
    {
      field,
      message:
        field === "email"
          ? "Email is already registered."
          : "Username is already taken.",
    },
  ],
});

const buildDeactivatedSignupConflictResponse = () => ({
  success: false,
  message: "Validation failed.",
  errors: [
    {
      field: "identifier",
      message:
        "An account with this email or username exists but is deactivated. Please contact support to reactivate it.",
    },
  ],
});

export const signup = async (req, res) => {
  const { username, Fname, Lname, email, password } = req.body;

  try {
    if (!username || !Fname || !Lname || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Username, First Name, Last Name, email, and password are required.",
      });
    }

    const normalizedUsername = String(username).trim().toLowerCase();
    const normalizedFname = String(Fname).trim();
    const normalizedLname = String(Lname).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    // Check for duplicates with a friendly message
    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });
    if (existing) {
      if (existing.isActive === false) {
        return res.status(409).json(buildDeactivatedSignupConflictResponse());
      }

      const field = existing.email === normalizedEmail ? "email" : "username";
      return res.status(409).json(buildSignupConflictResponse(field));
    }

    const newUser = await User.create({
      username: normalizedUsername,
      Fname: normalizedFname,
      Lname: normalizedLname,
      email: normalizedEmail,
      password,
      loginStreak: {
        current: 1,
        longest: 1,
        lastLoginDate: new Date(),
      },
    });

    const { accessToken, refreshToken } = generateTokenSetCookie(res, newUser._id);
    newUser.refreshTokenHash = hashRefreshToken(refreshToken);
    newUser.refreshTokenExpiresAt = Date.now() + REFRESH_TOKEN_MAX_AGE_MS;
    await newUser.save();

    await issueVerificationEmail(newUser);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      accessToken,
      user: toPublicUser(newUser),
    });
  } catch (error) {
    const message = String(error?.message || "");

    if (error?.code === 11000) {
      const duplicatedField =
        Object.keys(error?.keyPattern || {})[0] || "field";
      const conflictField = duplicatedField === "email" ? "email" : "username";
      return res.status(409).json(buildSignupConflictResponse(conflictField));
    }

    if (
      message.includes("JWT_SECRET is not configured") ||
      message.includes("expiresIn")
    ) {
      return res.status(500).json({
        success: false,
        message: "Server auth configuration error.",
      });
    }

    // Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    console.error("Signup Error Details:", error);
    return res.status(500).json({
      success: false,
      message: "Registration failed.",
      error: error.message,
    });
  }
};

// POST - Login

export const login = async (req, res) => {
  const body = req.body ?? {};
  const identifier = body.identifier || body.email || body.username;
  const { password } = body;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: "Please enter your email address or username and password.",
    });
  }

  try {
    await purgeDueDeletedAccounts();

    const normalizedIdentifier = String(identifier).trim().toLowerCase();

    const user = await User.findOne({
      $or: [
        { email: normalizedIdentifier },
        { username: normalizedIdentifier },
      ],
    }).select("+password");

    if (!user) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Invalid email/username or password.",
        });
    }

    const deletionStatus = user.accountDeletion?.status || "none";
    const isDeletionScheduled = deletionStatus === "scheduled";
    const isSelfDeactivated = user.isActive === false && !user.deactivatedBy && !isDeletionScheduled;

    if (user.isActive === false && isDeletionScheduled) {
      return res.status(403).json({
        success: false,
        message: "This account is scheduled for deletion. Use the undo deletion flow before logging in.",
        code: "ACCOUNT_DELETION_SCHEDULED",
        scheduledFor: user.accountDeletion?.scheduledFor ?? null,
      });
    }

    if (user.isActive === false && !isSelfDeactivated) {
      return res.status(403).json({
        success: false,
        message: "This account is deactivated. Please contact support.",
      });
    }

    // Account lockout: check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const unlockTime = new Date(user.lockUntil).toLocaleString();
      return res.status(423).json({
        success: false,
        message: `Account locked until ${unlockTime} due to multiple failed login attempts.`,
        lockUntil: user.lockUntil,
      });
    }

    const isMatch = await user.comparePassword(String(password));

    if (!isMatch) {
      // Increment failed attempts and set lock if threshold reached
      const MAX_FAILED = parseInt(process.env.MAX_FAILED_LOGIN, 10) || 8;
      const LOCK_TIME =
        parseInt(process.env.ACCOUNT_LOCK_TIME_MS, 10) || 30 * 60 * 1000; // 30 minutes

      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED) {
        user.lockUntil = Date.now() + LOCK_TIME;
      }
      await user.save();

      return res
        .status(401)
        .json({
          success: false,
          message: "Invalid email/username or password.",
        });
    }

    if (user.isVerified === false) {
      return res
        .status(401)
        .json({ success: false, message: "Email not verified." });
    }

    // Successful login: reset failed attempts and lock
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    if (isSelfDeactivated) {
      user.isActive = true;
      user.deactivatedAt = undefined;
      user.deactivatedBy = undefined;
      user.deactivationReason = undefined;
    }

    const { accessToken, refreshToken } = generateTokenSetCookie(res, user._id);
    user.refreshTokenHash = hashRefreshToken(refreshToken);
    user.refreshTokenExpiresAt = Date.now() + REFRESH_TOKEN_MAX_AGE_MS;

    const now = new Date();
    user.lastLogin = now;
    updateLoginStreak(user, now);
    await user.save();
    await recordLoginActivity(req, user);

    return res.status(200).json({
      success: true,
      message: isSelfDeactivated ? "Account reactivated successfully." : "Login successful.",
      accessToken,
      user: toPublicUser(user),
    });
  } catch (error) {
    const message = String(error?.message || "");
    if (
      message.includes("JWT_SECRET is not configured") ||
      message.includes("expiresIn")
    ) {
      return res.status(500).json({
        success: false,
        message: "Server auth configuration error.",
      });
    }

    console.error("Login Error Details:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed.",
      error: error.message,
    });
  }
};

// POST - Verify Email

export const verifyEmail = async (req, res) => {
  try {
    const { code } = req.body ?? {};

    if (!code) {
      return res
        .status(400)
        .json({ success: false, message: "Verification code is required." });
    }

    const user = await User.findOne({
      verificationToken: String(code),
      verificationTokenExpireAt: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification code." });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpireAt = undefined;
    await user.save();

    await sendWelcomeEmail(user.email, `${user.Fname} ${user.Lname}`);

    return res
      .status(200)
      .json({ success: true, message: "Email verified successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST - Resend Verify Email Code

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body ?? {};

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });

    if (user && user.isVerified !== true) {
      await issueVerificationEmail(user);
    }

    return res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a new verification code has been sent.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST - Logout

export const logout = (req, res) => {
  if (req.user) {
    req.user.refreshTokenHash = undefined;
    req.user.refreshTokenExpiresAt = undefined;
    void req.user.save();
  }

  clearAuthCookies(res);
  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully." });
};

// POST - Refresh Access Token

export const refreshAuth = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      code: "REFRESH_MISSING",
      message: "Refresh token missing. Please log in again.",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("+refreshTokenHash +password");

    if (!user || !user.refreshTokenHash) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        code: "REFRESH_INVALID",
        message: "Refresh token invalid. Please log in again.",
      });
    }

    if (user.isActive === false) {
      clearAuthCookies(res);
      return res.status(403).json({
        success: false,
        message: "This account is deactivated. Please contact support.",
      });
    }

    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < Date.now()) {
      user.refreshTokenHash = undefined;
      user.refreshTokenExpiresAt = undefined;
      await user.save();
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        code: "REFRESH_EXPIRED",
        message: "Refresh token expired. Please log in again.",
      });
    }

    if (hashRefreshToken(refreshToken) !== user.refreshTokenHash) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        code: "REFRESH_MISMATCH",
        message: "Refresh token mismatch. Please log in again.",
      });
    }

    if (user.passwordChangedAt) {
      const pwdChangedTs = parseInt(new Date(user.passwordChangedAt).getTime() / 1000, 10);
      if (decoded.iat < pwdChangedTs) {
        clearAuthCookies(res);
        return res.status(401).json({
          success: false,
          code: "REFRESH_PASSWORD_CHANGED",
          message: "User recently changed password. Please log in again.",
        });
      }
    }

    const accessToken = issueAccessToken(user._id);
    const nextRefreshToken = issueRefreshToken(user._id);

    user.refreshTokenHash = hashRefreshToken(nextRefreshToken);
    user.refreshTokenExpiresAt = Date.now() + REFRESH_TOKEN_MAX_AGE_MS;
    await user.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", nextRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 15 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      accessToken,
      user: toPublicUser(user),
    });
  } catch (error) {
    clearAuthCookies(res);
    return res.status(401).json({
      success: false,
      code: "REFRESH_SESSION_EXPIRED",
      message: "Session expired. Please log in again.",
    });
  }
};

// POST - Forget Password

export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body ?? {};

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (user) {
      await issuePasswordResetEmail(user);
    }

    return res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST - Resend Password Reset Email

export const resendPasswordReset = async (req, res) => {
  try {
    const { email } = req.body ?? {};

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });

    if (user) {
      await issuePasswordResetEmail(user);
    }

    return res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a new password reset link has been sent.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST - Reset Password

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body ?? {};

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "New password is required.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpireAt: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset password link.",
      });
    }

    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      "Unknown";

    const device = req.headers["user-agent"] || "Unknown";

    const resetTime = new Date().toLocaleString("en-US", {
      timeZone: "Africa/Cairo",
      dateStyle: "medium",
      timeStyle: "medium",
    });

    const location = "Approximate location unavailable";

    user.password = String(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpireAt = undefined;

    await user.save();

    const passwordChangedAt = new Date(
      user.passwordChangedAt || Date.now(),
    ).toLocaleString("en-US", {
      timeZone: "Africa/Cairo",
      dateStyle: "medium",
      timeStyle: "medium",
    });

    await sendResetSuccessEmail(user.email, `${user.Fname} ${user.Lname}`, {
      passwordChangedAt,
      resetTime,
      ipAddress,
      location,
      device,
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// GET - Check Auth

export const checkAuth = async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

  if (!req.user) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      message: "Unauthorized. Please log in again.",
    });
  }

  const hasPreferences = await UserPreference.exists({ user: req.user._id });

  return res.status(200).json({
    success: true,
    authenticated: true,
    user: toPublicUser(req.user, { hasPreferences }),
  });
};
