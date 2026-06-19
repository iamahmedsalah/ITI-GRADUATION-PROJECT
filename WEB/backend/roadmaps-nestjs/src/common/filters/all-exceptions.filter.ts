import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = this.statusToCode(status);

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseBody = exceptionResponse as Record<string, unknown>;
        const responseMessage = responseBody.message;

        if (Array.isArray(responseMessage)) {
          message = responseMessage.join('; ');
        } else if (typeof responseMessage === 'string') {
          message = responseMessage;
        } else if (exception.message) {
          message = exception.message;
        }
      }
    } else if (exception instanceof Error) {
      message = 'Internal server error';
    }

    this.logger.error(
      `[${request.method}] ${request.url} -> ${status}: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const body: ApiResponse<null> = {
      success: false,
      error: {
        code,
        message,
      },
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };

    return map[status] ?? 'HTTP_ERROR';
  }
}
