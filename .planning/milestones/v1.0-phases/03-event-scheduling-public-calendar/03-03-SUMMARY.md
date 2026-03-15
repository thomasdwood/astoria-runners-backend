---
phase: 03-event-scheduling-public-calendar
plan: 03
subsystem: public-calendar-views
tags: [calendar, public-api, date-formatting, grid-builder]
dependency_graph:
  requires:
    - 03-01 (event and recurring template services)
    - 02-01 (route schema and service)
  provides:
    - public calendar month view endpoint
    - public calendar list view endpoint
    - calendar helper utilities for event formatting and grid construction
  affects:
    - frontend calendar UI (will consume these endpoints)
tech_stack:
  added: []
  patterns:
    - Month grid construction with week/day grouping
    - Event deduplication (DB events override virtual recurring instances)
    - Chronological event grouping by date
    - Public access (no authentication middleware)
key_files:
  created:
    - src/utils/calendarHelpers.ts
  modified:
    - src/routes/calendar.ts
key_decisions:
  - Month grid extends to full weeks (Sunday-Saturday) for calendar UI rendering
  - DB events override virtual recurring instances on same date (materialized events take precedence)
  - Default month view to current year/month if not specified
  - Default list view to 30-day range from today
  - Category filter works across both month and list views
  - Navigation links (prev/next month) included in month view response
  - Events grouped by date in list view for easier frontend rendering
metrics:
  duration: 2 min
  tasks_completed: 2
  files_created: 1
  files_modified: 1
  commits: 2
  completed: 2026-02-14
---

# Phase 03 Plan 03: Public Calendar Views (Month and List) Summary

**One-liner:** Public calendar endpoints with month grid and chronological list views merging one-off and recurring events with category filtering.

## What Was Built

Implemented the public-facing calendar endpoints that replace the placeholder with real calendar views:

1. **Calendar Helper Utilities** (`src/utils/calendarHelpers.ts`):
   - `formatEventForCalendar`: Formats events with display-friendly date/time strings
   - `buildMonthGrid`: Constructs month calendar grid with weeks and days
   - `mergeAndSortEvents`: Deduplicates DB events and virtual recurring instances
   - Types: CalendarEvent, MonthDay, MonthGrid for type-safe calendar data

2. **Public Calendar Endpoints** (`src/routes/calendar.ts`):
   - **Month View** (`GET /calendar?view=month`):
     - Returns grid structure with weeks (arrays of 7 days)
     - Each day includes events that occur on that date
     - Extends to full weeks (startOfWeek to endOfWeek)
     - Includes prev/next month navigation links
     - Supports year/month parameters (defaults to current)
   - **List View** (`GET /calendar?view=list`):
     - Returns chronologically sorted events
     - Groups events by date for easier rendering
     - Supports start/end date range (defaults to today + 30 days)
   - **Both Views**:
     - Merge one-off events with recurring template instances
     - Support optional category filtering
     - No authentication required (public access)
     - Each event includes: date, time, route name, category, location, notes

## Deviations from Plan

None - plan executed exactly as written.

## Technical Implementation Notes

**Month Grid Construction:**
- Uses date-fns `startOfMonth`, `endOfMonth`, `startOfWeek`, `endOfWeek` for range calculation
- Extends calendar to full weeks (Sunday-Saturday) for UI grid rendering
- Groups days into weeks using array slicing (7 days per week)
- Each day includes `isCurrentMonth` and `isToday` flags for styling

**Event Deduplication Strategy:**
- DB events that have `recurringTemplateId` take precedence over virtual instances
- Build map of `dateKey -> Set<templateId>` for DB events
- Filter virtual instances that match this map
- This allows organizers to create "override" events for specific dates

**Date/Time Formatting:**
- `displayDate`: "Mon, Feb 17, 2026" (format: 'EEE, MMM d, yyyy')
- `displayTime`: "6:30 PM" (format: 'h:mm a')
- `startDateTime`: ISO 8601 string for machine parsing
- Timezone support via date-fns-tz (default: 'America/New_York')

**Category Filtering:**
- Passed through to both eventService.listEvents and recurringService.getAllInstancesInRange
- Works consistently across month and list views
- Optional parameter (returns all events if omitted)

**Navigation and Defaults:**
- Month view: defaults to current year/month, includes prev/next navigation
- List view: defaults to 30-day range from today
- Invalid month (< 1 or > 12) returns 400 error

## Verification Results

All verifications passed:

1. TypeScript compilation: PASSED (npx tsc --noEmit)
2. Both month and list views implemented: CONFIRMED
3. No auth middleware imported: CONFIRMED (public access preserved)
4. Category filtering supported: CONFIRMED
5. Event data includes date, time, route name, category: CONFIRMED
6. Month grid structure with weeks/days: CONFIRMED
7. List view groups events by date: CONFIRMED

## Self-Check: PASSED

**Files created:**
- FOUND: src/utils/calendarHelpers.ts

**Files modified:**
- FOUND: src/routes/calendar.ts

**Commits:**
- FOUND: d423f2d (Task 1: calendar helpers)
- FOUND: 5a74dc9 (Task 2: calendar endpoints)

## Task Breakdown

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Calendar helper utilities | d423f2d | calendarHelpers.ts |
| 2 | Public calendar endpoints (month and list views) | 5a74dc9 | calendar.ts |

## Next Steps

Ready for **Phase 4: Event Registration and Notifications** which will:
- Implement event registration endpoints for runners to sign up
- Create notification system for event reminders and updates
- Build email templates for confirmation and reminder messages
- Integrate with email service provider (SendGrid/Resend/Mailgun)

**Testing Note:** Runtime verification deferred until Docker environment available. Endpoints require:
- Database with seeded events and recurring templates
- Running Express server
- HTTP client (curl/Postman) for testing both month and list views
- Category filtering verification with real data
