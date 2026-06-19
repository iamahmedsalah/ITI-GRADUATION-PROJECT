import logger from "../utils/logger.js";

export default function errorHandler(err, req, res, _next) {
  logger.error(`Unhandled request error on ${req.method} ${req.originalUrl}`, {
    message: err?.message,
    stack: err?.stack,
    ip: req.ip,
    method: req.method,
    url: req.originalUrl,
  });

  if (err?.type === "entity.parse.failed") {
    logger.warn("Invalid JSON payload received", { ip: req.ip, url: req.originalUrl });
    return res.status(400).json({ success: false, message: "Invalid JSON payload." });
  }

  if (err?.type === "entity.too.large") {
    logger.warn("Request payload too large", { ip: req.ip, url: req.originalUrl });
    return res.status(413).json({
      success: false,
      message: "Request payload is too large. Reduce the pasted content or increase REQUEST_BODY_LIMIT.",
    });
  }

  if (String(err?.message || "").startsWith("CORS blocked")) {
    logger.warn("Blocked by CORS policy", { origin: req.headers.origin, ip: req.ip });
    return res.status(403).json({ success: false, message: "Origin is not allowed by CORS policy." });
  }

  // Expose known http status if provided
  if (err?.status && Number.isInteger(err.status) && err.status >= 400 && err.status < 600) {
    return res.status(err.status).json({
      success: false,
      message: err.message || "Error",
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  return res.status(500).json({ success: false, message: "Internal server error." });
}
