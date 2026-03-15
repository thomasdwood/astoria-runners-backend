---
phase: 05-hosts-meetup-workflow-calendar-polish
plan: 08
subsystem: ui
tags: [react, recurring-events, meetup, ux-copy, on-demand-materialization]

requires:
  - phase: 05-hosts-meetup-workflow-calendar-polish
    provides: MeetupExportPopover with useUpdateMeetupUrl, recurring instance edit flow via EventForm+EventsPage

provides:
  - User-facing wording for recurring instance edits no longer leaks internal "one-off exception" concepts
  - MeetupExportPopover URL save works for both DB events and virtual recurring instances

affects:
  - events-page: recurring instance edit dialog wording
  - meetup-export-popover: virtual instance URL save path

tech-stack:
  added: []
  patterns:
    - "On-demand materialization pattern: virtual recurring instance materialized (POST /api/events) immediately before secondary patch operation (PATCH meetup-url) in a single async function"

key-files:
  created: []
  modified:
    - client/src/components/events/event-form.tsx
    - client/src/pages/admin/events-page.tsx
    - client/src/components/events/meetup-export-popover.tsx

key-decisions:
  - "CalendarEvent has no hostId field (only hostName), so on-demand materialization omits hostId from the create payload — avoids type error"
  - "URL section gate changed from isDbEvent-only to (isDbEvent || !!calendarEvent) — virtual instances now show the URL input section"

patterns-established:
  - "On-demand materialization: for operations requiring a real event ID, materialize the virtual instance first, then perform the secondary operation"

requirements-completed: []

duration: 2min
completed: 2026-03-14
---

# Phase 05 Plan 08: UX Wording + Meetup URL for Virtual Instances Summary

**User-friendly wording for recurring instance edits (no internal jargon) and on-demand materialization enabling Meetup URL save for virtual recurring instances**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-14T19:46:48Z
- **Completed:** 2026-03-14T19:48:52Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Replaced all "one-off/exception" terminology in user-facing strings with plain language ("Save Changes", "Changes saved for [date]", "Changes will only apply to this date")
- Added a contextual scope hint below the submit button when editing a recurring instance
- Enabled Meetup URL save in MeetupExportPopover for virtual recurring instances via on-demand materialization

## Task Commits

1. **Task 1: Fix wording in event-form.tsx and events-page.tsx** - `b7ececa` (fix)
2. **Task 2: Enable Meetup URL save for virtual recurring instances** - `cfa82e2` (feat)

## Files Created/Modified
- `client/src/components/events/event-form.tsx` - Submit label 'Save Changes', scope hint paragraph below button
- `client/src/pages/admin/events-page.tsx` - Toast wording, DialogDescription, Type column label ('Single event')
- `client/src/components/events/meetup-export-popover.tsx` - useCreateEvent import, on-demand materialization in handleSaveUrl, expanded gate condition, disabled state

## Decisions Made
- `CalendarEvent` has no `hostId` field (only `hostName`), so on-demand materialization omits `hostId` from the create payload — no type error introduced
- URL section gate expanded from `isDbEvent` to `(isDbEvent || !!calendarEvent)` so virtual instances see the URL input

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All UAT-identified issues addressed
- Phase 05 gap closure complete (plans 07 and 08 covered all UAT issues)
- Ready for milestone completion

---
*Phase: 05-hosts-meetup-workflow-calendar-polish*
*Completed: 2026-03-14*
