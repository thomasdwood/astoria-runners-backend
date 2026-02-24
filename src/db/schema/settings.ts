import { pgTable, serial, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { InferSelectModel } from 'drizzle-orm';

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Setting = InferSelectModel<typeof settings>;
