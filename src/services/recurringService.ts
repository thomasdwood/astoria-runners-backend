import { eq, and, sql } from 'drizzle-orm';
import rrulePkg from 'rrule';
const { RRule } = rrulePkg;
import { addDays, setHours, setMinutes, startOfMonth, format } from 'date-fns';
import { db } from '../config/database.js';
import { recurringTemplates } from '../db/schema/recurringTemplates.js';
import { routes } from '../db/schema/routes.js';
import { events } from '../db/schema/events.js';
import type { CreateRecurringTemplateInput, UpdateRecurringTemplateInput } from '../validation/events.js';
import { notifyRecurringCreated, notifyRecurringDeleted } from './discordService.js';

// Local constants for natural language formatting
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORDINALS: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', [-1]: 'last' };

// Pattern object for recurrence rules
export interface RecurrencePattern {
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek: number;       // 0=Sun through 6=Sat
  bySetPos?: number;       // 1-4 or -1 (last), only for monthly
  startTime: string;       // HH:MM
  endDate?: Date;          // optional until date
}

// Helper: Map JavaScript day of week (0=Sunday) to RRule weekday constants
function dayOfWeekToRRuleDay(day: number) {
  const daysMap = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];
  return daysMap[day];
}

// Helper: Compute dtstart for RRULE - use start of current month so
// current month's instances are included (e.g., "last Thursday" this month)
function computeDtstart(dayOfWeek: number, startTime: string): Date {
  const [hours, minutes] = startTime.split(':').map(Number);
  let dtstart = startOfMonth(new Date());
  dtstart = setHours(dtstart, hours);
  dtstart = setMinutes(dtstart, minutes);
  return dtstart;
}

// Helper: Build RRULE string from a RecurrencePattern object
// NEVER includes count - use .between() for generation
export function buildRRule(pattern: RecurrencePattern): string {
  const dtstart = computeDtstart(pattern.dayOfWeek, pattern.startTime);
  const day = dayOfWeekToRRuleDay(pattern.dayOfWeek);

  let options: ConstructorParameters<typeof RRule>[0];

  if (pattern.frequency === 'weekly') {
    options = {
      freq: RRule.WEEKLY,
      byweekday: [day],
      dtstart,
    };
  } else if (pattern.frequency === 'biweekly') {
    options = {
      freq: RRule.WEEKLY,
      interval: 2,
      byweekday: [day],
      dtstart,
    };
  } else {
    // monthly
    options = {
      freq: RRule.MONTHLY,
      byweekday: [day],
      bysetpos: [pattern.bySetPos!],
      dtstart,
    };
  }

  if (pattern.endDate) {
    options.until = pattern.endDate;
  }

  return new RRule(options).toString();
}

// Helper: Produce natural language description of a recurrence pattern
export function formatRecurrenceText(pattern: RecurrencePattern): string {
  const dayName = DAY_NAMES[pattern.dayOfWeek];

  if (pattern.frequency === 'weekly') {
    return `Every ${dayName}`;
  } else if (pattern.frequency === 'biweekly') {
    return `Every other ${dayName}`;
  } else {
    // monthly
    const ordinal = ORDINALS[pattern.bySetPos!] || `${pattern.bySetPos}th`;
    return `Every ${ordinal} ${dayName} of the month`;
  }
}

// Helper: Preview recurrence with natural language text and next 3 upcoming dates
export function getRecurrencePreview(pattern: RecurrencePattern): { text: string; nextDates: string[] } {
  const text = formatRecurrenceText(pattern);
  const rruleString = buildRRule(pattern);
  const rule = RRule.fromString(rruleString);

  const now = new Date();
  const ninetyDaysFromNow = addDays(now, 90);

  const nextDates = rule
    .between(now, ninetyDaysFromNow, true)
    .slice(0, 3)
    .map((d) => d.toISOString());

  return { text, nextDates };
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

  // Build RRULE string using pattern-based approach (no count)
  const pattern: RecurrencePattern = {
    frequency: data.frequency || 'weekly',
    dayOfWeek: data.dayOfWeek,
    bySetPos: data.bySetPos ?? undefined,
    startTime: data.startTime,
    endDate: data.endDate ? new Date(data.endDate) : undefined,
  };
  const rruleString = buildRRule(pattern);

  const [created] = await db
    .insert(recurringTemplates)
    .values({
      routeId: data.routeId,
      rrule: rruleString,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      frequency: data.frequency || 'weekly',
      interval: data.interval || 1,
      bySetPos: data.bySetPos ?? null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      startLocation: data.startLocation,
      endLocation: data.endLocation,
      notes: data.notes,
    })
    .returning();

  // Fetch with route and category data using relational query
  const templateWithRoute = await db.query.recurringTemplates.findFirst({
    where: eq(recurringTemplates.id, created.id),
    with: {
      route: {
        with: { category: true },
      },
    },
  });

  // Fire and forget - don't block response on webhook
  if (templateWithRoute) {
    notifyRecurringCreated(templateWithRoute as any).catch(err => {
      console.error('Discord notification failed (recurring create):', err);
    });
  }

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

export async function listRecurringTemplates(filters?: { categoryId?: number }) {
  const results = await db.query.recurringTemplates.findMany({
    where: eq(recurringTemplates.isActive, true),
    with: {
      route: {
        with: { category: true },
      },
    },
    orderBy: (recurringTemplates, { asc }) => [
      asc(recurringTemplates.dayOfWeek),
      asc(recurringTemplates.startTime),
    ],
  });

  // Filter by categoryId in JS if requested (route.categoryId FK join)
  if (filters?.categoryId !== undefined) {
    return results.filter((t) => t.route?.categoryId === filters.categoryId);
  }

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
  if (fields.frequency !== undefined) {
    updateFields.frequency = fields.frequency;
  }
  if (fields.interval !== undefined) {
    updateFields.interval = fields.interval;
  }
  if (fields.bySetPos !== undefined) {
    updateFields.bySetPos = fields.bySetPos;
  }
  if (fields.endDate !== undefined) {
    updateFields.endDate = fields.endDate ? new Date(fields.endDate) : null;
  }
  if (fields.startLocation !== undefined) {
    updateFields.startLocation = fields.startLocation;
  }
  if (fields.endLocation !== undefined) {
    updateFields.endLocation = fields.endLocation;
  }
  if (fields.notes !== undefined) {
    updateFields.notes = fields.notes;
  }

  // Rebuild RRULE if any recurrence-affecting fields changed
  const rruleFieldChanged =
    fields.dayOfWeek !== undefined ||
    fields.startTime !== undefined ||
    fields.frequency !== undefined ||
    fields.interval !== undefined ||
    fields.bySetPos !== undefined ||
    fields.endDate !== undefined;

  if (rruleFieldChanged) {
    // Fetch current template to fill missing values
    const [current] = await db
      .select()
      .from(recurringTemplates)
      .where(eq(recurringTemplates.id, id))
      .limit(1);

    if (!current) {
      return { error: 'not_found' as const };
    }

    const newFrequency = (fields.frequency !== undefined ? fields.frequency : current.frequency) as 'weekly' | 'biweekly' | 'monthly';
    const newDayOfWeek = fields.dayOfWeek !== undefined ? fields.dayOfWeek : current.dayOfWeek;
    const newStartTime = fields.startTime !== undefined ? fields.startTime : current.startTime;
    const newBySetPos = fields.bySetPos !== undefined ? (fields.bySetPos ?? undefined) : (current.bySetPos ?? undefined);
    const newEndDate = fields.endDate !== undefined
      ? (fields.endDate ? new Date(fields.endDate) : undefined)
      : (current.endDate ? new Date(current.endDate) : undefined);

    const pattern: RecurrencePattern = {
      frequency: newFrequency,
      dayOfWeek: newDayOfWeek,
      bySetPos: newBySetPos,
      startTime: newStartTime,
      endDate: newEndDate,
    };

    updateFields.rrule = buildRRule(pattern);
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

export async function excludeDateFromTemplate(templateId: number, date: string) {
  // date should be in ISO date format (YYYY-MM-DD)
  const [template] = await db
    .select()
    .from(recurringTemplates)
    .where(eq(recurringTemplates.id, templateId))
    .limit(1);

  if (!template) {
    return { error: 'not_found' as const };
  }

  // Parse existing excluded dates
  let excludedList: string[] = [];
  if (template.excludedDates) {
    try {
      excludedList = JSON.parse(template.excludedDates) as string[];
    } catch {
      excludedList = [];
    }
  }

  // Add date if not already excluded
  if (!excludedList.includes(date)) {
    excludedList.push(date);
  }

  const [updated] = await db
    .update(recurringTemplates)
    .set({ excludedDates: JSON.stringify(excludedList), updatedAt: sql`NOW()` })
    .where(eq(recurringTemplates.id, templateId))
    .returning();

  if (!updated) {
    return { error: 'not_found' as const };
  }

  return { success: true as const };
}

export async function deleteRecurringTemplate(id: number) {
  // Fetch template with route and category before deletion (needed for Discord notification)
  const templateWithRoute = await db.query.recurringTemplates.findFirst({
    where: eq(recurringTemplates.id, id),
    with: {
      route: {
        with: { category: true },
      },
    },
  });

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

    // Fire and forget - notify Discord about cancellation
    if (templateWithRoute) {
      notifyRecurringDeleted(templateWithRoute as any).catch(err => {
        console.error('Discord notification failed (recurring delete):', err);
      });
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

  // Fire and forget - notify Discord about cancellation
  if (templateWithRoute) {
    notifyRecurringDeleted(templateWithRoute as any).catch(err => {
      console.error('Discord notification failed (recurring delete):', err);
    });
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

  // Parse excluded dates for filtering
  let excludedDateStrings: Set<string> = new Set();
  if (template.excludedDates) {
    try {
      const parsed = JSON.parse(template.excludedDates) as string[];
      excludedDateStrings = new Set(parsed);
    } catch {
      // Invalid JSON - ignore excluded dates
    }
  }

  // Parse RRULE and generate occurrences
  const rule = RRule.fromString(template.rrule);
  const occurrences = rule.between(rangeStart, rangeEnd, true);

  // Filter out excluded dates and map to virtual event objects
  return occurrences
    .filter((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return !excludedDateStrings.has(dateStr);
    })
    .map((date) => ({
      recurringTemplateId: template.id,
      routeId: template.routeId,
      startDateTime: date,
      startLocation: template.startLocation || null,
      endLocation: template.endLocation || null,
      notes: template.notes || null,
      route: template.route,
    }));
}

export async function getAllInstancesInRange(
  rangeStart: Date,
  rangeEnd: Date,
  filters?: { categoryId?: number }
) {
  // Load all active templates, optionally filtered by category
  const templates = await listRecurringTemplates(filters);

  // Generate instances for each template
  const allInstances = [];
  for (const template of templates) {
    // Parse excluded dates for filtering
    let excludedDateStrings: Set<string> = new Set();
    if (template.excludedDates) {
      try {
        const parsed = JSON.parse(template.excludedDates) as string[];
        excludedDateStrings = new Set(parsed);
      } catch {
        // Invalid JSON - ignore excluded dates
      }
    }

    const rule = RRule.fromString(template.rrule);
    const occurrences = rule.between(rangeStart, rangeEnd, true);

    for (const date of occurrences) {
      // Skip excluded (deleted) dates
      const dateStr = format(date, 'yyyy-MM-dd');
      if (excludedDateStrings.has(dateStr)) {
        continue;
      }

      allInstances.push({
        recurringTemplateId: template.id,
        routeId: template.routeId,
        startDateTime: date,
        startLocation: template.startLocation || null,
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
