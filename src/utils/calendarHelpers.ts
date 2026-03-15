import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  getDay,
} from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Formatted calendar event for public display
 */
export interface CalendarEvent {
  id: number | null; // null for virtual recurring instances
  title: string; // route name
  category: string; // route category name (display string)
  categoryColor: string; // category color key for CATEGORY_COLOR_MAP
  categoryIcon: string; // category emoji icon
  routeId: number; // route ID — needed for creating cancellation/exception events
  startDateTime: string; // ISO 8601 string
  displayDate: string; // "Mon, Feb 17, 2026"
  displayTime: string; // "6:30 PM"
  startLocation: string | null;
  endLocation: string | null;
  notes: string | null;
  isRecurring: boolean; // true if from recurring template
  recurringTemplateId: number | null;
  isCancelled: boolean; // true for materialized events marked as cancelled
  hostName: string | null;
  meetupUrl: string | null;
  stravaUrl: string | null;
  distance: number | null;
}

/**
 * Single day in the calendar grid
 */
export interface MonthDay {
  date: string; // "2026-02-17"
  dayOfMonth: number; // 17
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

/**
 * Complete month grid with weeks
 */
export interface MonthGrid {
  year: number;
  month: number;
  monthName: string; // "February 2026"
  weeks: MonthDay[][]; // Array of 5-6 weeks, each week is 7 days
}

/**
 * Format event data for calendar display
 * Accepts both DB events and virtual recurring instances
 */
export function formatEventForCalendar(
  event: any,
  timezone: string = 'America/New_York'
): CalendarEvent {
  const startDateTime = new Date(event.startDateTime);

  const cat = event.route?.category ?? null;
  return {
    id: event.id || null,
    title: event.route.name,
    category: cat?.name ?? 'Uncategorized',
    categoryColor: cat?.color ?? 'slate',
    categoryIcon: cat?.icon ?? '',
    routeId: event.routeId,
    startDateTime: startDateTime.toISOString(),
    displayDate: format(startDateTime, 'EEE, MMM d, yyyy'),
    displayTime: format(startDateTime, 'h:mm a'),
    startLocation: event.startLocation || null,
    endLocation: event.endLocation || null,
    notes: event.notes || null,
    isRecurring: !!event.recurringTemplateId,
    recurringTemplateId: event.recurringTemplateId || null,
    isCancelled: event.isCancelled === true,
    hostName: event.host?.name ?? null,
    meetupUrl: event.meetupUrl ?? null,
    stravaUrl: event.route?.stravaUrl ?? null,
    distance: event.route?.distance != null ? Number(event.route.distance) : null,
  };
}

/**
 * Build month grid with weeks and days
 * Groups events by day and organizes days into weeks
 */
export function buildMonthGrid(
  year: number,
  month: number,
  events: CalendarEvent[]
): MonthGrid {
  // month is 1-indexed (1=January), Date constructor expects 0-indexed
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);

  // Extend to full weeks (Sunday to Saturday)
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  // Generate all days in the calendar range
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const today = new Date();

  // Build MonthDay objects
  const monthDays: MonthDay[] = allDays.map((date) => {
    const dayEvents = events.filter((event) => {
      const eventDate = new Date(event.startDateTime);
      return isSameDay(eventDate, date);
    });

    return {
      date: format(date, 'yyyy-MM-dd'),
      dayOfMonth: date.getDate(),
      isCurrentMonth: isSameMonth(date, monthStart),
      isToday: isSameDay(date, today),
      events: dayEvents,
    };
  });

  // Group days into weeks (arrays of 7)
  const weeks: MonthDay[][] = [];
  for (let i = 0; i < monthDays.length; i += 7) {
    weeks.push(monthDays.slice(i, i + 7));
  }

  return {
    year,
    month,
    monthName: format(monthStart, 'MMMM yyyy'),
    weeks,
  };
}

/**
 * Merge and deduplicate events from DB and recurring instances
 * Priority: DB events override virtual recurring instances on the same date
 */
export function mergeAndSortEvents(
  dbEvents: any[],
  recurringInstances: any[]
): any[] {
  // Build set of dates with DB events that have recurringTemplateId
  // These are materialized instances that override virtual ones
  const dbEventDates = new Map<string, Set<number>>();

  for (const event of dbEvents) {
    if (event.recurringTemplateId) {
      const dateKey = format(new Date(event.startDateTime), 'yyyy-MM-dd');
      if (!dbEventDates.has(dateKey)) {
        dbEventDates.set(dateKey, new Set());
      }
      dbEventDates.get(dateKey)!.add(event.recurringTemplateId);
    }
  }

  // Filter out virtual instances that have been materialized as DB events
  const filteredRecurringInstances = recurringInstances.filter((instance) => {
    const dateKey = format(new Date(instance.startDateTime), 'yyyy-MM-dd');
    const templateId = instance.recurringTemplateId;

    // Keep the instance if there's no DB event for this template+date combo
    return !dbEventDates.get(dateKey)?.has(templateId);
  });

  // Combine all events
  const allEvents = [...dbEvents, ...filteredRecurringInstances];

  // Sort by startDateTime ascending
  allEvents.sort((a, b) => {
    const aTime = new Date(a.startDateTime).getTime();
    const bTime = new Date(b.startDateTime).getTime();
    return aTime - bTime;
  });

  return allEvents;
}
