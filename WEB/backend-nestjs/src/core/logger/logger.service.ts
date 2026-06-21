import { Injectable, LoggerService } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as winston from 'winston';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
});

const localFormat = printf(({ level, message, timestamp: time, stack, ...metadata }) => {
  const meta = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : '';
  return `[${time}] ${level}: ${stack || message}${meta}`;
});

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    const isServerlessRuntime =
      process.env.VERCEL === '1' ||
      process.env.VERCEL === 'true' ||
      Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

    const baseConsoleTransport = new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'production'
          ? combine(json())
          : combine(colorize({ all: true }), localFormat),
    });

    const fileTransports: winston.transport[] = [];

    if (!isServerlessRuntime) {
      fs.mkdirSync(path.resolve(process.cwd(), 'logs'), { recursive: true });
      fileTransports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: combine(json()),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: combine(json()),
        }),
      );
    }

    this.logger = winston.createLogger({
      levels: winston.config.npm.levels,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: combine(
        timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        errors({ stack: true }),
      ),
      transports: [baseConsoleTransport, ...fileTransports],
      exceptionHandlers: isServerlessRuntime
        ? [baseConsoleTransport]
        : [new winston.transports.File({ filename: 'logs/exceptions.log' })],
      rejectionHandlers: isServerlessRuntime
        ? [baseConsoleTransport]
        : [new winston.transports.File({ filename: 'logs/rejections.log' })],
    });
  }

  log(message: unknown, context?: string) {
    this.logger.info(String(message), context ? { context } : undefined);
  }

  error(message: unknown, trace?: string, context?: string) {
    this.logger.error(String(message), { stack: trace, context });
  }

  warn(message: unknown, context?: string | Record<string, unknown>) {
    this.logger.warn(String(message), typeof context === 'string' ? { context } : context);
  }

  debug(message: unknown, context?: string | Record<string, unknown>) {
    this.logger.debug(String(message), typeof context === 'string' ? { context } : context);
  }

  verbose(message: unknown, context?: string) {
    this.logger.verbose(String(message), context ? { context } : undefined);
  }

  http(message: string, metadata?: Record<string, unknown>) {
    this.logger.http(message, metadata);
  }
}
