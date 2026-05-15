import { z } from 'zod';

// ------------------------------------ User ------------------------------------

const email_max_len = 256
const username_len = { min: 3, max: 42 }
const password_len = { min: 8, max: 128 }

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

export const usernameSchema = z
  .string()
  .trim()
  .min(1, errno.required('Username'))
  .min(username_len.min, errno.range('Username', username_len).min)
  .max(username_len.max, errno.range('Username', username_len).max)
  .regex(/^[a-zA-Z0-9_-]+$/, errno.UBAD)

export const emailSchema = z
  .string()
  .trim()
  .min(1, errno.required('Email'))
  .max(email_max_len, errno.ELONG)
  .pipe(z.email(errno.EBAD))

export const passwordSchema = z
  .string()
  .min(1, errno.required('Password'))
  .min(password_len.min, errno.range('Password', password_len).min)
  .max(password_len.max, errno.range('Password', password_len).max)
  .regex(/[a-z]/, errno.contains('lowercase letter'))
  .regex(/[A-Z]/, errno.contains('uppercase letter'))
  .regex(/[0-9]/, errno.contains('number'))
  .regex(/[^A-Za-z0-9]/, errno.contains('special character'))

// ------------------------------------ X ------------------------------------
