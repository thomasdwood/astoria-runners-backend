import { eq, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { hosts } from '../db/schema/hosts.js';
import type { CreateHostInput, UpdateHostInput } from '../validation/hosts.js';

export async function listHosts() {
  const results = await db
    .select()
    .from(hosts)
    .orderBy(hosts.name);

  return results;
}

export async function getHostById(id: number) {
  const [host] = await db
    .select()
    .from(hosts)
    .where(eq(hosts.id, id))
    .limit(1);

  return host || null;
}

export async function createHost(data: CreateHostInput) {
  const [created] = await db
    .insert(hosts)
    .values({
      name: data.name,
      email: data.email ?? null,
      userId: data.userId ?? null,
    })
    .returning();

  return created;
}

export async function updateHost(id: number, data: UpdateHostInput) {
  const updateFields: Record<string, unknown> = {
    updatedAt: sql`NOW()`,
  };

  if (data.name !== undefined) {
    updateFields.name = data.name;
  }
  if (data.email !== undefined) {
    updateFields.email = data.email ?? null;
  }
  if (data.userId !== undefined) {
    updateFields.userId = data.userId ?? null;
  }

  const [updated] = await db
    .update(hosts)
    .set(updateFields)
    .where(eq(hosts.id, id))
    .returning();

  return updated || null;
}

export async function deleteHost(id: number) {
  // FK ON DELETE SET NULL cascades to events and recurring_templates automatically
  // Do NOT block deletion — events remain with hostId set to null
  const [deleted] = await db
    .delete(hosts)
    .where(eq(hosts.id, id))
    .returning();

  if (!deleted) {
    return { error: 'not_found' as const };
  }

  return { success: true as const };
}
