import { eq, and, sql } from 'drizzle-orm';
import rrulePkg from 'rrule';
const { RRule } = rrulePkg;
import { addDays, setHours, setMinutes, startOfDay } from 'date-fns';
import { db } from '../config/database.js';
import { recurringTemplates } from '../db/schema/recurringTemplates.js';
import { routes } from '../db/schema/routes.js';
import { events } from '../db/schema/events.js';
import type { CreateRecurringTemplateInput, UpdateRecurringTemplateInput } from '../validation/events.js';

// Helper: Map JavaScript day of week (0=Sunday) to RRule weekday constants
function dayOfWeekToRRuleDay(day: number) {
  const daysMap = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];
  return daysMap[day];
}

// Helper: Compute dtstart for RRULE - find next occurrence of the day of week from today
function computeDtstart(dayOfWeek: number, startTime: string): Date {
  const now = new Date();
  const [hours, minutes] = startTime.split(':').map(Number);

  // Get the next occurrence of the specified day of week
  let dtstart = startOfDay(now);
  const currentDay = now.getDay();

  if (currentDay === dayOfWeek) {
    // If today is the target day, use today
    dtstart = startOfDay(now);
  } else {
    // Calculate days until next occurrence
    const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
    dtstart = addDays(dtstart, daysUntilTarget);
  }

  // Set the time
  dtstart = setHours(dtstart, hours);
  dtstart = setMinutes(dtstart, minutes);

  return dtstart;
}

// Helper: Build RRULE string
function buildRRule(dayOfWeek: number, startTime: string, count: number): string {
  const dtstart = computeDtstart(dayOfWeek, startTime);

  const rule = new RRule({
    freq: RRule.WEEKLY,
    byweekday: [dayOfWeekToRRuleDay(dayOfWeek)],
    dtstart: dtstart,
    count: count,
  });

  return rule.toString();
}

export async function createRecurringTemplate(data: CreateRecurringTemplateInput) {
  // Verify route exists
  const [routeExists] = await db
    .select()
    .from(routes)
    .where(eq(routes.id, data.routeId))
    .limit(1);

  if (!routeExists) {
    return { error: 'route_not_found' as const };
  }

  // Build RRULE string
  const rruleString = buildRRule(data.dayOfWeek, data.startTime, data.count || 12);

  const [created] = await db
    .insert(recurringTemplates)
    .values({
      routeId: data.routeId,
      rrule: rruleString,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endLocation: data.endLocation,
      notes: data.notes,
    })
    .returning();

  // Fetch with route data using relational query
  const templateWithRoute = await db.query.recurringTemplates.findFirst({
    where: eq(recurringTemplates.id, created.id),
    with: {
      route: true,
    },
  });

  return templateWithRoute;
}

export async function getRecurringTemplateById(id: number) {
  const template = await db.query.recurringTemplates.findFirst({
    where: eq(recurringTemplates.id, id),
    with: {
      route: true,
    },
  });

  return template || null;
}

export async function listRecurringTemplates(filters?: { category?: string }) {
  const results = await db.query.recurringTemplates.findMany({
    where: eq(recurringTemplates.isActive, true),
    with: {
      route: true,
    },
    orderBy: (recurringTemplates, { asc }) => [
      asc(recurringTemplates.dayOfWeek),
      asc(recurringTemplates.startTime),
    ],
  });

  // TODO(03.1-02): category filter by string will be implemented after categories API migration
  // Category filtering via route.categoryId deferred to service layer migration in 03.1-02

  return results;
}

export async function updateRecurringTemplate(id: number, data: UpdateRecurringTemplateInput) {
  const { version, ...fields } = data;

  // Build update object with only provided fields
  const updateFields: Record<string, unknown> = {
    updatedAt: sql`NOW()`,
    version: sql`${recurringTemplates.version} + 1`,
  };

  if (fields.routeId !== undefined) {
    updateFields.routeId = fields.routeId;
  }
  if (fields.dayOfWeek !== undefined) {
    updateFields.dayOfWeek = fields.dayOfWeek;
  }
  if (fields.startTime !== undefined) {
    updateFields.startTime = fields.startTime;
  }
  if (fields.endLocation !== undefined) {
    updateFields.endLocation = fields.endLocation;
  }
  if (fields.notes !== undefined) {
    updateFields.notes = fields.notes;
  }

  // If dayOfWeek or startTime changed, rebuild RRULE
  if (fields.dayOfWeek !== undefined || fields.startTime !== undefined) {
    // Fetch current template to get missing values
    const [current] = await db
      .select()
      .from(recurringTemplates)
      .where(eq(recurringTemplates.id, id))
      .limit(1);

    if (!current) {
      return { error: 'not_found' as const };
    }

    const newDayOfWeek = fields.dayOfWeek !== undefined ? fields.dayOfWeek : current.dayOfWeek;
    const newStartTime = fields.startTime !== undefined ? fields.startTime : current.startTime;

    // Default count to 12 for rebuilt RRULEs
    updateFields.rrule = buildRRule(newDayOfWeek, newStartTime, 12);
  }

  const [updated] = await db
    .update(recurringTemplates)
    .set(updateFields)
    .where(and(eq(recurringTemplates.id, id), eq(recurringTemplates.version, version)))
    .returning();

  // If no row was updated, determine if it's not_found or conflict
  if (!updated) {
    const [existing] = await db
      .select()
      .from(recurringTemplates)
      .where(eq(recurringTemplates.id, id))
      .limit(1);

    if (!existing) {
      return { error: 'not_found' as const };
    }
    return { error: 'conflict' as const };
  }

  // Fetch updated template with route data
  const templateWithRoute = await db.query.recurringTemplates.findFirst({
    where: eq(recurringTemplates.id, updated.id),
    with: {
      route: true,
    },
  });

  return { template: templateWithRoute };
}

export async function deleteRecurringTemplate(id: number) {
  // Check if any events reference this template
  const [referencingEvent] = await db
    .select()
    .from(events)
    .where(eq(events.recurringTemplateId, id))
    .limit(1);

  if (referencingEvent) {
    // Soft-deactivate if events reference it
    const [updated] = await db
      .update(recurringTemplates)
      .set({ isActive: false })
      .where(eq(recurringTemplates.id, id))
      .returning();

    if (!updated) {
      return { error: 'not_found' as const };
    }

    return { success: true as const };
  }

  // Hard delete if no events reference it
  const [deleted] = await db
    .delete(recurringTemplates)
    .where(eq(recurringTemplates.id, id))
    .returning();

  if (!deleted) {
    return { error: 'not_found' as const };
  }

  return { success: true as const };
}

export async function getInstancesInRange(templateId: number, rangeStart: Date, rangeEnd: Date) {
  const template = await db.query.recurringTemplates.findFirst({
    where: eq(recurringTemplates.id, templateId),
    with: {
      route: true,
    },
  });

  if (!template) {
    return [];
  }

  // Parse RRULE and generate occurrences
  const rule = RRule.fromString(template.rrule);
  const occurrences = rule.between(rangeStart, rangeEnd, true);

  // Map to virtual event objects
  return occurrences.map((date) => ({
    recurringTemplateId: template.id,
    routeId: template.routeId,
    startDateTime: date,
    endLocation: template.endLocation || null,
    notes: template.notes || null,
    route: template.route,
  }));
}

export async function getAllInstancesInRange(
  rangeStart: Date,
  rangeEnd: Date,
  filters?: { category?: string }
) {
  // Load all active templates, optionally filtered by category
  const templates = await listRecurringTemplates(filters);

  // Generate instances for each template
  const allInstances = [];
  for (const template of templates) {
    const rule = RRule.fromString(template.rrule);
    const occurrences = rule.between(rangeStart, rangeEnd, true);

    for (const date of occurrences) {
      allInstances.push({
        recurringTemplateId: template.id,
        routeId: template.routeId,
        startDateTime: date,
        endLocation: template.endLocation || null,
        notes: template.notes || null,
        route: template.route,
      });
    }
  }

  // Sort by startDateTime ascending
  allInstances.sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

  return allInstances;
}
