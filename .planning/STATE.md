# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-12)

**Core value:** Organizers can reliably schedule runs without data conflicts or chaos
**Current focus:** Phase 3.1: Refinements & Missing Features

## Current Position

Phase: 3.1 of 4 (Refinements & Missing Features)
Plan: 2 of 3 in current phase
Status: In Progress
Last activity: 2026-02-24 — Completed 03.1-02-PLAN.md (Service and API layer for categories, settings, start location)

Progress: [██████████] Phase 3.1 in progress (2/3 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 10
- Average duration: 3 min
- Total execution time: 0.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-authentication | 3 | 18 min | 6 min |
| 02-route-management | 2 | 4 min | 2 min |
| 03-event-scheduling-public-calendar | 3 | 7 min | 2 min |
| 04-integrations-export | 2 | 4 min | 2 min |
| 03.1-refinements-missing-features | 1/3 | 4 min | 4 min |

**Recent Trend:**
- Last 5 plans: 03-02 (3 min), 03-03 (2 min), 04-01 (2 min), 04-02 (2 min), 03.1-01 (4 min)
- Trend: Stable (consistent 2-4 minute execution time for recent plans)

*Updated after each plan completion*
| Phase 03.1-refinements-missing-features P02 | 4 | 2 tasks | 16 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Public schedule viewing — Anyone can see runs without login (reduces friction for new members)
- Organizer-only editing — Prevents data chaos from previous attempt, small trusted group coordinates
- Web-first (no mobile app) — Lower cost, faster to build POC, mobile web works
- Standalone POC before integration — Prove value independently before integrating with main site

**From Phase 1 Plan 1:**
- Used timestamptz for all timestamp columns to ensure UTC storage
- Implemented version field for optimistic locking from day one
- Created asyncHandler utility instead of express-async-errors for ESM compatibility
- Runtime verification deferred until Docker environment available

**From Phase 1 Plan 2:**
- Session cookie named 'sid' instead of default 'connect.sid' for security
- 7-day session maxAge per user decision (604800000ms)
- Generic "Invalid credentials" error prevents email enumeration
- Global logout with req.session.destroy() logs out all devices
- Rate limiter skipSuccessfulRequests: true - only failed attempts count
- Public /calendar route has NO auth middleware (public access pattern)

**From Phase 1 Plan 3:**
- Seed script uses upsert pattern (INSERT ... ON CONFLICT DO UPDATE) for idempotency
- Runtime verification deferred until Docker environment available
- TypeScript compilation verified to ensure type correctness

**From Phase 2 Plan 1:**
- Used numeric(5,2) for distance to preserve decimal precision (converts string<->number in service layer)
- Type assertion for category filter safe because Zod validates enum at handler level
- formatRoute helper normalizes API responses (distance always returned as number)

**From Phase 2 Plan 2:**
- Router-level auth (router.use) instead of app.use-level keeps all auth concerns in route file
- Delete-then-insert pattern for route seeding ensures idempotency while allowing updates
- ZodError.issues (not .errors) is the correct property for type-safe validation error details
- req.params.id can be string or string[] - must check Array.isArray before parseInt

**From Phase 3 Plan 1:**
- RRULE string generated and stored using rrule.js library for recurring templates
- Virtual event instances generated on-the-fly from RRULE (not materialized in DB)
- Day of week stored as integer (0=Sunday, 6=Saturday) for quick queries
- Start time stored as varchar HH:MM for simplicity
- Recurring templates soft-deleted (isActive=false) if events reference them, hard-deleted otherwise
- Default count of 12 weeks for recurring template instance generation
- Used date-fns addDays instead of nextDay to avoid Day enum type incompatibility

**From Phase 3 Plan 2:**
- Router-level auth middleware instead of app-level keeps all auth concerns in route files (consistent with routes.ts pattern)
- Seed script builds RRULE strings directly using same helper functions as service layer (avoids service layer dependency)
- Delete-then-insert pattern for seeding ensures idempotency while allowing data updates
- One-off events seed data uses computed next occurrence dates (dynamic based on current date)

**From Phase 4 Plan 1:**
- Fire-and-forget Discord webhooks with .catch() ensure events succeed regardless of notification status
- DISCORD_WEBHOOK_URL optional (not in requiredVars) for graceful degradation
- Used @ts-ignore for discord-webhook-node ESM type resolution issue
- Fetch event data before deletion in deleteEvent to enable Discord notification

**From Phase 4 Plan 2:**
- Used template literals instead of Handlebars for simple template generation (no extra dependency)
- postedToMeetup updates bypass version increment to avoid optimistic locking conflicts (metadata pattern)
- Strava route link uses 'TBD' placeholder since route schema lacks stravaUrl field
- Event endLocation overrides route endLocation in template when provided
- Specific sub-resource routes placed before generic /:id routes for correct Express path matching

**From Phase 3.1 Plan 1:**
- Categories as pgTable FK instead of pgEnum allows runtime CRUD without DB migrations
- Settings as key-value store (key varchar, value text) for flexible app configuration
- RRULE strings without COUNT for open-ended recurring templates; COUNT stripped from existing data in migration
- Category filter in services stubbed with TODO for 03.1-02 full service migration (returns all results temporarily)
- endLocation made nullable on routes (start == end same location pattern supported)
- [Phase 03.1-02]: Public GET /api/categories and GET /api/settings (no auth) so frontend forms/calendar can load data without authentication
- [Phase 03.1-02]: CalendarEvent.category type changed from string to object (id/name/color/icon) to support rich category display
- [Phase 03.1-02]: JS-side categoryId filtering after relational query (not SQL WHERE join) for simplicity with small category lists

### Pending Todos

None yet.

### Roadmap Evolution

- Phase 03.1 inserted after Phase 3: Refinements & Missing Features (INSERTED) — flexible categories, start location, recurring on events page, complex recurring patterns

### Blockers/Concerns

**Research flags for Phase 1:**
- GPX parsing library selection needs comparison during planning (leaflet-gpx vs togeojson vs custom XML)
- Email service provider selection for notifications (SendGrid vs Resend vs Mailgun)

**Architecture requirements:**
- ✅ Must implement optimistic locking from day one (version fields in schema) — IMPLEMENTED in 01-01
- ✅ Must use UTC + timezone identifier pattern for all timestamps — IMPLEMENTED in 01-01 (timestamptz)
- ✅ Must implement event series data model for recurring events — IMPLEMENTED in 03-01 (recurring templates with RRULE)
- Must use secret/unguessable URLs for public calendar access

**From Phase 1 Plan 1:**
- Runtime verification deferred: Docker-dependent tests (database connection, drizzle-kit push, server startup) not yet executed — user will verify when Docker environment available later this week

**From Phase 1 Plan 2:**
- Runtime verification deferred: Redis connection, server startup, authentication endpoint testing, rate limiting behavior not yet verified — user will test when Docker environment available

**From Phase 1 Plan 3:**
- Runtime verification deferred: Seed script execution, database queries, all 8 curl integration tests, complete authentication flow checkpoint not yet executed — comprehensive end-to-end testing deferred until Docker environment available

## Session Continuity

Last session: 2026-02-24
Stopped at: Completed 03.1-02-PLAN.md (Service and API layer for categories, settings, start location)
Next step: Execute 03.1-03 (Frontend UI for categories, settings, and start location)
Resume file: .planning/phases/03.1-refinements-missing-features/03.1-02-SUMMARY.md

**Verification Status:**
- ✅ Static verification complete (TypeScript compilation, code structure, schema validation)
- ⏳ Runtime verification pending (waiting for Mac Mini hardware)

---
*State initialized: 2026-02-12*
*Last updated: 2026-02-24*
