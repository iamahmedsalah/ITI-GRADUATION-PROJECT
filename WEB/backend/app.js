import dns from "node:dns";
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import User from "./models/user/userAccountModel.js";

// Load Env variables
if (process.env.NODE_ENV !== "test") {
  dotenv.config({ path: [".env", ".env.local"] });
}

// Now safely import custom modules
import dbConfig from "./config/database.js";
import logger from "./utils/logger.js";
import authRoutes from "./routes/auth.route.js";
import roadmapsRoutes from "./routes/roadmaps.route.js";
import coursesRoutes from "./routes/courses.route.js";
import adminRoutes from "./routes/admin.route.js";
import contactRoutes from "./routes/contact.route.js";
import aiRoutes from "./routes/ai.route.js";
import systemRoutes from "./routes/system.route.js";
import {
  swaggerSpec,
  swaggerUiAssetPath,
  swaggerInitializerJs,
  swaggerHtml,
} from "./docs/swagger.js";
import errorHandler from "./middleware/errorHandler.js";

// Optional DNS override (use system DNS by default).
// This avoids SRV lookup failures on networks that block public DNS resolvers.
const dnsServers = String(process.env.DNS_SERVERS || "")
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean);

if (dnsServers.length > 0) {
  try {
    dns.setServers(dnsServers);
    logger.info("Custom DNS servers applied", { dnsServers });
  } catch (error) {
    logger.warn(
      "Failed to apply custom DNS servers; falling back to system DNS",
      {
        dnsServers,
        message: error.message,
      },
    );
  }
}

const app = express();

app.set("trust proxy", 1);

const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || "1mb";

// Database connection
if (process.env.NODE_ENV !== "test") {
  dbConfig().catch((error) => {
    logger.warn(
      "Initial database connection failed. API will keep running and retry on requests.",
      {
        code: error.code,
        message: error.customMessage || error.message,
      },
    );
  });
}

// CORS
const configuredOrigins = [
  process.env.FRONTEND_URL || "",
  process.env.CLIENT_URL || "",
  process.env.PRODUCTION_URL || "",
]
  .join(",")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const staticAllowedOrigins = new Set(configuredOrigins);
const allowVercelPreviewOrigins =
  process.env.ALLOW_VERCEL_PREVIEW_ORIGINS === "true";

const isAllowedOrigin = (origin) => {
  const normalizedOrigin = origin.replace(/\/$/, "");

  if (staticAllowedOrigins.has(normalizedOrigin)) {
    return true;
  }

  if (
    allowVercelPreviewOrigins &&
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalizedOrigin)
  ) {
    return true;
  }

  if (process.env.NODE_ENV !== "production") {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin);
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
  }),
);

// Body parser
app.use(express.urlencoded({ extended: false, limit: requestBodyLimit }));
app.use(express.json({ limit: requestBodyLimit }));
app.use(cookieParser());

// Morgan logger
if (process.env.NODE_ENV === "development") {
  app.use(
    morgan(
      ":remote-addr :method :url :status :response-time ms - :res[content-length]",
      {
        stream: logger.stream,
      },
    ),
  );
}

logger.info(`Mode: In ${process.env.NODE_ENV}`);

// Routes that must stay alive even if the database is unavailable.
/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Service is healthy
 */
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

app.get("/api/docs", (_req, res) => {
  res.redirect("/api/docs/index.html");
});


app.get("/api/docs/index.html", (_req, res) => {
  res.type("text/html").send(swaggerHtml);
});

app.get("/api/docs/swagger.json", (_req, res) => {
  res.type("application/json").send(swaggerSpec);
});

app.get("/api/docs/swagger-initializer.js", (_req, res) => {
  res.type("application/javascript").send(swaggerInitializerJs);
});

app.use("/api/docs", express.static(swaggerUiAssetPath));

// Contact form does not depend on the database.
app.use("/api/contact", contactRoutes);

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



// Auth Routes
app.use("/api/auth", authRoutes);

// Roadmaps Routes (Templates + User assignments)
app.use("/api/roadmaps", roadmapsRoutes);

// Courses Routes
app.use("/api/courses", coursesRoutes);

// AI-powered recommendations
app.use("/api/ai", aiRoutes);

// Admin Routes
app.use("/api/admin", adminRoutes);

// System/Version Routes
app.use("/api/system", systemRoutes);

// Centralized error middleware
app.use(errorHandler);
export default app;
