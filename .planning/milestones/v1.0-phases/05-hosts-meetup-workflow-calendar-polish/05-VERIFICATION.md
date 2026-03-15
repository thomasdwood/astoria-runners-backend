---
phase: 05-hosts-meetup-workflow-calendar-polish
verified: 2026-03-15T01:30:00Z
status: passed
score: 32/32 must-haves verified
re_verification:
  previous_status: passed
  previous_score: 30/30
  gaps_closed:
    - "Category filter prepopulates with the current route's category when editing an existing event"
    - "Editing a recurring instance shows 'Save Changes' on the submit button, not 'Save as One-off'"
    - "After saving a recurring instance edit the toast says 'Changes saved for [date]', not 'Instance saved as one-off event'"
    - "The instance edit dialog description says 'Changes will only apply to this date. Future instances won't be affected.'"
    - "The Type column for non-exception one-off events shows 'Single event' instead of 'One-off'"
    - "The Meetup description popover for virtual recurring instances shows the URL input and allows saving a URL (on-demand materialization)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Edit an existing event — verify category filter is pre-selected on open"
    expected: "Category dropdown shows the route's category on load; route dropdown shows routes in that category without manual selection"
    why_human: "Form state initialization requires running app to observe"
  - test: "Edit a recurring instance — check submit button label and scope hint"
    expected: "Button says 'Save Changes'; scope hint below reads 'Changes will only apply to [date]. Future instances won't be affected.'"
    why_human: "UI rendering and conditional text requires running app to observe"
  - test: "Open Meetup popover on a virtual recurring calendar event (not yet materialized)"
    expected: "URL input section is visible; entering a URL and saving creates a one-off instance and patches the URL; success toast appears"
    why_human: "Requires live calendar data with a virtual (not-yet-DB) recurring instance; two-step async flow must be observed"
---

# Phase 5: Hosts, Meetup Workflow, Calendar Polish — Verification Report

**Phase Goal:** Organizers can assign a run host, track Meetup posting via URL, configure description templates, and see richer event detail on the public calendar
**Verified:** 2026-03-15T01:30:00Z
**Status:** passed
**Re-verification:** Yes — after UAT gap closure (Plans 05-07 and 05-08)

## Goal Achievement

This is a third-pass verification. The previous VERIFICATION.md (status: passed, 30/30) was based on static code analysis. UAT (05-UAT.md) subsequently identified two issues:

1. Category filter blank on event edit (major) — root cause: `useState<number | null>(null)` ignores `event?.route?.categoryId`
2. UX wording leaking internal "one-off exception" concept + Meetup URL unavailable on virtual recurring instances (minor/major)

Plans 07 and 08 were created and executed to close these UAT gaps. This verification confirms both closures in the actual codebase.

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1–30 | All truths from previous 30/30 verification | ✓ VERIFIED | No regressions detected; TypeScript compiles clean |
| 31 | Category filter prepopulates from `event?.route?.categoryId` when editing | ✓ VERIFIED | `event-form.tsx` line 74: `useState<number | null>(event?.route?.categoryId ?? null)` — commit fd18c84 |
| 32 | Recurring instance edit UX uses user-facing language; Meetup URL save works for virtual instances | ✓ VERIFIED | All five wording strings updated (commits b7ececa, cfa82e2); MeetupExportPopover on-demand materialization present |

**Score:** 32/32 truths verified

### Gap 07 — Category Filter Prepopulation (Plan 05-07, commit fd18c84)

**Truth:** When editing an existing event, the category filter dropdown shows the route's category pre-selected.

| Artifact | Status | Evidence |
|----------|--------|---------|
| `client/src/components/events/event-form.tsx` | ✓ VERIFIED | Line 74: `useState<number | null>(event?.route?.categoryId ?? null)` — one-line fix confirmed present |

**Key link:** `event?.route?.categoryId` flows into `useState` initializer — the value is available on the `event` prop (type `Event | undefined`) which has `route.categoryId: number`.

### Gap 08 — Wording + Meetup URL for Virtual Instances (Plan 05-08, commits b7ececa + cfa82e2)

**Truth A:** Recurring instance edit UI uses user-facing language throughout.

| Location | Before | After | Status |
|----------|--------|-------|--------|
| `event-form.tsx` line 373 | `'Save as One-off'` | `'Save Changes'` | ✓ VERIFIED |
| `event-form.tsx` lines 376–380 | (absent) | Scope hint paragraph with date from `instanceDefaults.startDateTime` | ✓ VERIFIED |
| `events-page.tsx` line 162–163 | `'Instance saved as one-off event'` | `'Changes saved for ${instanceDateLabel}'` | ✓ VERIFIED |
| `events-page.tsx` line 515–516 | `'Saving will create a one-off exception for this instance.'` | `'Changes will only apply to this date. Future instances won\'t be affected.'` | ✓ VERIFIED |
| `events-page.tsx` line 435 | `'One-off'` | `'Single event'` | ✓ VERIFIED |

**Truth B:** Meetup URL save works for virtual recurring instances via on-demand materialization.

| Check | Status | Evidence |
|-------|--------|---------|
| `useCreateEvent` imported | ✓ WIRED | `meetup-export-popover.tsx` line 99: `const createEvent = useCreateEvent()` |
| URL section gate expanded | ✓ WIRED | Line 227: `{(isDbEvent \|\| !!calendarEvent) && (` |
| On-demand materialization in `handleSaveUrl` | ✓ WIRED | Lines 147–155: `if (!targetId && calendarEvent)` block calls `createEvent.mutateAsync()` with `calendarEvent` fields |
| Save button disabled during both mutations | ✓ WIRED | Line 245: `disabled={updateMeetupUrl.isPending \|\| createEvent.isPending}` |
| `CalendarEvent.hostId` omitted (correct) | ✓ VERIFIED | SUMMARY-08 notes `CalendarEvent` has no `hostId` field — payload omits it to avoid type error |

### TypeScript Compilation

`npx tsc --noEmit` — no output, clean compile. No errors introduced by gap closure plans.

### Commits Verified

| Commit | Description | Plan |
|--------|-------------|------|
| `fd18c84` | fix(05-07): seed category filter from existing event's route on edit | 05-07 |
| `b7ececa` | fix(05-08): update wording for recurring instance edit to avoid leaking internal concepts | 05-08 |
| `cfa82e2` | feat(05-08): enable Meetup URL save for virtual recurring instances via on-demand materialization | 05-08 |

All three commits confirmed present in git log.

### Anti-Patterns Found

None — all five previously-leaking user-facing strings replaced with plain language. No stubs or placeholder implementations introduced.

### Human Verification Required

#### 1. Category filter pre-selected on event edit

**Test:** Open the event edit dialog for an existing event that has a route assigned. Observe the Category filter dropdown on open.
**Expected:** Category dropdown shows the route's category; route dropdown shows routes in that category immediately without any manual selection.
**Why human:** useState initialization with a non-null value requires a running React app to observe the rendered state.

#### 2. Recurring instance edit button label and scope hint

**Test:** On the Events page, locate a recurring event in the list and click its edit action to open the instance edit dialog. Observe the submit button and text below it.
**Expected:** Button reads "Save Changes" (not "Save as One-off"). Below the button, a hint reads "Changes will only apply to [Month Day]. Future instances won't be affected." with the correct date interpolated.
**Why human:** Conditional JSX rendering with `instanceDefaults` prop requires a running app with a recurring event.

#### 3. Meetup URL save on virtual recurring calendar event

**Test:** Navigate to the calendar. Find a recurring event that has NOT been materialized as a one-off (no existing DB event for that date). Open its Meetup popover.
**Expected:** The URL input field is visible (was previously hidden for virtual instances). Enter a Meetup URL and click Save. The operation should succeed — a toast appears confirming the URL was saved. The event now has a DB record.
**Why human:** The on-demand materialization path (POST then PATCH in sequence) requires live API calls and a virtual recurring instance in the calendar to trigger.

### Summary

Both UAT-identified gaps are confirmed closed in the codebase. Phase 5 goal is fully achieved:

- **Host assignment:** Organizers can assign hosts to events and recurring templates — hosts table, API, settings UI, and form selectors all wired end-to-end.
- **Meetup URL tracking:** `meetupUrl` field replaces `postedToMeetup` flag — schema migrated, API updated, form field present, Meetup export popover functional for both DB events and virtual recurring instances (via on-demand materialization, newly added in plan 08).
- **Description templates:** Settings page has a template editor with variable reference; template consumed by export popover.
- **Richer calendar popover:** Host name, Meetup link, and Strava link display conditionally when set.
- **Category filter UX:** Event edit form now pre-selects the existing route's category on open (gap 07 closed).
- **User-facing wording:** All internal "one-off exception" terminology replaced with plain language across event form, events page, and export popover (gap 08 closed).

---

_Verified: 2026-03-15T01:30:00Z_
_Verifier: Claude (gsd-verifier)_
