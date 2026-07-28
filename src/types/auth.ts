import { z } from 'zod'

export const AuthSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().optional(),
})

export type AuthInput = z.infer<typeof AuthSchema>
