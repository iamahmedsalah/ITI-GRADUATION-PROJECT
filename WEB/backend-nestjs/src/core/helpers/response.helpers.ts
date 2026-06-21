import { HttpCode, HttpStatus } from '@nestjs/common';

export const ok = <T>(data: T | null = null, message = 'Success') => ({
  success: true,
  message,
  ...(data !== null && data !== undefined ? { data } : {}),
});

export const created = <T>(data: T | null = null, message = 'Created') => ok(data, message);

export const fail = (message: string, errors: unknown = null) => ({
  success: false,
  message,
  ...(errors ? { errors } : {}),
});

export const validationFailed = (errors: unknown, message = 'Validation failed.') =>
  fail(message, errors);

export { HttpCode, HttpStatus };
