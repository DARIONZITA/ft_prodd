import { z } from 'zod'

export const signInSchema = z.object({
  email:    z.email('Enter a valid email address.').min(1, 'Email is required.'),
  password: z.string().min(1, 'Password is required.'),
})

export const signUpSchema = z.object({
  email: z.email('Enter a valid email address.').min(1, 'Email is required.'),
  username: z
    .string()
    .min(1, 'Username is required.')
    .min(3, 'Username must be at least 3 characters.')
    .max(20, 'Username must be at most 20 characters.')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens.'),
  password: z
    .string()
    .min(1, 'Password is required.')
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.'),
  repeat: z.string().min(1, 'Please confirm your password.'),
}).refine(data => data.password === data.repeat, {
  message: 'Passwords do not match.',
  path: ['repeat'],
})

export type SignInErrors = Partial<Record<keyof z.infer<typeof signInSchema>, string>>
export type SignUpErrors = Partial<Record<keyof z.infer<typeof signUpSchema>, string>>

export function parseSignIn(data: unknown): { success: true } | { success: false; errors: SignInErrors } {
  const result = signInSchema.safeParse(data)
  if (result.success)
    return { success: true }
  const errors: SignInErrors = {}
  for (const issue of result.error.issues)
    errors[issue.path[0] as keyof SignInErrors] ??= issue.message
  return { success: false, errors }
}

export function parseSignUp(data: unknown): { success: true } | { success: false; errors: SignUpErrors } {
  const result = signUpSchema.safeParse(data)
  if (result.success)
    return { success: true }
  const errors: SignUpErrors = {}
  for (const issue of result.error.issues)
    errors[issue.path[0] as keyof SignUpErrors] ??= issue.message
  return { success: false, errors }
}
