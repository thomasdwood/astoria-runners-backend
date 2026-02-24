import { eq, and, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { routes } from '../db/schema/routes.js';
import { categories } from '../db/schema/categories.js';
import type { CreateRouteInput, UpdateRouteInput } from '../validation/routes.js';

export async function createRoute(data: CreateRouteInput) {
  // Verify category FK exists
  const [categoryExists] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, data.categoryId))
    .limit(1);

  if (!categoryExists) {
    return { error: 'category_not_found' as const };
  }

  const [created] = await db
    .insert(routes)
    .values({
      name: data.name,
      distance: String(data.distance),
      categoryId: data.categoryId,
      startLocation: data.startLocation || null,
      endLocation: data.endLocation || null,
    })
    .returning();

  // Fetch with category via relational query
  const routeWithCategory = await db.query.routes.findFirst({
    where: eq(routes.id, created.id),
    with: { category: true },
  });

  return formatRoute(routeWithCategory!);
}

export async function getRouteById(id: number) {
  const route = await db.query.routes.findFirst({
    where: eq(routes.id, id),
    with: { category: true },
  });

  return route ? formatRoute(route) : null;
}

export async function listRoutes(filters?: { categoryId?: number }) {
  const results = await db.query.routes.findMany({
    with: { category: true },
    orderBy: (routes, { asc }) => [asc(routes.name)],
  });

  let filtered = results;

  if (filters?.categoryId !== undefined) {
    filtered = results.filter((r) => r.categoryId === filters.categoryId);
  }

  return filtered.map(formatRoute);
}

export async function updateRoute(id: number, data: UpdateRouteInput) {
  const { version, ...fields } = data;

  // If categoryId is being updated, verify it exists
  if (fields.categoryId !== undefined) {
    const [categoryExists] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, fields.categoryId))
      .limit(1);

    if (!categoryExists) {
      return { error: 'category_not_found' as const };
    }
  }

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
  if (fields.categoryId !== undefined) {
    updateFields.categoryId = fields.categoryId;
  }
  if (fields.startLocation !== undefined) {
    updateFields.startLocation = fields.startLocation || null;
  }
  if (fields.endLocation !== undefined) {
    updateFields.endLocation = fields.endLocation || null;
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

  // Fetch updated route with category
  const routeWithCategory = await db.query.routes.findFirst({
    where: eq(routes.id, updated.id),
    with: { category: true },
  });

  return { route: formatRoute(routeWithCategory!) };
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

// Helper to normalize route response (distance as number, include category object)
function formatRoute(row: { distance: string; [key: string]: unknown }) {
  return {
    ...row,
    distance: Number(row.distance), // numeric column returns string, convert to number for API
  };
}
