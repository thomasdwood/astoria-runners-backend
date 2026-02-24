# Phase 4: Integrations & Export - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Automated Discord announcements when events are created/updated/deleted, plus Meetup description export with copy-to-clipboard and "posted to Meetup" tracking. Discord service and basic Meetup template already exist in code — this phase wires them into the event lifecycle and builds the organizer-facing export UI. Also adds stravaUrl field to routes for Meetup template use.

</domain>

<decisions>
## Implementation Decisions

### Discord message content
- Friendly run-club voice — short intro lines like "Lace up!" or "Heads up — schedule change" before the details
- Embed color bar matches event category color (e.g., brewery=amber, coffee=brown) — NOT action-based colors (green/orange/red)
- Conditional location fields: show meeting point only if different from the default start location setting; show end location only if different from start location
- Include: date/time, route name, distance, category, conditional locations, notes if present

### Discord notification triggers
- One-off events: notify on create, update, delete
- Recurring templates: notify at template level only (creation announces the recurring schedule, not each instance)
- Template deletion: single summary message ("Weekly Coffee Run has been cancelled"), not per-instance
- Admin toggle in settings UI to enable/disable Discord notifications (independent of webhook URL env var)
- Non-blocking toast warning if Discord notification fails — event saves regardless, organizer sees "Event saved. Discord notification failed."

### Meetup template design
- Fixed template (not admin-customizable) — one well-crafted template that auto-fills variables
- Variables: route name, distance, category, start location, end location, Strava route link, notes, date/time
- Add stravaUrl optional field to route schema — organizers paste when creating/editing routes, template includes if present
- Format toggle in export popover: plain text or Meetup HTML formatting — organizer picks which to copy

### Meetup export UX
- Popover on event row — "Meetup" button opens popover with generated description, format toggle (plain/HTML), copy button, and manual "posted to Meetup" checkbox
- Manual checkbox — organizer explicitly marks as posted after pasting on Meetup (no auto-check on copy)
- "Meetup" badge visible on event rows for events marked as posted — quick visual scan
- Available for all events: both one-off and recurring instances can be individually exported and tracked

### Claude's Discretion
- Update notification format (full details vs diff-style highlighting what changed)
- Exact embed field layout and formatting
- Toast notification styling and duration
- Meetup HTML template markup specifics
- Popover component design and positioning

</decisions>

<specifics>
## Specific Ideas

- Location fields should be conditional/smart: "Meeting point only if it differs from the default start location, end point only if different from start" — keeps embeds and descriptions clean
- Format toggle in popover was user's idea — toggling between plain text and Meetup HTML in the same export UI
- Discord should not spam for recurring instances — template-level announcements only

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-integrations-export*
*Context gathered: 2026-02-24*
