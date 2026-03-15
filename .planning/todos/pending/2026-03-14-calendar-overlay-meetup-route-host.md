---
created: 2026-03-14T00:00:00.000Z
title: Add meetup link, route link, and host to calendar event overlay
area: ui
files:
  - client/src/pages/calendar-page.tsx
  - client/src/components/
---

## Problem

The calendar event detail overlay (popover/modal shown on event click) doesn't show the Meetup URL, the Strava route link, or the event host.

## Solution

- Add host name to calendar event overlay (show "Hosted by [name]" if set)
- Add Meetup link to overlay (show as button/link if meetupUrl is set)
- Add Strava route link to overlay (show as link if stravaUrl is set on the route)
- These fields should also be exposed via the public calendar API endpoint
