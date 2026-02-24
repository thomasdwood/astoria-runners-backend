---
phase: 04-integrations-export
plan: 01
subsystem: discord-notifications
tags: [discord, webhooks, notifications, settings, recurring]
dependency_graph:
  requires: []
  provides: [discord-event-notifications, discord-recurring-notifications, discord-settings-toggle]
  affects: [src/services/discordService.ts, src/services/recurringService.ts, client/src/pages/admin/settings-page.tsx]
tech_stack:
  added: []
  patterns: [fire-and-forget-webhook, category-hex-colors, settings-toggle]
key_files:
  created: []
  modified:
    - src/services/discordService.ts
    - src/services/recurringService.ts
    - src/services/eventService.ts
    - client/src/pages/admin/settings-page.tsx
    - client/src/hooks/use-settings.ts
    - src/db/schema/index.ts
    - src/db/schema/events.ts
    - src/db/schema/routes.ts
    - src/db/schema/recurringTemplates.ts
decisions:
  - "Discord notifications check settings toggle (discord_notifications_enabled) before sending — default enabled if not set"
  - "Recurring template delete fetches full route+category data before deletion for notification payload"
  - "Settings page uses useSettings() hook directly instead of useDefaultStartLocation() wrapper"
metrics:
  duration: 10
  completed_date: "2026-02-24"
  tasks: 2
  files: 9
---

# Phase 4 Plan 01: Discord Webhook Integration Update Summary

Discord webhook integration updated to match Phase 3.1 data model — category-colored embeds, conditional locations, recurring template notifications, and admin toggle.

## Tasks Completed

### Task 1: Update Discord service for new data model, category colors, and settings toggle

**Status: Already complete from prior Phase 4 Plan 1 execution (commit cb792e4)**

The `src/services/discordService.ts` was fully updated in the previous execution:
- `EventWithRoute` interface updated for relational query shape (category as object with id/name/color/icon)
- `RecurringTemplateWithRoute` interface added
- `CATEGORY_HEX_COLORS` map added (amber, orange, emerald, blue, purple, red, pink, teal, indigo, slate)
- `isNotificationsEnabled()` checks both webhookUrl config and `discord_notifications_enabled` setting
- `addLocationFields()` adds conditional Meeting Point and End Location fields
- All three event notification functions updated (notifyEventCreated, notifyEventUpdated, notifyEventDeleted)
- Two new recurring template notification functions added (notifyRecurringCreated, notifyRecurringDeleted)
- Settings toggle check in all notification functions — defaults to enabled if setting absent

**Commit:** cb792e4

### Task 2: Wire Discord notifications into recurring service and add settings UI toggle

**Backend — recurringService.ts deleteRecurringTemplate:**
- Added pre-deletion fetch of template with route and category data
- Fire-and-forget `notifyRecurringDeleted()` in both soft-deactivate path (referenced events) and hard-delete path
- Uses `.catch(err => console.error(...))` pattern — events succeed regardless of Discord failure

**Frontend — settings-page.tsx Discord toggle:**
- Added Discord Notifications Card section below Default Start Location
- Switch component reads `discord_notifications_enabled` setting from `useSettings()` query
- Defaults to enabled (true) when setting key doesn't exist (`value !== 'false'`)
- `handleDiscordToggle` calls `updateSetting.mutateAsync` with `'true'` or `'false'` string value
- Shows `'Enabled'` / `'Disabled'` label next to toggle
- Switched from `useDefaultStartLocation` to `useSettings` hook directly to share the single query

**Commit:** 4bc28fa

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Restored .js extensions in schema imports broken by prior UAT commit**
- **Found during:** Task 2 verification (npx tsc --noEmit)
- **Issue:** The `wip` UAT commit (8836cee) removed `.js` extensions from all imports in `src/db/schema/index.ts`, `events.ts`, `routes.ts`, and `recurringTemplates.ts`. This cascaded into a DrizzleTypeError (`"Seems like the schema generic is missing"`) across all services that use `db.query.*`, because the schema module failed to load correctly under ESM `moduleResolution: node16`.
- **Fix:** Restored `.js` extensions on all schema cross-imports to match the ESM module resolution pattern used throughout the project
- **Files modified:** `src/db/schema/index.ts`, `src/db/schema/events.ts`, `src/db/schema/routes.ts`, `src/db/schema/recurringTemplates.ts`
- **Commit:** 1de95cc

## Verification

- [x] TypeScript compiles without errors: `npx tsc --noEmit` — clean output
- [x] Discord service uses category color (not action-based green/orange/red) — `getCategoryHexColor(event.route.category.color)`
- [x] Discord service checks settings toggle before sending — `isNotificationsEnabled()` in all functions
- [x] Event create/update/delete trigger Discord — wired in `eventService.ts` (existing)
- [x] Recurring template create triggers Discord — wired in `recurringService.ts` createRecurringTemplate (existing)
- [x] Recurring template delete triggers Discord — wired in `recurringService.ts` deleteRecurringTemplate (new)
- [x] Settings page has Discord toggle — Switch component in new Card section
- [x] Fire-and-forget pattern preserved — `.catch()` on all notification calls

## Self-Check

Files exist:
- src/services/discordService.ts - FOUND
- src/services/recurringService.ts - FOUND
- client/src/pages/admin/settings-page.tsx - FOUND

Commits exist:
- cb792e4 - prior Phase 4 Plan 1 discordService update
- 1de95cc - schema .js extension fix
- 4bc28fa - recurring delete notify + settings toggle

## Self-Check: PASSED
