import { z } from "zod";

const formatZodErrors = (issues) =>
  issues.map((issue) => ({
    field: issue.path.length ? issue.path.join(".") : "body",
    message: issue.message,
  }));

const validateRequest = (schema) => async (req, res, next) => {
  const result = await schema.safeParseAsync({
    body: req.body ?? {},
    params: req.params ?? {},
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: formatZodErrors(result.error.issues),
    });
  }

  req.body = result.data.body;
  req.params = result.data.params;
  return next();
};

const contactSchema = z.object({
  body: z.object({
    name: z
      .string({ error: "Name is required." })
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(80, "Name must be at most 80 characters.")
      .regex(/^[^\r\n<>]+$/, "Name contains invalid characters."),
    email: z
      .string({ error: "Email is required." })
      .trim()
      .email("Please provide a valid email address.")
      .transform((value) => value.toLowerCase()),
    message: z
      .string({ error: "Message is required." })
      .trim()
      .min(10, "Message must be at least 10 characters.")
      .max(5000, "Message must be at most 5000 characters."),
  }),
  params: z.object({}).passthrough(),
});

export const contactValidation = validateRequest(contactSchema);
