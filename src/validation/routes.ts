import { z } from 'zod';

export const ROUTE_CATEGORIES = ['Brewery Run', 'Coffee Run', 'Brunch Run', 'Weekend'] as const;
export type RouteCategory = typeof ROUTE_CATEGORIES[number];

export const createRouteSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  distance: z.number().positive('Distance must be positive'),
  category: z.enum(ROUTE_CATEGORIES, {
    message: `Category must be one of: ${ROUTE_CATEGORIES.join(', ')}`,
  }),
  endLocation: z.string().min(1, 'End location is required').max(200, 'End location must be 200 characters or less'),
});

export const updateRouteSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').optional(),
  distance: z.number().positive('Distance must be positive').optional(),
  category: z.enum(ROUTE_CATEGORIES, {
    message: `Category must be one of: ${ROUTE_CATEGORIES.join(', ')}`,
  }).optional(),
  endLocation: z.string().min(1, 'End location is required').max(200, 'End location must be 200 characters or less').optional(),
  version: z.number().int().nonnegative('Version must be a non-negative integer'),
});

export const listRoutesQuerySchema = z.object({
  category: z.enum(ROUTE_CATEGORIES).optional(),
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
