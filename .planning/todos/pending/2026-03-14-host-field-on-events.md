---
created: 2026-03-14T00:00:00.000Z
title: Host field on events drawn from hosts table
area: backend, ui
files:
  - src/db/schema/
  - src/services/
  - client/src/pages/admin/events-page.tsx
  - client/src/pages/admin/settings-page.tsx
---

## Problem

Events have no host assignment. Organizers want to associate a host with each run.

## Solution

- Create `hosts` table: id, name, email (nullable), userId (nullable FK to users)
- Seed hosts table with all existing admin/organizer users by default
- Add `hostId` (nullable FK) to events table
- Add `hostId` (nullable FK) to recurring_templates table (default host for instances)
- Admin UI on settings page to add/remove hosts from the hosts list
- Future: add email to a host and promote them to admin (make organizer account)
- Event form: host selector dropdown (nullable — "No host" option)
- Recurring template form: default host selector (nullable)
