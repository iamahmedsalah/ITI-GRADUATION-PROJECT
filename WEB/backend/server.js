import app from "./app.js";
import logger from "./utils/logger.js";

let server;

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;

  server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`, {
    name: err.name,
    stack: err.stack,
  });

  if (server) {
    server.close(() => {
      logger.warn("Shutting down server...");
      process.exit(1);
    });

    return;
  }

  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, {
    name: err.name,
    stack: err.stack,
  });

  process.exit(1);
});
