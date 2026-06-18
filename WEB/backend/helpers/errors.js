export class AppError extends Error {
  constructor(status, message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.isOperational = true;

    if (options.errors) {
      this.errors = options.errors;
    }
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request.", errors = null) {
    super(400, message, errors ? { errors } : {});
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized.") {
    super(401, message);
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message = "Requires Pro subscription.") {
    super(402, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden.") {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found.") {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict.") {
    super(409, message);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed.", errors = []) {
    super(400, message, { errors });
  }
}
