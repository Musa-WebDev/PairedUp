import { z } from 'zod'

////////////////////////////////////////////////////////////////////////////////
// ENUMS & SCHEMAS
////////////////////////////////////////////////////////////////////////////////

export const ActivityCategoryEnum = z.enum(['movie', 'show', 'activity'])
export const ActivityStatusEnum = z.enum(['suggested', 'planned', 'completed'])

export const ActivitySchema = z.object({
  id: z.string().uuid(),
  created_by: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  category: ActivityCategoryEnum,
  status: ActivityStatusEnum,
  url: z.string().url().nullable().optional().or(z.literal('')),
  created_at: z.string(),
})

export const CreateActivitySchema = ActivitySchema.pick({
  title: true,
  description: true,
  category: true,
  url: true,
})

////////////////////////////////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////////////////////////////////

export type ActivityCategory = z.infer<typeof ActivityCategoryEnum>
export type ActivityStatus = z.infer<typeof ActivityStatusEnum>
export type Activity = z.infer<typeof ActivitySchema>
export type CreateActivityInput = z.infer<typeof CreateActivitySchema>
