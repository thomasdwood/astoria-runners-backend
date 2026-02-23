# Astoria Runners Planning Tool

## What This Is

A web-based planning tool for Astoria Runners where organizers schedule future runs from a library of pre-defined routes, and members can view the schedule. This replaces a Google Sheets solution that failed due to data integrity issues when multiple organizers tried to coordinate.

## Core Value

Organizers can reliably schedule runs without data conflicts or chaos.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Organizers can create scheduled runs with date, time, route, notes, and end location
- [ ] Organizers can edit and delete scheduled runs
- [ ] Organizers can select from a library of saved routes when scheduling
- [ ] Routes include distance/duration and category (Brewery Run, Coffee Run, Brunch Run, Weekend)
- [ ] Organizers can add new routes to the library
- [ ] Routes can be imported from Strava (GPX files)
- [ ] Anyone can view the schedule in calendar format
- [ ] Anyone can view the schedule in list format
- [ ] Scheduled runs are announced to Discord automatically

### Out of Scope

- Meetup integration — deferred to future version
- User authentication for viewing — schedule is public
- RSVP tracking within the tool — Discord handles announcements only
- Mobile native app — web-first approach
- Integration with main website — POC first, integration later

## Context

**Previous attempt:**
Built in Google Sheets with Apps Script. Failed immediately due to data integrity issues - conflicts, overwrites, and inconsistencies when multiple organizers tried to schedule runs.

**User roles:**
- Small group of organizers who coordinate and schedule runs
- Larger group of club members and public who view the schedule
- Only organizers need edit access; schedule viewing is public

**Run categories:**
Runs are categorized by their destination or theme:
- Brewery Runs (ending at a bar/brewery)
- Coffee Runs (ending at a coffee shop)
- Brunch Runs (ending at a brunch spot)
- Weekend runs (longer/different format)

End locations are often different from start locations.

**Integration needs:**
- Strava: Import route data (GPX files) for the route library
- Discord: Post announcements of scheduled runs to a channel
- Future: Integrate with main Astoria Runners website (separate organizer responsibility)

## Constraints

- **Budget**: Keep hosting and service costs minimal - this is for a community run club
- **Scope**: Deliver a working proof of concept first, then integrate with existing website
- **Tech stack**: Flexible, but must be budget-friendly and easy to integrate later
- **Timeline**: POC to demonstrate value, then expand

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Public schedule viewing | Anyone can see runs without login - reduces friction for new members | — Pending |
| Organizer-only editing | Prevents data chaos from previous attempt, small trusted group coordinates | — Pending |
| Web-first (no mobile app) | Lower cost, faster to build POC, mobile web works | — Pending |
| Standalone POC before integration | Prove value independently before integrating with main site | — Pending |

---
*Last updated: 2026-02-12 after initialization*
