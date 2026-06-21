import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ZodError } from 'zod';
import { AppLoggerService } from '../logger/logger.service';

type ErrorLike = Error & {
  status?: number;
  errors?: unknown;
  type?: string;
  code?: string;
  customMessage?: string;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { ip?: string; originalUrl?: string; method?: string }>();
    const error = exception as ErrorLike;

    const method = request?.method || 'UNKNOWN';
    const url = request?.originalUrl || '';

    this.logger.error(`Unhandled request error on ${method} ${url}`, error?.stack, 'AllExceptionsFilter');

    if (error?.type === 'entity.parse.failed') {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Invalid JSON payload.',
      });
    }

    if (error?.type === 'entity.too.large') {
      return response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
        success: false,
        message:
          'Request payload is too large. Reduce the pasted content or increase REQUEST_BODY_LIMIT.',
      });
    }

    if (String(error?.message || '').startsWith('CORS blocked')) {
      return response.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: 'Origin is not allowed by CORS policy.',
      });
    }

    if (exception instanceof ZodError) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed.',
        errors: exception.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'object' && body !== null && 'message' in body
          ? (body as { message: string | string[] }).message
          : exception.message;

      return response.status(status).json({
        success: false,
        message: Array.isArray(message) ? message.join(', ') : message || 'Error',
        ...(typeof body === 'object' && body !== null && 'errors' in body
          ? { errors: (body as { errors: unknown }).errors }
          : {}),
      });
    }

    if (error?.status && Number.isInteger(error.status) && error.status >= 400 && error.status < 600) {
      return response.status(error.status).json({
        success: false,
        message: error.message || 'Error',
        ...(error.errors ? { errors: error.errors } : {}),
      });
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error.',
    });
  }
}
