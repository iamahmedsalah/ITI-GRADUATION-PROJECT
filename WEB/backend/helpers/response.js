export const ok = (res, data = null, message = "Success", status = 200) =>
  res.status(status).json({
    success: true,
    message,
    ...(data !== null && data !== undefined ? { data } : {}),
  });

export const created = (res, data = null, message = "Created") =>
  ok(res, data, message, 201);

export const noContent = (res) => res.status(204).send();

export const fail = (res, status, message, errors = null) =>
  res.status(status).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });

export const validationFailed = (res, errors, message = "Validation failed.") =>
  fail(res, 400, message, errors);

export const serverError = (
  res,
  error,
  fallbackMessage = "Internal server error.",
) =>
  res.status(error.status || 500).json({
    success: false,
    message: error.status ? error.message : fallbackMessage,
    ...(error.errors ? { errors: error.errors } : {}),
    ...(process.env.NODE_ENV !== "production" && error.message
      ? { error: error.message }
      : {}),
  });
