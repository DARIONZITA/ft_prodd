import { z } from 'zod'

const	email_max_len = 256;
const	username_len = { min : 3, max : 42 };
const	password_len = { min: 8, max: 128 }; 

const errno = {
  ELONG: 'Email is too long.',
  EBAD: 'Enter a valid email address.',
  UBAD: 'Username can only contain letters, numbers, underscores, and hyphens.',

  required: (field_name: string) => `${field_name} is required.`,
  range: (field_name: string, len: { min: number; max: number }) => ({
    min: `${field_name} must be at least ${len.min} characters.`,
    max: `${field_name} must be at most ${len.max} characters.`,
  }),
  contains: (what: string, field_name = 'Password') =>
  `${field_name} must contain at least one ${what}.`,
}

export const signInSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1)
    .refine((value) => {
      if (!value.includes('@'))
        return true
      return z.email().safeParse(value).success
    }),
  password: z
    .string()
    .trim()
    .min(1)
})

export const signUpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, errno.required('Email'))
    .max(email_max_len, errno.ELONG)
    .pipe(z.email(errno.EBAD)),
  username: z
    .string()
    .trim()
    .min(1, errno.required('Username'))
    .min(username_len.min, errno.range('Username', username_len).min)
    .max(username_len.max, errno.range('Username', username_len).max)
    .regex(/^[a-zA-Z0-9_-]+$/, errno.UBAD),
  password: z
    .string()
    .min(1, errno.required('Password'))
    .min(password_len.min, errno.range('Password', password_len).min)
    .max(password_len.max, errno.range('Password', password_len).max)
    .regex(/[a-z]/, errno.contains('lowercase letter'))
    .regex(/[A-Z]/, errno.contains('uppercase letter'))
    .regex(/[0-9]/, errno.contains('number'))
    .regex(/[^A-Za-z0-9]/, errno.contains('special character')),
  repeat: z.string().min(1, 'Please confirm your password.'),
}).refine(data => data.password === data.repeat, {
  message: 'Passwords do not match.',
  path: ['repeat'],
})

export function parseSchema<T extends z.ZodTypeAny>(schema: T, data: unknown) {
  const result = schema.safeParse(data)

  if (result.success)
    return { success: true } as const

  const errors: Record<string, string> = {}

  for (const issue of result.error.issues) {
    const field = String(issue.path[0])
    errors[field] ??= issue.message
  }

  return { success: false, errors }
}
