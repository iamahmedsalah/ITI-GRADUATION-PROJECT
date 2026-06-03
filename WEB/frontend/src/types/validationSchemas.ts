import { z } from 'zod'

const passwordSchema = z
  .string()
  .regex(
    /(?=.{8,})(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/,
    'validation.password.requirements',
  )

const usernameSchema = z
  .string()
  .trim()
  .min(3, 'validation.username.min')
  .max(20, 'validation.username.max')
  .regex(/[A-Za-z]/, 'validation.username.letter')
  .regex(/^[A-Za-z0-9._-]+$/, 'validation.username.pattern')

const allowedEmailDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'test.com']

const emailLocalPartHasLetter = (value: string) => {
  const localPart = value.split('@')[0] ?? ''
  return /[A-Za-z]/.test(localPart)
}

const baseEmailSchema = z
  .string()
  .trim()
  .email('validation.email.invalid')
  .refine(emailLocalPartHasLetter, 'validation.email.localPartLetter')

const signupEmailSchema = baseEmailSchema.refine((value) => {
  const domain = value.split('@')[1]?.toLowerCase() ?? ''
  return allowedEmailDomains.includes(domain)
}, 'validation.email.domain')

export const signupSchema = z.object({
  username: usernameSchema,
  Fname: z.string().trim().min(2, 'validation.firstName.required').max(24, 'validation.firstName.max'),
  Lname: z.string().trim().min(2, 'validation.lastName.required').max(24, 'validation.lastName.max'),
  email: signupEmailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'validation.identifier.min')
    .superRefine((value, ctx) => {
      if (value.includes('@')) {
        const emailResult = baseEmailSchema.safeParse(value)
        if (!emailResult.success) {
          ctx.addIssue({
            code: 'custom',
            message: emailResult.error.issues[0]?.message ?? 'validation.email.invalid',
          })
        }
        return
      }

      const usernameResult = usernameSchema.safeParse(value)
      if (!usernameResult.success) {
        ctx.addIssue({
          code: 'custom',
          message: usernameResult.error.issues[0]?.message ?? 'validation.username.pattern',
        })
      }
    }),
  password: passwordSchema,
})

export const verifyEmailSchema = z.object({
  code: z
    .string()
    .trim()
    .length(8, 'validation.verifyCode.length')
    .regex(/^[A-Z0-9]+$/i, 'validation.verifyCode.pattern'),
})

export const forgotPasswordSchema = z.object({
  email: baseEmailSchema,
})

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z
      .string()
      .min(8, 'validation.password.min'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'validation.password.confirmMatch',
  })
