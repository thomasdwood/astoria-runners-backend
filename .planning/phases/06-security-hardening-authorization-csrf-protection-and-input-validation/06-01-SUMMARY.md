---
phase: 06-security-hardening-authorization-csrf-protection-and-input-validation
plan: 01
subsystem: api
tags: [zod, validation, security, settings, allowlist]

# Dependency graph
requires:
  - phase: 03.1-refinements-missing-features
    provides: settings key-value table and PUT /api/settings/:key route
provides:
  - EDITABLE_SETTINGS allowlist constant and per-key Zod schemas for settings validation
  - Hardened PUT /api/settings/:key handler rejecting unknown keys (400) and invalid values (422)
affects: [any future settings keys added must be added to EDITABLE_SETTINGS in src/validation/settings.ts]

# Tech tracking
tech-stack:
  added: []
  patterns: [validation module pattern — security contracts in src/validation/ separate from route files]

key-files:
  created:
    - src/validation/settings.ts
  modified:
    - src/routes/settings.ts

key-decisions:
  - "Settings validation extracted to src/validation/settings.ts (separate from route) to avoid circular deps and allow isolated testing"
  - "z.enum(['true', 'false'] as [string, ...string[]]) satisfies ZodType<string> constraint for settingValueSchemas Record type"
  - "EDITABLE_SETTINGS allowlist is a hardcoded const (not DB-fetched) per SECURITY.md requirement"

patterns-established:
  - "Validation module pattern: security contracts (allowlists, per-key schemas) live in src/validation/, imported by routes"

requirements-completed: [SEC-01]

# Metrics
duration: 5min
completed: 2026-03-15
---

# Phase 6 Plan 01: Settings Allowlist and Per-Key Validation Summary

**Settings PUT endpoint hardened with EDITABLE_SETTINGS allowlist and per-key Zod constraints closing P0 key-injection gap**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-15T01:48:00Z
- **Completed:** 2026-03-15T01:53:06Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `src/validation/settings.ts` exporting EDITABLE_SETTINGS const, EditableSettingKey type, and settingValueSchemas per-key map
- Updated `src/routes/settings.ts` PUT handler to reject unknown keys (400) and validate values with per-key Zod schemas (422)
- Removed unbounded string acceptance — all three editable keys now have explicit length/format constraints

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/validation/settings.ts** - `7ba366f` (feat)
2. **Task 2: Update settings PUT handler** - `cdfaab4` (feat)

## Files Created/Modified
- `src/validation/settings.ts` - EDITABLE_SETTINGS allowlist, EditableSettingKey type, settingValueSchemas per-key Zod schemas
- `src/routes/settings.ts` - PUT handler now enforces allowlist check and per-key Zod validation before upsert

## Decisions Made
- Settings validation extracted to `src/validation/settings.ts` separate from route file — avoids circular deps, matches existing validation module pattern, allows isolated testing when test runner is added
- `z.enum(['true', 'false'] as [string, ...string[]])` cast used to satisfy `ZodType<string>` Record constraint while preserving enum validation behavior
- Allowlist is hardcoded const, not DB-fetched — per SECURITY.md requirement for settings endpoint protection

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

Note: Task 1 has `tdd="true"` but no test runner (vitest/jest) is installed in the project and no test files exist outside node_modules. The TDD steps (RED/GREEN/REFACTOR) were not executable. TypeScript compilation (`npx tsc --noEmit`) was used as the verification mechanism per the plan's `<verify>` blocks.

## Issues Encountered
None — TypeScript compilation passed cleanly after both tasks.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- SEC-01 (settings allowlist) complete
- Phase 6 may proceed with remaining security plans (ownership checks, CSRF, additional input validation)
- Any new settings key requires updating EDITABLE_SETTINGS in `src/validation/settings.ts` and adding a per-key schema to settingValueSchemas

---
*Phase: 06-security-hardening-authorization-csrf-protection-and-input-validation*
*Completed: 2026-03-15*
