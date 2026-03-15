# Phase 5: Hosts, Meetup Workflow & Calendar Polish - Research

**Researched:** 2026-03-14
**Domain:** Full-stack TypeScript — Drizzle ORM schema migrations, Express service layer, React/TanStack Query frontend, Radix UI
**Confidence:** HIGH

## Summary

Phase 5 extends the existing application with four distinct but interconnected feature clusters: a hosts management system (new DB table + CRUD), Meetup URL tracking (replacing the `postedToMeetup` boolean), a configurable Meetup description template (extending the settings key-value store), and richer calendar event overlays. Two pre-existing pending items are also bundled: route dropdown category filter on the event form, and cancel/restore actions for one-off (non-recurring) events.

The codebase is mature and well-patterned. Every new feature in this phase follows an established pattern already present in the codebase — the hosts system mirrors the categories system, the meetupUrl column mirrors stravaUrl, the description template mirrors `default_start_location`, and the calendar overlay extension mirrors the existing `formatEventForCalendar` / `CalendarEvent` interface pipeline. There are no new third-party dependencies required.

The one structural concern is DB migration state. The existing migration `0000_loving_famine.sql` does NOT include `routes.strava_url` (added in Phase 3.1/04-03 via `drizzle-kit push` rather than a tracked migration). Phase 5 must create a new migration that is accurate to the CURRENT live schema — meaning it needs to be generated against the real DB state, not diffed naively from the snapshot. This is the most technically risky task in the phase.

**Primary recommendation:** Start with DB schema + migration (05-01), then backend (05-02), then settings page (05-03), then event form (05-04), then calendar overlay (05-05). This ordering ensures each plan has the schema and API it depends on.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SC-1 | Events can have a host assigned from a managed hosts list | New `hosts` table + `hostId` FK on `events`; mirrors categories pattern |
| SC-2 | Recurring templates can have a default host | `hostId` FK on `recurring_templates`; same pattern as `routeId` FK |
| SC-3 | Admins can add/remove hosts from the settings page | New hostsService + CRUD API; settings-page UI section mirrors categories section |
| SC-4 | Meetup URL replaces "posted to Meetup" checkbox | Replace `postedToMeetup boolean` column with `meetupUrl varchar` on events; derive status from URL presence |
| SC-5 | Default Meetup description template configurable from settings with variable substitution | Add `meetup_description_template` key to settings store; template engine using string replace |
| SC-6 | Calendar event overlay shows host, Meetup link, and Strava route link when set | Extend `CalendarEvent` interface + `formatEventForCalendar` + `EventPopover` component |
| SC-7 | Route dropdown on event form is filterable by category | Category filter Select above route Select in `EventForm`; JS-side filter of `routes` array |
| SC-8 | Cancel/restore actions work for one-off events (not just recurring instances) | Add XCircle/RotateCcw actions to `kind: 'one-off'` rows in events-page; PATCH `isCancelled` endpoint |
| SC-9 | DB migration state is clean — all schema changes tracked via drizzle migrations | Generate migration against live DB; resolve stravaUrl column gap in migration history |
</phase_requirements>

## Standard Stack

### Core (already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | ^0.45.1 | ORM + relational queries | Already used for all DB access |
| drizzle-kit | ^0.31.9 | Schema migrations (`db:generate`, `db:migrate`) | Already configured with `drizzle.config.ts` |
| zod | ^4.3.6 (server), ^3.24.0 (client) | Validation schemas | Used for every API endpoint |
| @tanstack/react-query | ^5.62.0 | Server state caching | All API calls use this pattern |
| react-hook-form + @hookform/resolvers | ^7.54.0 / ^3.9.1 | Form state | All admin forms use this |
| @radix-ui/react-select | ^2.1.4 | Accessible Select dropdown | Used in all existing dropdowns |
| @radix-ui/react-popover | ^1.1.4 | Event detail overlay | EventPopover already uses this |

### No New Dependencies Required

All required UI primitives (Select, Input, Textarea, Switch, Table, Dialog, Badge, Button) are already installed in the client. All required backend utilities (drizzle-orm, zod, express, asyncHandler) are already installed. The template variable substitution for the Meetup description can be handled with simple string replace (no Handlebars or template engines — consistent with Phase 4 decision).

## Architecture Patterns

### Established Patterns to Follow

**Service layer pattern** — every DB table has a `src/services/{entity}Service.ts` with typed functions returning discriminated unions (`{ error: 'not_found' } | { entity: T }`).

**Route file pattern** — `src/routes/{entity}.ts` imports from service, uses `requireAuth` middleware at router level, uses `validateBody`/`validateQuery` middleware, uses `asyncHandler` wrapper.

**Drizzle relational queries** — `db.query.{table}.findFirst/findMany({ with: { relation: true } })` for joins. Used in eventService, recurringService.

**CalendarEvent pipeline** — `formatEventForCalendar(event: any)` in `src/utils/calendarHelpers.ts` maps raw DB/virtual events to the flat `CalendarEvent` interface. The interface is mirrored in `client/src/types/index.ts`. Both must be updated together.

**Settings store** — key-value store in `settings` table. New settings are read via `getSetting(key)` / written via `upsertSetting(key, value)`. Initialized via seed script.

**Categories pattern for hosts** — The `categories` table + `categoryService` + `src/routes/categories.ts` is the exact template for the `hosts` table. The SettingsPage categories section is the exact template for the hosts section.

### Recommended Project Structure (additions only)

```
src/
├── db/schema/
│   └── hosts.ts              # NEW: hosts table schema
├── services/
│   └── hostsService.ts       # NEW: listHosts, createHost, updateHost, deleteHost
├── routes/
│   └── hosts.ts              # NEW: GET /, POST /, PUT /:id, DELETE /:id
└── db/migrations/
    └── 0001_phase5.sql       # NEW: generated migration for all Phase 5 schema changes

client/src/
├── hooks/
│   └── use-hosts.ts          # NEW: useHosts, useCreateHost, useUpdateHost, useDeleteHost
└── components/
    └── shared/
        └── host-badge.tsx    # OPTIONAL: reusable host display component
```

### Pattern 1: Hosts Table (mirrors categories exactly)

```typescript
// src/db/schema/hosts.ts
import { pgTable, serial, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from './users.js';

export const hosts = pgTable('hosts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),          // nullable
  userId: integer('user_id').references(() => users.id), // nullable FK
  version: integer('version').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Host = InferSelectModel<typeof hosts>;
export type NewHost = InferInsertModel<typeof hosts>;
```

**When to use:** Whenever a host needs to be created, listed, or associated with an event.

### Pattern 2: Meetup URL replaces postedToMeetup

The `postedToMeetup boolean` column is replaced with `meetupUrl varchar(500)`. The UI derives "posted" status from `meetupUrl IS NOT NULL`. The `updateMeetupStatus` service function is replaced by a `updateMeetupUrl` function using the same bypass-version-increment pattern.

The `PATCH /api/events/:id/meetup-status` endpoint becomes `PATCH /api/events/:id/meetup-url`. The frontend `useUpdateMeetupStatus` hook becomes `useUpdateMeetupUrl`.

In `events-page.tsx`, the current logic `ev.postedToMeetup ? <Badge> : <MeetupExportPopover>` becomes `ev.meetupUrl ? <Badge with link> : <MeetupExportPopover with URL input>`.

### Pattern 3: Template Variable Substitution

Consistent with Phase 4 decision ("template literals instead of Handlebars for simple template generation"), use simple `String.prototype.replace` with a variable map:

```typescript
// src/services/meetupExportService.ts (extension)
const TEMPLATE_VARS = {
  '{{routeName}}': params.routeName,
  '{{distance}}': String(params.distance),
  '{{startLocation}}': params.startLocation ?? '',
  '{{endLocation}}': params.endLocation ?? '',
  '{{routeLink}}': params.stravaUrl ?? '',
  '{{host}}': params.hostName ?? '',
  '{{notes}}': params.notes ?? '',
};

function applyTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [key, val]) => acc.replaceAll(key, val),
    template
  );
}
```

The setting key is `meetup_description_template`. If not set, fall back to the hardcoded template.

### Pattern 4: Cancel/Restore for One-Off Events

Currently `isCancelled` is only set by the `useCancelRecurringInstance` hook (which creates a new event row with `isCancelled: true`). For one-off events that already exist in the DB, a simpler PATCH approach is used.

The missing backend endpoint: `PATCH /api/events/:id/cancel` and `PATCH /api/events/:id/restore`. Both bypass version increment (same pattern as `meetup-status`). In `events-page.tsx`, the `kind: 'one-off'` row needs XCircle and RotateCcw action buttons added (currently only Pencil and Trash2 are shown for one-off rows).

### Pattern 5: CalendarEvent Extension (host, meetupUrl, stravaUrl)

The `CalendarEvent` interface in `src/utils/calendarHelpers.ts` and `client/src/types/index.ts` must gain three new optional fields:

```typescript
// Both calendarHelpers.ts and client/src/types/index.ts
interface CalendarEvent {
  // ... existing fields ...
  hostName: string | null;       // NEW
  meetupUrl: string | null;      // NEW
  stravaUrl: string | null;      // NEW (from route)
}
```

`formatEventForCalendar` maps: `hostName: event.host?.name ?? null`, `meetupUrl: event.meetupUrl ?? null`, `stravaUrl: event.route?.stravaUrl ?? null`.

`EventPopover` renders these conditionally with appropriate icons (ExternalLink for links, User for host).

### Pattern 6: Route Dropdown Category Filter

In `EventForm`, above the route `<Select>`, add a category filter `<Select>` (default "All categories"). Filter the `routes` array client-side:

```typescript
const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
const filteredRoutes = categoryFilter
  ? routes?.filter(r => r.categoryId === categoryFilter)
  : routes;
```

No API changes needed — all routes are already fetched by `useRoutes()`. The category data is fetched by `useCategories()` (already available in many components).

### Anti-Patterns to Avoid

- **New migration without resolving snapshot gap:** Running `drizzle-kit generate` against the snapshot (which lacks `strava_url`) will produce a migration that tries to ADD `strava_url` even though it already exists in the live DB. Must use `drizzle-kit push --dry-run` or a custom baseline approach to reconcile.
- **Deleting `postedToMeetup` without data migration:** Existing rows have `postedToMeetup = true`. Before dropping the column, decide whether to migrate those booleans to a placeholder meetupUrl value or simply drop the data (acceptable since it's a status flag, not a URL).
- **Adding `hostId` without ON DELETE SET NULL:** If a host is deleted and events reference them, the FK must cascade to NULL or be blocked. Use `ON DELETE SET NULL` for the `hostId` FK on both events and recurring_templates.
- **Version-incrementing meetup URL updates:** Consistent with the `postedToMeetup` pattern established in Phase 4, `meetupUrl` updates bypass the version counter. This is metadata, not structural event data.
- **Duplicating CalendarEvent interface:** The interface is defined in `src/utils/calendarHelpers.ts` (backend) AND mirrored in `client/src/types/index.ts` (frontend). Both MUST be updated. The backend is the source of truth.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Template variable substitution | Custom parser/AST | `String.replaceAll` with a vars map | Established in Phase 4; Handlebars is overkill for 6 variables |
| Hosts CRUD | Custom service boilerplate | Copy categories service pattern verbatim | Pattern already works, test against it |
| DB migration | Manual SQL | `npm run db:generate` + `npm run db:migrate` | Drizzle tracks schema snapshots; hand-writing SQL bypasses this |
| Client-side route filtering | API endpoint with filter | JS `.filter()` on already-fetched routes | Route list is small; consistent with categoryId filtering pattern |
| Cancel/restore one-off | New event row pattern | PATCH existing row `isCancelled` field | Recurring cancel needs new row (no existing row); one-off HAS an existing row |

**Key insight:** Every pattern in Phase 5 already exists in the codebase. The task is extension, not invention.

## Common Pitfalls

### Pitfall 1: Migration Snapshot Drift

**What goes wrong:** `routes.strava_url` was added via `drizzle-kit push` (Phase 04-03) without running `db:generate`. The migration snapshot `0000_snapshot.json` does NOT include this column. Running `db:generate` will produce a migration that tries to ADD `strava_url` — applying this migration to the live DB will fail with "column already exists."

**Why it happens:** `db:push` applies schema to the DB directly but does not create a migration file or update the journal. The snapshot diverges from reality.

**How to avoid:** Before generating the Phase 5 migration, reconcile the snapshot. Options:
1. Generate the migration with `db:generate`, then manually edit the SQL to remove the `ADD COLUMN strava_url` statement (the column already exists).
2. Or use `drizzle-kit push` to sync the DB to current schema state, then generate a clean baseline migration.

The safest approach: generate, inspect, edit out the `strava_url` ADD statement, then apply.

**Warning signs:** Migration SQL contains `ALTER TABLE "routes" ADD COLUMN "strava_url"` — this means the snapshot was stale.

### Pitfall 2: hostId ON DELETE Behavior

**What goes wrong:** If `hostId` on events uses the default `ON DELETE NO ACTION` (Drizzle default), attempting to delete a host that is referenced by events will throw a FK constraint error.

**Why it happens:** Drizzle's `.references()` without explicit `onDelete` uses `NO ACTION`.

**How to avoid:** Use `onDelete: 'set null'` on the hostId FK definition:
```typescript
hostId: integer('host_id').references(() => hosts.id, { onDelete: 'set null' })
```

### Pitfall 3: Zod Version Mismatch Between Client and Server

**What goes wrong:** Server uses zod `^4.3.6`; client uses zod `^3.24.0`. Some Zod v4 APIs differ from v3. If validation schemas are shared or copied between server and client, incompatibilities appear.

**Why it happens:** The client pinned Zod v3 while the server upgraded to v4.

**How to avoid:** Keep validation schemas strictly separate. Server schemas in `src/validation/`, client schemas inline in form components using v3 patterns. Never import server schemas in client code.

### Pitfall 4: postedToMeetup Removal — useUpdateMeetupStatus Hook Still References It

**What goes wrong:** After removing `postedToMeetup` from the DB schema and Event type, any frontend code that reads `ev.postedToMeetup` will silently become `undefined` (TypeScript won't catch it if not updated). The `useUpdateMeetupStatus` mutation also sends `{ postedToMeetup: boolean }` to a now-removed endpoint.

**Why it happens:** Multiple touch points: DB schema, Drizzle type, API response type, frontend Event type, events-page.tsx conditional render, useUpdateMeetupStatus hook.

**How to avoid:** 05-01 schema plan removes the column and adds the type. 05-02 backend plan removes the endpoint and service function. 05-04 frontend plan removes all `postedToMeetup` references. Treat this as a coordinated rename, not a simple addition.

### Pitfall 5: CalendarEvent Pipeline — Backend and Frontend Must Stay in Sync

**What goes wrong:** `CalendarEvent` is defined in two places: `src/utils/calendarHelpers.ts` (backend, TypeScript) and `client/src/types/index.ts` (frontend). Adding `hostName`/`meetupUrl`/`stravaUrl` to one but not the other causes type errors or silent undefined values.

**Why it happens:** The interface is duplicated by design (no shared types package). Updating requires touching both files.

**How to avoid:** 05-02 updates the backend interface and `formatEventForCalendar`. 05-05 or 05-02 updates the frontend type. Document in the plan that both must change together.

### Pitfall 6: Virtual Recurring Instances Have No hostId/meetupUrl

**What goes wrong:** Virtual recurring instances (generated by `recurringService.getAllInstancesInRange`) don't have a DB row — they're constructed from the template. The template has a `hostId` but the virtual instance might not carry it through to `formatEventForCalendar`.

**Why it happens:** The recurring service builds lightweight virtual event objects. The `formatEventForCalendar(event: any)` function relies on `event.host?.name` — but virtual instances are constructed without the full relational join.

**How to avoid:** In `recurringService.ts`, when building virtual instances, include the resolved host object from the template. The template's `with: { host: true }` relation query provides the host. Pass it through to the virtual instance object so `formatEventForCalendar` can map it.

## Code Examples

### Adding a FK column with ON DELETE SET NULL (Drizzle)

```typescript
// In schema file — correct FK with cascade
hostId: integer('host_id').references(() => hosts.id, { onDelete: 'set null' })
```

### Hosts service — listHosts (mirrors categoryService.listCategories)

```typescript
export async function listHosts() {
  return db.select().from(hosts).orderBy(hosts.name);
}
```

### upsertSetting pattern for description template

```typescript
// Already exists in settingsService.ts — just call with new key
await upsertSetting('meetup_description_template', templateText);
const template = await getSetting('meetup_description_template');
```

### Extending formatEventForCalendar

```typescript
// src/utils/calendarHelpers.ts
export function formatEventForCalendar(event: any, timezone = 'America/New_York'): CalendarEvent {
  return {
    // ... existing fields ...
    hostName: event.host?.name ?? null,
    meetupUrl: event.meetupUrl ?? null,
    stravaUrl: event.route?.stravaUrl ?? null,
  };
}
```

### Cancel one-off event — PATCH endpoint

```typescript
// PATCH /api/events/:id/cancel — bypass version increment (metadata pattern)
router.patch('/:id/cancel', requireAuth, asyncHandler(async (req, res) => {
  const [updated] = await db
    .update(events)
    .set({ isCancelled: true, updatedAt: sql`NOW()` })
    .where(eq(events.id, id))
    .returning();
  // ...
}));
```

### Route dropdown category filter (EventForm)

```typescript
const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
const { data: categories } = useCategories();
const filteredRoutes = categoryFilter
  ? routes?.filter(r => r.categoryId === categoryFilter)
  : routes;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `postedToMeetup: boolean` flag | `meetupUrl: varchar` — URL presence = posted | Phase 5 | Richer data; links are clickable in calendar overlay |
| Hardcoded Meetup description | Configurable template with variables | Phase 5 | Organizers can customize; `{{host}}` variable enables host attribution |
| Calendar overlay shows: title, time, end location, notes | Overlay adds: host, Meetup link, Strava route link | Phase 5 | Public users see richer info directly |
| Cancel/restore only for recurring instances | Cancel/restore for ALL event types | Phase 5 | Fixes UAT gap — one-off events can be cancelled too |

**Deprecated/outdated:**
- `postedToMeetup: boolean` on events: replaced by `meetupUrl`; column dropped in Phase 5 migration
- `PATCH /api/events/:id/meetup-status`: removed; replaced by `PATCH /api/events/:id/meetup-url`
- `useUpdateMeetupStatus`: removed from `use-events.ts`; replaced by `useUpdateMeetupUrl`

## Open Questions

1. **stravaUrl migration gap resolution**
   - What we know: `strava_url` column was added to routes table via `db:push`, not tracked in migration
   - What's unclear: Does the `0000_snapshot.json` reflect this? (Based on the migration SQL file content, it does NOT contain `strava_url` — confirming the drift)
   - Recommendation: In 05-01, run `db:generate`, inspect the output SQL, manually remove any `ADD COLUMN strava_url` statement if present, then apply. Document this in the plan explicitly.

2. **Host deletion behavior when referenced by events**
   - What we know: Use `ON DELETE SET NULL` on hostId FKs
   - What's unclear: Should the settings page UI warn that deleting a host will clear it from N events?
   - Recommendation: Show a confirmation dialog (consistent with category delete pattern) but do not block deletion. Let the FK cascade handle cleanup.

3. **Meetup description template — plain text only or also HTML?**
   - What we know: The existing `generateMeetupDescription` supports both plain and HTML modes
   - What's unclear: Should the template be one template applied to both, or two separate settings keys?
   - Recommendation: One template key (`meetup_description_template`) for plain text. HTML format can be derived by wrapping or using a separate generation path. Keep it simple for now.

4. **Host field on virtual recurring instances**
   - What we know: Virtual instances don't have DB rows; they're built from templates
   - What's unclear: Does `recurringService.getAllInstancesInRange` need to include host data in the virtual instance objects?
   - Recommendation: Yes — the recurring service template query must use `with: { route: true, host: true }` so the virtual instances carry host data through to `formatEventForCalendar`.

## Validation Architecture

> `workflow.nyquist_validation` is not set in `.planning/config.json` — treating as enabled (key absent = enabled).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no test files, no jest.config, no vitest.config, no pytest.ini |
| Config file | None — Wave 0 gap |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SC-1 | Host can be created and returned | unit | N/A — no test infra | Wave 0 gap |
| SC-4 | meetupUrl replaces postedToMeetup | unit | N/A | Wave 0 gap |
| SC-5 | Template variables substituted correctly | unit | N/A | Wave 0 gap |
| SC-6 | CalendarEvent includes host/meetupUrl/stravaUrl | unit | N/A | Wave 0 gap |
| SC-8 | One-off event cancel/restore updates isCancelled | unit | N/A | Wave 0 gap |
| SC-9 | Migration applies cleanly | smoke (manual) | `npm run db:migrate && npm run db:seed` | ❌ manual |

### Sampling Rate

- **Per task commit:** No automated tests — manual smoke via `npm run dev:all` and browser verification
- **Per wave merge:** Manual end-to-end verification of affected pages
- **Phase gate:** Full UAT checklist before `/gsd:verify-work`

### Wave 0 Gaps

No test infrastructure exists. This is a known project state. The planner should NOT add test setup tasks to Phase 5 — this is out of scope and would be a large undertaking. Manual verification is the current pattern for this project.

## Sources

### Primary (HIGH confidence)

All findings based on direct inspection of the live codebase at commit `c8fbb67`:

- `src/db/schema/*.ts` — Current schema definitions (events, routes, recurringTemplates, categories, settings, users)
- `src/db/migrations/0000_loving_famine.sql` — Confirmed `strava_url` absent from migration (snapshot drift issue)
- `src/db/migrations/meta/_journal.json` — Confirmed only one migration entry exists
- `src/services/categoryService.ts` — Template pattern for hostsService
- `src/services/settingsService.ts` — `getSetting`/`upsertSetting` pattern for template setting
- `src/services/eventService.ts` — `updateMeetupStatus` pattern for `updateMeetupUrl`; `postedToMeetup` bypass pattern
- `src/utils/calendarHelpers.ts` — `CalendarEvent` interface and `formatEventForCalendar` function
- `src/routes/events.ts` — Event route patterns including `meetup-status` endpoint
- `src/routes/settings.ts` — Settings CRUD pattern
- `client/src/pages/admin/settings-page.tsx` — Full categories + settings UI pattern
- `client/src/pages/admin/events-page.tsx` — Full events table with cancel/restore pattern
- `client/src/components/events/event-form.tsx` — Route Select pattern for category filter addition
- `client/src/components/calendar/event-popover.tsx` — Current overlay showing title/time/location/notes
- `client/src/types/index.ts` — Frontend type definitions including CalendarEvent
- `package.json` + `client/package.json` — Confirmed available libraries, Zod version split
- `drizzle.config.ts` — Migration output directory and dialect
- `.planning/STATE.md` — Phase 4 decisions, established patterns, pending todos
- `.planning/todos/pending/*.md` — Detailed scope of all 5 pending todo items

### Secondary (MEDIUM confidence)

- `.planning/phases/04-integrations-export/04-03-SUMMARY.md` — Confirms `strava_url` was added via `db:push` without a tracked migration

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json and all service/component code
- Architecture patterns: HIGH — all patterns read directly from live codebase
- Migration gap issue: HIGH — confirmed by comparing schema file to migration SQL
- Pitfalls: HIGH — derived from established decisions in STATE.md and code inspection
- Validation: HIGH — no test infra confirmed by filesystem scan

**Research date:** 2026-03-14
**Valid until:** Stable — no fast-moving dependencies; codebase patterns are project-specific
