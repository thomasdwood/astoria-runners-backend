---
status: resolved
trigger: "cancelling a recurring instance fails with validation failed error on the admin events page"
created: 2026-02-24T00:00:00Z
updated: 2026-02-24T00:00:00Z
---

## Current Focus

hypothesis: null values sent for optional string fields fail Zod validation
test: compare CalendarEvent field types with createEventSchema
expecting: schema rejects null but frontend sends null
next_action: report root cause

## Symptoms

expected: Clicking Cancel on a recurring instance creates a cancelled event (isCancelled=true) in the DB
actual: 422 "Validation failed" error is returned
errors: Zod validation error on POST /api/events
reproduction: Click Cancel on any recurring instance on admin events page
started: Since cancel feature was added

## Eliminated

(none needed - root cause found on first hypothesis)

## Evidence

- timestamp: 2026-02-24
  checked: CalendarEvent type definition (client/src/types/index.ts:82-98)
  found: startLocation, endLocation, notes are typed as `string | null`
  implication: frontend will send null values for these fields

- timestamp: 2026-02-24
  checked: events-page.tsx cancel handler (lines 197-204)
  found: passes calEvent.startLocation, calEvent.endLocation, calEvent.notes directly
  implication: null values are sent in the POST body

- timestamp: 2026-02-24
  checked: createEventSchema in src/validation/events.ts (lines 3-11)
  found: startLocation, endLocation use z.string().optional(); notes uses z.string().optional()
  implication: .optional() accepts undefined but NOT null - Zod rejects null as invalid type for string

- timestamp: 2026-02-24
  checked: validate middleware (src/middleware/validate.ts)
  found: uses schema.parse() and returns 422 "Validation failed" on ZodError
  implication: confirms this is the exact error the user sees

## Resolution

root_cause: The frontend sends `null` for startLocation, endLocation, and notes fields when cancelling a recurring instance, but the Zod createEventSchema only accepts `string | undefined` (via `.optional()`), not `null`. Zod's `.optional()` only allows `undefined`, not `null`. When these CalendarEvent fields are null, Zod rejects them with a validation error.

fix: Either (a) change the Zod schema to accept null with `.nullable()` on those fields, or (b) strip null values in the frontend before sending. Option (a) is cleaner since the DB likely supports null for these columns.

verification: pending
files_changed: []
