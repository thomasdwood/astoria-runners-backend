# Project Research Summary

**Project:** Astoria Runners - Run Club Planning Tool
**Domain:** Event Scheduling & Route Management
**Researched:** 2026-02-12
**Confidence:** HIGH

## Executive Summary

Run club event scheduling is a well-established domain with clear technical patterns. The core challenge is building a lightweight tool that replaces failed Google Sheets with proper concurrency control, timezone handling, and integration capabilities. Research shows Next.js 15 + PostgreSQL + Prisma is the 2025 gold standard for this type of application, providing full-stack type safety and budget-friendly deployment options.

The recommended approach prioritizes foundation correctness over feature velocity. Critical architectural decisions—optimistic locking for concurrent edits, UTC+timezone storage, event series pattern for recurring events, and async webhook delivery—must be implemented in Phase 1. Deferring these creates technical debt that's extremely expensive to fix later. The route library is foundational: events can't exist without routes to schedule.

Key risks center on data integrity (concurrent edits, timezone bugs, GPX corruption) and integration reliability (webhook failures, API rate limits). All risks have established mitigation patterns documented in research. With proper foundation and testing, this is a straightforward 4-phase build: Foundation → RSVP/Attendance → Integrations → Polish.

## Key Findings

### Recommended Stack

Next.js 15 with TypeScript represents the industry standard for full-stack React applications in 2025. The framework provides built-in routing, API routes, Server Components, and excellent deployment optimization. Combined with Prisma ORM and PostgreSQL, this stack delivers end-to-end type safety from database to UI with minimal configuration.

**Core technologies:**
- **Next.js 15 + React 19:** Full-stack framework with App Router, React Server Components, and built-in API routes—handles SSR/SSG optimization out-of-box
- **TypeScript 5.5+:** Compile-time type safety eliminates entire classes of bugs, essential for schema validation with Zod and tRPC type inference
- **PostgreSQL 15+:** Industry standard RDBMS with robust scheduling queries, JSON fields for flexible GPX storage, and free tiers on Vercel/Supabase/Railway
- **Prisma ORM 7.3+:** Type-safe database queries auto-generated from schema, visual Studio tool, and migration system—Version 7 is Rust-free for simpler deployments
- **tRPC 11 + Zod 3.23+:** End-to-end type safety without code generation, procedures defined once with types automatically inferred on client
- **Tailwind CSS 4.1:** Version 4 with 5x faster builds, CSS-first configuration, zero-config setup—utility-first approach enables rapid prototyping
- **shadcn/ui:** Copy-paste component library on Radix UI primitives, fully customizable and accessible by default, styled with Tailwind
- **react-big-calendar 1.19+:** Industry standard for event calendar UIs supporting multiple views, drag-and-drop, and custom styling
- **Leaflet 1.9+ + react-leaflet + leaflet-gpx:** Lightweight open-source mapping with GPX track rendering, no API keys required

**Critical version requirements:**
- Node.js 20 LTS minimum for Next.js 15
- React 19+ required by Next.js 15
- date-fns 3.6+ with date-fns-tz for timezone handling (more performant and tree-shakeable than alternatives)

**Deployment approach:**
Vercel (zero-config Next.js deployment) + Supabase PostgreSQL (free 500MB tier for POC, scales to Vercel Postgres for production). Total cost: $0 for MVP, $20-50/month at scale with budget caps to prevent overages.

### Expected Features

Research reveals a clear feature landscape with well-defined table stakes vs differentiators. The run club domain has mature patterns from established platforms (Strava Clubs, Endurela, Heylo).

**Must have (table stakes):**
- Public event calendar view—users expect to see schedules without login (default for all event platforms)
- Event details (date, time, location, distance)—core information for attendance decisions
- RSVP/attendance tracking—organizers need headcounts with capacity limits and waitlist
- Recurring event templates—weekly repeats reduce organizer workload by 80%+
- Mobile-responsive design—70%+ of users access on mobile
- Route library with rich metadata—distance, category, elevation, end location (social destination)
- Basic organizer permissions—separate admin vs public capabilities
- Event categories/tags—filter by run type (Brewery, Coffee, Weekend)
- Strava integration—running community standard for activity tracking
- Discord integration—modern clubs use Discord for communication
- Email/notification system—remind members about upcoming events

**Should have (competitive):**
- Pace group organization—Strava added this in 2026, becoming expected feature
- Route metadata richness—elevation, terrain, difficulty ratings help runners choose appropriate events
- Weather integration—auto-display forecast reduces "what to wear" questions
- Public route map embedding—interactive preview reduces uncertainty for new members
- Historical event insights—past attendance patterns help organizers optimize scheduling
- Attendance streaks/badges—gamification builds habit and increases retention
- Auto-posting to Strava clubs—two-way sync reduces duplicate work
- Discord slash commands—meet users where they are, reduces app-switching

**Defer (v2+):**
- Payment processing—adds regulatory/tax burden, use external platforms (RunSignUp) instead
- Real-time GPS tracking—privacy concerns and battery drain without clear value
- Advanced role hierarchy—complexity 90% of small clubs don't need
- Custom mobile apps—PWA provides 90% of native UX at 1/10th the cost
- Social network features—content moderation burden, leverage existing platforms instead
- Multi-club federation—network effects require scale, chicken-egg problem

**Feature dependencies identified:**
Route Library is foundational—cannot create events without routes to schedule. RSVP drives engagement features (capacity limits, waitlists, notifications). Integrations are enhancers, not blockers for core functionality. Keep recurring events simple: weekly repeats cover 95% of use cases.

### Architecture Approach

JAMstack with serverless functions pattern optimized for read-heavy workloads (public calendar) with occasional writes (event creation). Static frontend on CDN, serverless API functions for dynamic operations, PostgreSQL for structured data. Budget-sensitive and globally performant.

**Major components:**
1. **Public Views + Calendar Widget**—display upcoming events and embeddable calendar with SSR/SSG for performance and SEO
2. **Organizer Dashboard + Route Manager**—protected CRUD interface with GPX import/export, map visualization, role-based access control
3. **Events/Routes Services**—business logic layer with validation, recurring event generation, Strava/Discord integration
4. **Auth Service**—OAuth2/JWT-based authentication with role-based access (organizer vs viewer), NextAuth v5 integration
5. **Webhooks Service**—async job queue for Discord notifications with retry logic and rate limiting
6. **Data Layer**—PostgreSQL stores for events, routes, users, settings with Prisma ORM for type-safe queries

**Critical architectural patterns:**
- **Role-Based Access Control (RBAC):** Permissions assigned to roles (organizer, viewer) with principle of least privilege
- **Async Webhook Delivery:** Queue with exponential backoff prevents blocking user operations and handles external service failures
- **OAuth2 Flow:** Standard authorization for Strava API access with scoped permissions and token refresh handling
- **Event Series Pattern:** Store recurrence template separately from instances, allowing instance-level customization while maintaining series relationship

**Data flow highlights:**
- Public calendar: Static HTML served from CDN → API fetch for events → render calendar (cached/ISR)
- Event creation: Auth middleware → validate → store → queue webhook → return success (non-blocking)
- Strava import: OAuth2 → fetch route → parse GPX → validate → store with metadata → available for scheduling

**Scaling considerations:**
First bottleneck will be database connection limits (serverless functions exhaust pools). Solution: Use Supabase/Neon with built-in connection pooling. Second bottleneck: static site rebuild times. Solution: Implement ISR from start. Third bottleneck: webhook delivery failures. Solution: Async queue + retry pattern (implement day 1).

### Critical Pitfalls

Research identified 7 critical pitfalls that must be addressed in foundation phase. These are domain-specific issues that appear after launch and are expensive to fix retroactively.

1. **Concurrent Edit Conflicts Without Locking** — Multiple organizers editing same event causes data overwrites (the Google Sheets failure mode). Prevention: Implement optimistic locking with version fields on each record. Verify version hasn't changed since read before updating. *Must be in Phase 1 data model.*

2. **Timezone Mishandling and DST Transitions** — Events scheduled during DST transitions show incorrect times or fail to save. Static UTC offsets break during spring-forward/fall-back. Prevention: Always store UTC timestamps + IANA timezone identifier ("America/New_York" not "EST"). Validate scheduled times exist (detect DST gaps). *Must be in Phase 1 data model.*

3. **No-Show Cascade Leading to Event Cancellations** — Free events with simple RSVPs experience 50%+ no-show rates. Organizers plan for RSVP count but actual attendance is half. Prevention: RSVP confirmation system 24-48 hours before event, track individual attendance history, use waitlist system even for free events, calculate expected attendance using historical rates. *Core in Phase 2, but data model setup in Phase 1.*

4. **Public Calendar Security Exposure** — Public calendars get indexed by search engines, exposing organizer patterns and participant information. Prevention: Use unguessable secret URLs for public viewing, implement capability-based security (secret token in URL), add robots.txt and noindex tags, separate organizer view from sanitized public view. *Must be in Phase 1 security model.*

5. **Webhook Integration Death Spiral** — Discord/Strava webhooks fail due to rate limits or repeated errors, causing external service to stop sending entirely. Prevention: Implement queue with rate limiting, use exponential backoff for retries, return 200 OK immediately and process async, monitor SSL certificate expiration, log all webhook receipts and failures. *Must be in Phase 3 integration design.*

6. **Recurring Event Architectural Trap** — Editing one instance modifies all instances, or deleting single occurrence deletes entire series. Prevention: Use "event series" pattern—store recurrence template separately from instances, generate individual events from template, allow instance-level customization, track "exceptions" (modified instances). *Must be in Phase 1 data model.*

7. **GPX File Corruption and Metadata Loss** — Files become corrupted during upload/storage/download, won't open in GPS software. Prevention: Validate GPX structure on upload (XML schema validation), check required elements and coordinate value ranges, store original + validated version, use Content-MD5 for upload integrity, test with multiple parsers before accepting. *Must be in Phase 1 foundation.*

**Anti-patterns to avoid:**
- Synchronous webhook delivery (blocks user experience on external service availability)
- Storing GPX files as BLOBs in database (use object storage with URL reference)
- Client-side only authentication (security through obscurity)
- Polling for calendar updates (use SSG with periodic rebuilds)
- Not tracking Strava rate limits (100 req/15min, 1000/day—will get blocked)

## Implications for Roadmap

Based on research, recommended phase structure prioritizes foundation correctness over feature velocity. Critical architectural decisions cannot be deferred without creating expensive technical debt.

### Phase 1: Foundation & PDF/GPX Extraction
**Rationale:** Data model decisions (concurrency control, timezone handling, event series pattern) must be correct from day one. Retrofitting optimistic locking or timezone fields is extremely difficult and requires data migration. Route library is foundational—cannot schedule events without routes.

**Delivers:**
- Database schema with version fields for optimistic locking
- UTC + timezone identifier storage pattern
- Event series data model (template + instances)
- Route library with GPX validation and metadata extraction
- Basic CRUD for routes and events
- Organizer authentication (NextAuth v5 with RBAC)
- Public calendar security model (secret URLs, capability-based access)

**Addresses features:**
- Route library with metadata (table stakes)
- Basic organizer permissions (table stakes)

**Avoids pitfalls:**
- Concurrent edit conflicts (optimistic locking in schema)
- Timezone/DST bugs (UTC+timezone pattern)
- Recurring event architecture trap (event series pattern)
- GPX corruption (validation on upload)
- Public calendar security exposure (secret URLs from start)

**Research flag:** GPX parsing and validation may need deeper research during implementation. Multiple parser libraries exist—verify leaflet-gpx vs custom XML parsing approach.

### Phase 2: Event Scheduling & Public Calendar
**Rationale:** With foundation in place (data model, route library), can now build event creation and public display. Recurring events depend on event series pattern from Phase 1. RSVP system should include basic attendance tracking to avoid no-show cascade pitfall.

**Delivers:**
- Event creation/editing interface for organizers
- Recurring event template creation (weekly repeats)
- Event instance generation from templates with exception handling
- Public calendar view (list and month view) with SSR/ISR
- Event categories and filtering (Brewery, Coffee, Weekend)
- Basic RSVP functionality with capacity limits
- Mobile-responsive design (Tailwind + shadcn/ui)

**Addresses features:**
- Public event calendar (table stakes)
- Event creation/editing (table stakes)
- Recurring event templates (table stakes)
- Event categories/tags (table stakes)
- Basic RSVP (table stakes)
- Mobile-responsive design (table stakes)

**Avoids pitfalls:**
- Event series editing properly handles single instance vs all instances
- RSVP system includes attendance history tracking (foundation for Phase 3 no-show prevention)

**Research flag:** Standard patterns, well-documented. React-big-calendar integration should be straightforward. Verify date-fns localizer setup.

### Phase 3: RSVP Enhancement & Attendance Tracking
**Rationale:** With basic RSVP in place, add sophisticated tracking to prevent no-show cascade. RSVP confirmation system requires notification infrastructure which leads naturally to email integration.

**Delivers:**
- RSVP confirmation workflow (24-48 hour pre-event confirmation)
- Waitlist system triggered by capacity limits
- Individual attendance history tracking
- Expected attendance calculation using historical no-show rates
- Email notification system (upcoming events, reminders, schedule changes)
- "Interested / Going / Can't Go" RSVP options

**Addresses features:**
- RSVP capacity limits + waitlist (table stakes/should-have)
- Email notifications (table stakes)
- Historical event insights foundation (should-have)

**Avoids pitfalls:**
- No-show cascade (confirmation system, attendance tracking, waitlist psychology)

**Research flag:** Email service selection needs research—SendGrid vs Resend vs Mailgun for transactional emails. Verify free tier limits and deliverability.

### Phase 4: External Integrations (Strava & Discord)
**Rationale:** Integrations are enhancers, not blockers for core functionality. With stable event system in place, can now add Strava OAuth and Discord webhooks. Must implement with reliability patterns from day one to avoid webhook death spiral.

**Delivers:**
- Strava OAuth2 flow for organizer accounts
- Strava route import with GPX parsing and metadata extraction
- Discord webhook integration with async queue
- Webhook retry logic with exponential backoff
- Rate limiting for both Strava API (100/15min, 1000/day) and Discord webhooks (30/60sec)
- Webhook health monitoring dashboard

**Addresses features:**
- Strava integration (table stakes)
- Discord integration (table stakes)
- Route import from Strava (should-have)

**Avoids pitfalls:**
- Webhook integration death spiral (async queue, retry logic, rate limiting)
- Strava rate limit violations (tracking, graceful degradation)

**Research flag:** Strava API v3 integration needs verification—check current webhook subscription requirements and OAuth scope options. Discord webhook formatting for event announcements needs research for optimal UX.

### Phase Ordering Rationale

1. **Phase 1 must come first** because data model decisions (optimistic locking, timezone storage, event series pattern) cannot be retroactively added without expensive migrations and breaking changes. Route library is dependency for all event features.

2. **Phase 2 builds on Phase 1 foundation** to deliver core value—organizers can schedule events, public can view calendar. Recurring events depend on event series pattern from Phase 1.

3. **Phase 3 enhances RSVP** with sophisticated tracking and notifications. Cannot do this effectively without basic RSVP system from Phase 2. Notification infrastructure needed for Phase 4 integrations.

4. **Phase 4 adds integrations** after stable event system exists. Integrations are enhancers—Strava and Discord make the system better but aren't blocking for core scheduling functionality.

This ordering maximizes value delivery while avoiding technical debt. Each phase delivers working functionality and sets up the next phase's dependencies.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 1:** GPX parsing library selection and validation approach needs comparison—leaflet-gpx vs togeojson vs custom XML parsing
- **Phase 3:** Email service provider selection with cost/deliverability comparison—SendGrid vs Resend vs Mailgun transactional email features
- **Phase 4:** Strava API v3 current requirements and Discord webhook message formatting best practices

**Phases with standard patterns (skip research-phase):**
- **Phase 2:** Event scheduling with react-big-calendar is well-documented, standard Next.js + Prisma CRUD patterns apply
- **Phase 3:** RSVP confirmation workflows and waitlist patterns are established in event management systems
- **Phase 4:** OAuth2 flow is standard pattern with extensive Next.js + NextAuth documentation

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified with official Next.js 15, Prisma 7, Tailwind v4, and React 19 documentation. Version compatibility confirmed from release notes. |
| Features | MEDIUM-HIGH | Based on multiple run club management platforms (Strava Clubs, Endurela, Heylo) and event scheduling best practices. Feature landscape is mature. |
| Architecture | HIGH | JAMstack with serverless functions is well-established pattern. Next.js + Vercel deployment is heavily documented. Budget estimates verified from Vercel pricing and Supabase free tier specs. |
| Pitfalls | MEDIUM-HIGH | Pitfalls documented from event management mistakes, calendar systems issues, and webhook integration failures. Timezone/DST pitfalls verified from Rails/JavaScript handling guides. Concurrent edit patterns from real-time collaboration research. |

**Overall confidence:** HIGH

Research is based on official documentation for core stack, established patterns from mature platforms in the domain, and verified technical patterns for identified pitfalls. The run club event scheduling domain is well-explored with clear best practices.

### Gaps to Address

**Minor gaps requiring validation during implementation:**

- **GPX parser performance:** Need to test leaflet-gpx library with large GPX files (10k+ points) to verify performance is acceptable for web parsing vs background job requirement. May need to implement file size limits or background processing for very large files.

- **Strava API approval timing:** Strava API requires approval for higher rate limits beyond basic tier. Need to factor 2-week approval process into Phase 4 timeline if planning to support many simultaneous route imports. Can start with basic tier for POC.

- **Vercel Postgres vs Supabase decision point:** Research recommends starting with Supabase for generous free tier, then migrating to Vercel Postgres for production. Need to validate migration complexity and determine trigger point (number of events/users) for migration decision.

- **ISR revalidation timing:** Need to determine optimal Incremental Static Regeneration interval for public calendar pages. Research suggests 15 minutes but should validate based on actual event update frequency. Balance between freshness and build costs.

**These gaps are minor and can be resolved during implementation. They don't affect foundational architectural decisions.**

## Sources

### Primary (HIGH confidence)
- Next.js 15 official documentation (stable release, 15.5 updates)
- Prisma ORM 7 release notes and migration guides
- Tailwind CSS v4 documentation and migration guide
- React 19 release notes (concurrent features, Server Components)
- Strava Developers API documentation (v3, webhooks, OAuth)
- Discord Developers webhook documentation (rate limits, best practices)
- OWASP Authorization Cheat Sheet (RBAC patterns)
- IANA timezone database documentation (DST handling)

### Secondary (MEDIUM confidence)
- Run club management platform research (Endurela, Heylo, Springly blog posts)
- Strava Club Events features and insights documentation (2026 updates)
- Event management best practices (Eventtia, Eventdex, Glueup articles)
- Calendar system design patterns (Medium, GeeksforGeeks, Educative)
- React calendar library comparisons (Builder.io, npm package stats)
- Webhook system design guides (System Design Handbook, Hookdeck)
- GPX file format specifications and corruption recovery guides

### Tertiary (LOW confidence)
- Community discussions on concurrent editing patterns (Stack Overflow, Reddit)
- Anecdotal reports of no-show rates for free events (blog posts, run club forums)
- Discord bot integration examples (GitHub repositories)

**Source quality:** Mix of official documentation (high confidence), established platform documentation (medium-high confidence), and community best practices (medium confidence). No reliance on single-source claims for critical decisions.

---
*Research completed: 2026-02-12*
*Ready for roadmap: Yes*
