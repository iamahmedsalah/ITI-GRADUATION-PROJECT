import { z } from 'zod';

export const contactBodySchema = z.object({
  name: z
    .string({ error: 'Name is required.' })
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(80, 'Name must be at most 80 characters.')
    .regex(/^[^\r\n<>]+$/, 'Name contains invalid characters.'),
  email: z
    .string({ error: 'Email is required.' })
    .trim()
    .email('Please provide a valid email address.')
    .transform((value) => value.toLowerCase()),
  message: z
    .string({ error: 'Message is required.' })
    .trim()
    .min(10, 'Message must be at least 10 characters.')
    .max(5000, 'Message must be at most 5000 characters.'),
});

export type ContactBody = z.infer<typeof contactBodySchema>;
