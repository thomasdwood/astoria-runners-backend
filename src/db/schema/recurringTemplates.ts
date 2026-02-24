import { pgTable, serial, integer, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel, relations } from 'drizzle-orm';
import { routes } from './routes';

export const recurringTemplates = pgTable('recurring_templates', {
  id: serial('id').primaryKey(),
  routeId: integer('route_id').notNull().references(() => routes.id),
  rrule: text('rrule').notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Sunday through 6=Saturday
  startTime: varchar('start_time', { length: 5 }).notNull(), // HH:MM format, e.g. "18:30"
  frequency: varchar('frequency', { length: 20 }).notNull().default('weekly'), // 'weekly', 'biweekly', 'monthly'
  interval: integer('interval').notNull().default(1), // 2 for biweekly
  bySetPos: integer('by_set_pos'), // nullable, used for monthly nth-weekday (1=first, 2=second, -1=last)
  endDate: timestamp('end_date', { withTimezone: true }), // nullable, optional end date
  startLocation: varchar('start_location', { length: 200 }), // nullable
  endLocation: varchar('end_location', { length: 200 }),
  excludedDates: text('excluded_dates'), // nullable, JSON array of ISO date strings e.g. '["2026-03-04","2026-03-11"]'
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  version: integer('version').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const recurringTemplatesRelations = relations(recurringTemplates, ({ one }) => ({
  route: one(routes, {
    fields: [recurringTemplates.routeId],
    references: [routes.id],
  }),
}));

export type RecurringTemplate = InferSelectModel<typeof recurringTemplates>;
export type NewRecurringTemplate = InferInsertModel<typeof recurringTemplates>;
