---
phase: 04-integrations-export
plan: 03
subsystem: ui
tags: [react, zod, strava, route-form]

requires:
  - phase: 04-integrations-export
    provides: "stravaUrl field in DB schema, backend validation, route service, frontend types, Meetup export"
provides:
  - "stravaUrl input field in route form UI — organizers can now set Strava route URLs"
affects: []

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - client/src/components/routes/route-form.tsx

key-decisions:
  - "Empty stravaUrl converted to undefined before submission to avoid storing empty strings"

patterns-established: []

requirements-completed: [EXPORT-02]

duration: 3min
completed: 2026-02-24
---

# Plan 04-03: Strava URL Route Form Field Summary

**Added stravaUrl input field to route form, closing the UI gap so organizers can associate Strava routes with runs and have them appear in Meetup export descriptions**

## Performance

- **Duration:** 3 min
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added stravaUrl to local Zod schema with URL validation and empty-string support
- Added stravaUrl to defaultValues for pre-filling on edit
- Added URL input field after End Location with appropriate placeholder and error display
- Added handleFormSubmit wrapper to convert empty stravaUrl to undefined before submission

## Task Commits

1. **Task 1: Add stravaUrl field to RouteForm component** - `55e3cb6` (feat)

## Files Created/Modified
- `client/src/components/routes/route-form.tsx` - Added stravaUrl to Zod schema, defaultValues, and rendered URL input field

## Decisions Made
- Used `.or(z.literal(''))` pattern on stravaUrl validation to allow clearing the field without triggering URL validation errors
- Added handleFormSubmit wrapper to strip empty string to undefined, keeping backend clean

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 4 gap closure complete — stravaUrl field is now accessible end-to-end from UI to Meetup export
- All Phase 4 plans executed

---
*Phase: 04-integrations-export*
*Completed: 2026-02-24*
