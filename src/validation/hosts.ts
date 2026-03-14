import { z } from 'zod';

export const createHostSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  email: z.string().email('Must be a valid email').optional().nullable(),
  userId: z.number().int().optional().nullable(),
});

export const updateHostSchema = createHostSchema.partial();

export type CreateHostInput = z.infer<typeof createHostSchema>;
export type UpdateHostInput = z.infer<typeof updateHostSchema>;
