---
phase: 04-integrations-export
plan: 02
subsystem: meetup-export
tags: [meetup, export, routes, popover, ui]
dependency_graph:
  requires: []
  provides: [EXPORT-01, EXPORT-02, EXPORT-03, EXPORT-04]
  affects: [events-page, routes-schema, meetup-export-service]
tech_stack:
  added: []
  patterns: [popover-export, format-toggle, client-side-generation]
key_files:
  created:
    - client/src/components/events/meetup-export-popover.tsx
  modified:
    - src/db/schema/routes.ts
    - src/validation/routes.ts
    - src/services/routeService.ts
    - src/services/meetupExportService.ts
    - src/routes/events.ts
    - client/src/types/index.ts
    - client/src/hooks/use-events.ts
    - client/src/pages/admin/events-page.tsx
  deleted:
    - client/src/components/events/meetup-description-dialog.tsx
decisions:
  - "Native input[type=checkbox] used instead of Radix Checkbox — @radix-ui/react-checkbox not installed"
  - "HTML format not shown for virtual recurring instances (client-side only, no route.stravaUrl available)"
  - "Meetup badge shows when posted; popover trigger replaces badge when unposted (no Switch)"
metrics:
  duration: 3 min
  completed: 2026-02-24
  tasks: 2
  files_changed: 9
---

# Phase 04 Plan 02: Meetup Export Update Summary

**One-liner:** Updated Meetup export with stravaUrl on routes, plain/HTML format toggle, Popover UI replacing Dialog, and green Meetup badge on posted event rows.

## What Was Built

### Task 1: stravaUrl on routes + Meetup export service rewrite

- Added `stravaUrl` varchar(500) column to routes schema (nullable, optional)
- Added `stravaUrl` Zod validation (optional URL or empty string) to both create and update schemas
- Updated `createRoute` and `updateRoute` in routeService to persist stravaUrl
- Added `stravaUrl: string | null` to the frontend `Route` interface
- Rewrote `meetupExportService.ts` with updated `EventForMeetup` interface matching the Phase 3.1 data model (category as object with id/name/color/icon, startLocation on event, stravaUrl on route)
- `generateMeetupDescription` now accepts `format: 'plain' | 'html'` parameter
- Plain text: date, distance, conditional start/end locations, Strava link (if present), notes
- HTML: `<p>` tags, `<b>` labels, `<a href>` for Strava link
- Added `meetupDescriptionQuerySchema` to events router; passes `format` query param to service

### Task 2: MeetupExportPopover + events page update

- Created `MeetupExportPopover` component using Radix Popover (already installed)
- Popover features: format toggle (Plain Text / HTML) for DB events, pre-formatted description area, copy-to-clipboard with 2s "Copied!" feedback, posted-to-Meetup checkbox
- Virtual recurring instances: client-side description generation (no API call, no format toggle)
- Updated `useMeetupDescription` hook to accept `format` parameter
- Events page: replaced Dialog + Switch pattern with inline Popover
- Posted events show green "Meetup" badge instead of popover trigger
- Recurring instance rows now show MeetupExportPopover (client-side) instead of dash
- Cancelled instance rows still show dash (no export)
- Deleted `meetup-description-dialog.tsx` (replaced by popover)

## Commits

- `6ebdeb8`: feat(04-02): add stravaUrl to routes and update Meetup export service
- `7676257`: feat(04-02): replace MeetupDescriptionDialog with MeetupExportPopover, add Meetup badge

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing @radix-ui/react-checkbox dependency**
- **Found during:** Task 2, creating MeetupExportPopover
- **Issue:** Plan specified using Checkbox component, but `@radix-ui/react-checkbox` is not installed and there is no shadcn Checkbox UI component
- **Fix:** Used native `<input type="checkbox">` with matching label instead — functionally identical
- **Files modified:** `client/src/components/events/meetup-export-popover.tsx`
- **Commit:** `7676257`

## Self-Check: PASSED

- [x] `client/src/components/events/meetup-export-popover.tsx` — FOUND
- [x] `src/services/meetupExportService.ts` — updated with new interface and format support
- [x] `src/db/schema/routes.ts` — stravaUrl column added
- [x] `client/src/components/events/meetup-description-dialog.tsx` — DELETED (confirmed)
- [x] Commits 6ebdeb8 and 7676257 exist in git log
