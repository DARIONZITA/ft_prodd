import { z } from 'zod'
import { usernameSchema } from './fields'

// ------------------------------------ PATCH /users/:id ------------------------------------

const bio_max_len = 142

export const updateUserProfileSchema = z.object({
  username: usernameSchema.optional(),
  bio: z.string().max(bio_max_len, 'Bio is too long').optional(),
  avatarUrl: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().url('Invalid URL').optional(),
  ),
})
.strict()
