import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, 'validation.password.min')
  .regex(/[A-Z]/, 'validation.password.uppercase')
  .regex(/[a-z]/, 'validation.password.lowercase')
  .regex(/[0-9]/, 'validation.password.number')
  .regex(/[^A-Za-z0-9]/, 'validation.password.symbol')

const allowedEmailDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'test.com']

export const signupSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'validation.username.min')
    .max(24, 'validation.username.max')
    .regex(/^[A-Za-z0-9._-]+$/, 'validation.username.pattern'),
  Fname: z.string().trim().min(2, 'validation.firstName.required'),
  Lname: z.string().trim().min(2, 'validation.lastName.required'),
  email: z
    .string()
    .trim()
    .email('validation.email.invalid')
    .refine((value) => {
      const domain = value.split('@')[1]?.toLowerCase() ?? ''
      return allowedEmailDomains.includes(domain)
    }, 'validation.email.domain'),
  password: passwordSchema,
})

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'validation.identifier.min'),
  password: z
    .string()
    .min(8, 'validation.password.min'),
})

export const verifyEmailSchema = z.object({
  code: z
    .string()
    .trim()
    .length(8, 'validation.verifyCode.length')
    .regex(/^[A-Z0-9]+$/i, 'validation.verifyCode.pattern'),
})

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email('validation.email.invalid'),
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
