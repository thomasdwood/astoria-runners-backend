# Milestones

## ✅ v1.0 MVP — Shipped 2026-03-15

**Phases:** 9 (01 → 02 → 03 → 03.1 → 04 → 05 → 06 → 07 → 08)
**Plans:** 33 total
**Timeline:** 2026-02-23 → 2026-03-15 (21 days)
**LOC:** ~4,400 TypeScript
**Commits:** 113

### Delivered

Full run scheduling web app for Astoria Runners — organizer auth, route library with dynamic categories, event scheduling with complex recurring patterns, public calendar, Discord notifications, Meetup description export with configurable templates, host assignment, and security hardening. Replaced a broken Google Sheets workflow.

### Key Accomplishments

1. Auth system with bcrypt + Redis sessions, rate-limited login, public/organizer access split
2. Route library: 47 real Astoria Runners routes seeded, dynamic admin-defined categories (replaced hardcoded enum)
3. Event scheduling with rrule.js — one-off events + complex recurring (weekly, biweekly, nth-weekday patterns) rendered as virtual instances
4. Public calendar in month grid + chronological list with category-filtered views
5. Discord webhook notifications for event create/update/delete (fire-and-forget, graceful degradation)
6. Meetup export workflow: configurable description templates with {{distance}}/{{route}}/{{category}} variables, host assignment, meetupUrl tracking
7. Security hardening: EDITABLE_SETTINGS allowlist, input validation across all endpoints, CSRF posture documented

### Known Gaps

- **EXPORT-01 partial:** `meetupExportService` ignores stored `meetup_description_template` for DB events; custom templates only apply to virtual recurring instances (client-side path). Fix: add `getSetting('meetup_description_template')` to backend service (~20 lines).
- **No test framework:** Vitest/Jest not installed; Nyquist validation deferred to future milestone.

### Archives

- `.planning/milestones/v1.0-ROADMAP.md` — full phase details
- `.planning/milestones/v1.0-REQUIREMENTS.md` — requirements with outcomes
- `.planning/milestones/v1.0-MILESTONE-AUDIT.md` — audit report (status: tech_debt, 23/23 req satisfied)
