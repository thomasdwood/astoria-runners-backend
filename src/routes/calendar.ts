import { Router } from 'express';
import { startOfMonth, endOfMonth, addMonths, addDays, format } from 'date-fns';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateQuery } from '../middleware/validate.js';
import { calendarQuerySchema } from '../validation/events.js';
import * as eventService from '../services/eventService.js';
import * as recurringService from '../services/recurringService.js';
import {
  formatEventForCalendar,
  buildMonthGrid,
  mergeAndSortEvents,
  type CalendarEvent,
} from '../utils/calendarHelpers.js';

const router = Router();

/**
 * GET /calendar
 * Public calendar endpoint - NO authentication required
 * Supports both month and list views with optional categoryId filtering
 *
 * Query parameters:
 * - view: 'month' | 'list' (default: 'month')
 * - year: number (default: current year)
 * - month: number 1-12 (default: current month)
 * - start: ISO 8601 date string (for list view)
 * - end: ISO 8601 date string (for list view)
 * - categoryId: category ID filter (optional)
 */
router.get(
  '/',
  validateQuery(calendarQuerySchema),
  asyncHandler(async (req, res) => {
    const raw = req.query as Record<string, any>;
    const query = {
      view: raw.view as 'month' | 'list' | undefined,
      year: raw.year ? Number(raw.year) : undefined,
      month: raw.month ? Number(raw.month) : undefined,
      start: raw.start as string | undefined,
      end: raw.end as string | undefined,
      categoryId: raw.categoryId ? Number(raw.categoryId) : undefined,
    };

    // Default to month view
    const view = query.view || 'month';

    if (view === 'month') {
      // Month view: show calendar grid for specified month
      const now = new Date();
      const year = query.year || now.getFullYear();
      const month = query.month || now.getMonth() + 1; // month is 1-indexed in query

      // Validate year/month combination
      if (month < 1 || month > 12) {
        res.status(400).json({
          error: 'Invalid month',
          message: 'Month must be between 1 and 12',
        });
        return;
      }

      // Compute date range for the month
      const monthStart = startOfMonth(new Date(year, month - 1, 1));
      const monthEnd = endOfMonth(monthStart);

      // Fetch one-off events in range (including cancelled for display)
      const dbEvents = await eventService.listEvents({
        start: monthStart,
        end: monthEnd,
        categoryId: query.categoryId,
      });

      // Fetch recurring instances in range
      const recurringInstances = await recurringService.getAllInstancesInRange(
        monthStart,
        monthEnd,
        query.categoryId ? { categoryId: query.categoryId } : undefined
      );

      // Merge and deduplicate (cancelled DB events override virtual instances)
      const mergedEvents = mergeAndSortEvents(dbEvents, recurringInstances);

      // Format all events for calendar display
      const calendarEvents: CalendarEvent[] = mergedEvents.map((event) =>
        formatEventForCalendar(event)
      );

      // Build month grid
      const grid = buildMonthGrid(year, month, calendarEvents);

      // Calculate prev/next month navigation
      const prevMonth = addMonths(monthStart, -1);
      const nextMonth = addMonths(monthStart, 1);

      res.status(200).json({
        view: 'month',
        grid,
        events: calendarEvents,
        navigation: {
          prev: {
            year: prevMonth.getFullYear(),
            month: prevMonth.getMonth() + 1,
          },
          next: {
            year: nextMonth.getFullYear(),
            month: nextMonth.getMonth() + 1,
          },
        },
      });
    } else if (view === 'list') {
      // List view: chronological list of events
      const now = new Date();

      // Default range: today to 30 days from now
      const rangeStart = query.start ? new Date(query.start) : now;
      const rangeEnd = query.end ? new Date(query.end) : addDays(now, 30);

      // Fetch one-off events in range (including cancelled for display)
      const dbEvents = await eventService.listEvents({
        start: rangeStart,
        end: rangeEnd,
        categoryId: query.categoryId,
      });

      // Fetch recurring instances in range
      const recurringInstances = await recurringService.getAllInstancesInRange(
        rangeStart,
        rangeEnd,
        query.categoryId ? { categoryId: query.categoryId } : undefined
      );

      // Merge and deduplicate (cancelled DB events override virtual instances)
      const mergedEvents = mergeAndSortEvents(dbEvents, recurringInstances);

      // Format all events for calendar display
      const calendarEvents: CalendarEvent[] = mergedEvents.map((event) =>
        formatEventForCalendar(event)
      );

      // Group events by date
      const groupedByDate: Record<string, CalendarEvent[]> = {};
      for (const event of calendarEvents) {
        const dateKey = event.startDateTime.split('T')[0]; // Extract YYYY-MM-DD
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = [];
        }
        groupedByDate[dateKey].push(event);
      }

      res.status(200).json({
        view: 'list',
        events: calendarEvents,
        groupedByDate,
        dateRange: {
          start: rangeStart.toISOString(),
          end: rangeEnd.toISOString(),
        },
      });
    } else {
      // Should never reach here due to Zod validation
      res.status(400).json({
        error: 'Invalid view',
        message: 'View must be either "month" or "list"',
      });
    }
  })
);

export default router;
