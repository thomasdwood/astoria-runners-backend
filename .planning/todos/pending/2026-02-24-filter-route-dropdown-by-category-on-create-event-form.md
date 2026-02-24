---
created: 2026-02-24T22:24:53.789Z
title: Filter route dropdown by category on Create Event form
area: ui
files:
  - client/src/pages/admin/events-page.tsx
---

## Problem

When creating an event, the route selection dropdown shows all routes. As the route library grows, organizers need a way to filter routes by category (e.g., only show Brewery Runs) to quickly find the route they want.

## Solution

Add an optional category filter to the route dropdown on the Create Event form. Could be a secondary select/toggle above or beside the route select, or an inline filter within the dropdown. Should default to showing all routes (no filter).
