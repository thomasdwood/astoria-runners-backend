# Astoria Runners Planning Tool

## What This Is

A web-based run scheduling tool for Astoria Runners organizers. Organizers schedule runs from a library of pre-defined routes, assign hosts, track Meetup posting, and automatically announce events to Discord. Members and the public view the schedule on a public calendar. Replaced a broken Google Sheets coordination workflow.

## Core Value

Organizers can reliably schedule runs without data conflicts or chaos.

## Requirements

### Validated

- ✓ Organizer authentication (login/logout, rate-limited, Redis sessions) — v1.0
- ✓ Public calendar access without login — v1.0
- ✓ Route library with dynamic admin-defined categories, distance, start/end locations — v1.0
- ✓ Event scheduling: one-off and recurring (weekly, biweekly, nth-weekday) with virtual instance generation — v1.0
- ✓ Public calendar in month grid and chronological list views — v1.0
- ✓ Discord notifications on event create/update/delete — v1.0
- ✓ Meetup description export with configurable templates and {{variable}} substitution — v1.0
- ✓ Host assignment on events and recurring templates — v1.0
- ✓ meetupUrl tracking (URL presence = posted status) — v1.0
- ✓ Security hardening: settings allowlist, input validation, CSRF posture — v1.0
- ✓ 47 real Astoria Runners routes seeded — v1.0

### Active

- [ ] Fix EXPORT-01 backend template wiring: `meetupExportService` should read `meetup_description_template` from settings for DB events (currently uses hardcoded format; virtual instances work correctly via client-side path)
- [ ] Add test framework (Vitest) and baseline test coverage
- [ ] `requireGuest` middleware: apply to /login route to redirect already-authenticated users
- [ ] Automated Meetup API posting when event is created (currently manual copy/paste workflow)
- [ ] Secret/unguessable calendar URLs to prevent indexing

### Out of Scope

| Feature | Reason |
|---------|--------|
| RSVP/attendance tracking | Handled via Meetup and Strava — avoid duplication |
| Payment processing | Regulatory/tax burden; use external platforms |
| Real-time GPS tracking | Privacy concerns; no clear value |
| Advanced role hierarchy | Complexity that 90% of small clubs don't need |
| Custom mobile native app | PWA provides sufficient mobile UX at lower cost |
| Social network features | Content moderation burden; leverage Discord instead |
| Multi-club federation | Network effects require scale — chicken-egg problem |
| Strava GPX import | Deferred — manual route entry sufficient for MVP |

## Context

**Shipped v1.0 with ~4,400 LOC TypeScript.**

**Tech stack:** Node.js + Express (backend), React + Vite (frontend), PostgreSQL (Drizzle ORM), Redis (sessions), Docker (local dev), rrule.js (recurring patterns), discord-webhook-node, bcrypt, express-session.

**Previous attempt:** Google Sheets with Apps Script. Failed immediately — data conflicts when multiple organizers coordinated simultaneously.

**User roles:**
- Small group of organizers who schedule runs and manage the tool
- Larger group of club members and public who view the calendar
- Single-organizer authorization model (requireAuth IS the ownership check)

**Run categories:** Admin-defined (was: Brewery/Coffee/Brunch/Weekend hardcoded). Dynamic categories with color + icon configurable from Settings page.

**Known issues / tech debt from v1.0:**
- No test framework installed — zero automated tests
- DB schema applied manually for Phase 05 (not via drizzle-kit push) — migration history may diverge
- EXPORT-01 backend path uses hardcoded Meetup description format, ignores stored template for DB events

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Public schedule viewing | Anyone can see runs without login — reduces friction for new members | ✓ Good |
| Organizer-only editing | Prevents data chaos from previous Google Sheets attempt | ✓ Good |
| Web-first (no mobile app) | Lower cost, faster POC, mobile web works | ✓ Good |
| Standalone POC before integration | Prove value independently before integrating with main site | ✓ Good |
| Categories as FK table (not pgEnum) | Runtime CRUD without DB migrations | ✓ Good |
| Virtual recurring instances (not materialized) | Avoids DB bloat; on-the-fly generation from RRULE | ✓ Good |
| postedToMeetup → meetupUrl varchar | URL presence as status indicator; enables direct link in calendar | ✓ Good |
| Router-level auth (router.use) | Consistent pattern; all auth concerns in route file | ✓ Good |
| asyncHandler utility over express-async-errors | ESM compatibility | ✓ Good |
| sameSite: lax CSRF posture | Sufficient for single-origin app; csrf-csrf tokens over-engineered for this scale | ✓ Good |
| Manual DB migration for Phase 05 | drizzle-kit 0.31.x cannot resolve .js ESM imports in CJS mode | ⚠️ Revisit — migration drift risk |
| Skip test framework in v1.0 | Speed; no critical path need at POC stage | ⚠️ Revisit — add Vitest before onboarding devs |
| Fire-and-forget Discord webhooks | Events succeed regardless of notification failure | ✓ Good |

## Constraints

- **Budget:** Keep hosting and service costs minimal — community run club
- **Scope:** Working POC first, then expand; avoid over-engineering
- **Tech stack:** Budget-friendly, easy to integrate later
- **Single organizer model:** requireAuth IS the authorization check — no per-resource ownership needed currently

---
*Last updated: 2026-03-15 after v1.0 milestone*
