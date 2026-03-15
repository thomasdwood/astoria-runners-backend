---
phase: 5
slug: hosts-meetup-workflow-calendar-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None detected — no jest.config, no vitest.config, no test files |
| **Config file** | none — Wave 0 installs if test infra is added |
| **Quick run command** | `npm run dev:all` + manual browser smoke |
| **Full suite command** | Manual UAT checklist |
| **Estimated runtime** | ~5 minutes manual verification per wave |

---

## Sampling Rate

- **After every task commit:** Manual smoke via `npm run dev:all` and browser verification of affected page
- **After every plan wave:** Manual end-to-end verification of affected pages
- **Before `/gsd:verify-work`:** Full UAT checklist must be green
- **Max feedback latency:** ~5 minutes

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | SC-9 | manual | `npm run db:generate && npm run db:migrate` | ❌ W0 | ⬜ pending |
| 5-01-02 | 01 | 1 | SC-1 | manual | `npm run dev:all` — check hosts table exists | ❌ W0 | ⬜ pending |
| 5-01-03 | 01 | 1 | SC-4 | manual | `npm run dev:all` — check meetupUrl column | ❌ W0 | ⬜ pending |
| 5-02-01 | 02 | 2 | SC-1 | manual | `npm run dev:all` — GET /api/hosts | ❌ W0 | ⬜ pending |
| 5-02-02 | 02 | 2 | SC-4 | manual | `npm run dev:all` — event meetupUrl field | ❌ W0 | ⬜ pending |
| 5-02-03 | 02 | 2 | SC-5 | manual | `npm run dev:all` — GET /api/settings | ❌ W0 | ⬜ pending |
| 5-02-04 | 02 | 2 | SC-6 | manual | `npm run dev:all` — GET /api/calendar includes host/meetupUrl/stravaUrl | ❌ W0 | ⬜ pending |
| 5-03-01 | 03 | 3 | SC-3 | manual | Browser — settings page shows hosts section | ❌ W0 | ⬜ pending |
| 5-03-02 | 03 | 3 | SC-5 | manual | Browser — settings page shows meetup template editor | ❌ W0 | ⬜ pending |
| 5-04-01 | 04 | 4 | SC-1, SC-2 | manual | Browser — event form shows host selector | ❌ W0 | ⬜ pending |
| 5-04-02 | 04 | 4 | SC-4 | manual | Browser — event form shows meetupUrl input | ❌ W0 | ⬜ pending |
| 5-04-03 | 04 | 4 | SC-7 | manual | Browser — route dropdown filterable by category | ❌ W0 | ⬜ pending |
| 5-04-04 | 04 | 4 | SC-8 | manual | Browser — one-off events show cancel/restore buttons | ❌ W0 | ⬜ pending |
| 5-05-01 | 05 | 5 | SC-6 | manual | Browser — calendar event popover shows host/Meetup link/Strava link | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No test infrastructure exists. This is a known project state — manual verification is the established pattern.

*All verifications are manual: "Existing pattern covers phase requirements — no automated test infra."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| DB migration applies cleanly without strava_url conflict | SC-9 | No migration test infra | Run `npm run db:generate`, inspect SQL for duplicate strava_url, run `npm run db:migrate`, check tables |
| Hosts can be created/deleted from settings page | SC-3 | No test infra | Navigate to Settings > Hosts, add a host, verify appears in list, delete, verify removed |
| Host selector appears on event form and saves | SC-1 | No test infra | Create/edit event, select host from dropdown, save, verify host persisted |
| Recurring template default host propagates to new instances | SC-2 | No test infra | Edit recurring template, set host, verify new virtual instances inherit host |
| MeetupUrl field replaces postedToMeetup checkbox | SC-4 | No test infra | Create event, enter meetupUrl, save, verify URL stored and postedToMeetup gone from UI |
| Template variables substituted in Meetup description | SC-5 | No test infra | Set template with `{{routeName}}`, export event to Meetup, verify variable replaced |
| Calendar overlay shows host/Meetup link/Strava link | SC-6 | No test infra | Click event on public calendar, verify host name, Meetup URL, and Strava link visible when set |
| Route dropdown filterable by category | SC-7 | No test infra | Open event form, select category filter, verify route list narrows accordingly |
| Cancel/restore works for one-off events | SC-8 | No test infra | Find one-off event in events table, click cancel, verify isCancelled=true; click restore, verify restored |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5 minutes
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
