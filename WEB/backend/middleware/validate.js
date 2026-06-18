import { validationFailed } from "../helpers/response.js";

export const formatZodErrors = (issues) =>
  issues.map((issue) => ({
    field: issue.path.length ? issue.path.join(".") : "body",
    message: issue.message,
  }));

export const validateBody = (schema) => async (req, res, next) => {
  const result = await schema.safeParseAsync(req.body ?? {});

  if (!result.success) {
    return validationFailed(res, formatZodErrors(result.error.issues));
  }

  req.body = result.data;
  return next();
};

export const validateRequest = (schema) => async (req, res, next) => {
  const result = await schema.safeParseAsync({
    body: req.body ?? {},
    params: req.params ?? {},
    query: req.query ?? {},
  });

  if (!result.success) {
    return validationFailed(res, formatZodErrors(result.error.issues));
  }

  if ("body" in result.data) req.body = result.data.body;
  if ("params" in result.data) req.params = result.data.params;
  if ("query" in result.data) req.query = result.data.query;
  return next();
};

export const validateQuery = (schema) => async (req, res, next) => {
  const result = await schema.safeParseAsync(req.query ?? {});

  if (!result.success) {
    return validationFailed(res, formatZodErrors(result.error.issues));
  }

  req.query = result.data;
  return next();
};
