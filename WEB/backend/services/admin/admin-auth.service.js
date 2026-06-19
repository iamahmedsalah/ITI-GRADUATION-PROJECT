import crypto from "crypto";
import User from "../../models/user/userAccountModel.js";
import {
  sendPasswordResetEmail,
  sendResetSuccessEmail,
  sendWelcomeEmail,
} from "../../mails/emails.js";
import generateTokenSetCookie, {
  clearAuthCookies,
  hashRefreshToken,
} from "../../utils/generateTokenSetCookie.js";
import { REFRESH_TOKEN_MAX_AGE_MS } from "../../helpers/auth.helpers.js";

const toPublicAdmin = (user) => ({
  _id: user._id,
  username: user.username,
  Fname: user.Fname,
  Lname: user.Lname,
  name: `${user.Fname} ${user.Lname}`,
  email: user.email,
  avatarUrl: user.avatarUrl || null,
  role: user.role,
  isVerified: user.isVerified,
  lastLogin: user.lastLogin,
  loginStreak: {
    current: user.loginStreak?.current ?? 0,
    longest: user.loginStreak?.longest ?? 0,
    lastLoginDate: user.loginStreak?.lastLoginDate ?? null,
  },
});

const ensureAdminRole = (user) => user?.role === "admin";

export const adminLogin = async (req, res) => {
  const body = req.body ?? {};
  const identifier = body.identifier || body.email || body.username;
  const { password } = body;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: "Please enter your admin email/username and password.",
    });
  }

  try {
    const normalizedIdentifier = String(identifier).trim().toLowerCase();
    const user = await User.findOne({
      $or: [
        { email: normalizedIdentifier },
        { username: normalizedIdentifier },
      ],
    }).select("+password");

    if (!user || !ensureAdminRole(user)) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "This admin account is deactivated.",
      });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const unlockTime = new Date(user.lockUntil).toLocaleString();
      return res.status(423).json({
        success: false,
        message: `Account locked until ${unlockTime} due to multiple failed login attempts.`,
      });
    }

    const isMatch = await user.comparePassword(String(password));

    if (!isMatch) {
      const MAX_FAILED = parseInt(process.env.MAX_FAILED_LOGIN, 10) || 5;
      const LOCK_TIME =
        parseInt(process.env.ACCOUNT_LOCK_TIME_MS, 10) || 30 * 60 * 1000;

      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED) {
        user.lockUntil = Date.now() + LOCK_TIME;
      }
      await user.save();

      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    if (user.isVerified === false) {
      return res.status(401).json({
        success: false,
        message: "Admin email not verified.",
      });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = Date.now();

    const { accessToken, refreshToken } = generateTokenSetCookie(res, user._id);
    user.refreshTokenHash = hashRefreshToken(refreshToken);
    user.refreshTokenExpiresAt = Date.now() + REFRESH_TOKEN_MAX_AGE_MS;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      accessToken,
      user: toPublicAdmin(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Admin login failed.",
      error: error.message,
    });
  }
};

export const adminVerifyEmail = async (req, res) => {
  try {
    const { code } = req.body ?? {};

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Verification code is required.",
      });
    }

    const user = await User.findOne({
      verificationToken: String(code),
      verificationTokenExpireAt: { $gt: Date.now() },
      role: "admin",
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin verification code.",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpireAt = undefined;
    await user.save();

    await sendWelcomeEmail(user.email, `${user.Fname} ${user.Lname}`);

    return res.status(200).json({
      success: true,
      message: "Admin email verified successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const adminForgetPassword = async (req, res) => {
  try {
    const { email } = req.body ?? {};

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase(),
      role: "admin",
    });

    if (user) {
      const resetToken = crypto.randomBytes(20).toString("hex");
      const hashedResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      user.resetPasswordToken = hashedResetToken;
      user.resetPasswordExpireAt = Date.now() + 60 * 60 * 1000;
      await user.save();

      const frontendBase =
        process.env.CLIENT_URL || process.env.PRODUCTION_URL || "";
      const adminResetPath = `/en/admin/reset-password/${resetToken}`;
      const resetURL = `${frontendBase}${adminResetPath}`;

      await sendPasswordResetEmail(
        user.email,
        resetURL,
        `${user.Fname} ${user.Lname}`,
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const adminResetPassword = async (req, res) => {
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
      role: "admin",
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired admin reset link.",
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
      message: "Admin password reset successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const adminLogout = (req, res) => {
  if (req.user) {
    req.user.refreshTokenHash = undefined;
    req.user.refreshTokenExpiresAt = undefined;
    void req.user.save();
  }

  clearAuthCookies(res);
  return res.status(200).json({
    success: true,
    message: "Admin logged out successfully.",
  });
};

export const adminCheckAuth = async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

  if (!req.user || req.user.role !== "admin") {
    return res.status(401).json({
      success: false,
      authenticated: false,
      message: "Unauthorized admin access.",
    });
  }

  try {
    return res.status(200).json({
      success: true,
      authenticated: true,
      user: toPublicAdmin(req.user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      authenticated: false,
      message: "Failed to check admin authentication.",
      error: error.message,
    });
  }
};
