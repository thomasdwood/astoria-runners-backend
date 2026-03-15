---
phase: 08-documentation-cleanup-requirements-traceability
plan: 02
subsystem: database
tags: [seed, drizzle, routes, categories, strava]

# Dependency graph
requires:
  - phase: 08-01
    provides: Phase 8 documentation phase context
provides:
  - 47 real Astoria Runners routes seeded with correct categories, distances, and Strava URLs
  - Idempotent seed script with stravaUrl field on all route objects
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "stravaUrl field added to sampleRoutes objects in seed.ts (Drizzle NewRoute includes it as optional)"
    - "oneOffEventData and recurringTemplateData updated in tandem with sampleRoutes to maintain referential integrity"

key-files:
  created: []
  modified:
    - src/db/seed.ts

key-decisions:
  - "47 routes seeded (plan said 46 — the xlsx route_data provided 47 entries; all included)"
  - "oneOffEventData updated alongside sampleRoutes: stale route names replaced with valid routes from new list (auto-fix Rule 1)"

patterns-established: []

requirements-completed: []

# Metrics
duration: 2min
completed: 2026-03-15
---

# Phase 8 Plan 02: Real Routes Seed Summary

**47 real Astoria Runners routes seeded in src/db/seed.ts with correct category mapping, Strava URLs, and end locations from the xlsx Route List**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-15T02:33:00Z
- **Completed:** 2026-03-15T02:35:02Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Replaced 5 placeholder routes with 47 real routes from the "ROUTE LIST" sheet of the xlsx
- Added `stravaUrl` field to all route objects (populated where available, null otherwise)
- Applied correct category mapping: Beer Run→Brewery Run, Coffee→Coffee Run, Brunch→Brunch Run, Weekend/Slow Run/Regular Wednesday/Regular Intervals→Weekend
- Updated `recurringTemplateData` to reference valid new route names (Singlecut, Randall's Island South)
- Updated `oneOffEventData` to reference valid new route names (Classic Wednesday, Roosevelt Island North (+ Brooklyn Bagel), Focal Point)
- Seed is idempotent — verified by running twice without errors or duplicates

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace sampleRoutes with real routes from xlsx** - `8349c1e` (feat)

**Plan metadata:** (to be committed with SUMMARY.md)

## Files Created/Modified
- `src/db/seed.ts` - sampleRoutes replaced with 47 real routes; stravaUrl field added; recurringTemplateData and oneOffEventData updated to reference valid route names

## Decisions Made
- 47 routes included (plan text said 46, but actual route_data in plan had 47 entries — all included faithfully)
- oneOffEventData stale route names updated as part of task (auto-fix: would cause seed warnings without them)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated oneOffEventData to reference valid route names**
- **Found during:** Task 1 (Replace sampleRoutes with real routes from xlsx)
- **Issue:** `oneOffEventData` referenced old placeholder route names (Kinship Coffee Out-and-Back, Astoria Park to Comfortland, Singlecut Beersmiths Run) that no longer exist after replacing sampleRoutes — would cause ⚠ warnings during seed with no events seeded
- **Fix:** Updated oneOffEventData to use valid routes from new list: Classic Wednesday, Roosevelt Island North (+ Brooklyn Bagel), Focal Point
- **Files modified:** src/db/seed.ts
- **Verification:** npm run db:seed completed with all 3 one-off events seeded (no warnings)
- **Committed in:** 8349c1e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Auto-fix necessary for correct operation. No scope creep.

## Issues Encountered
- npm run seed did not exist — correct script is npm run db:seed (minor discovery, no code change needed)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Real routes now in seed data, dev/staging environments populated with Astoria Runners actual route catalog
- No blockers

## Self-Check: PASSED
- src/db/seed.ts: FOUND
- 08-02-SUMMARY.md: FOUND
- commit 8349c1e: FOUND

---
*Phase: 08-documentation-cleanup-requirements-traceability*
*Completed: 2026-03-15*
