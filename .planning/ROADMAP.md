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
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md -- Discord webhook integration (service, env config, fire-and-forget event triggers)
- [ ] 04-02-PLAN.md -- Meetup export template generation, postedToMeetup field, and REST endpoints

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Authentication | 3/3 | ✓ Complete | 2026-02-13 |
| 2. Route Management | 2/2 | ✓ Complete | 2026-02-13 |
| 3. Event Scheduling & Public Calendar | 3/3 | ✓ Complete | 2026-02-13 |
| 4. Integrations & Export | 0/2 | Not started | - |

---
*Roadmap created: 2026-02-12*
*Last updated: 2026-02-13*
