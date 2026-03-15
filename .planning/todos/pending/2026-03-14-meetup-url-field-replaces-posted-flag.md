---
created: 2026-03-14T00:00:00.000Z
title: Meetup URL field replaces "posted to Meetup" checkbox
area: backend, ui
files:
  - src/db/schema/events.ts
  - src/services/eventService.ts
  - src/handlers/eventHandlers.ts
  - client/src/pages/admin/events-page.tsx
---

## Problem

Events have a `postedToMeetup` boolean flag. This is redundant — whether an event is posted to Meetup is better represented by the presence of a Meetup URL.

## Solution

- Add `meetupUrl` (nullable varchar) field to the events table
- Remove `postedToMeetup` boolean column (or derive it as `meetupUrl IS NOT NULL`)
- `meetupUrl` is optional and can be added/edited after event creation
- Update all Meetup-related UI to use the URL field instead of the checkbox toggle
- In the Meetup export UI, replace the "mark as posted" checkbox with a URL input field
