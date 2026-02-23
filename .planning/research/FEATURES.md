# Feature Research

**Domain:** Event Scheduling and Run Club Management
**Researched:** 2026-02-12
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Public event calendar view | Users need to see what's scheduled without logging in | LOW | Standard for all event platforms; default visibility with clean UI |
| Event details (date, time, location, distance) | Core information for deciding to attend | LOW | Must include start time, location, route distance/type |
| RSVP/attendance tracking | Organizers need headcounts for planning | MEDIUM | Includes capacity limits, waitlist functionality for popular events |
| Recurring event templates | Most runs happen weekly on same schedule | MEDIUM | Auto-scheduling reduces organizer workload by 80%+ |
| Mobile-responsive design | 70%+ of users access on mobile | MEDIUM | Critical for on-the-go access and day-of event checking |
| Route library/management | Clubs reuse favorite routes regularly | MEDIUM | Store routes with metadata (distance, category, end location) |
| Basic organizer permissions | Separate admin vs public capabilities | LOW | Organizers edit/create, public views only |
| Event categories/tags | Users filter by run type (Brewery, Coffee, etc.) | LOW | Essential for discovery and schedule organization |
| Integration with Strava | Running community standard platform | HIGH | Auto-sync activities, attendance verification, community engagement |
| Integration with Discord | Modern clubs use Discord for communication | MEDIUM | Event announcements, reminders, real-time coordination |
| Email/notification system | Remind members about upcoming events | MEDIUM | Pre-event reminders, schedule changes, cancellations |
| Social context (post-run destination) | Brewery/coffee shop is part of the experience | LOW | Display end location prominently; it's a key decision factor |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Route metadata richness | Goes beyond distance to include elevation, terrain, difficulty, scenic ratings | MEDIUM | Helps runners choose appropriate events; builds route reputation |
| Pace group organization | Events can specify multiple pace groups (8min/mi, 10min/mi, etc.) | LOW | Strava added this in 2026; reduces no-one-to-run-with friction |
| Historical event insights | Show past attendance, popular routes, seasonal patterns | HIGH | Helps organizers optimize scheduling; shows club growth |
| Weather integration | Auto-display forecast for event day/time | LOW | Reduces "should I bring a jacket?" questions |
| Partner/sponsor highlights | Feature breweries, coffee shops, local businesses | LOW | Monetization opportunity; community building |
| Public route map embedding | Interactive map on event page | MEDIUM | Visual route preview reduces uncertainty for new members |
| Attendance streaks/badges | Gamification for regular attendees | MEDIUM | Builds habit, increases retention; Strava-style engagement |
| Auto-posting to Strava clubs | Two-way sync: create event in scheduler → auto-posts to Strava club | HIGH | Reduces duplicate work; maintains single source of truth |
| Discord slash commands | `/schedule` or `/next-run` in Discord | MEDIUM | Meets users where they are; reduces app-switching |
| Route difficulty ratings | Community or organizer-rated challenge level | LOW | Helps newcomers choose appropriate first event |
| Event series/challenges | "5K Summer Series" or "Coffee Shop Tour" | MEDIUM | Increases engagement through progression/completion goals |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Payment processing for events | "Some clubs charge for events" | Adds regulatory compliance, tax implications, support burden | Use external platforms (RunSignUp, Eventbrite) for paid events; focus on free community runs |
| Real-time GPS tracking during runs | "Cool to see where everyone is" | Privacy concerns, battery drain, safety issues, tech support load | Post-run Strava activity sharing achieves similar social goal without drawbacks |
| Advanced role hierarchy | "We need sub-organizers, captains, etc." | Complexity that 90% of small clubs don't need | Start with organizer/member binary; add roles only if validated |
| Custom mobile apps | "We want our own app" | Development/maintenance cost 10-100x web | Progressive Web App (PWA) provides 90% of native app UX |
| Social network features | "Let members post photos, comments, etc." | Content moderation burden, spam management | Leverage existing platforms (Discord, Instagram); don't recreate social networks |
| Advanced analytics/reporting | "Give us charts and graphs" | Feature bloat for MVP; most organizers don't use | Start simple (attendance counts); add analytics only if requested post-launch |
| Multi-club federation | "Connect all running clubs in the city" | Network effects require scale; chicken-egg problem | Focus on single-club experience first; federation is v2+ feature |

## Feature Dependencies

```
Event Creation
    └──requires──> Route Library (must have routes to schedule)
                       └──requires──> Route Metadata (distance, category, end location)

RSVP Functionality
    └──requires──> Event Creation
    └──enhances──> Email Notifications (notify on RSVP confirmation)

Strava Integration
    └──requires──> Event Creation
    └──enhances──> Attendance Tracking (auto-verify via Strava activities)
    └──enhances──> Historical Insights (pull activity data)

Discord Integration
    └──requires──> Event Calendar (something to announce)
    └──enhances──> RSVP Functionality (RSVP via Discord)

Recurring Events
    └──requires──> Event Creation
    └──conflicts──> Complex Scheduling Logic (keep it simple: weekly repeats only)

Pace Groups
    └──requires──> Event Creation
    └──optional──> Route Metadata (suggested paces for route difficulty)

Waitlist Functionality
    └──requires──> RSVP with Capacity Limits
    └──enhances──> Email Notifications (notify when spot opens)
```

### Dependency Notes

- **Route Library is foundational:** Cannot create events without routes to schedule
- **RSVP drives engagement features:** Capacity limits, waitlists, notifications all depend on RSVP system
- **Integrations are enhancers, not blockers:** Strava/Discord integrations make features better but shouldn't block core functionality
- **Keep recurring events simple:** Weekly repeats cover 95% of use cases; avoid complex recurrence rules initially

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] Public event calendar (list and month view) — Must see what's scheduled without login
- [ ] Event creation/editing (organizer only) — Core scheduling capability
- [ ] Route library with metadata (distance, category, end location) — Foundation for event creation
- [ ] Event categories (Brewery, Coffee, Brunch, Weekend) — Essential for browsing/filtering
- [ ] Basic RSVP functionality — Validate that people want to commit to events
- [ ] Mobile-responsive design — 70%+ of traffic will be mobile
- [ ] Discord webhook integration — Announce new events to existing community channel
- [ ] Recurring event templates (weekly repeats) — Reduce organizer workload for regular runs

**Validation goal:** Can organizers easily schedule runs? Do members RSVP and show up?

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Strava integration (read clubs, post events) — Add when users request sync with Strava
- [ ] Email notifications (upcoming events, reminders) — Add when RSVP numbers justify automation
- [ ] RSVP capacity limits + waitlist — Add when events start hitting capacity issues
- [ ] Pace group specification — Add when organizers request it (Strava added in 2026, will become expected)
- [ ] Weather integration — Low-effort enhancement once events proven
- [ ] Public route map display — Add when users request route previews
- [ ] Event detail editing history/audit log — Add for organizer accountability

**Trigger:** User feedback requests or observed pain points

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Historical event insights/analytics — Defer until enough data exists
- [ ] Attendance streaks/gamification — Defer until retention becomes priority
- [ ] Advanced Discord integration (slash commands, RSVP via bot) — Defer until basic integration validated
- [ ] Two-way Strava sync (create in Strava → import here) — Complex; defer until single-direction working
- [ ] Event series/challenges — Defer until club shows interest in structured programming
- [ ] Route difficulty ratings — Defer until route library is robust
- [ ] Multi-route events (choose your own route) — Edge case; defer indefinitely

**Why defer:** Avoid feature bloat; focus on core scheduling problem first

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Public event calendar | HIGH | LOW | P1 |
| Event creation (organizer) | HIGH | LOW | P1 |
| Route library + metadata | HIGH | MEDIUM | P1 |
| Event categories/filtering | HIGH | LOW | P1 |
| Basic RSVP | HIGH | MEDIUM | P1 |
| Mobile-responsive design | HIGH | MEDIUM | P1 |
| Discord webhook | HIGH | LOW | P1 |
| Recurring event templates | HIGH | MEDIUM | P1 |
| Strava integration | HIGH | HIGH | P2 |
| Email notifications | MEDIUM | MEDIUM | P2 |
| Capacity limits + waitlist | MEDIUM | MEDIUM | P2 |
| Pace groups | MEDIUM | LOW | P2 |
| Weather integration | MEDIUM | LOW | P2 |
| Route map display | MEDIUM | MEDIUM | P2 |
| Historical analytics | LOW | HIGH | P3 |
| Attendance gamification | LOW | MEDIUM | P3 |
| Advanced Discord integration | MEDIUM | HIGH | P3 |
| Two-way Strava sync | MEDIUM | HIGH | P3 |
| Event series/challenges | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch (validates core concept)
- P2: Should have, add when possible (addresses observed pain points)
- P3: Nice to have, future consideration (optimization/enhancement)

## Competitor Feature Analysis

| Feature | Strava Clubs | Discord Bots (Apollo, Sesh) | Club Management Platforms (Endurela, Heylo) | Our Approach |
|---------|--------------|----------------------------|------------------------------------------|--------------|
| Event scheduling | Yes, added Club Events 2026 with RSVP limits, pace groups | Yes, full-featured calendar systems | Yes, comprehensive event management | Simple, running-specific; pre-populate from route library |
| RSVP tracking | Yes, with capacity limits | Yes, with reminders | Yes, with waitlists | P1: basic RSVP; P2: capacity/waitlist |
| Route management | Individual route storage, not club-level | N/A (general purpose) | Limited or generic "location" | P1: Dedicated route library with running-specific metadata |
| Recurring events | Yes (weekly repeats) | Yes (complex recurrence rules) | Yes (flexible scheduling) | P1: Weekly repeats only (KISS) |
| Integrations | API for external tools | Multi-platform (Google Cal, etc.) | Varies by platform | P1: Discord; P2: Strava |
| Mobile experience | Native app (excellent) | Works in Discord app | Web-based, mobile-responsive | PWA (P2+), mobile-first web |
| Cost model | Free (part of Strava) | Freemium or paid tiers | Paid subscriptions ($50-200/mo) | Free for clubs (monetize via sponsorships?) |
| Community features | Activity feed, comments | Chat-native | Email, member directory | Leverage Discord/Strava; don't rebuild |

**Our differentiation:**
- **Route-first design:** Unlike general event tools, routes are first-class citizens with rich metadata
- **Social destination emphasis:** Brewery/coffee shop is part of the event, not an afterthought
- **Single-club focus:** Not trying to be all-in-one club management; just scheduling
- **Integration over reinvention:** Use Discord for community, Strava for activities; focus on scheduling gap

## Sources

### Run Club Management Research
- [The Best Running Club Software in 2024 | Springly](https://www.springly.org/en-us/nonprofit/running-club-software/)
- [Why Running Club Leaders Choose Heylo](https://www.heylo.com/running-club)
- [Running Club Management: 10 Best Practices for Growth and Retention | Endurela Blog](https://endurela.com/blog/running-club-management-best-practices/)
- [Building Community: How to Foster Engagement in Your Running Club | Endurela Blog](https://endurela.com/blog/building-community/)
- [2025 Running Club Trends: Surge in Participation & Social Impact](https://www.accio.com/business/running_club_trend)

### Event Scheduling & RSVP Systems
- [Group Events for Clubs – Strava Support](https://support.strava.com/hc/en-us/articles/216918607-Group-Events-for-Clubs)
- [Strava targets leaderboard accuracy, and rolls out navigation and club event updates](https://endurance.biz/2026/industry-news/strava-targets-leaderboard-accuracy-and-rolls-out-navigation-and-club-event-updates/)
- [Club Event Insights – Strava Support](https://support.strava.com/hc/en-us/articles/36495511851917-Club-Event-Insights)
- [Apollo Discord Bot: The best calendar and event bot on Discord](https://apollo.fyi/)
- [sesh.fyi - The best calendar and event bot for Discord](https://sesh.fyi/)
- [RSVP Events Waitlist - EventON](https://www.myeventon.com/addons/rsvp-events-waitlist/)
- [Recurring Events - Simplify Meeting Management | Cal.com](https://cal.com/blog/recurring-events-simplifying-meeting-management-for-busy-professionals)

### Social Running Events
- [Brewery Running Series | We Run For Beer](https://www.breweryrunningseries.com/)
- [2026 Winter Events | MN Brewery Running Series | Eventbrite](https://www.eventbrite.com/cc/2026-winter-events-mn-brewery-running-series-4801736)

### Event Management Best Practices
- [12 Event Planning Problems and Solutions](https://www.eventtia.com/en/6-common-event-management-mistakes-and-what-to-do-instead/)
- [How to Manage Google Calendar Visibility - 2026 Guide](https://www.onecal.io/blog/how-to-manage-google-calendar-visibility)
- [Control access to a shared calendar - Google Calendar Help](https://support.google.com/calendar/answer/15716974?hl=en)

### Metadata & Route Management
- [Challenges for Clubs - Ride With GPS Help](https://ridewithgps.com/help/challenges-for-clubs)
- [How to Define a Metadata Tagging Strategy](https://www.siffletdata.com/blog/metadata-tagging)

---
*Feature research for: Astoria Runners Event Scheduling Tool*
*Researched: 2026-02-12*
