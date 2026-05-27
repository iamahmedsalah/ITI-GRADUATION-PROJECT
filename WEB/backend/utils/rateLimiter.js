import rateLimit from "express-rate-limit";


// Rate limiters
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.LOGIN_RATE_LIMIT || "20", 10), // limit each IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts from this IP, try again later." },
});

// Forgot-password limiter: prefer per-email throttling to prevent mass email abuse.
const forgotPasswordLimiterOptions = {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.FORGOT_PASSWORD_RATE_LIMIT || "5", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many password reset requests, try again later." },
  keyGenerator: (req) => {
    return (req.body && req.body.email) ? String(req.body.email).toLowerCase() : req.ip;
  },
};

export const forgotPasswordLimiter = rateLimit(forgotPasswordLimiterOptions);


export default { loginLimiter, forgotPasswordLimiter };