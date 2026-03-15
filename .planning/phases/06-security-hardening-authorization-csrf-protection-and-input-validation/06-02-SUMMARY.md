---
phase: 06-security-hardening-authorization-csrf-protection-and-input-validation
plan: 02
subsystem: api
tags: [zod, express, input-validation, security]

# Dependency graph
requires:
  - phase: 05-hosts-meetup-workflow-calendar-polish
    provides: route files and validation schemas this plan hardens
provides:
  - notes max(2000) constraint in all four event/template Zod schemas
  - isNaN(id) || id <= 0 guard in all five route files (19 sites)
affects: [06-03-settings-allowlist, any future route additions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "isNaN(id) || id <= 0 pattern for integer ID param validation (SECURITY.md required)"
    - "Zod .max(2000) on unbounded text fields to prevent excessive DB writes"

key-files:
  created: []
  modified:
    - src/validation/events.ts
    - src/routes/events.ts
    - src/routes/routes.ts
    - src/routes/recurringTemplates.ts
    - src/routes/categories.ts
    - src/routes/hosts.ts

key-decisions:
  - "isNaN(id) || id <= 0 is the canonical ID guard — bare isNaN(id) is now forbidden in route files per SECURITY.md"
  - "notes max 2000 chars matches common textarea limits and prevents unbounded DB writes without breaking existing data"
  - ".max(2000) placed before .nullable().optional() so null bypasses length check correctly (null is not a string)"

patterns-established:
  - "ID guard pattern: isNaN(id) || id <= 0 returns 400 — all route files follow this"
  - "Notes fields: z.string().max(2000, ...) before nullable/optional modifiers"

requirements-completed: [SEC-02]

# Metrics
duration: 1min
completed: 2026-03-15
---

# Phase 6 Plan 02: Input Validation Hardening Summary

**Zod notes max(2000) added to 4 schemas and isNaN(id) || id <= 0 guard applied to 19 integer ID check sites across 5 route files**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-15T01:52:29Z
- **Completed:** 2026-03-15T01:53:27Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added `.max(2000, 'Notes must be 2000 characters or less')` to notes field in all four event/recurring-template Zod schemas
- Replaced 19 bare `if (isNaN(id))` guards with `if (isNaN(id) || id <= 0)` across events.ts (7), recurringTemplates.ts (5), routes.ts (3), categories.ts (2), hosts.ts (2)
- TypeScript compiles cleanly with no new errors after both changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Add max(2000) to notes fields in all four event/template schemas** - `54c7889` (feat)
2. **Task 2: Harden isNaN(id) guards to reject id <= 0 across all five route files** - `3b1edc1` (feat)

## Files Created/Modified
- `src/validation/events.ts` - notes field in createEventSchema, updateEventSchema, createRecurringTemplateSchema, updateRecurringTemplateSchema all get `.max(2000)` constraint
- `src/routes/events.ts` - 7 ID guards hardened
- `src/routes/recurringTemplates.ts` - 5 ID guards hardened
- `src/routes/routes.ts` - 3 ID guards hardened
- `src/routes/categories.ts` - 2 ID guards hardened
- `src/routes/hosts.ts` - 2 ID guards hardened

## Decisions Made
- `.max(2000)` placed before `.nullable().optional()` in the Zod chain — null bypasses string length check correctly, which is the desired behavior
- 2000 char limit matches common textarea conventions and prevents excessive DB writes without requiring a migration (column is text/varchar with no DB-level constraint)
- `isNaN(id) || id <= 0` is now the required canonical pattern; bare `isNaN(id)` is considered a bug per SECURITY.md

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Input validation hardening complete for notes fields and integer ID params
- Ready for 06-03: Settings endpoint allowlist (EDITABLE_SETTINGS) and per-key value constraints

---
*Phase: 06-security-hardening-authorization-csrf-protection-and-input-validation*
*Completed: 2026-03-15*
