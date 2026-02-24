import { eq, and, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { routes } from '../db/schema/routes.js';
import type { Route } from '../db/schema/routes.js';
import type { CreateRouteInput, UpdateRouteInput } from '../validation/routes.js';

function formatRoute(row: Route) {
  return {
    ...row,
    distance: Number(row.distance), // numeric column returns string, convert to number for API
  };
}

export async function createRoute(data: CreateRouteInput) {
  const [created] = await db
    .insert(routes)
    .values({
      name: data.name,
      distance: String(data.distance),
      // TODO(03.1-02): categoryId will be looked up from data.category string after categories API is implemented
      categoryId: 1, // placeholder - service layer migration in 03.1-02
      endLocation: data.endLocation,
    })
    .returning();

  return formatRoute(created);
}

export async function getRouteById(id: number) {
  const [route] = await db
    .select()
    .from(routes)
    .where(eq(routes.id, id))
    .limit(1);

  return route ? formatRoute(route) : null;
}

export async function listRoutes(filters?: { category?: string }) {
  // TODO(03.1-02): category filter by string will be implemented after categories API migration
  // For now, return all routes (category filtering deferred to service layer migration in 03.1-02)
  const results = await db.select().from(routes).orderBy(routes.name);
  return results.map(formatRoute);
}

export async function updateRoute(id: number, data: UpdateRouteInput) {
  const { version, ...fields } = data;

  // Build update object with only provided fields
  const updateFields: Record<string, unknown> = {
    updatedAt: sql`NOW()`,
    version: sql`${routes.version} + 1`,
  };

  if (fields.name !== undefined) {
    updateFields.name = fields.name;
  }
  if (fields.distance !== undefined) {
    updateFields.distance = String(fields.distance);
  }
  // TODO(03.1-02): category update by string will be implemented after categories API migration
  // if (fields.category !== undefined) { updateFields.categoryId = ... }
  if (fields.endLocation !== undefined) {
    updateFields.endLocation = fields.endLocation;
  }

  const [updated] = await db
    .update(routes)
    .set(updateFields)
    .where(and(eq(routes.id, id), eq(routes.version, version)))
    .returning();

  // If no row was updated, determine if it's not_found or conflict
  if (!updated) {
    const [existing] = await db
      .select()
      .from(routes)
      .where(eq(routes.id, id))
      .limit(1);

    if (!existing) {
      return { error: 'not_found' as const };
    }
    return { error: 'conflict' as const };
  }

  return { route: formatRoute(updated) };
}

export async function deleteRoute(id: number) {
  const [deleted] = await db
    .delete(routes)
    .where(eq(routes.id, id))
    .returning();

  if (!deleted) {
    return { error: 'not_found' as const };
  }

  return { success: true as const };
}
