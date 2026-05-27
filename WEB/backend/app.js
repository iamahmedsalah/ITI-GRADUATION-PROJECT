import dns from "node:dns";
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

// Load Env variables
dotenv.config({ path: [".env", ".env.local"] });


// Now safely import custom modules
import dbConfig from "./config/database.js";
import logger from "./utils/logger.js";
import authRoutes from "./routes/auth.route.js";
import roadmapsRoutes from "./routes/roadmaps.route.js";
import coursesRoutes from "./routes/courses.route.js";


// Set DNS overrides
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();

app.set("trust proxy", 1);

// Database connection
dbConfig();


// CORS
const configuredOrigins = String(
  process.env.CLIENT_URL || process.env.PRODUCTION_URL || ""
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const staticAllowedOrigins = new Set([...configuredOrigins]);

const isAllowedOrigin = (origin) => {
  if (staticAllowedOrigins.has(origin)) return true;

  if (process.env.NODE_ENV !== "production") {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  }

  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      logger.warn("CORS blocked request", {
        origin,
      });

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },

    credentials: true,
  })
);

// Body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Morgan logger
if (process.env.NODE_ENV === "development") {
  app.use(
  morgan(
    ":remote-addr :method :url :status :response-time ms - :res[content-length]",
    {
      stream: logger.stream,
    }
  )
);
}

logger.info(`Mode: In ${process.env.NODE_ENV}`);

// Reconnect middleware
app.use("/api", async (req, res, next) => {
  if (req.method === "OPTIONS") return next();

  try {
    await dbConfig();

    logger.debug("Database connection verified", {
      route: req.originalUrl,
    });

    return next();
  } catch (error) {
    logger.error("Database reconnect failed", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(503).json({
      success: false,
      code: error.code,
      message: error.customMessage,
    });
  }
});

// Routes
app.get("/api/health", (_req, res) => {
  logger.info("Health check endpoint called");

  res.status(200).json({
    ok: true,
    service: "backend-api",
  });
});

app.get("/", (_req, res) => {
  logger.info("Root endpoint called");

  res.status(200).json({
    message: "backend is running",
    health: "/api/health",
  });
});


// Auth Routes
app.use("/api/auth", authRoutes);

// Roadmaps Routes (Templates + User assignments)
app.use("/api/roadmaps", roadmapsRoutes);

// Courses Routes
app.use("/api/courses", coursesRoutes);

// Error handler
app.use((err, req, res, _next) => {
  logger.error(`Unhandled request error on ${req.method} ${req.originalUrl}`, {
    message: err.message,
    stack: err.stack,
    ip: req.ip,
    method: req.method,
    url: req.originalUrl,
  });

  if (err?.type === "entity.parse.failed") {
    logger.warn("Invalid JSON payload received", { ip: req.ip, url: req.originalUrl });
    return res.status(400).json({ success: false, message: "Invalid JSON payload." });
  }

  if (String(err?.message || "").startsWith("CORS blocked")) {
    logger.warn("Blocked by CORS policy", { origin: req.headers.origin, ip: req.ip });
    return res.status(403).json({ success: false, message: "Origin is not allowed by CORS policy." });
  }

  return res.status(500).json({ success: false, message: "Internal server error." });
});
export default app;