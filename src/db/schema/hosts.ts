import { pgTable, serial, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from './users.js';

export const hosts = pgTable('hosts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  version: integer('version').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Host = InferSelectModel<typeof hosts>;
export type NewHost = InferInsertModel<typeof hosts>;
