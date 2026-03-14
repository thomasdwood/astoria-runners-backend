---
phase: 05-hosts-meetup-workflow-calendar-polish
plan: "02"
subsystem: backend-api
tags: [hosts, meetup-url, calendar-pipeline, cancel-restore, frontend-types]
dependency_graph:
  requires: [05-01]
  provides: [hosts-api, meetup-url-endpoint, cancel-restore-endpoints, calendar-host-fields, frontend-host-types]
  affects: [05-03, 05-04]
tech_stack:
  added: []
  patterns: [FK-cascade-delete, bypass-version-increment, virtual-instance-host-propagation]
key_files:
  created:
    - src/validation/hosts.ts
    - src/services/hostsService.ts
    - src/routes/hosts.ts
  modified:
    - src/app.ts
    - src/validation/events.ts
    - src/services/eventService.ts
    - src/services/recurringService.ts
    - src/routes/events.ts
    - src/utils/calendarHelpers.ts
    - client/src/types/index.ts
    - client/src/hooks/use-events.ts
    - client/src/pages/admin/events-page.tsx
    - src/db/seed.ts
decisions:
  - "hostsService.deleteHost allows deletion without blocking — FK ON DELETE SET NULL cascades to events and recurring_templates automatically"
  - "useUpdateMeetupStatus renamed to useUpdateMeetupUrl; endpoint changed from /meetup-status to /meetup-url for consistency with new API design"
  - "cancel/restore endpoints bypass version increment (metadata pattern, same as meetupUrl updates)"
  - "Virtual recurring instances now carry host from template via host: true in listRecurringTemplates and getAllInstancesInRange queries"
  - "meetup_description_template setting seeded directly via Docker psql due to pre-existing categories unique constraint issue in seed script"
metrics:
  duration: 6 min
  completed: "2026-03-14"
  tasks: 2
  files_modified: 13
---

# Phase 5 Plan 02: Backend Services, Routes, and Frontend Types Summary

Hosts CRUD API, meetup-url endpoint (replacing meetup-status), cancel/restore endpoints, CalendarEvent pipeline enriched with hostName/meetupUrl/stravaUrl, and frontend type system updated for Phase 5 features.

## What Was Built

### Task 1: Hosts service, validation, routes, and app wiring

- **src/validation/hosts.ts** — `createHostSchema` and `updateHostSchema` with name (required), email (optional, validated), userId (optional FK)
- **src/services/hostsService.ts** — `listHosts`, `getHostById`, `createHost`, `updateHost`, `deleteHost` — mirrors categoryService pattern; deletion allows FK cascade to set null on events/recurring_templates
- **src/routes/hosts.ts** — `GET /` (public), `POST /` (auth), `PUT /:id` (auth), `DELETE /:id` (auth)
- **src/app.ts** — registered `/api/hosts` route after categoriesRouter
- **src/validation/events.ts** — added `hostId: z.number().int().nullable().optional()` to both `createRecurringTemplateSchema` and `updateRecurringTemplateSchema`
- **src/services/recurringService.ts** — `hostId` now included in create values and updateFields for recurring templates

### Task 2: Event service/route updates, calendar pipeline, frontend types

- **src/services/eventService.ts** — renamed `updateMeetupStatus` to `updateMeetupUrl`; same bypass-version pattern
- **src/validation/events.ts** — renamed `updateMeetupStatusSchema` to `updateMeetupUrlSchema`
- **src/routes/events.ts** — removed `PATCH /:id/meetup-status`; added `PATCH /:id/meetup-url` (auth, validates URL), `PATCH /:id/cancel` (auth, sets isCancelled=true), `PATCH /:id/restore` (auth, sets isCancelled=false) — all placed before generic `/:id` routes
- **src/services/recurringService.ts** — added `host: true` to template queries in `listRecurringTemplates` and `getInstancesInRange`; virtual instances now carry `host: template.host ?? null`
- **src/utils/calendarHelpers.ts** — `CalendarEvent` interface gains `hostName`, `meetupUrl`, `stravaUrl`; `formatEventForCalendar` maps `event.host?.name`, `event.meetupUrl`, `event.route?.stravaUrl`
- **client/src/types/index.ts** — added `Host` interface; `Event` gains `hostId`/`host`; `CalendarEvent` gains `hostName`/`meetupUrl`/`stravaUrl`; `RecurringTemplate` gains `hostId`/`host`
- **client/src/hooks/use-events.ts** — `useUpdateMeetupStatus` renamed to `useUpdateMeetupUrl` (calls `/meetup-url`); added `useCancelOneOffEvent` and `useRestoreOneOffEvent` hooks
- **client/src/pages/admin/events-page.tsx** — updated import and usage from `useUpdateMeetupStatus` to `useUpdateMeetupUrl`
- **src/db/seed.ts** — added `meetup_description_template` upsert; setting also seeded directly via psql

## Verification

- TypeScript compiles cleanly (`npx tsc --noEmit` — no errors)
- `GET /api/hosts` returns `{"hosts":[]}` (verified against running server)
- `meetup_description_template` setting present in DB (confirmed via docker psql)
- All new endpoints present in routes/events.ts with correct order (before /:id generic routes)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated frontend hook and events-page to use renamed API**
- **Found during:** Task 2
- **Issue:** `useUpdateMeetupStatus` hook in `use-events.ts` still called `/api/events/:id/meetup-status` (the endpoint being removed). `events-page.tsx` imported and used the old hook name.
- **Fix:** Renamed `useUpdateMeetupStatus` to `useUpdateMeetupUrl`; updated endpoint to `/meetup-url`; updated import and usage in `events-page.tsx`. Added `useCancelOneOffEvent` and `useRestoreOneOffEvent` hooks while there (needed by upcoming 05-04 plan).
- **Files modified:** `client/src/hooks/use-events.ts`, `client/src/pages/admin/events-page.tsx`
- **Commit:** e9663ab

**2. [Rule 1 - Pre-existing] Seed script categories unique constraint failure**
- **Found during:** Task 2 seed verification
- **Issue:** Pre-existing issue — `categories` table lacks a unique constraint on `name`, causing `ON CONFLICT (name)` in seed to fail with PG error 42P10. Not caused by this plan.
- **Fix:** Seeded `meetup_description_template` setting directly via docker psql. Logged pre-existing seed issue to deferred items.
- **Out of scope:** Not modifying seed categories logic (pre-existing, not caused by this plan)

## Self-Check: PASSED

- `src/services/hostsService.ts` — FOUND
- `src/validation/hosts.ts` — FOUND
- `src/routes/hosts.ts` — FOUND
- `src/utils/calendarHelpers.ts` — FOUND (hostName/meetupUrl/stravaUrl added)
- `client/src/types/index.ts` — FOUND (Host interface added, CalendarEvent updated)
- Task 1 commit: 532cb05
- Task 2 commit: e9663ab
