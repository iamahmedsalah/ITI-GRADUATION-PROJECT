import { z } from "zod";

const emailLocalPartHasLetter = (value) => {
  const localPart = String(value).split("@")[0] ?? "";
  return /[A-Za-z]/.test(localPart);
};

const usernameHasLetter = /[A-Za-z]/;
const usernamePattern = /^[A-Za-z0-9._-]+$/;
const passwordRequirementsPattern =
  /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]).{8,}/;
const passwordRequirementsMessage =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

const imageDataUriSchema = z
  .string()
  .trim()
  .regex(
    /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\r\n]+$/,
    "Avatar must be a valid base64 image.",
  )
  .refine((value) => {
    const base64 = String(value).split(",")[1] || "";
    const normalizedBase64 = base64.replace(/\s/g, "");
    const padding = normalizedBase64.endsWith("==")
      ? 2
      : normalizedBase64.endsWith("=")
        ? 1
        : 0;
    const bytes = Math.floor((normalizedBase64.length * 3) / 4) - padding;

    return bytes <= 3 * 1024 * 1024;
  }, "Avatar image must be 3MB or smaller.");

const getUsernameValidationMessage = (value) => {
  const username = String(value).trim();

  if (username.length < 3 || username.length > 20) {
    return "Username must be between 3 and 20 characters.";
  }

  if (!usernameHasLetter.test(username)) {
    return "Username must include at least one letter.";
  }

  if (!usernamePattern.test(username)) {
    return "Username can only contain letters, numbers, dots, underscores, and hyphens.";
  }

  return null;
};

const bodySchema = {
  username: z
    .string({ error: "Username is required." })
    .trim()
    .min(3, "Username must be between 3 and 20 characters.")
    .max(20, "Username must be between 3 and 20 characters.")
    .regex(usernameHasLetter, "Username must include at least one letter.")
    .regex(
      usernamePattern,
      "Username can only contain letters, numbers, dots, underscores, and hyphens."
    )
    .transform((value) => value.toLowerCase()),
  Fname: z
    .string({ error: "First name is required." })
    .trim()
    .min(2, "First name must be at least 2 characters.")
    .max(24, "First name must be at most 24 characters."),
  Lname: z
    .string({ error: "Last name is required." })
    .trim()
    .min(2, "Last name must be at least 2 characters.")
    .max(24, "Last name must be at most 24 characters."),
  email: z
    .string({ error: "Email is required." })
    .trim()
    .email("Please provide a valid email address.")
    .refine(
      emailLocalPartHasLetter,
      "Email address before @ must include at least one letter."
    )
    .transform((value) => value.toLowerCase()),
  password: z
    .string({ error: "Password must be a string." })
    .min(8, "Password must be at least 8 characters.")
    .regex(
      passwordRequirementsPattern,
      passwordRequirementsMessage
    ),
};

export const signupSchema = z.object({
  body: z.object(bodySchema),
  params: z.object({}).passthrough(),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    code: z
      .string({ error: "Verification code is required." })
      .trim()
      .regex(/^[A-Za-z0-9]{8}$/, "Verification code must be 8 letters/numbers.")
      .transform((value) => value.toUpperCase()),
  }),
  params: z.object({}).passthrough(),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().trim().optional(),
    email: z.string().trim().optional(),
    username: z.string().trim().optional(),
    password: z
      .string({ error: "Please enter your password." })
      .min(8, "Password must be at least 8 characters.")
      .regex(
        passwordRequirementsPattern,
        passwordRequirementsMessage
      ),
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
    return;
  }

  if (!String(identifier).includes("@")) {
    const usernameMessage = getUsernameValidationMessage(identifier);

    if (usernameMessage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["body", "identifier"],
        message: usernameMessage,
      });
    }
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

export const forgetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ error: "Please enter the email address for your account." })
      .trim()
      .email("Please enter a valid email address.")
      .transform((value) => value.toLowerCase()),
  }),
  params: z.object({}).passthrough(),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    password: z
      .string({ error: "Please enter a new password." })
      .min(8, "New password must be at least 8 characters long.")
      .regex(
        passwordRequirementsPattern,
        passwordRequirementsMessage
      ),
  }),
  params: z.object({
    token: z
      .string({ error: "Reset token is missing from the link." })
      .trim()
      .regex(/^[a-fA-F0-9]{40}$/, "Reset token must be 40 hexadecimal characters."),
  }),
});

export const profileUpdateSchema = z.object({
  body: z
    .object({
      username: bodySchema.username.optional(),
      Fname: bodySchema.Fname.optional(),
      Lname: bodySchema.Lname.optional(),
    })
    .strict()
    .refine(
      (value) => Boolean(value.username || value.Fname || value.Lname),
      "Provide at least one field to update.",
    ),
  params: z.object({}).passthrough(),
});

export const updatePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string({ error: "Current password is required." })
        .min(8, "Current password must be at least 8 characters."),
      newPassword: z
        .string({ error: "New password is required." })
        .min(8, "New password must be at least 8 characters.")
        .regex(passwordRequirementsPattern, passwordRequirementsMessage),
    })
    .strict()
    .refine(
      (value) => value.currentPassword !== value.newPassword,
      {
        path: ["newPassword"],
        message: "New password must be different from current password.",
      },
    ),
  params: z.object({}).passthrough(),
});

const accountReasonSchema = z
  .string()
  .trim()
  .max(500, "Reason must be at most 500 characters.")
  .optional()
  .transform((value) => value || undefined);

export const accountPasswordActionSchema = z.object({
  body: z
    .object({
      password: z
        .string({ error: "Password is required." })
        .min(8, "Password must be at least 8 characters."),
      reason: accountReasonSchema,
    })
    .strict(),
  params: z.object({}).passthrough(),
});

export const accountDeleteCodeSchema = z.object({
  body: z
    .object({
      code: z
        .string({ error: "Verification code is required." })
        .trim()
        .regex(/^[A-Za-z0-9]{8}$/, "Verification code must be 8 letters/numbers.")
        .transform((value) => value.toUpperCase()),
    })
    .strict(),
  params: z.object({}).passthrough(),
});

export const accountDeleteUndoRequestSchema = z.object({
  body: z.object({
    identifier: z.string().trim().optional(),
    email: z.string().trim().optional(),
    username: z.string().trim().optional(),
    password: z
      .string({ error: "Please enter your password." })
      .min(8, "Password must be at least 8 characters."),
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
    return;
  }

  if (!String(identifier).includes("@")) {
    const usernameMessage = getUsernameValidationMessage(identifier);

    if (usernameMessage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["body", "identifier"],
        message: usernameMessage,
      });
    }
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

export const avatarUpdateSchema = z.object({
  body: z.object({
    avatarImage: imageDataUriSchema,
  }),
  params: z.object({}).passthrough(),
});

const listFromInput = z
  .union([
    z.array(z.string()),
    z.string(),
  ])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    const items = Array.isArray(value) ? value : String(value).split(",");

    return items
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 12);
  });

export const preferencesUpdateSchema = z.object({
  body: z
    .object({
      interests: listFromInput,
      preferredLanguages: listFromInput,
      learningGoals: listFromInput,
      skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      learningPace: z.enum(["slow", "medium", "fast"]).optional(),
      preferredCategories: listFromInput,
      preferredDifficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      weeklyStudyHours: z.coerce
        .number({ error: "Weekly study hours must be a number." })
        .min(0, "Weekly study hours cannot be negative.")
        .max(80, "Weekly study hours must be 80 or less.")
        .optional(),
      reminderPreference: z.enum(["email", "push", "none"]).optional(),
    })
    .strict()
    .refine((value) => Object.values(value).some((item) => item !== undefined), "Provide at least one preference field."),
  params: z.object({}).passthrough(),
});
