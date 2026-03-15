---
phase: 05-hosts-meetup-workflow-calendar-polish
plan: "04"
subsystem: ui
tags: [react, react-hook-form, zod, tanstack-query, lucide-react]

# Dependency graph
requires:
  - phase: 05-02
    provides: host field on Event and RecurringTemplate types; cancel/restore endpoints
  - phase: 05-03
    provides: useUpdateMeetupUrl, useCancelEvent, useRestoreEvent hooks; MeetupExportPopover with URL input
provides:
  - EventForm with category filter dropdown + host selector + meetup URL input
  - RecurringForm with default host selector
  - EventsPage with cancel/restore for one-off events and differentiated row logic
affects:
  - events-page
  - recurring-page
  - event-form
  - recurring-form

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Client-side route filtering via useState + array filter (categoryId match)
    - Differentiate cancelled-one-off vs cancelled-recurring-instance by recurringTemplateId nullability in row builder

key-files:
  created: []
  modified:
    - client/src/components/events/event-form.tsx
    - client/src/components/recurring/recurring-form.tsx
    - client/src/pages/admin/events-page.tsx
    - client/src/hooks/use-events.ts
    - client/src/hooks/use-recurring.ts
    - client/src/pages/admin/recurring-page.tsx

key-decisions:
  - "Route category filter is client-side only — no API change needed since all routes are loaded; filter by categoryId with useState"
  - "Cancelled one-off events (recurringTemplateId === null, isCancelled === true) keep kind one-off in row builder; restore uses PATCH /restore not DELETE"
  - "Cancelled recurring instances (recurringTemplateId !== null, isCancelled === true) use existing kind cancelled-instance with DELETE restore path"
  - "meetupUrl schema uses .or(z.literal('')) to allow clearing the URL field by submitting empty string"

patterns-established:
  - "Category filter pattern: useState<number|null> + array.filter on categoryId — can be reused for other list filters"
  - "isCancelled within one-off kind: render cancelled styling and RotateCcw in the same row component rather than a separate kind"

requirements-completed:
  - SC-1
  - SC-2
  - SC-7
  - SC-8

# Metrics
duration: 8min
completed: 2026-03-14
---

# Phase 05 Plan 04: Frontend Forms + EventsPage Actions Summary

**Host selectors + category route filter on EventForm and RecurringForm; cancel/restore XCircle/RotateCcw actions for one-off events in EventsPage**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-14T19:22:00Z
- **Completed:** 2026-03-14T19:30:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- EventForm gains: category filter Select above route dropdown (client-side filtering by categoryId), host selector dropdown, and meetup URL input field
- RecurringForm gains: default host selector dropdown after route selector
- EventsPage: one-off row logic differentiated by isCancelled — active rows show XCircle (cancel), cancelled rows show RotateCcw (restore) + struck-through styling
- Row builder now correctly splits cancelled-one-off (PATCH /restore path) from cancelled-recurring-instance (DELETE restore path) based on recurringTemplateId nullability

## Task Commits

1. **Task 1: Update EventForm (host selector + category filter) and RecurringForm (host selector)** - `6c36f6a` (feat)
2. **Task 2: Update EventsPage — cancel/restore for one-off events and meetupUrl display** - `2c67631` (feat)

## Files Created/Modified
- `client/src/components/events/event-form.tsx` - Added useHosts, useCategories imports; categoryFilter state; category filter Select; updated route Select to use filteredRoutes; host selector; meetup URL input; updated Zod schema with hostId and meetupUrl fields
- `client/src/components/recurring/recurring-form.tsx` - Added useHosts import; hostId in Zod schema and defaultValues; host selector after route Select
- `client/src/pages/admin/events-page.tsx` - Added useCancelEvent and useRestoreEvent hooks; updated row builder to differentiate cancelled one-offs; updated one-off row JSX with isCancelled-based conditional rendering
- `client/src/hooks/use-events.ts` - Added hostId and meetupUrl to useCreateEvent and useUpdateEvent mutation types
- `client/src/hooks/use-recurring.ts` - Added hostId to useCreateRecurringTemplate and useUpdateRecurringTemplate mutation types
- `client/src/pages/admin/recurring-page.tsx` - Updated handleSubmit type to include hostId

## Decisions Made
- Client-side category filter via `useState<number|null>` and `array.filter(r => r.categoryId === categoryFilter)` — no API change required since all routes load eagerly
- `meetupUrl` Zod schema uses `.url().nullable().optional().or(z.literal(''))` to allow empty string for clearing the field
- Cancelled one-off events stay as `kind: 'one-off'` in the row builder (differentiated by `isCancelled`) rather than creating a new row type — simpler and avoids extra union variant
- Row builder distinguishes cancelled-recurring-instance (recurringTemplateId non-null + isCancelled) from cancelled-one-off (recurringTemplateId null or isCancelled without template) based on recurringTemplateId nullability

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Updated use-events and use-recurring hook types for hostId/meetupUrl**
- **Found during:** Task 1 (EventForm update)
- **Issue:** useCreateEvent and useUpdateEvent mutation types didn't include hostId or meetupUrl, causing TypeScript errors when passing form data
- **Fix:** Added hostId and meetupUrl to mutation input types in use-events.ts; added hostId to use-recurring.ts create/update types; updated recurring-page.tsx handleSubmit type
- **Files modified:** client/src/hooks/use-events.ts, client/src/hooks/use-recurring.ts, client/src/pages/admin/recurring-page.tsx
- **Verification:** npx tsc --noEmit passes cleanly
- **Committed in:** 6c36f6a (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical — hook types for new fields)
**Impact on plan:** Necessary for type safety. No scope creep.

## Issues Encountered
None — all type errors resolved in Task 1 commit before Task 2 started.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 05 frontend work complete (hosts management UI, meetup template editor, MeetupExportPopover, EventPopover, EventForm, RecurringForm, EventsPage)
- Phase 05 plans 01-05 all complete
- Ready for milestone completion and git push

---
*Phase: 05-hosts-meetup-workflow-calendar-polish*
*Completed: 2026-03-14*
