import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { customAlphabet } from "nanoid";
import User from "../models/user/userAccountModel.js";
import UserActivity from "../models/user/userActivityModel.js";
import { sendVerificationEmail } from "../mails/emails.js";
import generateTokenSetCookie, {
  clearAuthCookies,
  hashRefreshToken,
} from "../utils/generateTokenSetCookie.js";
import {
  REFRESH_TOKEN_MAX_AGE_MS,
  generateVerificationToken,
  toPublicUser,
  updateLoginStreak,
} from "../helpers/auth.helpers.js";

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
const googleIdTokenClient = new OAuth2Client();

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

const normalizeLanguage = (language) => (String(language).toLowerCase().startsWith("ar") ? "ar" : "en");

const normalizeSocialIntent = (intent) => (String(intent).toLowerCase() === "login" ? "login" : DEFAULT_SOCIAL_INTENT);

const parseSocialState = (state, fallbackLanguage = "en") => {
  const [languagePart, intentPart, popupPart] = String(state || "").split(":");

  return {
    language: normalizeLanguage(languagePart || fallbackLanguage),
    intent: normalizeSocialIntent(intentPart),
    popup: popupPart === "popup",
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

const buildSocialStartUrl = (req, provider, language, intent = DEFAULT_SOCIAL_INTENT, popup = false, loginHint = "") => {
  const config = getSocialProviderConfig(provider);
  const callbackUrl = buildSocialCallbackUrl(req, provider);
  const authorizationUrl = new URL(config.authorizationUrl);
  const normalizedLanguage = normalizeLanguage(language);
  const normalizedIntent = normalizeSocialIntent(intent);

  authorizationUrl.searchParams.set("client_id", config.clientId);
  authorizationUrl.searchParams.set("redirect_uri", callbackUrl);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", config.scope);
  authorizationUrl.searchParams.set(
    "state",
    popup
      ? `${normalizedLanguage}:${normalizedIntent}:popup`
      : `${normalizedLanguage}:${normalizedIntent}`,
  );

  if (provider === "google") {
    authorizationUrl.searchParams.set("access_type", "offline");
    authorizationUrl.searchParams.set("prompt", "select_account");
    if (loginHint) {
      authorizationUrl.searchParams.set("login_hint", loginHint);
    }
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
    .slice(0, 13) || "user";

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

const verifyGoogleCredential = async (credential) => {
  const clientId = SOCIAL_PROVIDER_CONFIG.google.clientId;

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID must be configured");
  }

  if (!credential || typeof credential !== "string") {
    const error = new Error("Google credential is required");
    error.statusCode = 400;
    throw error;
  }

  const ticket = await googleIdTokenClient.verifyIdToken({
    idToken: credential,
    audience: clientId,
  });

  const payload = ticket.getPayload();

  if (!payload?.email) {
    const error = new Error("Google account did not return an email address");
    error.statusCode = 400;
    throw error;
  }

  return {
    email: payload.email,
    emailVerified: payload.email_verified !== false,
    name: payload.name,
    first_name: payload.given_name,
    last_name: payload.family_name,
    picture: payload.picture,
    providerId: payload.sub,
  };
};

const handleSocialAuthSuccess = async (res, user) => {
  const now = new Date();
  user.lastLogin = now;
  updateLoginStreak(user, now);
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;

  const { accessToken, refreshToken } = generateTokenSetCookie(res, user._id);
  res.locals.accessToken = accessToken;
  user.refreshTokenHash = hashRefreshToken(refreshToken);
  user.refreshTokenExpiresAt = Date.now() + REFRESH_TOKEN_MAX_AGE_MS;
  await user.save();
  await recordLoginActivity(res.req, user);

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

const sendPopupPostMessage = (res, targetOrigin, payload) => {
  const safePayload = JSON.stringify(payload).replace(/</g, "\\u003c");
  const html = `<!DOCTYPE html>
<html><head><title>OAuth</title></head>
<body>
<script>
  (function() {
    try {
      if (window.opener) {
        window.opener.postMessage(${safePayload}, "${targetOrigin}");
      }
    } catch (e) {
      // ignore
    }
    setTimeout(function() { window.close(); }, 300);
  })();
</script>
<p style="font-family:system-ui;text-align:center;margin-top:40px;color:#888">
  Completing sign-in&hellip; This window will close automatically.
</p>
</body></html>`;

  return res.type("text/html").send(html);
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
    existingUser.avatarUrl = existingUser.avatarUrl || profile.picture || "";

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
    avatarUrl: profile.picture || "",
  });

  return {
    user: createdUser,
    requiresVerification: createdUser.isVerified !== true,
  };
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

export const startSocialAuth = (provider, intent = DEFAULT_SOCIAL_INTENT) => (req, res) => {
  try {
    const { language = "en", popup, login_hint } = req.query ?? {};
    const isPopup = popup === "true" || popup === "1";
    clearAuthCookies(res);
    const redirectUrl = buildSocialStartUrl(req, provider, language, intent, isPopup, login_hint);
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
    const isPopup = parsedState.popup;
    const frontendOrigin = getFrontendOrigin(req);

    if (error) {
      clearAuthCookies(res);
      if (isPopup) {
        return sendPopupPostMessage(res, frontendOrigin, {
          type: "OAUTH_ERROR",
          error: String(error),
        });
      }
      return redirectWithSocialError(res, language, String(error));
    }

    if (!code) {
      clearAuthCookies(res);
      if (isPopup) {
        return sendPopupPostMessage(res, frontendOrigin, {
          type: "OAUTH_ERROR",
          error: "Missing OAuth code",
        });
      }
      return redirectWithSocialError(res, language, "Missing OAuth code");
    }

    const profile = await exchangeCodeForSocialProfile(req, provider, String(code));

    if (!profile.email) {
      clearAuthCookies(res);
      if (isPopup) {
        return sendPopupPostMessage(res, frontendOrigin, {
          type: "OAUTH_ERROR",
          error: `${provider} account did not provide an email address`,
        });
      }
      return redirectWithSocialError(res, language, `${provider} account did not provide an email address`);
    }

    const { user, requiresVerification } = await createOrLinkSocialUser(provider, profile, intent);

    if (requiresVerification) {
      clearAuthCookies(res);
      await issueVerificationEmail(user);
      if (isPopup) {
        return sendPopupPostMessage(res, frontendOrigin, {
          type: "OAUTH_VERIFY",
          email: profile.email,
          provider,
          language,
        });
      }
      const redirectPath = getSocialRedirectPath(language, SOCIAL_SUCCESS_REDIRECT);
      const redirectUrl = new URL(buildFrontendUrl(req, redirectPath));
      redirectUrl.searchParams.set("email", profile.email);
      redirectUrl.searchParams.set("provider", provider);

      return res.redirect(302, redirectUrl.toString());
    }

    await handleSocialAuthSuccess(res, user);

    if (isPopup) {
      return sendPopupPostMessage(res, frontendOrigin, {
        type: "OAUTH_SUCCESS",
        language,
        user: {
          name: `${user.Fname} ${user.Lname}`.trim(),
          email: user.email,
          avatarUrl: user.avatarUrl || "",
        },
      });
    }

    return redirectToDashboard(res, language);
  } catch (error) {
    const parsedState = parseSocialState(req.query?.state || req.query?.language || "en");
    const language = parsedState.language;
    const isPopup = parsedState.popup;
    const frontendOrigin = getFrontendOrigin(req);
    clearAuthCookies(res);

    if (isPopup) {
      const errorMessage =
        error?.statusCode === 403 || error?.statusCode === 404
          ? error.message
          : `${provider} login failed`;

      if (!(error?.statusCode === 403 || error?.statusCode === 404)) {
        console.error(`${provider} OAuth error:`, error);
      }

      return sendPopupPostMessage(res, frontendOrigin, {
        type: "OAUTH_ERROR",
        error: errorMessage,
      });
    }

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

export const handleGoogleCredentialAuth = async (req, res) => {
  const { credential, mode = DEFAULT_SOCIAL_INTENT } = req.body ?? {};
  const intent = normalizeSocialIntent(mode);

  try {
    clearAuthCookies(res);
    const profile = await verifyGoogleCredential(credential);
    const { user, requiresVerification } = await createOrLinkSocialUser("google", profile, intent);

    if (requiresVerification) {
      await issueVerificationEmail(user);

      return res.status(202).json({
        success: true,
        requiresVerification: true,
        email: profile.email,
        provider: "google",
        message: "Email verification required.",
      });
    }

    const signedInUser = await handleSocialAuthSuccess(res, user);
    const accessToken = res.locals?.accessToken;

    return res.status(200).json({
      success: true,
      message: "Google login successful.",
      accessToken,
      user: toPublicUser(signedInUser),
      googleUser: {
        name: `${signedInUser.Fname} ${signedInUser.Lname}`.trim(),
        email: signedInUser.email,
        avatarUrl: signedInUser.avatarUrl || "",
      },
    });
  } catch (error) {
    clearAuthCookies(res);

    const status =
      error?.statusCode === 400 ||
      error?.statusCode === 403 ||
      error?.statusCode === 404
        ? error.statusCode
        : 401;

    if (status === 401) {
      console.error("Google credential auth error:", error);
    }

    return res.status(status).json({
      success: false,
      message: error.message || "Google login failed.",
    });
  }
};
