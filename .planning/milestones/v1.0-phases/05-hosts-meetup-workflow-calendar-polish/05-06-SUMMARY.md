---
phase: 05-hosts-meetup-workflow-calendar-polish
plan: "06"
subsystem: backend-api
tags: [gap-closure, validation, eventService, seed]
dependency_graph:
  requires: [05-01, 05-02, 05-04]
  provides: [SC-1, SC-4, SC-9]
  affects: [event-create-api, event-update-api, seed-reliability]
tech_stack:
  added: []
  patterns:
    - "Zod .or(z.literal('')) for empty-string-to-null normalization on URL fields"
    - "pool.query raw SQL with ON CONFLICT ON CONSTRAINT for reliable named-constraint upserts"
key_files:
  modified:
    - src/validation/events.ts
    - src/services/eventService.ts
    - src/db/seed.ts
key_decisions:
  - "Used pool.query raw SQL for categories seed upsert to explicitly reference constraint name 'categories_name_unique' — avoids Drizzle column-reference ambiguity on databases created outside migrations"
  - "meetupUrl empty string normalized to null in both createEvent and updateEvent — prevents storing empty string in DB when EventForm clears the field"
  - "hostId null in updateEvent is explicitly valid and clears the host assignment (no ?? null guard)"
metrics:
  duration: "3 min"
  completed: "2026-03-14"
  tasks_completed: 3
  files_modified: 3
---

# Phase 5 Plan 6: Gap Closure — hostId/meetupUrl Schema and Seed Fix Summary

Closed three gaps found during Phase 5 verification: hostId and meetupUrl were silently stripped by Zod (not in schemas), and the seed script categories upsert was unreliable due to Drizzle column-based conflict resolution.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add hostId and meetupUrl to event schemas | e021047 | src/validation/events.ts |
| 2 | Persist hostId and meetupUrl in eventService | b697a30 | src/services/eventService.ts |
| 3 | Fix seed script categories ON CONFLICT target | 1c75787 | src/db/seed.ts |

## What Was Built

**Gap 1 & 2 — Schema and service wiring for hostId/meetupUrl:**
- `createEventSchema` and `updateEventSchema` now include `hostId: z.number().int().nullable().optional()` and `meetupUrl: z.string().url().nullable().optional().or(z.literal(''))`
- The `.or(z.literal(''))` handles EventForm submitting an empty string when the URL field is cleared, preventing a Zod validation error
- `createEvent()` maps both fields to DB insert with empty-string-to-null normalization on meetupUrl
- `updateEvent()` conditionally maps both fields to updateFields; null is valid for hostId (clears host assignment)

**Gap 3 — Seed script reliability:**
- Replaced `onConflictDoUpdate({ target: categories.name })` with raw `pool.query` using `ON CONFLICT ON CONSTRAINT "categories_name_unique"`
- The explicit named constraint works regardless of whether the database was created via Drizzle migration or manual DDL
- Ensures seed script reaches and executes the `meetup_description_template` upsert on fresh databases

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] sql`(name)` approach doesn't type-check with Drizzle's onConflictDoUpdate**
- **Found during:** Task 3
- **Issue:** The plan specified `target: sql\`(name)\`` but Drizzle's `PgInsertOnConflictDoUpdateConfig.target` is typed as `IndexColumn | IndexColumn[]` (which is `PgColumn`), so raw SQL is rejected at compile time
- **Fix:** Used `pool.query()` with raw SQL `ON CONFLICT ON CONSTRAINT "categories_name_unique"` — pool is already imported in seed.ts, and this approach explicitly names the constraint as required
- **Files modified:** src/db/seed.ts
- **Commit:** 1c75787

## Self-Check: PASSED

- FOUND: .planning/phases/05-hosts-meetup-workflow-calendar-polish/05-06-SUMMARY.md
- FOUND: commit e021047 (Task 1 — schema additions)
- FOUND: commit b697a30 (Task 2 — service persistence)
- FOUND: commit 1c75787 (Task 3 — seed fix)
