# Roadmap: Astoria Runners Planning Tool

## Overview

This roadmap delivers a web-based run scheduling tool in four phases. Starting with authentication and data foundation, we build the route library, then event scheduling with public calendar views, and finally external integrations for Discord announcements and Meetup export. Each phase delivers complete, verifiable capabilities while setting up dependencies for the next phase.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Authentication** - Core infrastructure and organizer access
- [x] **Phase 2: Route Management** - Route library with categories and metadata
- [ ] **Phase 3: Event Scheduling & Public Calendar** - Event creation and public calendar views
- [ ] **Phase 4: Integrations & Export** - Discord webhooks and Meetup export

## Phase Details

### Phase 1: Foundation & Authentication
**Goal**: Secure data foundation with organizer authentication and public access model
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. Organizer can log in with email and password
  2. Organizer can log out from any page
  3. Public users can view calendar without authentication
  4. Database schema includes version fields for optimistic locking
  5. Timestamp storage uses UTC with timezone identifier pattern
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md -- Project setup, Docker infrastructure, database schema with version fields and timestamptz
- [ ] 01-02-PLAN.md -- Authentication system (login/logout, session config, middleware guards, rate limiting, public calendar)
- [ ] 01-03-PLAN.md -- Seed data and end-to-end integration verification

### Phase 2: Route Management
**Goal**: Complete route library for scheduling events
**Depends on**: Phase 1
**Requirements**: ROUTE-01, ROUTE-02, ROUTE-03, ROUTE-04, ROUTE-05
**Success Criteria** (what must be TRUE):
  1. Organizer can create route with name, distance, category, and end location
  2. Organizer can edit existing route details
  3. Organizer can delete routes that aren't referenced by events
  4. Organizer can view list of all routes filtered by category
  5. Routes support all required categories: Brewery Run, Coffee Run, Brunch Run, Weekend
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md -- Routes schema with pgEnum, Zod validation, and service layer with CRUD and optimistic locking
- [ ] 02-02-PLAN.md -- REST endpoints with validation middleware, app wiring, and seed data

### Phase 3: Event Scheduling & Public Calendar
**Goal**: Organizers can schedule runs and public can view calendar
**Depends on**: Phase 2
**Requirements**: EVENT-01, EVENT-02, EVENT-03, EVENT-04, EVENT-05, EVENT-06, CAL-01, CAL-02, CAL-03
**Success Criteria** (what must be TRUE):
  1. Organizer can create event with date, time, route selection, notes, and end location
  2. Organizer can edit existing event details
  3. Organizer can delete scheduled events
  4. Organizer can create recurring event template for weekly repeats
  5. System automatically generates individual event instances from recurring template
  6. Organizer can filter events by category
  7. Public user can view events in month calendar format
  8. Public user can view events in chronological list format
  9. Calendar displays event date, time, route name, and category
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md -- Event and recurring template schema, Zod validation, service layer with rrule.js instance generation
- [ ] 03-02-PLAN.md -- Event and recurring template REST endpoints with auth protection, seed data
- [ ] 03-03-PLAN.md -- Public calendar endpoints (month grid and chronological list views, no auth required)

### Phase 03.1: Refinements & Missing Features (INSERTED)

**Goal:** Address accumulated TODOs: replace hardcoded route categories with admin-defined categories (new categories table, CRUD API, admin UI), add startLocation field to routes/events with configurable default setting, show recurring event instances on the events admin page, and support complex recurring patterns (nth-weekday like 2nd Wednesday, last Thursday) using RRule bysetpos.
**Depends on:** Phase 3
**Plans:** 6/6 plans complete

Plans:
- [ ] 03.1-01-PLAN.md — Database schema foundation: categories table, settings table, route/event/recurring schema updates
- [ ] 03.1-02-PLAN.md — Categories & settings API, route/event API updates for categoryId and startLocation
- [ ] 03.1-03-PLAN.md — Complex recurring patterns: biweekly, monthly nth-weekday, natural language preview
- [ ] 03.1-04-PLAN.md — Frontend types, hooks, and CategoryBadge updates for new data model
- [ ] 03.1-05-PLAN.md — Admin settings page (categories + default start location), updated forms
- [ ] 03.1-06-PLAN.md — Recurring instances on events page, cancel/delete/edit actions, conflict detection

### Phase 4: Integrations & Export
**Goal**: Automated Discord announcements and Meetup export workflow
**Depends on**: Phase 3
**Requirements**: INTEG-01, INTEG-02, INTEG-03, EXPORT-01, EXPORT-02, EXPORT-03, EXPORT-04
**Success Criteria** (what must be TRUE):
  1. System posts event announcement to Discord when event is created
  2. System posts update to Discord when event is modified or deleted
  3. Discord announcements include all event details
  4. System generates Meetup event description from customizable template
  5. Template supports all required variables
  6. Organizer can copy generated description to clipboard with one click
  7. Organizer can mark event as "posted to Meetup" via checkbox
**Plans**: 3 plans

Plans:
- [ ] 04-01-PLAN.md -- Discord webhook updates (category colors, settings toggle, recurring template notifications, Phase 3.1 data model)
- [ ] 04-02-PLAN.md -- Meetup export updates (stravaUrl on routes, format toggle, Popover UI, Phase 3.1 data model)
- [ ] 04-03-PLAN.md -- Gap closure: add stravaUrl input field to route form UI

### Phase 5: Hosts, Meetup Workflow & Calendar Polish
**Goal**: Organizers can assign a run host, track Meetup posting via URL, configure description templates, and see richer event detail on the public calendar
**Depends on**: Phase 4
**Success Criteria** (what must be TRUE):
  1. Events can have a host assigned from a managed hosts list
  2. Recurring templates can have a default host
  3. Admins can add/remove hosts from the settings page
  4. Meetup URL replaces the "posted to Meetup" checkbox — posting status is derived from URL presence
  5. Default Meetup description template is configurable from settings with variable substitution
  6. Calendar event overlay shows host, Meetup link, and Strava route link when set
  7. Route dropdown on event form is filterable by category
  8. Cancel/restore actions work for one-off events (not just recurring instances)
  9. DB migration state is clean — all schema changes tracked via drizzle migrations
**Plans**: 6 plans

Plans:
- [ ] 05-01-PLAN.md — Schema & migrations: hosts table, meetupUrl on events (replaces postedToMeetup), hostId on events/recurring_templates, drizzle migration cleanup
- [ ] 05-02-PLAN.md — Backend: hosts service + CRUD API, event service updates (meetupUrl, hostId), meetup_description_template setting, calendar API exposes host/meetupUrl/stravaUrl
- [ ] 05-03-PLAN.md — Settings page: hosts management UI (add/remove, future email/admin path), meetup description template editor with variable reference
- [ ] 05-04-PLAN.md — Event form: host selector dropdown, meetup URL input field, route dropdown category filter, cancel/restore for one-off events
- [ ] 05-05-PLAN.md — Calendar overlay: display host, Meetup link, and Strava route link on event detail popover
- [ ] 05-06-PLAN.md — Gap closure: hostId and meetupUrl persisted on event create/edit; seed script categories ON CONFLICT fix

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Authentication | 3/3 | ✓ Complete | 2026-02-13 |
| 2. Route Management | 2/2 | ✓ Complete | 2026-02-13 |
| 3. Event Scheduling & Public Calendar | 3/3 | ✓ Complete | 2026-02-13 |
| 03.1. Refinements & Missing Features | 6/6 | ✓ Complete | 2026-02-24 |
| 4. Integrations & Export | 3/3 | ✓ Complete | 2026-02-24 |
| 5. Hosts, Meetup Workflow & Calendar Polish | 8/8 | Complete   | 2026-03-15 |

### Phase 6: Security hardening: authorization, CSRF protection, and input validation

**Goal:** Close known security gaps: settings endpoint key allowlist + per-key value constraints (P0), notes field max length on events/templates (SEC-02), and document intentional CSRF posture + single-organizer authorization model (SEC-03).
**Requirements**: SEC-01, SEC-02, SEC-03
**Depends on:** Phase 5
**Plans:** 3 plans

Plans:
- [ ] 06-01-PLAN.md — Settings endpoint hardening: EDITABLE_SETTINGS allowlist + per-key Zod schemas
- [ ] 06-02-PLAN.md — Input validation gaps: notes max(2000) on 4 schemas, id <= 0 guards across 5 route files
- [ ] 06-03-PLAN.md — CSRF posture documentation: session.ts comment + SECURITY.md updates

---
*Roadmap created: 2026-02-12*
*Last updated: 2026-02-13*
