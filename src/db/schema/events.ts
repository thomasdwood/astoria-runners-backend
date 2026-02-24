import { pgTable, serial, integer, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel, relations } from 'drizzle-orm';
import { routes } from './routes.js';
import { recurringTemplates } from './recurringTemplates.js';

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  routeId: integer('route_id').notNull().references(() => routes.id),
  recurringTemplateId: integer('recurring_template_id').references(() => recurringTemplates.id),
  startDateTime: timestamp('start_date_time', { withTimezone: true }).notNull(),
  startLocation: varchar('start_location', { length: 200 }), // nullable, overrides route/default setting
  endLocation: varchar('end_location', { length: 200 }),
  notes: text('notes'),
  isCancelled: boolean('is_cancelled').notNull().default(false),
  postedToMeetup: boolean('posted_to_meetup').notNull().default(false),
  version: integer('version').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const eventsRelations = relations(events, ({ one }) => ({
  route: one(routes, {
    fields: [events.routeId],
    references: [routes.id],
  }),
  recurringTemplate: one(recurringTemplates, {
    fields: [events.recurringTemplateId],
    references: [recurringTemplates.id],
  }),
}));

export type Event = InferSelectModel<typeof events>;
export type NewEvent = InferInsertModel<typeof events>;
