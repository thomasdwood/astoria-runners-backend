import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  color: z.string().min(1, 'Color is required').max(50, 'Color must be 50 characters or less'),
  icon: z.string().min(1, 'Icon is required').max(50, 'Icon must be 50 characters or less'),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').optional(),
  color: z.string().min(1, 'Color is required').max(50, 'Color must be 50 characters or less').optional(),
  icon: z.string().min(1, 'Icon is required').max(50, 'Icon must be 50 characters or less').optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
