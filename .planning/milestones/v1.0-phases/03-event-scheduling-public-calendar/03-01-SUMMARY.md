---
phase: 03-event-scheduling-public-calendar
plan: 01
subsystem: event-data-model
tags: [schema, service-layer, recurring-events, rrule]
dependency_graph:
  requires:
    - 02-01 (routes schema and service)
  provides:
    - event schema with route FK
    - recurring template schema with RRULE generation
    - event CRUD service with route JOIN
    - recurring instance generation service
  affects:
    - 03-02 (event REST endpoints will consume these services)
    - 03-03 (calendar view will use getAllInstancesInRange)
tech_stack:
  added:
    - rrule: "^2.8.1"
    - date-fns: "^4.1.0"
    - date-fns-tz: "^3.2.0"
  patterns:
    - RRULE-based recurring event templates
    - On-the-fly instance generation (no materialized events for recurring patterns)
    - Soft-deactivate vs hard-delete based on event references
key_files:
  created:
    - src/db/schema/events.ts
    - src/db/schema/recurringTemplates.ts
    - src/validation/events.ts
    - src/services/eventService.ts
    - src/services/recurringService.ts
  modified:
    - src/db/schema/index.ts
    - package.json
    - package-lock.json
key_decisions:
  - Used timestamptz for startDateTime to store UTC dates
  - Day of week stored as integer (0=Sunday, 6=Saturday) for quick queries
  - Start time stored as varchar HH:MM (e.g., "18:30") for simplicity
  - RRULE string generated and stored using rrule.js library
  - Virtual event instances generated on-the-fly from RRULE (not materialized in DB)
  - Recurring templates soft-deleted (isActive=false) if events reference them, hard-deleted otherwise
  - Optimistic locking on both events and recurring templates using version field
  - Default count of 12 weeks for recurring template instance generation
metrics:
  duration: 2 min
  tasks_completed: 2
  files_created: 5
  files_modified: 3
  commits: 2
  completed: 2026-02-14
---

# Phase 03 Plan 01: Event and Recurring Template Data Model Summary

**One-liner:** Event schema with route FK and recurring template RRULE generation using rrule.js for on-the-fly instance creation.

## What Was Built

Created the foundational data model and service layer for events and recurring event templates:

1. **Event Schema** (`events` table):
   - One-off and materialized recurring events
   - Foreign keys to routes (required) and recurring_templates (optional)
   - timestamptz for startDateTime (UTC storage)
   - Optimistic locking with version field

2. **Recurring Template Schema** (`recurring_templates` table):
   - Stores RRULE patterns for weekly recurring events
   - dayOfWeek (0-6) and startTime (HH:MM) for quick filtering
   - Foreign key to routes
   - isActive flag for soft-delete support

3. **Zod Validation Schemas**:
   - createEventSchema, updateEventSchema
   - createRecurringTemplateSchema, updateRecurringTemplateSchema
   - calendarQuerySchema, listEventsQuerySchema
   - All validation follows established patterns from routes.ts

4. **Event Service Layer**:
   - Full CRUD with route JOIN support
   - Optimistic locking in updateEvent (version in WHERE clause)
   - Category filtering via explicit JOIN on routes table
   - Discriminated union error handling (route_not_found, not_found, conflict)

5. **Recurring Service Layer**:
   - RRULE generation using rrule.js library
   - On-the-fly instance generation with `getInstancesInRange()`
   - Combined instance retrieval with `getAllInstancesInRange()`
   - Smart deletion: soft-deactivate if events reference template, hard-delete otherwise
   - RRULE rebuilding on dayOfWeek or startTime update

## Deviations from Plan

None - plan executed exactly as written.

## Technical Implementation Notes

**RRULE Generation Strategy:**
- Template stores dayOfWeek (0-6) + startTime (HH:MM) for UI display
- RRULE string generated using `RRule.fromString()` and stored in rrule column
- dtstart computed by finding next occurrence of target dayOfWeek from today
- Default count of 12 weeks ensures reasonable instance generation range

**Date Handling:**
- Used date-fns `addDays`, `setHours`, `setMinutes`, `startOfDay` for date calculations
- Avoided `nextDay()` which requires Day enum type (incompatible with numeric dayOfWeek)
- All dates stored as timestamptz (UTC) in database

**Virtual Event Instances:**
- Recurring templates generate "virtual events" on-the-fly using RRULE.between()
- Virtual events have same shape as materialized events (routeId, startDateTime, endLocation, notes, route)
- No materialized recurring_instance table (reduces data model complexity)

**Service Layer Patterns:**
- Followed routeService.ts conventions exactly
- Optimistic locking with version in WHERE clause
- Discriminated union return types: `{ event } | { error: 'not_found' | 'conflict' }`
- Explicit JOIN for category filtering (relational queries don't support filtering on joined columns)
- Type assertion `as any` safe because Zod validates enum at handler level

## Verification Results

All verifications passed:

1. TypeScript compilation: PASSED (npx tsc --noEmit)
2. Dependencies installed: PASSED (rrule, date-fns, date-fns-tz in package.json)
3. Schema barrel exports: PASSED (events and recurringTemplates exported from index.ts)
4. Foreign key references: PASSED (both tables reference routes.id)
5. Optimistic locking: PASSED (version in WHERE clause for updates)
6. Service exports: PASSED (all required functions exported)

## Self-Check: PASSED

**Files created:**
- FOUND: src/db/schema/events.ts
- FOUND: src/db/schema/recurringTemplates.ts
- FOUND: src/validation/events.ts
- FOUND: src/services/eventService.ts
- FOUND: src/services/recurringService.ts

**Commits:**
- FOUND: 46fa626 (Task 1: schema and validation)
- FOUND: e51a415 (Task 2: service layer)

## Task Breakdown

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Event and recurring template schema with Zod validation | 46fa626 | events.ts, recurringTemplates.ts, events validation, index.ts, package.json |
| 2 | Event and recurring template service layer | e51a415 | eventService.ts, recurringService.ts |

## Next Steps

Ready for **03-02: Event REST Endpoints** which will:
- Create POST /api/events (create one-off events)
- Create POST /api/recurring-templates (create recurring patterns)
- Create GET /api/events (list events with date range and category filters)
- Create GET /api/recurring-templates/:id/instances (generate virtual instances)
- Consume eventService and recurringService from this plan
