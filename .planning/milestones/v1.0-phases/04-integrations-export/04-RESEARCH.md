# Phase 4: Integrations & Export - Research

**Researched:** 2026-02-24
**Domain:** Discord webhook notifications, Meetup description export
**Confidence:** HIGH

## Summary

Phase 4 was previously executed before Phase 3.1, so Discord service (`src/services/discordService.ts`) and Meetup export service (`src/services/meetupExportService.ts`) already exist in the codebase. However, Phase 3.1 significantly changed the data model — categories are now a `categories` table with FK instead of a string enum, `startLocation` was added to routes and events, settings table exists for default start location, and recurring templates support complex patterns (bySetPos, monthly).

The existing Discord service has three critical issues: (1) uses hardcoded action-based colors (green/orange/red) instead of category-based colors, (2) the `EventWithRoute` interface expects `route.category` as a string but it's now an object `{ id, name, color, icon }`, and (3) it has no `startLocation` field support. The existing Meetup service has similar issues: old interface expecting `route.category` as string, no `startLocation`, and uses a 'TBD' placeholder for stravaUrl.

**Primary recommendation:** Update existing services to match the Phase 3.1 data model, add `stravaUrl` to routes, add Discord notifications for recurring templates, add settings toggle for Discord, and upgrade Meetup dialog from Dialog to Popover with format toggle.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Discord message content: Friendly run-club voice, embed color bar matches event category color (NOT action-based), conditional location fields
- Discord notification triggers: One-off events (create/update/delete), recurring templates at template level only, admin toggle in settings, non-blocking toast on failure
- Meetup template: Fixed template (not admin-customizable), auto-fills variables, add stravaUrl optional field to routes
- Meetup template format toggle: plain text or Meetup HTML — organizer picks which to copy
- Meetup export UX: Popover on event row (not dialog), manual "posted to Meetup" checkbox, "Meetup" badge on posted events

### Claude's Discretion
- Update notification format (full details vs diff-style highlighting what changed)
- Exact embed field layout and formatting
- Toast notification styling and duration
- Meetup HTML template markup specifics
- Popover component design and positioning

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INTEG-01 | System posts event announcement to Discord when event is created | Existing `notifyEventCreated` in discordService.ts — needs interface update for new category model + startLocation |
| INTEG-02 | System posts update to Discord when event is modified or deleted | Existing `notifyEventUpdated`/`notifyEventDeleted` — needs same interface updates + recurring template notifications |
| INTEG-03 | Discord announcements include event details: date, time, route, end location, notes | Existing embed fields cover this — add startLocation conditional display + category color mapping |
| EXPORT-01 | System generates Meetup event description from customizable template | Existing `generateMeetupDescription` — needs interface update + stravaUrl from route + HTML format option |
| EXPORT-02 | Template supports variables: distance, route name, category, end location, Strava route link | All variables available once stravaUrl added to routes schema |
| EXPORT-03 | Organizer can copy generated description to clipboard with one click | Existing copy button in MeetupDescriptionDialog — needs migration to Popover + format toggle |
| EXPORT-04 | Organizer can mark event as "posted to Meetup" via checkbox | Existing `postedToMeetup` field + `updateMeetupStatus` endpoint + Switch in events-page — move to Popover |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| discord-webhook-node | ^1.1.8 | Discord webhook integration | Installed, in use |
| zod | ^4.3.6 | Schema validation | Installed, in use |
| date-fns | ^4.1.0 | Date formatting | Installed, in use |

### Supporting (Already Installed)
| Library | Purpose | Used By |
|---------|---------|---------|
| @radix-ui/react-popover | Popover component | Already in project (used for location autocomplete) |
| sonner | Toast notifications | Already in project (for Discord failure warnings) |
| lucide-react | Icons | Already in project |

### No New Dependencies Required
All functionality can be built with existing libraries. No new packages needed.

## Architecture Patterns

### Existing Project Structure (Relevant Files)
```
src/
├── services/
│   ├── discordService.ts    # UPDATE: new category model, startLocation, category colors
│   ├── meetupExportService.ts # UPDATE: new category model, stravaUrl, HTML format
│   ├── eventService.ts      # UPDATE: Discord toggle check, recurring template notifications
│   ├── recurringService.ts  # UPDATE: add Discord notifications for template CRUD
│   ├── routeService.ts      # UPDATE: handle stravaUrl field
│   └── settingsService.ts   # EXISTS: can store discord_notifications_enabled
├── db/schema/
│   ├── routes.ts            # UPDATE: add stravaUrl column
│   └── events.ts            # No changes needed (postedToMeetup exists)
├── validation/
│   ├── routes.ts            # UPDATE: add stravaUrl to create/update schemas
│   └── events.ts            # UPDATE: add meetup format query param
├── routes/
│   ├── events.ts            # UPDATE: meetup endpoint adds format param
│   └── recurringTemplates.ts # UPDATE: add Discord notifications on CRUD
└── config/
    └── env.ts               # No changes (DISCORD_WEBHOOK_URL already optional)

client/src/
├── components/events/
│   ├── meetup-description-dialog.tsx  # REPLACE: convert to MeetupExportPopover
│   └── event-form.tsx                 # No changes
├── pages/admin/
│   ├── events-page.tsx               # UPDATE: use Popover, add Meetup badge, recurring instance export
│   └── settings-page.tsx             # UPDATE: add Discord toggle
├── hooks/
│   └── use-events.ts                 # UPDATE: add format param to meetup hook
├── types/
│   └── index.ts                      # UPDATE: add stravaUrl to Route
└── lib/
    └── constants.ts                  # Reference: CATEGORY_COLOR_MAP for Discord color lookup
```

### Pattern: Category Color to Discord Hex
The frontend uses `CATEGORY_COLOR_MAP` keyed by color name (amber, blue, etc.). Discord embeds use hex colors. Need a server-side mapping from category.color to hex values.

```typescript
// Discord hex colors mapped from Tailwind color names
const CATEGORY_HEX_COLORS: Record<string, number> = {
  amber: 0xF59E0B,
  orange: 0xF97316,
  emerald: 0x10B981,
  blue: 0x3B82F6,
  purple: 0xA855F7,
  red: 0xEF4444,
  pink: 0xEC4899,
  teal: 0x14B8A6,
  indigo: 0x6366F1,
  slate: 0x64748B,
};
```

### Pattern: Fire-and-Forget with Toast Feedback
Already established in eventService.ts — `.catch()` pattern for Discord. The new addition is propagating failure info back to frontend as a warning toast. Since webhooks are fire-and-forget, this requires a response header or separate mechanism. Simplest: keep current pattern (console.error server-side, event succeeds regardless). Frontend toast only if the API explicitly returns a `discordFailed` flag.

**Decision:** Add optional `discordNotificationFailed: boolean` to event create/update/delete responses. Frontend checks and shows toast.

### Pattern: Settings Toggle
Settings service already has get/upsert pattern. Add `discord_notifications_enabled` key. Check this in Discord service before sending.

```typescript
// In discordService.ts
import { getSetting } from './settingsService.js';

async function isNotificationsEnabled(): Promise<boolean> {
  if (!config.discord.webhookUrl) return false;
  const setting = await getSetting('discord_notifications_enabled');
  return setting !== 'false'; // Default to enabled if setting doesn't exist
}
```

### Pattern: Recurring Template Notifications
Per CONTEXT.md, recurring templates notify at template level:
- Create: "New recurring run: Weekly Coffee Run every Tuesday at 6:30 PM"
- Delete: "Weekly Coffee Run has been cancelled"
- No notification per-instance

### Anti-Patterns to Avoid
- **Don't use action-based embed colors** (green=create, red=delete) — use category color for all messages
- **Don't block on Discord webhooks** — always fire-and-forget with .catch()
- **Don't notify per recurring instance** — template-level only
- **Don't auto-check "posted to Meetup"** on copy — manual checkbox only

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Discord embeds | Custom HTTP requests | discord-webhook-node MessageBuilder | Already in use, handles formatting |
| Clipboard API | Custom copy logic | navigator.clipboard.writeText | Already used in existing Meetup dialog |
| Popover UI | Custom modal | @radix-ui/react-popover (via shadcn) | Already in project, used for location autocomplete |
| Toast notifications | Custom notification system | sonner (via shadcn) | Already in project |

## Common Pitfalls

### Pitfall 1: Category Object vs String
**What goes wrong:** Discord/Meetup services expect `route.category` as string, but it's now `{ id, name, color, icon }`
**Why it happens:** Phase 3.1 changed categories from enum to FK table
**How to avoid:** Update all service interfaces to use the relational query result shape
**Warning signs:** TypeScript errors with `as any` casts (already visible in eventService.ts)

### Pitfall 2: Discord Webhook Rate Limits
**What goes wrong:** Discord rate limits webhook requests (5 per 2 seconds per webhook URL)
**Why it happens:** Batch operations could trigger multiple webhooks
**How to avoid:** Fire-and-forget with catch — failures are acceptable per CONTEXT.md
**Warning signs:** 429 responses from Discord

### Pitfall 3: DB Migration for stravaUrl
**What goes wrong:** Adding column requires migration, but project uses manual schema push
**Why it happens:** STATE.md notes "DB migration state needs cleanup — schema was applied manually"
**How to avoid:** Add column to Drizzle schema, push with `drizzle-kit push`
**Warning signs:** Schema out of sync with DB

### Pitfall 4: Meetup Popover State Management
**What goes wrong:** Popover needs to load description, track format, track copy state, and meetup status
**Why it happens:** Multiple state concerns in one component
**How to avoid:** Keep state local to MeetupExportPopover component, use existing hooks
**Warning signs:** State leaking between popover instances

## Code Examples

### Discord Notification with Category Color
```typescript
// Updated EventWithRoute interface matching current data model
interface EventWithRoute {
  id: number;
  startDateTime: Date;
  startLocation: string | null;
  endLocation: string | null;
  notes: string | null;
  route: {
    name: string;
    distance: string;
    category: {
      id: number;
      name: string;
      color: string; // Tailwind color name e.g. "amber"
      icon: string;
    };
    startLocation: string | null;
    endLocation: string | null;
  };
}

function getCategoryHexColor(colorName: string): number {
  return CATEGORY_HEX_COLORS[colorName] ?? 0x64748B; // default slate
}
```

### Meetup HTML Template
```typescript
function generateMeetupHTML(event: EventForMeetup): string {
  return `<p>Join us for a ${event.route.category.name}!</p>
<p><b>Route:</b> ${event.route.name}<br>
<b>Distance:</b> ${event.route.distance} miles<br>
${event.startLocation ? `<b>Meeting Point:</b> ${event.startLocation}<br>` : ''}
${endLocation ? `<b>End Location:</b> ${endLocation}<br>` : ''}
${event.route.stravaUrl ? `<b>Strava Route:</b> <a href="${event.route.stravaUrl}">${event.route.stravaUrl}</a><br>` : ''}
</p>
${event.notes ? `<p>${event.notes}</p>` : ''}
<p>See you there!</p>`;
}
```

### Settings Toggle UI Pattern
```typescript
// In settings-page.tsx, add a Discord section
<div className="flex items-center justify-between">
  <div>
    <Label>Discord Notifications</Label>
    <p className="text-sm text-muted-foreground">
      Post event announcements to Discord
    </p>
  </div>
  <Switch
    checked={discordEnabled}
    onCheckedChange={(checked) => updateSetting('discord_notifications_enabled', String(checked))}
  />
</div>
```

## State of the Art

| Old (Pre-3.1) | Current (Post-3.1) | Impact |
|---------------|---------------------|--------|
| route.category = string enum | route.category = { id, name, color, icon } | All service interfaces need update |
| No startLocation on events/routes | startLocation nullable field on both | Discord/Meetup must show conditionally |
| No settings table | settings key-value store exists | Can store Discord toggle setting |
| MeetupDescriptionDialog (full dialog) | Should be Popover per CONTEXT.md | UI component replacement |

## Open Questions

1. **Meetup export for recurring instances**
   - What we know: CONTEXT.md says "both one-off and recurring instances can be individually exported and tracked"
   - What's unclear: Virtual recurring instances have no DB `id` — can't call `/api/events/:id/meetup-description`
   - Recommendation: Generate description client-side for virtual instances using route data already in CalendarEvent, OR create a query-param-based endpoint that doesn't require event ID

## Sources

### Primary (HIGH confidence)
- Codebase analysis: All files listed in Architecture Patterns section
- discord-webhook-node: Already in use, API patterns established in existing code
- CONTEXT.md: User decisions constraining implementation

### Secondary (MEDIUM confidence)
- Discord webhook rate limits: Standard Discord API documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and in use
- Architecture: HIGH - extending existing patterns, not introducing new ones
- Pitfalls: HIGH - identified from direct codebase analysis of pre/post 3.1 differences

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable — no external dependency changes expected)
