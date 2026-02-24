import { eq, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { settings } from '../db/schema/settings.js';
import { routes } from '../db/schema/routes.js';
import { events } from '../db/schema/events.js';

export const DEFAULT_START_LOCATION_KEY = 'default_start_location';

export async function getSetting(key: string): Promise<string | null> {
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);

  return row?.value ?? null;
}

export async function upsertSetting(key: string, value: string) {
  const [result] = await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        value,
        updatedAt: sql`NOW()`,
      },
    })
    .returning();

  return result;
}

export async function getAllSettings() {
  const results = await db
    .select({ key: settings.key, value: settings.value })
    .from(settings);

  return results;
}

export async function getLocationSuggestions(): Promise<string[]> {
  // Gather distinct non-null, non-empty startLocation and endLocation from routes and events
  const routeStartLocations = await db
    .selectDistinct({ location: routes.startLocation })
    .from(routes)
    .where(sql`${routes.startLocation} IS NOT NULL AND ${routes.startLocation} != ''`);

  const routeEndLocations = await db
    .selectDistinct({ location: routes.endLocation })
    .from(routes)
    .where(sql`${routes.endLocation} IS NOT NULL AND ${routes.endLocation} != ''`);

  const eventStartLocations = await db
    .selectDistinct({ location: events.startLocation })
    .from(events)
    .where(sql`${events.startLocation} IS NOT NULL AND ${events.startLocation} != ''`);

  const eventEndLocations = await db
    .selectDistinct({ location: events.endLocation })
    .from(events)
    .where(sql`${events.endLocation} IS NOT NULL AND ${events.endLocation} != ''`);

  // Merge and deduplicate in JS
  const seen = new Set<string>();
  const all = [
    ...routeStartLocations,
    ...routeEndLocations,
    ...eventStartLocations,
    ...eventEndLocations,
  ];

  for (const row of all) {
    if (row.location) {
      seen.add(row.location);
    }
  }

  return Array.from(seen).sort();
}
