# Requirements: Astoria Runners Planning Tool

**Defined:** 2026-02-12
**Core Value:** Organizers can reliably schedule runs without data conflicts or chaos

## v1 Requirements

Requirements for initial proof of concept. Each maps to roadmap phases.

### Route Management

- [x] **ROUTE-01**: Organizer can create route with name, distance, category, and end location
- [x] **ROUTE-02**: Organizer can edit existing routes
- [x] **ROUTE-03**: Organizer can delete routes
- [x] **ROUTE-04**: Organizer can view list of all routes with filtering by category
- [x] **ROUTE-05**: Routes support categories: Brewery Run, Coffee Run, Brunch Run, Weekend

### Event Scheduling

- [x] **EVENT-01**: Organizer can create event with date, time, route selection, notes, and end location
- [x] **EVENT-02**: Organizer can edit existing events
- [x] **EVENT-03**: Organizer can delete events
- [x] **EVENT-04**: Organizer can create recurring event template for weekly repeats
- [x] **EVENT-05**: System automatically generates individual event instances from recurring template
- [x] **EVENT-06**: Organizer can filter events by category (Brewery, Coffee, Brunch, Weekend)

### Calendar Views

- [x] **CAL-01**: Public user can view events in month calendar format
- [x] **CAL-02**: Public user can view events in chronological list format
- [x] **CAL-03**: Calendar displays event date, time, route name, and category for each event

### Authentication

- [x] **AUTH-01**: Organizer can log in with email and password
- [x] **AUTH-02**: Organizer can log out from any page
- [x] **AUTH-03**: Public users can view calendar without authentication or account creation

### Integrations

- [x] **INTEG-01**: System posts event announcement to Discord when event is created
- [x] **INTEG-02**: System posts update to Discord when event is modified or deleted
- [x] **INTEG-03**: Discord announcements include event details: date, time, route, end location, notes

### Meetup Export

- [x] **EXPORT-01**: System generates Meetup event description from customizable template
- [x] **EXPORT-02**: Template supports variables: distance, route name, category, end location, Strava route link
- [x] **EXPORT-03**: Organizer can copy generated description to clipboard with one click
- [x] **EXPORT-04**: Organizer can mark event as "posted to Meetup" via checkbox

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Route Management Enhancements

- **ROUTE-V2-01**: Import routes from Strava via OAuth and GPX parsing
- **ROUTE-V2-02**: Display interactive route maps using Leaflet
- **ROUTE-V2-03**: Show elevation profiles and terrain difficulty ratings
- **ROUTE-V2-04**: Track route popularity and usage statistics

### Calendar Enhancements

- **CAL-V2-01**: Event detail pages with full information and comments
- **CAL-V2-02**: Mobile-responsive design optimization
- **CAL-V2-03**: Embeddable calendar widget for main Astoria Runners website
- **CAL-V2-04**: Drag-and-drop calendar editing for rescheduling
- **CAL-V2-05**: Week view and agenda view options

### Notifications

- **NOTIF-01**: Email notifications for upcoming events
- **NOTIF-02**: Email reminders 24 hours before event
- **NOTIF-03**: Email notifications when schedule changes

### Security & Access

- **AUTH-V2-01**: Secret/unguessable calendar URLs to prevent search engine indexing
- **AUTH-V2-02**: Member accounts with profile management
- **AUTH-V2-03**: Member attendance history tracking

### Meetup Integration

- **MEETUP-01**: Automated posting to Meetup API when event is created
- **MEETUP-02**: Auto-check "posted to Meetup" flag on successful API response
- **MEETUP-03**: Sync RSVP counts from Meetup back to calendar
- **MEETUP-04**: Update Meetup events when calendar events are modified

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| RSVP/attendance tracking in app | Handled via Meetup and Strava - avoid duplication |
| Payment processing | Adds regulatory/tax burden, use external platforms |
| Real-time GPS tracking during runs | Privacy concerns and battery drain without clear value |
| Advanced role hierarchy | Complexity that 90% of small clubs don't need |
| Custom mobile native apps | PWA provides sufficient mobile UX at lower cost |
| Social network features | Content moderation burden, leverage Discord instead |
| Multi-club federation | Network effects require scale - chicken-egg problem |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| ROUTE-01 | Phase 2 | Complete |
| ROUTE-02 | Phase 2 | Complete |
| ROUTE-03 | Phase 2 | Complete |
| ROUTE-04 | Phase 2 | Complete |
| ROUTE-05 | Phase 2/03.1 | Complete |
| EVENT-01 | Phase 3 | Complete |
| EVENT-02 | Phase 3 | Complete |
| EVENT-03 | Phase 3 | Complete |
| EVENT-04 | Phase 3/03.1 | Complete |
| EVENT-05 | Phase 3 | Complete |
| EVENT-06 | Phase 3 | Complete |
| CAL-01 | Phase 3 | Complete |
| CAL-02 | Phase 3 | Complete |
| CAL-03 | Phase 3 | Complete |
| INTEG-01 | Phase 4 | Complete |
| INTEG-02 | Phase 4 | Complete |
| INTEG-03 | Phase 4 | Complete |
| EXPORT-01 | Phase 4 | Complete |
| EXPORT-02 | Phase 7 | Complete |
| EXPORT-03 | Phase 4 | Complete |
| EXPORT-04 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 23 total (21 original + SEC-01/02/03 from Phase 6)
- Mapped to phases: 23
- Complete: 22 | Pending: 1 (EXPORT-02 → Phase 7)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-12*
*Last updated: 2026-02-12 after roadmap creation*
