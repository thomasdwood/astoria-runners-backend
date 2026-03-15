---
phase: 07-feature-gap-closure-host-edit-ui-and-meetup-distance-fix
plan: 01
subsystem: ui
tags: [meetup, template, recurring, calendar, typescript]

# Dependency graph
requires:
  - phase: 05-hosts-meetup-workflow-calendar-polish
    provides: MeetupExportPopover with client-side description generation; CalendarEvent type; formatEventForCalendar
provides:
  - distance field on CalendarEvent (backend and frontend types)
  - formatEventForCalendar populates distance from route.distance via Number() coercion
  - generateClientSideDescription passes distance to applyTemplate, fixing {{distance}} for virtual recurring instances
affects: [meetup-export, calendar-display, recurring-instances]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Number(event.route.distance) coercion — Drizzle returns numeric(5,2) as string; convert to number for type safety, then String() back for template substitution"

key-files:
  created: []
  modified:
    - src/utils/calendarHelpers.ts
    - client/src/types/index.ts
    - client/src/components/events/meetup-export-popover.tsx

key-decisions:
  - "String(ce.distance) for template substitution — JS number toString drops trailing zero (Number('6.20') = 6.2 -> '6.2'), which is the desired display format"

patterns-established:
  - "CalendarEvent type is duplicated (not shared package) — both src/utils/calendarHelpers.ts and client/src/types/index.ts must be updated together"

requirements-completed:
  - EXPORT-02

# Metrics
duration: 5min
completed: 2026-03-14
---

# Phase 07 Plan 01: Meetup Distance Fix Summary

**Fixed {{distance}} blank in Meetup description templates by adding distance field to CalendarEvent and wiring it through client-side generation for virtual recurring instances**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-14T00:00:00Z
- **Completed:** 2026-03-14T00:05:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added `distance: number | null` to `CalendarEvent` interface in both backend (`src/utils/calendarHelpers.ts`) and frontend (`client/src/types/index.ts`)
- Populated `distance` in `formatEventForCalendar` using `Number(event.route?.distance)` coercion (Drizzle returns `numeric(5,2)` as string)
- Fixed `generateClientSideDescription` to pass `ce.distance != null ? String(ce.distance) : ''` — resolves EXPORT-02 requirement

## Task Commits

Each task was committed atomically:

1. **Task 1: Add distance to CalendarEvent type in both backend and frontend** - `f9c473b` (feat)
2. **Task 2: Wire distance into generateClientSideDescription** - `7739051` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/utils/calendarHelpers.ts` - Added `distance: number | null` to interface; added mapping in `formatEventForCalendar`
- `client/src/types/index.ts` - Added `distance: number | null` to `CalendarEvent` interface
- `client/src/components/events/meetup-export-popover.tsx` - Changed `distance: ''` to `distance: ce.distance != null ? String(ce.distance) : ''`

## Decisions Made
- `String(ce.distance)` for template substitution — JS `Number('6.20')` yields `6.2`, so `String(6.2)` renders `'6.2'` which is the desired display format (no trailing zero)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- EXPORT-02 satisfied: `{{distance}}` now renders route distance for both virtual recurring instances and DB events
- Ready to proceed to Plan 07-02 (host edit UI)

---
*Phase: 07-feature-gap-closure-host-edit-ui-and-meetup-distance-fix*
*Completed: 2026-03-14*
