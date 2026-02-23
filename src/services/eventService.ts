import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { db } from '../config/database.js';
import { events } from '../db/schema/events.js';
import { routes } from '../db/schema/routes.js';
import type { Event } from '../db/schema/events.js';
import type { CreateEventInput, UpdateEventInput } from '../validation/events.js';
import { notifyEventCreated, notifyEventUpdated, notifyEventDeleted } from './discordService.js';

export async function createEvent(data: CreateEventInput) {
  // Verify route exists
  const [routeExists] = await db
    .select()
    .from(routes)
    .where(eq(routes.id, data.routeId))
    .limit(1);

  if (!routeExists) {
    return { error: 'route_not_found' as const };
  }

  const [created] = await db
    .insert(events)
    .values({
      routeId: data.routeId,
      startDateTime: data.startDateTime,
      endLocation: data.endLocation,
      notes: data.notes,
    })
    .returning();

  // Fetch with route data using relational query
  const eventWithRoute = await db.query.events.findFirst({
    where: eq(events.id, created.id),
    with: {
      route: true,
    },
  });

  // Fire and forget - don't block response on webhook
  if (eventWithRoute) {
    notifyEventCreated(eventWithRoute as any).catch(err => {
      console.error('Discord notification failed (create):', err);
    });
  }

  return eventWithRoute;
}

export async function getEventById(id: number) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    with: {
      route: true,
    },
  });

  return event || null;
}

export async function listEvents(filters?: { category?: string; start?: Date; end?: Date }) {
  const conditions = [];

  if (filters?.start) {
    conditions.push(gte(events.startDateTime, filters.start));
  }

  if (filters?.end) {
    conditions.push(lte(events.startDateTime, filters.end));
  }

  // If category filter is provided, we need to use explicit JOIN
  if (filters?.category) {
    const results = await db
      .select({
        id: events.id,
        routeId: events.routeId,
        recurringTemplateId: events.recurringTemplateId,
        startDateTime: events.startDateTime,
        endLocation: events.endLocation,
        notes: events.notes,
        version: events.version,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        route: routes,
      })
      .from(events)
      .innerJoin(routes, eq(events.routeId, routes.id))
      .where(
        and(
          eq(routes.category, filters.category as any),
          conditions.length > 0 ? and(...conditions) : undefined
        )
      )
      .orderBy(events.startDateTime);

    return results;
  }

  // No category filter - use relational query
  const results = await db.query.events.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      route: true,
    },
    orderBy: (events, { asc }) => [asc(events.startDateTime)],
  });

  return results;
}

export async function updateEvent(id: number, data: UpdateEventInput) {
  const { version, ...fields } = data;

  // Build update object with only provided fields
  const updateFields: Record<string, unknown> = {
    updatedAt: sql`NOW()`,
    version: sql`${events.version} + 1`,
  };

  if (fields.routeId !== undefined) {
    updateFields.routeId = fields.routeId;
  }
  if (fields.startDateTime !== undefined) {
    updateFields.startDateTime = fields.startDateTime;
  }
  if (fields.endLocation !== undefined) {
    updateFields.endLocation = fields.endLocation;
  }
  if (fields.notes !== undefined) {
    updateFields.notes = fields.notes;
  }

  const [updated] = await db
    .update(events)
    .set(updateFields)
    .where(and(eq(events.id, id), eq(events.version, version)))
    .returning();

  // If no row was updated, determine if it's not_found or conflict
  if (!updated) {
    const [existing] = await db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1);

    if (!existing) {
      return { error: 'not_found' as const };
    }
    return { error: 'conflict' as const };
  }

  // Fetch updated event with route data
  const eventWithRoute = await db.query.events.findFirst({
    where: eq(events.id, updated.id),
    with: {
      route: true,
    },
  });

  // Fire and forget - don't block response on webhook
  if (eventWithRoute) {
    notifyEventUpdated(eventWithRoute as any).catch(err => {
      console.error('Discord notification failed (update):', err);
    });
  }

  return { event: eventWithRoute };
}

export async function deleteEvent(id: number) {
  // Fetch event with route before deleting (needed for Discord notification)
  const eventWithRoute = await db.query.events.findFirst({
    where: eq(events.id, id),
    with: { route: true },
  });

  const [deleted] = await db
    .delete(events)
    .where(eq(events.id, id))
    .returning();

  if (!deleted) {
    return { error: 'not_found' as const };
  }

  // Notify Discord about cancellation
  if (eventWithRoute) {
    notifyEventDeleted(eventWithRoute as any).catch(err => {
      console.error('Discord notification failed (delete):', err);
    });
  }

  return { success: true as const };
}

export async function updateMeetupStatus(id: number, postedToMeetup: boolean) {
  const [updated] = await db
    .update(events)
    .set({
      postedToMeetup,
      updatedAt: sql`NOW()`,
    })
    .where(eq(events.id, id))
    .returning();

  if (!updated) {
    return { error: 'not_found' as const };
  }

  return { event: updated };
}
