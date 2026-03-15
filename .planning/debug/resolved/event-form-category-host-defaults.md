---
status: resolved
trigger: "EventForm: category filter not prepopulated when editing; host should default to recurring template's host"
created: 2026-03-14T00:00:00Z
updated: 2026-03-15T00:00:00Z
---

## Current Focus

hypothesis: confirmed — two independent missing-initialization problems
test: code trace complete
expecting: n/a (diagnosis only)
next_action: return findings to caller

## Symptoms

expected:
  1. Editing an existing event should show the category filter pre-selected based on the event's current route category
  2. When materializing a recurring instance, the host field should default to the template's hostId (not null)
actual:
  1. Category filter always starts at null ("All categories"); user must re-select to narrow the route list
  2. Host field is always initialized to null for instance defaults, regardless of the template's hostId
errors: none (silent UX failures)
reproduction:
  1. Navigate to Events page, click Edit on any one-off event — category filter shows "All categories"
  2. Click the edit (pencil) icon on a recurring instance from a template that has a host — host field is blank
started: always — no regression, never implemented

## Eliminated

(none — root cause confirmed on first read)

## Evidence

- timestamp: 2026-03-14T00:00:00Z
  checked: event-form.tsx line 74
  found: |
    `const [categoryFilter, setCategoryFilter] = useState<number | null>(null);`
    No initialization from props. When `event` prop is present (edit mode), `event.route.categoryId`
    is available (Route type has categoryId, and Event.route is a full Route object) but is never
    used to seed this local state.
  implication: Category filter always starts blank when editing.

- timestamp: 2026-03-14T00:00:00Z
  checked: event-form.tsx lines 83–107 (defaultValues block)
  found: |
    The `event` branch (edit mode) seeds `hostId: event.hostId ?? null` — correct.
    The `instanceDefaults` branch hardcodes `hostId: null` — does not attempt to
    source from the recurring template even though CalendarEvent carries `recurringTemplateId`.
  implication: Host is always null for recurring instance materialization.

- timestamp: 2026-03-14T00:00:00Z
  checked: types/index.ts — Event and CalendarEvent shapes
  found: |
    Event.route is a full Route object with categoryId (number) and category (Category).
    CalendarEvent has `recurringTemplateId: number | null` but does NOT carry `hostId` or `hostName`
    as a number — it only has `hostName: string | null` (display string, not usable as FK).
  implication: |
    Issue 1: categoryId is fully derivable from event.route.categoryId at form init time.
    Issue 2: CalendarEvent does not carry the template's hostId. The parent page would need to
    either fetch the template by recurringTemplateId or pass hostId through CalendarEvent / the
    instanceDefaults object.

- timestamp: 2026-03-14T00:00:00Z
  checked: events-page.tsx lines 245–253 (editingDefaultValues construction)
  found: |
    editingDefaultValues is built from CalendarEvent fields only:
      routeId, startDateTime, notes, endLocation, startLocation.
    No hostId is included. The InstanceDefaults interface (event-form.tsx lines 55–61)
    does not even have a `hostId` field.
  implication: |
    Even if EventForm wanted to use template's hostId in the instanceDefaults branch,
    it has no channel to receive it. Both the interface and the construction site omit it.

- timestamp: 2026-03-14T00:00:00Z
  checked: events-page.tsx — where recurring template data lives
  found: |
    The page imports useCalendarList and useEvents. It does NOT import useRecurringTemplates
    or useRecurringTemplate. The CalendarEvent objects have recurringTemplateId but the
    full template (including hostId) is never fetched on this page.
  implication: |
    To prefill hostId from the template, the page must either:
    (a) call useRecurringTemplates() (already fetches all templates with hostId), then
        look up the matching template by recurringTemplateId when building editingDefaultValues, or
    (b) add hostId to CalendarEvent on the API side and pass it through.

## Resolution

root_cause: |
  TWO separate missing-initialization problems:

  1. CATEGORY FILTER (event-form.tsx):
     categoryFilter local state is unconditionally initialized to null (line 74).
     When `event` prop is provided (edit mode), `event.route.categoryId` is available
     immediately but is never used to seed useState. The fix is a lazy initializer:
     `useState<number | null>(event?.route?.categoryId ?? null)`.
     Note: because defaultValues is computed outside the form (not in a useMemo), and
     useState only uses its argument on the FIRST render, passing the event prop value
     as the initial state is safe and correct.

  2. HOST DEFAULT FOR INSTANCE (events-page.tsx + event-form.tsx):
     The InstanceDefaults interface has no hostId field, and editingDefaultValues (built
     in events-page.tsx) never includes one. The EventForm instanceDefaults branch
     hardcodes `hostId: null`. There is no path for the template's hostId to reach the form.
     The CalendarEvent shape carries hostName (string) but not hostId (number), so the
     template must be looked up. The fix requires:
       (a) Add `hostId?: number | null` to the InstanceDefaults interface in event-form.tsx
       (b) Use it in the instanceDefaults branch: `hostId: instanceDefaults.hostId ?? null`
       (c) In events-page.tsx, import useRecurringTemplates, look up the template by
           `editingInstance.recurringTemplateId`, and include its `hostId` when building
           editingDefaultValues.

fix: n/a — diagnosis only
verification: n/a
files_changed: []
