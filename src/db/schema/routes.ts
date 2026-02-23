import { pgTable, pgEnum, serial, varchar, numeric, integer, timestamp } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const routeCategory = pgEnum('route_category', [
  'Brewery Run',
  'Coffee Run',
  'Brunch Run',
  'Weekend',
]);

export const routes = pgTable('routes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  distance: numeric('distance', { precision: 5, scale: 2 }).notNull(),
  category: routeCategory('category').notNull(),
  endLocation: varchar('end_location', { length: 200 }).notNull(),
  version: integer('version').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Route = InferSelectModel<typeof routes>;
export type NewRoute = InferInsertModel<typeof routes>;
