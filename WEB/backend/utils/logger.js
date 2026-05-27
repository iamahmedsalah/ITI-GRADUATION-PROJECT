// utils/logger.js

import winston from "winston";

const {
  combine,
  timestamp,
  printf,
  colorize,
  json,
  errors,
} = winston.format;

// Add custom colors
winston.addColors({
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
});

// Custom format for development
const localFormat = printf(
  ({ level, message, timestamp, stack, ...metadata }) => {
    let metaStr = Object.keys(metadata).length
      ? ` ${JSON.stringify(metadata)}`
      : "";

    return `[${timestamp}] ${level}: ${stack || message}${metaStr}`;
  }
);

const logger = winston.createLogger({
  levels: winston.config.npm.levels,

  level: process.env.NODE_ENV === "production" ? "info" : "debug",

  format: combine(
    timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),

    // Capture stack traces
    errors({ stack: true })
  ),

  transports: [
    // Console transport
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === "production"
          ? combine(json())
          : combine(colorize({ all: true }), localFormat),
    }),

    // Error file
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: combine(json()),
    }),

    // Combined logs
    new winston.transports.File({
      filename: "logs/combined.log",
      format: combine(json()),
    }),
  ],

  // Handle exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: "logs/exceptions.log",
    }),
  ],

  // Handle promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: "logs/rejections.log",
    }),
  ],
});

// Morgan integration
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

export default logger;