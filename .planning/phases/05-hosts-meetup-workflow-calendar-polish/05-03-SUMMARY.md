---
phase: 05-hosts-meetup-workflow-calendar-polish
plan: "03"
subsystem: ui
tags: [react, react-query, settings, hosts, meetup, template]

# Dependency graph
requires:
  - phase: 05-02
    provides: "Hosts API, meetup-url endpoint, Host type in types/index.ts"
provides:
  - "useHosts, useCreateHost, useUpdateHost, useDeleteHost React Query hooks"
  - "useCancelEvent, useRestoreEvent hooks in use-events.ts"
  - "Settings page Hosts section with add/delete CRUD"
  - "Settings page Meetup Description Template editor with variable reference"
  - "MeetupExportPopover updated with URL input (replaces postedToMeetup checkbox)"
  - "Popover reads saved template from settings for client-side description generation"
affects: [calendar, events, admin-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Template override pattern: generateClientSideDescription accepts optional templateOverride string"
    - "Popover self-contained URL save: useUpdateMeetupUrl called inside popover, not parent"

key-files:
  created:
    - client/src/hooks/use-hosts.ts
  modified:
    - client/src/hooks/use-events.ts
    - client/src/pages/admin/settings-page.tsx
    - client/src/components/events/meetup-export-popover.tsx
    - client/src/pages/admin/events-page.tsx

key-decisions:
  - "MeetupExportPopover self-contains useUpdateMeetupUrl — parent (events-page) no longer manages URL saving"
  - "Always show MeetupExportPopover button for DB events (badge shown alongside when URL set) — allows editing/clearing URL"
  - "generateClientSideDescription accepts templateOverride string; uses simple replaceAll substitution for {{variable}} placeholders"
  - "Template initialization uses same pattern as locationInitialized — set once when settings first load"

patterns-established:
  - "Settings page sections: Card + CardHeader + CardContent + Table + Dialog + AlertDialog pattern"
  - "Popover self-contained mutations: hook called inside popover component, not passed via props"

requirements-completed: [SC-3, SC-5]

# Metrics
duration: 8min
completed: 2026-03-14
---

# Phase 05 Plan 03: Hosts Management UI and Meetup Template Editor Summary

**Hosts CRUD on settings page (add/delete with confirmation) plus Meetup description template editor and URL-input popover replacing the old postedToMeetup checkbox**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-14T19:15:00Z
- **Completed:** 2026-03-14T19:23:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created `use-hosts.ts` with useHosts, useCreateHost, useUpdateHost, useDeleteHost React Query hooks
- Added Hosts section to settings page: table listing hosts (name/email), Add Host dialog, delete with AlertDialog confirmation
- Added Meetup Description Template section to settings page: Textarea editor, variable reference list, Save button persisting to `meetup_description_template` settings key
- Updated MeetupExportPopover: replaced postedToMeetup checkbox with URL input field; popover now saves URL directly via useUpdateMeetupUrl; reads saved template from useSettings for client-side description generation
- Added useCancelEvent and useRestoreEvent hooks to use-events.ts
- Removed onTogglePosted prop from MeetupExportPopover interface and all callers

## Task Commits

Each task was committed atomically:

1. **Task 1: Create use-hosts.ts hooks and update use-events.ts** - `8557d07` (feat)
2. **Task 2: Settings page Hosts section, Meetup template editor, MeetupExportPopover update** - `cd6d3cf` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `client/src/hooks/use-hosts.ts` - New file: useHosts, useCreateHost, useUpdateHost, useDeleteHost hooks
- `client/src/hooks/use-events.ts` - Added useCancelEvent, useRestoreEvent hooks
- `client/src/pages/admin/settings-page.tsx` - Added Hosts section and Meetup Description Template section
- `client/src/components/events/meetup-export-popover.tsx` - Replaced checkbox with URL input, added template consumption via useSettings
- `client/src/pages/admin/events-page.tsx` - Removed onTogglePosted prop usage, removed unused updateMeetupUrl hook

## Decisions Made
- MeetupExportPopover now self-contains URL saving — `useUpdateMeetupUrl` is called inside the popover, not passed from parent. This removes the `onTogglePosted` callback prop entirely.
- Always show MeetupExportPopover button for DB events (Meetup badge shown alongside when URL is set), allowing admins to edit or clear the URL at any time.
- Client-side description generation uses `applyTemplate()` with `replaceAll` substitution for `{{variable}}` placeholders when `templateOverride` is provided.
- Template state initialization mirrors the `locationInitialized` pattern from the existing settings page — initialized once when settings load.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated events-page.tsx to remove broken onTogglePosted prop**
- **Found during:** Task 2 (MeetupExportPopover update)
- **Issue:** Removing `onTogglePosted` from the popover interface would cause a TypeScript error in events-page.tsx which was still passing it
- **Fix:** Removed `onTogglePosted` prop usage, removed unused `handleMeetupToggle` function, removed unused `updateMeetupUrl` import and hook from events-page
- **Files modified:** client/src/pages/admin/events-page.tsx
- **Verification:** TypeScript compiles with no errors
- **Committed in:** cd6d3cf (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug/consistency fix)
**Impact on plan:** Necessary cleanup to maintain TypeScript correctness when removing the onTogglePosted prop. No scope creep.

## Issues Encountered
None - execution went smoothly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Hosts management UI is fully functional
- Meetup template editor persists custom templates to settings
- MeetupExportPopover shows URL input, saves URL on save button click
- Phase 05 plans 01-03 complete; remaining plans in phase can proceed

---
*Phase: 05-hosts-meetup-workflow-calendar-polish*
*Completed: 2026-03-14*
