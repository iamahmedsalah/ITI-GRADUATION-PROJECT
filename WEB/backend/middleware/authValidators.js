import { z } from "zod";
import User from "../models/user/userAccountModel.js";

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

const bodySchema = {
  username: z
    .string({ error: "Username is required." })
    .trim()
    .min(3, "Username must be between 3 and 20 characters.")
    .max(20, "Username must be between 3 and 20 characters.")
    .transform((value) => value.toLowerCase()),
  Fname: z
    .string({ error: "First name is required." })
    .trim()
    .min(2, "First name must be between 2 and 20 characters.")
    .max(20, "First name must be between 2 and 20 characters."),
  Lname: z
    .string({ error: "Last name is required." })
    .trim()
    .min(2, "Last name must be between 2 and 20 characters.")
    .max(20, "Last name must be between 2 and 20 characters."),
  email: z
    .string({ error: "Email is required." })
    .trim()
    .email("Please provide a valid email address.")
    .transform((value) => value.toLowerCase()),
  password: z
    .string({ error: "Password must be a string." })
    .min(8, "Password must be at least 8 characters.")
    .regex(
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]).{8,}/,
      "Password must include uppercase, lowercase, number and symbol."
    ),
};

const signupSchema = z.object({
  body: z.object(bodySchema),
  params: z.object({}).passthrough(),
});

const verifyEmailSchema = z.object({
  body: z.object({
    code: z
      .string({ error: "Verification code is required." })
      .trim()
      .regex(/^[A-Za-z0-9]{8}$/, "Verification code must be 8 letters/numbers.")
      .transform((value) => value.toUpperCase()),
  }),
  params: z.object({}).passthrough(),
});

const loginSchema = z.object({
  body: z.object({
    identifier: z.string().trim().optional(),
    email: z.string().trim().optional(),
    username: z.string().trim().optional(),
    password: z
      .string({ error: "Please enter your password." })
      .min(1, "Please enter your password."),
  }),
  params: z.object({}).passthrough(),
}).superRefine((data, ctx) => {
  const identifier = data.body.identifier || data.body.email || data.body.username;

  if (!identifier) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["body", "identifier"],
      message: "Please enter your email address or username.",
    });
  }
}).transform(({ body, params }) => ({
  body: {
    identifier: String(body.identifier || body.email || body.username || "")
      .trim()
      .toLowerCase(),
    password: body.password,
  },
  params,
}));

const forgetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ error: "Please enter the email address for your account." })
      .trim()
      .email("Please enter a valid email address.")
      .transform((value) => value.toLowerCase()),
  }),
  params: z.object({}).passthrough(),
});

const resetPasswordSchema = z.object({
  body: z.object({
    password: z
      .string({ error: "Please enter a new password." })
      .min(8, "New password must be at least 8 characters long.")
      .regex(
        /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]).{8,}/,
        "Password must include uppercase, lowercase, number and symbol."
      ),
  }),
  params: z.object({
    token: z
      .string({ error: "Reset token is missing from the link." })
      .trim()
      .regex(/^[a-fA-F0-9]{40}$/, "Reset token must be 40 hexadecimal characters."),
  }),
});

export const signupValidation = validateRequest(signupSchema);

export const signupUniquenessValidation = async (req, res, next) => {
  try {
    const username = req.body?.username;
    const email = req.body?.email;

    if (!username && !email) {
      return next();
    }

    const normalizedUsername = username
      ? String(username).trim().toLowerCase()
      : null;
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;

    const filters = [];
    if (normalizedUsername) {
      filters.push({ username: normalizedUsername });
    }
    if (normalizedEmail) {
      filters.push({ email: normalizedEmail });
    }

    const existingUser = await User.findOne({ $or: filters })
      .select("username email isActive")
      .lean();

    if (existingUser) {
      if (existingUser.isActive === false) {
        return res.status(409).json({
          success: false,
          message: "Validation failed.",
          errors: [
            {
              field: "identifier",
              message:
                "An account with this email or username exists but is deactivated. Please contact support to reactivate it.",
            },
          ],
        });
      }

      const conflictField =
        normalizedEmail && existingUser.email === normalizedEmail
          ? "email"
          : "username";

      return res.status(409).json({
        success: false,
        message: "Validation failed.",
        errors: [
          {
            field: conflictField,
            message:
              conflictField === "email"
                ? "Email is already registered."
                : "Username is already taken.",
          },
        ],
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

export const verifyEmailValidation = validateRequest(verifyEmailSchema);

export const loginValidation = validateRequest(loginSchema);

export const forgetPasswordValidation = validateRequest(forgetPasswordSchema);

export const resendVerificationValidation = validateRequest(forgetPasswordSchema);

export const resetPasswordValidation = validateRequest(resetPasswordSchema);
