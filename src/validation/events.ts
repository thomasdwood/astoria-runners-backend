import { z } from 'zod';
import { ROUTE_CATEGORIES } from './routes.js';

export const createEventSchema = z.object({
  routeId: z.number().int().positive('Route ID must be a positive integer'),
  startDateTime: z.string().datetime('Start date time must be a valid ISO 8601 date string').transform((val) => new Date(val)),
  endLocation: z.string().max(200, 'End location must be 200 characters or less').optional(),
  notes: z.string().optional(),
});

export const updateEventSchema = z.object({
  routeId: z.number().int().positive('Route ID must be a positive integer').optional(),
  startDateTime: z.string().datetime('Start date time must be a valid ISO 8601 date string').transform((val) => new Date(val)).optional(),
  endLocation: z.string().max(200, 'End location must be 200 characters or less').optional(),
  notes: z.string().optional(),
  version: z.number().int().nonnegative('Version must be a non-negative integer'),
});

export const createRecurringTemplateSchema = z.object({
  routeId: z.number().int().positive('Route ID must be a positive integer'),
  dayOfWeek: z.number().int().min(0, 'Day of week must be between 0 and 6').max(6, 'Day of week must be between 0 and 6'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:MM format (e.g., "18:30")'),
  endLocation: z.string().max(200, 'End location must be 200 characters or less').optional(),
  notes: z.string().optional(),
  count: z.number().int().positive('Count must be a positive integer').optional().default(12),
});

export const updateRecurringTemplateSchema = z.object({
  routeId: z.number().int().positive('Route ID must be a positive integer').optional(),
  dayOfWeek: z.number().int().min(0, 'Day of week must be between 0 and 6').max(6, 'Day of week must be between 0 and 6').optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:MM format (e.g., "18:30")').optional(),
  endLocation: z.string().max(200, 'End location must be 200 characters or less').optional(),
  notes: z.string().optional(),
  version: z.number().int().nonnegative('Version must be a non-negative integer'),
});

export const calendarQuerySchema = z.object({
  view: z.enum(['month', 'list'], {
    message: 'View must be either "month" or "list"',
  }),
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1, 'Month must be between 1 and 12').max(12, 'Month must be between 1 and 12').optional(),
  start: z.string().datetime('Start must be a valid ISO 8601 date string').optional(),
  end: z.string().datetime('End must be a valid ISO 8601 date string').optional(),
  category: z.enum(ROUTE_CATEGORIES, {
    message: `Category must be one of: ${ROUTE_CATEGORIES.join(', ')}`,
  }).optional(),
});

export const listEventsQuerySchema = z.object({
  category: z.enum(ROUTE_CATEGORIES, {
    message: `Category must be one of: ${ROUTE_CATEGORIES.join(', ')}`,
  }).optional(),
  start: z.string().datetime('Start must be a valid ISO 8601 date string').optional(),
  end: z.string().datetime('End must be a valid ISO 8601 date string').optional(),
});

export const updateMeetupStatusSchema = z.object({
  postedToMeetup: z.boolean(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateRecurringTemplateInput = z.infer<typeof createRecurringTemplateSchema>;
export type UpdateRecurringTemplateInput = z.infer<typeof updateRecurringTemplateSchema>;
export type CalendarQueryInput = z.infer<typeof calendarQuerySchema>;
export type ListEventsQueryInput = z.infer<typeof listEventsQuerySchema>;
export type UpdateMeetupStatusInput = z.infer<typeof updateMeetupStatusSchema>;
