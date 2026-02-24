import { eq, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { categories } from '../db/schema/categories.js';
import { routes } from '../db/schema/routes.js';
import type { CreateCategoryInput, UpdateCategoryInput } from '../validation/categories.js';

export async function listCategories() {
  const results = await db
    .select()
    .from(categories)
    .orderBy(categories.name);

  return results;
}

export async function getCategoryById(id: number) {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  return category || null;
}

export async function createCategory(data: CreateCategoryInput) {
  const [created] = await db
    .insert(categories)
    .values({
      name: data.name,
      color: data.color,
      icon: data.icon,
    })
    .returning();

  return created;
}

export async function updateCategory(id: number, data: UpdateCategoryInput) {
  const updateFields: Record<string, unknown> = {
    updatedAt: sql`NOW()`,
  };

  if (data.name !== undefined) {
    updateFields.name = data.name;
  }
  if (data.color !== undefined) {
    updateFields.color = data.color;
  }
  if (data.icon !== undefined) {
    updateFields.icon = data.icon;
  }

  const [updated] = await db
    .update(categories)
    .set(updateFields)
    .where(eq(categories.id, id))
    .returning();

  return updated || null;
}

export async function deleteCategory(id: number) {
  // Check if any routes reference this category
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(routes)
    .where(eq(routes.categoryId, id));

  const routeCount = countResult?.count ?? 0;

  if (routeCount > 0) {
    return { error: 'in_use' as const, routeCount };
  }

  const [deleted] = await db
    .delete(categories)
    .where(eq(categories.id, id))
    .returning();

  if (!deleted) {
    return { error: 'not_found' as const };
  }

  return { success: true as const };
}
