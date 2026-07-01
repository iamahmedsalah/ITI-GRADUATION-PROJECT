import { z } from 'zod';

const emailLocalPartHasLetter = (value: string) => {
  const localPart = value.split('@')[0] ?? '';
  return /[A-Za-z]/.test(localPart);
};

const usernameHasLetter = /[A-Za-z]/;
const usernamePattern = /^[A-Za-z0-9._-]+$/;
const passwordRequirementsPattern =
  /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}/;
const passwordRequirementsMessage =
  'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';

const getUsernameValidationMessage = (value: string) => {
  const username = value.trim();

  if (username.length < 3 || username.length > 20) {
    return 'Username must be between 3 and 20 characters.';
  }

  if (!usernameHasLetter.test(username)) {
    return 'Username must include at least one letter.';
  }

  if (!usernamePattern.test(username)) {
    return 'Username can only contain letters, numbers, dots, underscores, and hyphens.';
  }

  return null;
};

export const signupBodySchema = z.object({
  username: z
    .string({ error: 'Username is required.' })
    .trim()
    .min(3, 'Username must be between 3 and 20 characters.')
    .max(20, 'Username must be between 3 and 20 characters.')
    .regex(usernameHasLetter, 'Username must include at least one letter.')
    .regex(usernamePattern, 'Username can only contain letters, numbers, dots, underscores, and hyphens.')
    .transform((value) => value.toLowerCase()),
  Fname: z
    .string({ error: 'First name is required.' })
    .trim()
    .min(2, 'First name must be at least 2 characters.')
    .max(24, 'First name must be at most 24 characters.'),
  Lname: z
    .string({ error: 'Last name is required.' })
    .trim()
    .min(2, 'Last name must be at least 2 characters.')
    .max(24, 'Last name must be at most 24 characters.'),
  email: z
    .string({ error: 'Email is required.' })
    .trim()
    .email('Please provide a valid email address.')
    .refine(emailLocalPartHasLetter, 'Email address before @ must include at least one letter.')
    .transform((value) => value.toLowerCase()),
  password: z
    .string({ error: 'Password must be a string.' })
    .min(8, 'Password must be at least 8 characters.')
    .regex(passwordRequirementsPattern, passwordRequirementsMessage),
});

export const verifyEmailBodySchema = z.object({
  code: z
    .string({ error: 'Verification code is required.' })
    .trim()
    .regex(/^[A-Za-z0-9]{8}$/, 'Verification code must be 8 letters/numbers.')
    .transform((value) => value.toUpperCase()),
});

export const loginBodySchema = z
  .object({
    identifier: z.string().trim().optional(),
    email: z.string().trim().optional(),
    username: z.string().trim().optional(),
    password: z
      .string({ error: 'Please enter your password.' })
      .min(8, 'Password must be at least 8 characters.')
      .regex(passwordRequirementsPattern, passwordRequirementsMessage),
  })
  .superRefine((body, ctx) => {
    const identifier = body.identifier || body.email || body.username;

    if (!identifier) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['identifier'],
        message: 'Please enter your email address or username.',
      });
      return;
    }

    if (!String(identifier).includes('@')) {
      const usernameMessage = getUsernameValidationMessage(identifier);

      if (usernameMessage) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['identifier'],
          message: usernameMessage,
        });
      }
    }
  })
  .transform((body) => ({
    identifier: String(body.identifier || body.email || body.username || '')
      .trim()
      .toLowerCase(),
    password: body.password,
  }));

export const emailBodySchema = z.object({
  email: z
    .string({ error: 'Please enter the email address for your account.' })
    .trim()
    .email('Please enter a valid email address.')
    .transform((value) => value.toLowerCase()),
});

export const resetPasswordBodySchema = z.object({
  password: z
    .string({ error: 'Please enter a new password.' })
    .min(8, 'New password must be at least 8 characters long.')
    .regex(passwordRequirementsPattern, passwordRequirementsMessage),
});

export type SignupBody = z.infer<typeof signupBodySchema>;
export type VerifyEmailBody = z.infer<typeof verifyEmailBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type EmailBody = z.infer<typeof emailBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
