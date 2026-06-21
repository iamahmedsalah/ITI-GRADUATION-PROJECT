import rateLimit, { ipKeyGenerator } from "express-rate-limit";


// Rate limiters
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.LOGIN_RATE_LIMIT || "20", 10), // limit each IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts from this IP, try again later." },
});

export const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.SIGNUP_RATE_LIMIT || "10", 10), // limit each IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many signup attempts from this IP, try again later." },
});

// Forgot-password limiter: prefer per-email throttling to prevent mass email abuse.
const forgotPasswordLimiterOptions = {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.FORGOT_PASSWORD_RATE_LIMIT || "5", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many password reset requests, try again later." },
  keyGenerator: (req) => {
    return (req.body && req.body.email)
      ? String(req.body.email).toLowerCase()
      : ipKeyGenerator(req.ip);
  },
};

export const forgotPasswordLimiter = rateLimit(forgotPasswordLimiterOptions);

export const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.VERIFICATION_RESEND_RATE_LIMIT || "5", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification resend requests, try again later.",
  },
  keyGenerator: (req) => {
    return req.body?.email
      ? String(req.body.email).toLowerCase()
      : ipKeyGenerator(req.ip);
  },
});

export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.CONTACT_RATE_LIMIT || "5", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many contact requests, try again later.",
  },
  keyGenerator: (req) => {
    return req.body?.email
      ? String(req.body.email).toLowerCase()
      : ipKeyGenerator(req.ip);
  },
});

export const aiRecommendationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AI_RECOMMENDATION_RATE_LIMIT || "60", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many AI recommendation requests, try again later.",
  },
});

// Admin endpoints rate limiters
export const adminListLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.ADMIN_LIST_RATE_LIMIT || "100", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many admin list requests, try again later." },
});

export const adminWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.ADMIN_WRITE_RATE_LIMIT || "50", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many admin write requests, try again later." },
});

export const adminPublishLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.ADMIN_PUBLISH_RATE_LIMIT || "20", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many publish requests, try again later." },
});

export default { loginLimiter, signupLimiter, forgotPasswordLimiter, resendVerificationLimiter, contactLimiter, aiRecommendationLimiter, adminListLimiter, adminWriteLimiter, adminPublishLimiter };
