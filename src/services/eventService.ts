import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { db } from '../config/database.js';
import { events } from '../db/schema/events.js';
import { routes } from '../db/schema/routes.js';
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
      startLocation: data.startLocation || null,
      endLocation: data.endLocation || null,
      notes: data.notes,
    })
    .returning();

  // Fetch with route and nested category via relational query
  const eventWithRoute = await db.query.events.findFirst({
    where: eq(events.id, created.id),
    with: {
      route: {
        with: { category: true },
      },
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
      route: {
        with: { category: true },
      },
    },
  });

  return event || null;
}

export async function listEvents(filters?: { categoryId?: number; start?: Date; end?: Date }) {
  const conditions = [];

  if (filters?.start) {
    conditions.push(gte(events.startDateTime, filters.start));
  }

  if (filters?.end) {
    conditions.push(lte(events.startDateTime, filters.end));
  }

  // Use relational query to fetch events with route and nested category
  const results = await db.query.events.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      route: {
        with: { category: true },
      },
    },
    orderBy: (events, { asc }) => [asc(events.startDateTime)],
  });

  // Filter by categoryId in JS if requested
  if (filters?.categoryId !== undefined) {
    return results.filter((e) => e.route?.categoryId === filters.categoryId);
  }

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
  if (fields.startLocation !== undefined) {
    updateFields.startLocation = fields.startLocation || null;
  }
  if (fields.endLocation !== undefined) {
    updateFields.endLocation = fields.endLocation || null;
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

  // Fetch updated event with route and nested category
  const eventWithRoute = await db.query.events.findFirst({
    where: eq(events.id, updated.id),
    with: {
      route: {
        with: { category: true },
      },
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
    with: {
      route: {
        with: { category: true },
      },
    },
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
