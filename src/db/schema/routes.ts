import { pgTable, serial, varchar, numeric, integer, timestamp } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel, relations } from 'drizzle-orm';
import { categories } from './categories';

export const routes = pgTable('routes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  distance: numeric('distance', { precision: 5, scale: 2 }).notNull(),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  startLocation: varchar('start_location', { length: 200 }), // nullable, uses default setting if null
  endLocation: varchar('end_location', { length: 200 }),
  version: integer('version').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const routesRelations = relations(routes, ({ one }) => ({
  category: one(categories, {
    fields: [routes.categoryId],
    references: [categories.id],
  }),
}));

export type Route = InferSelectModel<typeof routes>;
export type NewRoute = InferInsertModel<typeof routes>;
