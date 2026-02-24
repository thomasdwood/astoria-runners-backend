import { z } from 'zod';

export const createRouteSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  distance: z.number().positive('Distance must be positive'),
  categoryId: z.number().int().positive('Category ID must be a positive integer'),
  startLocation: z.string().max(200, 'Start location must be 200 characters or less').optional().or(z.literal('')),
  endLocation: z.string().max(200, 'End location must be 200 characters or less').optional(),
});

export const updateRouteSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').optional(),
  distance: z.number().positive('Distance must be positive').optional(),
  categoryId: z.number().int().positive('Category ID must be a positive integer').optional(),
  startLocation: z.string().max(200, 'Start location must be 200 characters or less').optional().or(z.literal('')),
  endLocation: z.string().max(200, 'End location must be 200 characters or less').optional(),
  version: z.number().int().nonnegative('Version must be a non-negative integer'),
});

export const listRoutesQuerySchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
