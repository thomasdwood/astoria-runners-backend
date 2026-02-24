---
status: diagnosed
trigger: "admin dashboard shows no upcoming events"
created: 2026-02-24T05:20:00Z
updated: 2026-02-24T05:25:00Z
---

## Current Focus

hypothesis: CONFIRMED - unstable query key from `new Date()` on every render
test: code analysis + comparison with working events-page.tsx
expecting: n/a - root cause confirmed
next_action: return diagnosis

## Symptoms

expected: Dashboard shows upcoming events for next 7 days
actual: Dashboard shows "No events in the next 7 days" despite events existing
errors: none visible (silent failure)
reproduction: Visit /admin dashboard
started: likely since dashboard was created

## Eliminated

- hypothesis: No events in database within 7 days
  evidence: DB query shows 5 events between 2026-02-24 and 2026-03-03
  timestamp: 2026-02-24T05:21:00Z

- hypothesis: Backend filtering broken (start/end params)
  evidence: SQL query with same date range returns correct results; service code is correct
  timestamp: 2026-02-24T05:21:30Z

- hypothesis: Zod validation rejecting datetime params
  evidence: Tested z.string().datetime() with .toISOString() output in Zod 4 - passes
  timestamp: 2026-02-24T05:22:00Z

- hypothesis: Type mismatch between API response and frontend types
  evidence: Backend returns { events: [...] } with route.category nested; frontend types match
  timestamp: 2026-02-24T05:22:30Z

- hypothesis: Auth issue preventing API access
  evidence: User confirmed API returns events via curl; dashboard is behind RequireAuth
  timestamp: 2026-02-24T05:23:00Z

## Evidence

- timestamp: 2026-02-24T05:21:00Z
  checked: Database events table
  found: 5 events exist in next 7 days with valid routes and categories
  implication: Data is present; issue is in fetching/rendering

- timestamp: 2026-02-24T05:23:00Z
  checked: dashboard-page.tsx line 13 vs events-page.tsx line 68
  found: Dashboard uses `const now = new Date()` (unstable); Events page uses `startOfToday()` (stable)
  implication: Dashboard query key changes every render

- timestamp: 2026-02-24T05:24:00Z
  checked: use-events.ts query key construction
  found: queryKey includes params object which contains ISO timestamp strings from `now`
  implication: New Date() per render -> new ISO string -> new query key -> perpetual refetching

- timestamp: 2026-02-24T05:24:30Z
  checked: App.tsx QueryClient config
  found: staleTime 30s, retry 1 - standard config, no error suppression
  implication: Query restarts are not from cache invalidation but from key instability

## Resolution

root_cause: `new Date()` on line 13 of dashboard-page.tsx creates a new timestamp on every render, which flows into `useEvents({ start: now.toISOString(), ... })`. Since the params object is used as the React Query key (line 19 of use-events.ts: `queryKey: ['events', params ?? 'all']`), each render creates a unique query key. When other queries (useRoutes, useRecurringTemplates) resolve and trigger re-renders, the events query key changes, abandoning the in-flight fetch and starting a new one. The data never stabilizes because the query key is never the same across consecutive renders.

fix: empty
verification: empty
files_changed: []
