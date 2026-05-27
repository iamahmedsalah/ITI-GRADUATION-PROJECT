import User from "../models/user/userModel.js";
import crypto from "crypto";
import { customAlphabet } from "nanoid";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail,
} from "../mails/emails.js";
import generateTokenSetCookie, {
  getAuthCookieOptions,
} from "../utils/generateTokenSetCookie.js";

const toPublicUser = (user) => ({
  _id: user._id,
  username: user.username,
  name: `${user.Fname} ${user.Lname}`,
  email: user.email,
  isVerified: user.isVerified,
  lastLogin: user.lastLogin,
});

const generateVerificationToken = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);

// POST - Sign Up
export const signup = async (req, res) => {

  const { username, Fname, Lname, email, password } = req.body;

  try {

    if (!username || !Fname || !Lname || !email || !password) {
      return res
        .status(400)
        .json({
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
      const field =
        existing.email === normalizedEmail ? "email" : "username";
      return res.status(409).json({
        success: false,
        message: `A user with that ${field} already exists.`,
      });
    }

    const verificationToken = generateVerificationToken();

    const newUser = await User.create({
      username: normalizedUsername,
      Fname: normalizedFname,
      Lname: normalizedLname,
      email: normalizedEmail,
      password,
      verificationToken,
      verificationTokenExpireAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    generateTokenSetCookie(res, newUser._id);

    await sendVerificationEmail(
      newUser.email,
      verificationToken,
      `${newUser.Fname} ${newUser.Lname}`,
    );

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: toPublicUser(newUser),
    });
  } catch (error) {
    const message = String(error?.message || "");

    if (error?.code === 11000) {
      const duplicatedField = Object.keys(error?.keyPattern || {})[0] || "field";
      return res.status(409).json({
        success: false,
        message: `A user with that ${duplicatedField} already exists.`,
      });
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
    return res
      .status(400)
      .json({
        success: false,
        message: "Please enter your email address or username and password.",
      });
  }

  try {
    const normalizedIdentifier = String(identifier).trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }],
    }).select("+password");

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email/username or password." });
    }

    // Account lockout: check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const unlockTime = new Date(user.lockUntil).toLocaleString();
      return res.status(423).json({
        success: false,
        message: `Account locked until ${unlockTime} due to multiple failed login attempts.`,
      });
    }

    const isMatch = await user.comparePassword(String(password));

    if (!isMatch) {
      // Increment failed attempts and set lock if threshold reached
      const MAX_FAILED = parseInt(process.env.MAX_FAILED_LOGIN, 10) || 5;
      const LOCK_TIME = parseInt(process.env.ACCOUNT_LOCK_TIME_MS, 10) || 60 * 60 * 1000; // 1 hour

      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED) {
        user.lockUntil = Date.now() + LOCK_TIME;
      }
      await user.save();

      return res
        .status(401)
        .json({ success: false, message: "Invalid email/username or password." });
    }

    if (user.isVerified === false) {
      return res
        .status(401)
        .json({ success: false, message: "Email not verified." });
    }

    // Successful login: reset failed attempts and lock
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    generateTokenSetCookie(res, user._id);

    user.lastLogin = Date.now();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Login successful.",
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

// POST - Logout
export const logout = (req, res) => {
  res.clearCookie("token", getAuthCookieOptions());
  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully." });
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
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist." });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const hashedResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpireAt = Date.now() + 60 * 60 * 1000;
    await user.save();

    const frontendBase =
      process.env.CLIENT_URL || process.env.PRODUCTION_URL || "";
    const resetURL = `${frontendBase}/reset-password/${resetToken}`;

    await sendPasswordResetEmail(
      user.email,
      resetURL,
      `${user.Fname} ${user.Lname}`,
    );

    return res.status(200).json({
      success: true,
      message: "Password reset email sent successfully.",
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

    const passwordChangedAt = new Date(user.passwordChangedAt || Date.now()).toLocaleString("en-US", {
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
export const checkAuth = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      message: "Unauthorized. Please log in again.",
    });
  }

  return res.status(200).json({
    success: true,
    authenticated: true,
    user: toPublicUser(req.user),
  });
};

export default {
  signup,
  verifyEmail,
  login,
  logout,
  forgetPassword,
  resetPassword,
  checkAuth,
};

