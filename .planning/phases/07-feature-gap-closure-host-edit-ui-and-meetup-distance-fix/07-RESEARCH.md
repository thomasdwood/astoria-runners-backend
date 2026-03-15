# Phase 7: Feature Gap Closure — Host Edit UI and Meetup Distance Fix - Research

**Researched:** 2026-03-14
**Domain:** React/TypeScript frontend wiring; CalendarEvent type extension; client-side template rendering
**Confidence:** HIGH

## Summary

This phase closes two functional gaps identified in the v1.0 audit. Both gaps are purely frontend changes with no new backend work required — the API and service layer are already complete and correct.

**Gap 1 — `{{distance}}` blank in Meetup template for virtual recurring instances.** `generateClientSideDescription()` in `meetup-export-popover.tsx` passes `distance: ''` (hardcoded empty string) when rendering the custom template. The `distance` field exists on the `Route` type and is included in DB event descriptions (via the backend `meetupExportService`), but `CalendarEvent` (both the backend `calendarHelpers.ts` interface and the frontend `types/index.ts`) does not carry `distance`. The fix is: add `distance` to `CalendarEvent`, populate it from `route.distance` in `formatEventForCalendar()`, and pass it through in `generateClientSideDescription()`.

**Gap 2 — No host edit UI in Settings.** `settings-page.tsx` imports `useUpdateHost` from `@/hooks/use-hosts` — wait, actually it does NOT. Looking at the current import: `import { useHosts, useCreateHost, useDeleteHost } from '@/hooks/use-hosts'`. The `useUpdateHost` hook exists in `use-hosts.ts` but is never imported or called in the settings page. The hosts table shows only a Delete action (Trash2 icon), no Edit action. The `PUT /api/hosts/:id` route is implemented, validated, and working. The fix is: import `useUpdateHost`, add edit state management (mirrors the category edit pattern already present), and add a Pencil button + edit dialog to the hosts table.

**Primary recommendation:** Both fixes are isolated UI-layer changes. Address them in two separate plans as scoped: 07-01 for the `distance` data-flow fix, 07-02 for the host edit UI wiring.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EXPORT-02 | Template supports variables: distance, route name, category, end location, Strava route link | Fix is: add `distance` to `CalendarEvent` type + `formatEventForCalendar()` + `generateClientSideDescription()`. All other variables already work. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React + TypeScript | Already installed | Component state, types | Project standard |
| @tanstack/react-query | Already installed | `useUpdateHost` mutation | Already used for all other CRUD operations |
| Zod (backend) | Already installed | `updateHostSchema` validation | Already wired in `PUT /api/hosts/:id` route |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Radix Dialog | Already installed | Host edit dialog | Same pattern as category edit dialog already in settings-page.tsx |
| Lucide React | Already installed | Pencil icon for edit button | Already used throughout — `Pencil` imported for category edit |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate Dialog for host edit | Inline editing in table row | Dialog is consistent with the category edit pattern already in the page — less divergence |

**Installation:** No new dependencies required.

## Architecture Patterns

### Recommended Project Structure

No new files. Changes touch:
```
client/src/
├── types/index.ts                              # Add distance to CalendarEvent
├── components/events/meetup-export-popover.tsx # Pass distance through generateClientSideDescription
├── pages/admin/settings-page.tsx               # Add host edit state + dialog + Pencil button
src/
└── utils/calendarHelpers.ts                    # Add distance to CalendarEvent interface + formatEventForCalendar
```

### Pattern 1: CalendarEvent Type Extension

**What:** Add `distance: number` field to `CalendarEvent` in both the backend interface (`src/utils/calendarHelpers.ts`) and frontend type (`client/src/types/index.ts`).

**When to use:** When a field exists on the Route and is needed downstream in the client-side template renderer.

**What it looks like now (calendarHelpers.ts):**
```typescript
// src/utils/calendarHelpers.ts — CalendarEvent interface (line 17-36)
export interface CalendarEvent {
  id: number | null;
  title: string;
  // ... other fields
  stravaUrl: string | null;
  // distance is NOT present
}

// formatEventForCalendar (line 63-90)
export function formatEventForCalendar(event: any, timezone: string = 'America/New_York'): CalendarEvent {
  return {
    // ...
    stravaUrl: event.route?.stravaUrl ?? null,
    // distance is NOT mapped
  };
}
```

**After fix:**
```typescript
// Add to CalendarEvent interface
distance: number | null;

// Add to formatEventForCalendar return
distance: event.route?.distance ? Number(event.route.distance) : null,
```

Note: `route.distance` is `numeric(5,2)` in the DB — Drizzle returns it as a string. The existing pattern (from `formatRoute` in `routeService.ts` and `meetupExportService.ts`) is `Number(event.route.distance)`. Apply the same coercion here.

### Pattern 2: generateClientSideDescription distance wiring

**What:** Replace the hardcoded `distance: ''` in `generateClientSideDescription()` with the actual value from the `CalendarEvent`.

**Current code (meetup-export-popover.tsx, lines 47-60):**
```typescript
return applyTemplate(templateOverride, {
  routeName: ce.title,
  distance: '',           // <-- BUG: always blank
  startLocation: ce.startLocation ?? '',
  // ...
}).trim();
```

**After fix:**
```typescript
distance: ce.distance != null ? String(ce.distance) : '',
```

### Pattern 3: Host Edit UI — mirroring the Category Edit pattern

**What:** The category edit flow in `settings-page.tsx` is the exact model to follow for host edit.

**Category edit state (current):**
```typescript
const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
const [editingCategory, setEditingCategory] = useState<Category | undefined>();
```

**Corresponding host edit state to add:**
```typescript
const updateHost = useUpdateHost();           // import from @/hooks/use-hosts
const [editingHost, setEditingHost] = useState<Host | undefined>();
const [editHostDialogOpen, setEditHostDialogOpen] = useState(false);
const [editHostNameInput, setEditHostNameInput] = useState('');
const [editHostEmailInput, setEditHostEmailInput] = useState('');
```

**Pattern: open edit dialog pre-filled with current values:**
```typescript
function openEditHost(host: Host) {
  setEditingHost(host);
  setEditHostNameInput(host.name);
  setEditHostEmailInput(host.email ?? '');
  setEditHostDialogOpen(true);
}
```

**Pattern: submit handler:**
```typescript
async function handleUpdateHost() {
  if (!editingHost || !editHostNameInput.trim()) return;
  try {
    await updateHost.mutateAsync({
      id: editingHost.id,
      data: {
        name: editHostNameInput.trim(),
        email: editHostEmailInput.trim() || null,
      },
    });
    toast.success('Host updated');
    setEditHostDialogOpen(false);
  } catch {
    toast.error('Failed to update host');
  }
}
```

**Pattern: Pencil button in hosts table (mirrors category table):**
```tsx
<Button variant="ghost" size="icon" onClick={() => openEditHost(host)}>
  <Pencil className="h-4 w-4" />
</Button>
```

### Anti-Patterns to Avoid

- **Do NOT add `distance` as required (non-nullable) without verifying the `route` join is always present.** The `formatEventForCalendar` function accepts `any` — use `event.route?.distance` with optional chaining and map to `number | null`.
- **Do NOT share the "Add Host" dialog for editing.** Separate dialogs avoid state bleed between create and edit flows.
- **Do NOT pass `distance` as a raw number to the template substitution.** Convert to string: `String(ce.distance)` — `applyTemplate` works on `Record<string, string>`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Host PUT API | Custom fetch | `useUpdateHost()` hook in `use-hosts.ts` | Already exists, wires cache invalidation |
| Edit dialog UI | Custom modal | Radix `Dialog` + `DialogContent` | Already used in this exact file for category edit and host create |
| Input validation (client) | Manual checks | Trim + empty-string guard (same as `handleCreateHost`) | No Zod needed client-side for this simple form |

## Common Pitfalls

### Pitfall 1: distance as string from DB

**What goes wrong:** `route.distance` is `numeric(5,2)` — Drizzle returns it as a `string` (e.g. `"6.20"`). Passing it directly to the template renders `"6.20"` not `6.2`.
**Why it happens:** PostgreSQL `numeric` maps to JS string in Drizzle to preserve precision.
**How to avoid:** Use `Number(event.route.distance)` then `String(ce.distance)` — or format as desired. The existing `meetupExportService` and `formatRoute` already use `Number(...)` for this field. Match that pattern.
**Warning signs:** Template renders `{{distance}}` as `"6.20"` with trailing zero instead of `6.2`.

### Pitfall 2: CalendarEvent type mismatch between backend and frontend

**What goes wrong:** `CalendarEvent` is defined in two places: `src/utils/calendarHelpers.ts` (backend, used by `formatEventForCalendar`) and `client/src/types/index.ts` (frontend, used by all React components). Both must be updated or TypeScript will catch it in one direction but miss the other.
**Why it happens:** The type is duplicated — it is not a shared package.
**How to avoid:** Update both files in the same task. The fields must match identically.

### Pitfall 3: useUpdateHost mutation argument shape

**What goes wrong:** `useUpdateHost` takes `{ id: number; data: { name?: string; email?: string | null } }` — the `data` wrapper is required. Passing `{ id, name, email }` flat will fail TypeScript.
**Why it happens:** The mutation shape was defined in `use-hosts.ts` line 27: `{ id: number; data: ... }`.
**How to avoid:** Follow the exact `useUpdateHost` signature: `updateHost.mutateAsync({ id: editingHost.id, data: { name: ..., email: ... } })`.

### Pitfall 4: Edit dialog not resetting on close

**What goes wrong:** If edit state is not cleared when the dialog closes, reopening "Add Host" after editing may show stale values.
**Why it happens:** Shared or non-reset state.
**How to avoid:** Reset `editHostNameInput` and `editHostEmailInput` in the `onOpenChange` handler for the edit dialog (same pattern as the existing Add Host dialog in the page).

## Code Examples

### distance field: backend CalendarEvent interface

```typescript
// Source: src/utils/calendarHelpers.ts (current, lines 17-36)
// Add this field to the CalendarEvent interface:
distance: number | null;

// And in formatEventForCalendar return object:
distance: event.route?.distance != null ? Number(event.route.distance) : null,
```

### distance field: frontend CalendarEvent type

```typescript
// Source: client/src/types/index.ts (current, lines 97-116)
// Add this field to the CalendarEvent interface:
distance: number | null;
```

### generateClientSideDescription: distance variable

```typescript
// Source: client/src/components/events/meetup-export-popover.tsx (line 48)
// Change:
distance: '',
// To:
distance: ce.distance != null ? String(ce.distance) : '',
```

### useUpdateHost import in settings-page

```typescript
// Source: client/src/hooks/use-hosts.ts
// Change current import line from:
import { useHosts, useCreateHost, useDeleteHost } from '@/hooks/use-hosts';
// To:
import { useHosts, useCreateHost, useUpdateHost, useDeleteHost } from '@/hooks/use-hosts';
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `postedToMeetup` boolean | `meetupUrl varchar(500)` | Phase 5 | URL presence is the posted indicator |
| Server-side description only | Client-side for virtual instances | Phase 5-03 | Avoids materializing virtual events just to generate description |

**Deprecated/outdated:**
- Hardcoded `distance: ''` in client-side template path: introduced as a stub in Phase 5-03, needs to be filled in as part of EXPORT-02.

## Open Questions

1. **Should `distance` be `number | null` or `number`?**
   - What we know: `route.distance` is `NOT NULL` in the DB schema, so it is always present on DB events. Virtual instances also carry `route` with full data.
   - What's unclear: Whether `formatEventForCalendar` is ever called without a `route` (the function accepts `any`).
   - Recommendation: Use `number | null` for safety, with `event.route?.distance != null ? Number(event.route.distance) : null`. Template renders empty string for null — acceptable fallback.

2. **Should host edit dialog reuse the Add Host dialog JSX?**
   - What we know: Category uses a separate `CategoryForm` component and a shared Dialog open-state. Host create is inlined in a Dialog directly.
   - What's unclear: Whether to extract a `HostForm` component or keep it inline.
   - Recommendation: Keep inline — host form is simple (2 fields: name + email). Extracting a component is over-engineering for this scope.

## Validation Architecture

> `workflow.nyquist_validation` is absent from `.planning/config.json` — treat as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no jest.config, vitest.config, pytest.ini found in project |
| Config file | None — see Wave 0 |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXPORT-02 | `{{distance}}` renders correctly in client-side Meetup template for virtual recurring instances | manual-only | N/A — no frontend test runner configured | ❌ Wave 0 |
| (host edit) | Host can be edited via Settings page | manual-only | N/A — no frontend test runner configured | ❌ Wave 0 |

**Manual-only justification:** There is no test framework installed in this project (no jest, vitest, or pytest config found). Both changes are pure UI/type wiring changes that require a running dev environment to verify.

### Sampling Rate
- **Per task commit:** Manual verification: open MeetupExportPopover for a virtual recurring instance, confirm `{{distance}}` renders the route distance value
- **Per wave merge:** Confirm host edit dialog in Settings saves and shows updated name/email
- **Phase gate:** Both manual checks green before `/gsd:verify-work`

### Wave 0 Gaps
- None — no test infrastructure gaps to fill (no test runner configured, manual verification is the gate)

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `client/src/components/events/meetup-export-popover.tsx` — confirmed `distance: ''` hardcoded on line 48
- Direct code inspection: `src/utils/calendarHelpers.ts` — confirmed `distance` absent from `CalendarEvent` interface and `formatEventForCalendar` return
- Direct code inspection: `client/src/types/index.ts` — confirmed `distance` absent from frontend `CalendarEvent`
- Direct code inspection: `client/src/pages/admin/settings-page.tsx` — confirmed `useUpdateHost` not imported, only Delete action in hosts table
- Direct code inspection: `client/src/hooks/use-hosts.ts` — confirmed `useUpdateHost` exists and is ready to use
- Direct code inspection: `src/routes/hosts.ts` — confirmed `PUT /:id` is implemented, auth-protected, Zod-validated

### Secondary (MEDIUM confidence)
- Cross-reference: `src/services/meetupExportService.ts` confirms `distance` comes through as string from DB and is coerced with `Number()` — validates the coercion pattern to use in `formatEventForCalendar`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, no new dependencies
- Architecture: HIGH — both bugs identified precisely from direct code inspection; fix paths are unambiguous
- Pitfalls: HIGH — distance-as-string is confirmed from DB schema; type duplication confirmed from file inspection

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable codebase, no external dependencies changing)
