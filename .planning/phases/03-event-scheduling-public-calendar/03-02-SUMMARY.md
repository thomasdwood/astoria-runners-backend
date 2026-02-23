---
phase: 03-event-scheduling-public-calendar
plan: 02
subsystem: event-api
tags:
  - rest-api
  - event-management
  - recurring-templates
  - seed-data
dependency_graph:
  requires:
    - 03-01 (event service layer with business logic)
    - 02-02 (route REST endpoints pattern)
    - 01-02 (authentication middleware)
  provides:
    - REST endpoints for event CRUD
    - REST endpoints for recurring template management
    - Seed data for events and recurring templates
  affects:
    - src/app.ts (route mounting)
    - future calendar views (event data availability)
tech_stack:
  added:
    - Express routers for /api/events and /api/recurring-templates
  patterns:
    - Router-level authentication (router.use(requireAuth))
    - Optimistic locking for all updates (version field)
    - Delete-then-insert idempotent seeding pattern
    - RRULE string generation in seed script
key_files:
  created:
    - src/routes/events.ts (event CRUD endpoints)
    - src/routes/recurringTemplates.ts (recurring template management endpoints)
  modified:
    - src/app.ts (mounted new routers)
    - src/db/seed.ts (added event and recurring template seed data)
decisions:
  - Router-level auth middleware instead of app-level keeps all auth concerns in route files (consistent with routes.ts pattern)
  - Seed script builds RRULE strings directly using same helper functions as service layer (avoids service layer dependency)
  - Delete-then-insert pattern for seeding ensures idempotency while allowing data updates
  - One-off events seed data uses computed next occurrence dates (dynamic based on current date)
metrics:
  duration: 161s
  tasks_completed: 2
  files_created: 2
  files_modified: 2
  commits: 2
  completed_date: 2026-02-13
---

# Phase 3 Plan 2: Event and Recurring Template REST API Summary

**One-liner:** Authenticated REST endpoints for event CRUD and recurring template management with seed data across all run categories

## Overview

Created fully authenticated REST API endpoints for event and recurring template management, mounted them in the Express app, and added comprehensive seed data for testing. All endpoints follow established patterns (validation, error handling, optimistic locking) and require authentication.

## Tasks Completed

### Task 1: Event and Recurring Template REST Endpoints
**Status:** ✅ Complete
**Commit:** 9197674
**Files:** src/routes/events.ts, src/routes/recurringTemplates.ts, src/app.ts

Created two new router modules following the exact pattern from src/routes/routes.ts:

**src/routes/events.ts** - 5 endpoints:
- `POST /` - Create event (validates route exists, returns 422 if route_not_found)
- `GET /` - List events with optional filters (category, start date, end date)
- `GET /:id` - Get single event (handles Array.isArray id case)
- `PUT /:id` - Update event with optimistic locking (404/409/200 responses)
- `DELETE /:id` - Delete event (404 or 204)

**src/routes/recurringTemplates.ts** - 6 endpoints:
- `POST /` - Create recurring template (validates route exists, returns 422 if route_not_found)
- `GET /` - List active recurring templates with optional category filter
- `GET /:id` - Get single template
- `GET /:id/instances` - Generate virtual event instances in date range (requires start/end query params)
- `PUT /:id` - Update template with optimistic locking (404/409/200 responses)
- `DELETE /:id` - Delete/deactivate template (soft-delete if events reference it)

Both routers:
- Apply `router.use(requireAuth)` at the top (all routes require authentication)
- Import asyncHandler, requireAuth, validateBody, validateQuery
- Import validation schemas from src/validation/events.ts
- Import service layer functions (eventService, recurringService)
- Export default router

**src/app.ts** updates:
- Imported eventsRouter and recurringTemplatesRouter
- Mounted at `/api/events` and `/api/recurring-templates` with consistent comment style
- Auth handled in router (not app-level middleware)

### Task 2: Event and Recurring Template Seed Data
**Status:** ✅ Complete
**Commit:** 9c47706
**Files:** src/db/seed.ts

Updated seed script with comprehensive event and recurring template data:

**Imports added:**
- events and recurringTemplates schemas
- RRule from 'rrule' for RRULE generation
- date-fns functions (addDays, setHours, setMinutes, startOfDay)
- Additional Drizzle operators (and, isNull)

**Recurring templates (2):**
1. Monday Evening Brewery Run - ICONYC Brewing Loop, Monday 18:30, count: 12
2. Saturday Morning Weekend Run - Randalls Island Bridge Loop, Saturday 08:00, count: 8

**One-off events (3):**
1. Special Coffee Run - Kinship Coffee route, next Wednesday 18:00, notes: "Bring friends!"
2. Brunch Run Kickoff - Astoria Park to Comfortland route, next Sunday 09:30, notes: "First brunch run of the season"
3. Singlecut Brewery Run - Singlecut Beersmiths route, next Friday 18:30

**Seeding approach:**
- Look up routes by name to get IDs
- Build RRULE strings using helper functions (same logic as recurringService)
- Delete existing items with matching criteria before inserting (idempotent)
- Compute next occurrence dates dynamically using date-fns nextDay()
- Set endLocation from route data
- Clear logging for all seeded items

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification criteria passed:

1. ✅ `npx tsc --noEmit` passes with zero errors
2. ✅ src/routes/events.ts exports default router with 5 endpoints (POST, GET list, GET by id, PUT, DELETE)
3. ✅ src/routes/recurringTemplates.ts exports default router with 6 endpoints (POST, GET list, GET by id, GET instances, PUT, DELETE)
4. ✅ src/app.ts mounts /api/events and /api/recurring-templates
5. ✅ Both routers apply requireAuth middleware at router level
6. ✅ src/db/seed.ts creates 2 recurring templates and 3 one-off events
7. ✅ All event routes use optimistic locking pattern (version in body, 409 on conflict)

## Success Criteria Met

- ✅ Organizer can create, read, update, delete events via /api/events (all auth-protected)
- ✅ Organizer can create and manage recurring templates via /api/recurring-templates (all auth-protected)
- ✅ Organizer can filter events by category via query parameter
- ✅ Seed data provides realistic test data across all categories
- ✅ TypeScript compilation passes with zero errors

## Technical Notes

**Pattern consistency:**
- Both routers follow the exact same pattern as src/routes/routes.ts
- Router-level `requireAuth` instead of app-level middleware
- Array.isArray check for req.params.id (handles edge case)
- Optimistic locking with version field (409 conflict responses)
- Error handling with discriminated unions (result.error checks)
- Validation with Zod schemas (422 validation errors)

**Seed script design:**
- RRULE generation logic duplicated from recurringService (seed runs against raw DB, not service layer)
- Delete-then-insert pattern ensures idempotency
- Dynamic date computation (next occurrence) instead of hardcoded dates
- Route lookup by name ensures resilience to ID changes

**Instance generation endpoint:**
- GET /:id/instances calls recurringService.getInstancesInRange()
- Generates virtual event instances on-the-fly (not materialized in DB)
- Returns array of instance objects with route data included

## Self-Check: PASSED

**Files created:**
- ✅ FOUND: src/routes/events.ts
- ✅ FOUND: src/routes/recurringTemplates.ts

**Files modified:**
- ✅ FOUND: src/app.ts (mounts both routers)
- ✅ FOUND: src/db/seed.ts (event and recurring template seed data)

**Commits:**
- ✅ FOUND: 9197674 (Task 1 - REST endpoints)
- ✅ FOUND: 9c47706 (Task 2 - seed data)
