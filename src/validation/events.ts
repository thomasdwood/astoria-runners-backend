import { z } from 'zod';

export const createEventSchema = z.object({
  routeId: z.number().int().positive('Route ID must be a positive integer'),
  startDateTime: z.string().datetime('Start date time must be a valid ISO 8601 date string').transform((val) => new Date(val)),
  startLocation: z.string().max(200, 'Start location must be 200 characters or less').nullable().optional(),
  endLocation: z.string().max(200, 'End location must be 200 characters or less').nullable().optional(),
  notes: z.string().nullable().optional(),
  isCancelled: z.boolean().optional(),
  recurringTemplateId: z.number().int().positive().optional(),
});

export const updateEventSchema = z.object({
  routeId: z.number().int().positive('Route ID must be a positive integer').optional(),
  startDateTime: z.string().datetime('Start date time must be a valid ISO 8601 date string').transform((val) => new Date(val)).optional(),
  startLocation: z.string().max(200, 'Start location must be 200 characters or less').optional(),
  endLocation: z.string().max(200, 'End location must be 200 characters or less').optional(),
  notes: z.string().optional(),
  version: z.number().int().nonnegative('Version must be a non-negative integer'),
});

export const createRecurringTemplateSchema = z.object({
  routeId: z.number().int().positive('Route ID must be a positive integer'),
  dayOfWeek: z.number().int().min(0, 'Day of week must be between 0 and 6').max(6, 'Day of week must be between 0 and 6'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:MM format (e.g., "18:30")'),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']).default('weekly'),
  interval: z.number().int().min(1).max(4).default(1),
  bySetPos: z.number().int().min(-1).max(4).nullable().optional(),
  endDate: z.preprocess(
    (val) => (val === '' ? null : typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val) ? new Date(val).toISOString() : val),
    z.string().datetime('End date must be a valid ISO 8601 date string').nullable().optional(),
  ),
  startLocation: z.string().max(200, 'Start location must be 200 characters or less').nullable().optional(),
  endLocation: z.string().max(200, 'End location must be 200 characters or less').nullable().optional(),
  notes: z.string().nullable().optional(),
  // Deprecated: kept for backward compatibility but not used in RRULE generation
  count: z.number().int().positive('Count must be a positive integer').optional(),
}).superRefine((data, ctx) => {
  if (data.frequency === 'monthly') {
    if (data.bySetPos == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'bySetPos is required for monthly frequency (use 1-4 for nth weekday, or -1 for last)',
        path: ['bySetPos'],
      });
    } else if (![-1, 1, 2, 3, 4].includes(data.bySetPos)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'bySetPos must be one of: -1 (last), 1, 2, 3, or 4',
        path: ['bySetPos'],
      });
    }
  }
  if (data.frequency === 'biweekly' && data.interval !== undefined && data.interval !== 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'interval should be 2 for biweekly frequency',
      path: ['interval'],
    });
  }
});

export const updateRecurringTemplateSchema = z.object({
  routeId: z.number().int().positive('Route ID must be a positive integer').optional(),
  dayOfWeek: z.number().int().min(0, 'Day of week must be between 0 and 6').max(6, 'Day of week must be between 0 and 6').optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:MM format (e.g., "18:30")').optional(),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
  interval: z.number().int().min(1).max(4).optional(),
  bySetPos: z.number().int().min(-1).max(4).nullable().optional(),
  endDate: z.preprocess(
    (val) => (val === '' ? null : typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val) ? new Date(val).toISOString() : val),
    z.string().datetime('End date must be a valid ISO 8601 date string').nullable().optional(),
  ),
  startLocation: z.string().max(200, 'Start location must be 200 characters or less').nullable().optional(),
  endLocation: z.string().max(200, 'End location must be 200 characters or less').nullable().optional(),
  notes: z.string().nullable().optional(),
  version: z.number().int().nonnegative('Version must be a non-negative integer'),
});

// Schema for the recurrence preview endpoint (query params)
export const recurrencePreviewSchema = z.object({
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  bySetPos: z.coerce.number().int().min(-1).max(4).nullable().optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:MM format (e.g., "18:30")'),
});

export const calendarQuerySchema = z.object({
  view: z.enum(['month', 'list'], {
    message: 'View must be either "month" or "list"',
  }),
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1, 'Month must be between 1 and 12').max(12, 'Month must be between 1 and 12').optional(),
  start: z.string().datetime('Start must be a valid ISO 8601 date string').optional(),
  end: z.string().datetime('End must be a valid ISO 8601 date string').optional(),
  categoryId: z.coerce.number().int().positive().optional(),
});

export const listEventsQuerySchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
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
export type RecurrencePreviewInput = z.infer<typeof recurrencePreviewSchema>;
export type CalendarQueryInput = z.infer<typeof calendarQuerySchema>;
export type ListEventsQueryInput = z.infer<typeof listEventsQuerySchema>;
export type UpdateMeetupStatusInput = z.infer<typeof updateMeetupStatusSchema>;
