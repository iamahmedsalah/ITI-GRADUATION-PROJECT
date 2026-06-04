import User from "../models/user/userAccountModel.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { customAlphabet } from "nanoid";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail,
} from "../mails/emails.js";
import generateTokenSetCookie, {
  clearAuthCookies,
  hashRefreshToken,
  issueAccessToken,
  issueRefreshToken,
} from "../utils/generateTokenSetCookie.js";

const REFRESH_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const generateSocialSuffix = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

const SOCIAL_PROVIDER_CONFIG = {
  google: {
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
    scope: "openid email profile",
    callbackPath: "/auth/oauth/google/callback",
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
};

const SOCIAL_CALLBACK_ERROR = "oauth_error";
const SOCIAL_SUCCESS_REDIRECT = "/verify-email";
const DEFAULT_SOCIAL_INTENT = "signup";

const toPublicUser = (user) => ({
  _id: user._id,
  username: user.username,
  name: `${user.Fname} ${user.Lname}`,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  lastLogin: user.lastLogin,
});

const generateVerificationToken = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  8,
);

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

const normalizeLanguage = (language) => (String(language).toLowerCase().startsWith("ar") ? "ar" : "en");

const normalizeSocialIntent = (intent) => (String(intent).toLowerCase() === "login" ? "login" : DEFAULT_SOCIAL_INTENT);

const parseSocialState = (state, fallbackLanguage = "en") => {
  const [languagePart, intentPart] = String(state || "").split(":");

  return {
    language: normalizeLanguage(languagePart || fallbackLanguage),
    intent: normalizeSocialIntent(intentPart),
  };
};

const getSocialRedirectPath = (language, path) => {
  const normalizedLanguage = normalizeLanguage(language);
  return `/${normalizedLanguage}${path.startsWith("/") ? path : `/${path}`}`;
};

const getSocialProviderConfig = (provider) => {
  const config = SOCIAL_PROVIDER_CONFIG[provider];

  if (!config) {
    throw new Error(`Unsupported social provider: ${provider}`);
  }

  if (!config.clientId || !config.clientSecret) {
    throw new Error(`${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET must be configured`);
  }

  return config;
};

const buildBackendOrigin = (req) => {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.get("host");

  return `${protocol}://${host}`;
};

const buildSocialCallbackUrl = (req, provider) => {
  return new URL(`/api${SOCIAL_PROVIDER_CONFIG[provider].callbackPath}`, buildBackendOrigin(req)).toString();
};

const buildSocialStartUrl = (req, provider, language, intent = DEFAULT_SOCIAL_INTENT) => {
  const config = getSocialProviderConfig(provider);
  const callbackUrl = buildSocialCallbackUrl(req, provider);
  const authorizationUrl = new URL(config.authorizationUrl);
  const normalizedLanguage = normalizeLanguage(language);
  const normalizedIntent = normalizeSocialIntent(intent);

  authorizationUrl.searchParams.set("client_id", config.clientId);
  authorizationUrl.searchParams.set("redirect_uri", callbackUrl);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", config.scope);
  authorizationUrl.searchParams.set("state", `${normalizedLanguage}:${normalizedIntent}`);

  if (provider === "google") {
    authorizationUrl.searchParams.set("access_type", "offline");
    authorizationUrl.searchParams.set("prompt", "select_account");
  }

  return authorizationUrl.toString();
};

const parseSocialName = (profile = {}) => {
  const displayName = String(profile.name || "").trim();
  const firstName = String(profile.first_name || "").trim();
  const lastName = String(profile.last_name || "").trim();

  if (firstName || lastName) {
    return {
      firstName: firstName || displayName.split(" ")[0] || "User",
      lastName:
        lastName ||
        displayName.split(" ").slice(1).join(" ") ||
        "Account",
    };
  }

  const parts = displayName.split(" ").filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "User", lastName: "Account" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ") || "Account",
  };
};

const generateSocialUsername = (email) => {
  const localPart = String(email).split("@")[0] || "user";
  const base = localPart
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 16) || "user";

  return `${base}-${generateSocialSuffix()}`;
};

const generateUniqueSocialUsername = async (email) => {
  let username = generateSocialUsername(email);

  while (await User.exists({ username })) {
    username = generateSocialUsername(email);
  }

  return username;
};

const exchangeCodeForSocialProfile = async (req, provider, code) => {
  const config = getSocialProviderConfig(provider);
  const callbackUrl = buildSocialCallbackUrl(req, provider);

  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    throw new Error(tokenData?.error_description || tokenData?.error || "Google token exchange failed");
  }

  const profileResponse = await fetch(config.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  const profileData = await profileResponse.json();

  if (!profileResponse.ok) {
    throw new Error(profileData?.error?.message || "Google profile fetch failed");
  }

  return {
    email: profileData.email,
    emailVerified: profileData.verified_email !== false,
    name: profileData.name,
    first_name: profileData.given_name,
    last_name: profileData.family_name,
    picture: profileData.picture,
    providerId: profileData.id,
  };
};

const handleSocialAuthSuccess = async (res, user) => {
  user.lastLogin = Date.now();
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;

  const { refreshToken } = generateTokenSetCookie(res, user._id);
  user.refreshTokenHash = hashRefreshToken(refreshToken);
  user.refreshTokenExpiresAt = Date.now() + REFRESH_TOKEN_MAX_AGE_MS;
  await user.save();

  return user;
};

const redirectToDashboard = (res, language) => {
  const redirectUrl = new URL(buildFrontendUrl(res.req, `/${normalizeLanguage(language)}/dashboard`));
  return res.redirect(302, redirectUrl.toString());
};

const redirectWithSocialError = (res, language, message) => {
  const normalizedLanguage = normalizeLanguage(language);
  const redirectUrl = new URL(`/${normalizedLanguage}/login`, getFrontendOrigin(res.req));
  redirectUrl.searchParams.set(SOCIAL_CALLBACK_ERROR, message);
  return res.redirect(302, redirectUrl.toString());
};

const createOrLinkSocialUser = async (provider, profile, intent) => {
  const email = String(profile.email || "").trim().toLowerCase();
  const providerVerifiedEmail = profile.emailVerified !== false;

  if (!email) {
    throw new Error(`${provider} account did not return an email address`);
  }

  const existingUser = await User.findOne({ email }).select("+password");

  if (existingUser) {
    if (existingUser.isActive === false) {
      const error = new Error("This account is deactivated. Please contact support.");
      error.statusCode = 403;
      throw error;
    }

    if (!existingUser.isVerified && providerVerifiedEmail) {
      existingUser.isVerified = true;
      existingUser.verificationToken = undefined;
      existingUser.verificationTokenExpireAt = undefined;
    }

    const { firstName, lastName } = parseSocialName(profile);
    existingUser.Fname = existingUser.Fname || firstName;
    existingUser.Lname = existingUser.Lname || lastName;

    return {
      user: existingUser,
      requiresVerification: existingUser.isVerified !== true,
    };
  }

  if (intent === "login") {
    const error = new Error("No account found for this email. Please sign up first.");
    error.statusCode = 404;
    throw error;
  }

  const { firstName, lastName } = parseSocialName(profile);
  const username = await generateUniqueSocialUsername(email);

  const createdUser = await User.create({
    username,
    Fname: firstName,
    Lname: lastName,
    email,
    password: crypto.randomBytes(32).toString("hex"),
    isVerified: providerVerifiedEmail,
  });

  return {
    user: createdUser,
    requiresVerification: createdUser.isVerified !== true,
  };
};

export const startSocialAuth = (provider, intent = DEFAULT_SOCIAL_INTENT) => (req, res) => {
  try {
    const { language = "en" } = req.query ?? {};
    clearAuthCookies(res);
    const redirectUrl = buildSocialStartUrl(req, provider, language, intent);
    return res.redirect(302, redirectUrl);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const handleSocialAuthCallback = (provider) => async (req, res) => {
  try {
    const { code, state, error } = req.query ?? {};
    const parsedState = parseSocialState(state || req.query.language || "en");
    const intent = parsedState.intent;
    const language = parsedState.language;

    if (error) {
      clearAuthCookies(res);
      return redirectWithSocialError(res, language, String(error));
    }

    if (!code) {
      clearAuthCookies(res);
      return redirectWithSocialError(res, language, "Missing OAuth code");
    }

    const profile = await exchangeCodeForSocialProfile(req, provider, String(code));

    if (!profile.email) {
      clearAuthCookies(res);
      return redirectWithSocialError(res, language, `${provider} account did not provide an email address`);
    }

    const { user, requiresVerification } = await createOrLinkSocialUser(provider, profile, intent);

    if (requiresVerification) {
      clearAuthCookies(res);
      await issueVerificationEmail(user);
      const redirectPath = getSocialRedirectPath(language, SOCIAL_SUCCESS_REDIRECT);
      const redirectUrl = new URL(buildFrontendUrl(req, redirectPath));
      redirectUrl.searchParams.set("email", profile.email);
      redirectUrl.searchParams.set("provider", provider);

      return res.redirect(302, redirectUrl.toString());
    }

    await handleSocialAuthSuccess(res, user);
    return redirectToDashboard(res, language);
  } catch (error) {
    const { language } = parseSocialState(req.query?.state || req.query?.language || "en");
    clearAuthCookies(res);
    if (error?.statusCode === 403) {
      return redirectWithSocialError(res, language, error.message);
    }

    if (error?.statusCode === 404) {
      return redirectWithSocialError(res, language, error.message);
    }

    console.error(`${provider} OAuth error:`, error);
    return redirectWithSocialError(res, language, `${provider} login failed`);
  }
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

// POST - Sign Up
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

    if (user.isActive === false) {
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

    const { accessToken, refreshToken } = generateTokenSetCookie(res, user._id);
    user.refreshTokenHash = hashRefreshToken(refreshToken);
    user.refreshTokenExpiresAt = Date.now() + REFRESH_TOKEN_MAX_AGE_MS;

    user.lastLogin = Date.now();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Login successful.",
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
export const checkAuth = (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

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
  resendVerificationEmail,
  login,
  logout,
  refreshAuth,
  forgetPassword,
  resendPasswordReset,
  resetPassword,
  checkAuth,
};
