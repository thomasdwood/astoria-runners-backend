---
status: resolved
trigger: "Meetup export popover button says 'Save as one off' and toast says 'Save as one off event'"
created: 2026-03-14T00:00:00Z
updated: 2026-03-15T00:00:00Z
---

## Current Focus

hypothesis: User-facing "one off" terminology is scattered across two components: the EventForm submit button label and the events-page toast message. The MeetupExportPopover save button already says "Save" (not "Save as one off") but the URL save section is hidden from recurring instances entirely.
test: N/A — diagnosis only mode
expecting: N/A
next_action: deliver findings to caller

## Symptoms

expected: Button says "Save URL"; recurring instances show contextual scope note; internal "one off" terminology hidden from users
actual: EventForm submit button says "Save as One-off" when instanceDefaults is set; toast on save says "Instance saved as one-off event"; EventForm DialogDescription says "Saving will create a one-off exception for this instance."; Type column in table shows "One-off" label for pure one-off events
errors: none (UI/UX issue, not a runtime error)
reproduction: Open Events page > click edit on a recurring instance > observe button and dialog description; save > observe toast
started: always been this way

## Eliminated

- hypothesis: MeetupExportPopover save button says "Save as one off"
  evidence: Line 230 of meetup-export-popover.tsx — the button says "Save" (not "Save as one off"); the URL save section is only shown when isDbEvent = true (eventId set, no calendarEvent), so it is already hidden for virtual recurring instances
  timestamp: 2026-03-14

## Evidence

- timestamp: 2026-03-14
  checked: client/src/components/events/event-form.tsx:373
  found: Submit button label ternary: `event ? 'Update Event' : instanceDefaults ? 'Save as One-off' : 'Create Event'`
  implication: When editing a recurring instance (instanceDefaults is set), the button reads "Save as One-off" — exposes internal concept

- timestamp: 2026-03-14
  checked: client/src/pages/admin/events-page.tsx:162
  found: `toast.success('Instance saved as one-off event');` fires after createEvent.mutateAsync inside the editingInstance branch
  implication: Toast message exposes "one-off event" terminology to the user

- timestamp: 2026-03-14
  checked: client/src/pages/admin/events-page.tsx:515
  found: DialogDescription text: "Saving will create a one-off exception for this instance."
  implication: Dialog description also exposes internal model language; should be reworded to explain scope impact

- timestamp: 2026-03-14
  checked: client/src/pages/admin/events-page.tsx:434
  found: `<span className="text-muted-foreground text-xs">One-off</span>` in the Type column for pure one-off events
  implication: User-facing type label — minor but consistent with the pattern of internal vocab leaking into UI

- timestamp: 2026-03-14
  checked: client/src/components/events/meetup-export-popover.tsx:154 and 210-234
  found: `const isDbEvent = !!eventId && !calendarEvent;` gates the URL save section. For recurring instances (calendarEvent passed, no eventId), the URL save section (including any save button) is hidden entirely.
  implication: MeetupExportPopover URL save is NOT currently shown for recurring instances at all — the feature is blocked, not mislabeled. The "Save as one off" bug is NOT in this component.

- timestamp: 2026-03-14
  checked: CalendarEvent type (client/src/types/index.ts:111-112)
  found: CalendarEvent has `isRecurring: boolean` and `recurringTemplateId: number | null`; Event has `recurringTemplateId: number | null`
  implication: Both component contexts have sufficient data to detect whether we're editing a recurring instance. EventForm already receives instanceDefaults (truthy = recurring). MeetupExportPopover already receives calendarEvent (truthy = virtual recurring instance) vs eventId (truthy = materialized DB event, which may or may not be an exception — check ev.recurringTemplateId !== null).

## Resolution

root_cause: Two places use "one off" / "one-off" as user-facing copy when they should use clearer scope language. Additionally, the MeetupExportPopover does not show a URL-save UI at all for virtual recurring instances, which means the desired "Save URL" flow for a recurring instance currently requires materializing it first. The wording bugs are in event-form.tsx (submit button) and events-page.tsx (toast + dialog description + type column label).

fix: N/A — diagnose only

verification: N/A

files_changed: []
