import { z } from 'zod'
import { usernameSchema } from './fields'

// ------------------------------------ PATCH /users/:id ------------------------------------

const bio_max_len = 142

export const updateUserProfileSchema = z.object({
  username: usernameSchema.optional(),
  bio: z.string().max(bio_max_len, 'Bio is too long').optional()
})
.strict() // ❌ reject any unknown fields
.refine(data => Object.values(data).some(v => v !== undefined), {
  message: 'At least one field must be provided.'
});
