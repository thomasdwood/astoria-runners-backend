# Architecture Research

**Domain:** Event scheduling and route management system (Run club planning tool)
**Researched:** 2026-02-12
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Presentation Layer                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Public   │  │ Calendar │  │ Organizer│  │ Route    │    │
│  │ Views    │  │ Widget   │  │ Dashboard│  │ Manager  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
├───────┴─────────────┴─────────────┴─────────────┴───────────┤
│                   Application Layer                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │           API & Business Logic                      │    │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │    │
│  │  │Events  │  │Routes  │  │Auth    │  │Webhooks│   │    │
│  │  │Service │  │Service │  │Service │  │Service │   │    │
│  │  └────────┘  └────────┘  └────────┘  └────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                   Integration Layer                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ Strava   │  │ Discord  │  │ GPX      │                   │
│  │ API      │  │ Webhook  │  │ Parser   │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
├─────────────────────────────────────────────────────────────┤
│                   Data Layer                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Events   │  │ Routes   │  │ Users    │  │ Settings │    │
│  │ Store    │  │ Store    │  │ Store    │  │ Store    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Public Views** | Display upcoming events, route details, and calendar for general visitors | Static pages with SSR/SSG or client-side rendering |
| **Calendar Widget** | Embeddable calendar for existing website integration | Iframe-based widget or JavaScript embed with customizable styling |
| **Organizer Dashboard** | CRUD operations for events and routes, authentication gate | Protected admin interface with role-based access control |
| **Route Manager** | Route library management, GPX import/export, map visualization | GPX parsing library + mapping library (Leaflet/Mapbox) + file storage |
| **Events Service** | Event creation, scheduling, metadata management, calendar logic | API endpoints with validation, business rules for recurring events |
| **Routes Service** | Route CRUD, GPX processing, Strava import, route-event association | Service layer interfacing with Strava API and GPX parser |
| **Auth Service** | Organizer authentication, role management, session handling | OAuth2/JWT-based auth with role-based access control (RBAC) |
| **Webhooks Service** | Discord notification dispatch on event changes | Async job queue for webhook delivery with retry logic |
| **Strava API** | OAuth flow for route import, activity/route data retrieval | OAuth2 client + REST API wrapper with rate limiting |
| **Discord Webhook** | POST endpoint for sending formatted event announcements | HTTP client with retry logic and rate limit handling (30 req/60s) |
| **GPX Parser** | Parse/validate/transform GPX files for route import/export | XML parser for GPX 1.1 format with validation |
| **Data Stores** | Persistent storage for events, routes, users, system settings | Relational DB (PostgreSQL) or serverless DB with schema management |

## Recommended Project Structure

```
src/
├── components/           # UI components (React/Vue/Svelte)
│   ├── public/          # Public-facing components (calendar, event list)
│   ├── admin/           # Organizer dashboard components
│   └── shared/          # Reusable UI elements (buttons, modals, forms)
├── services/            # Business logic and API services
│   ├── events.ts        # Event CRUD and scheduling logic
│   ├── routes.ts        # Route management and GPX handling
│   ├── auth.ts          # Authentication and authorization
│   ├── webhooks.ts      # Discord webhook dispatch
│   └── integrations/    # External API integrations
│       ├── strava.ts    # Strava API client
│       └── discord.ts   # Discord webhook client
├── models/              # Data models and types
│   ├── event.ts         # Event entity with validation
│   ├── route.ts         # Route entity with GPX metadata
│   └── user.ts          # User entity with roles
├── api/                 # API endpoints (REST or serverless functions)
│   ├── events/          # Event endpoints
│   ├── routes/          # Route endpoints
│   ├── auth/            # Auth endpoints
│   └── webhooks/        # Webhook trigger endpoints
├── lib/                 # Utility libraries
│   ├── gpx-parser.ts    # GPX file parsing
│   ├── date-utils.ts    # Date/time utilities for scheduling
│   └── validators.ts    # Input validation
├── db/                  # Database layer
│   ├── schema.ts        # Database schema definition
│   └── migrations/      # Database migrations
├── workers/             # Background jobs (if using queue)
│   └── webhook-sender.ts # Async webhook delivery worker
└── config/              # Configuration files
    ├── auth.ts          # Auth provider config
    └── integrations.ts  # API keys and integration settings
```

### Structure Rationale

- **components/:** Separation between public and admin interfaces prevents accidental exposure of organizer functionality and keeps bundle sizes optimized
- **services/:** Business logic isolated from UI and API layers enables testing and potential future mobile app development
- **models/:** Centralized type definitions ensure consistency across frontend and backend with shared validation logic
- **api/:** Serverless-friendly structure allows deploying as cloud functions (Vercel, Netlify, Cloudflare) for cost optimization
- **workers/:** Async webhook delivery prevents blocking user operations and enables retry logic for failed deliveries

## Architectural Patterns

### Pattern 1: JAMstack with Serverless Functions

**What:** Static frontend hosted on CDN with serverless API functions for dynamic operations. Data fetched at build time for public pages, client-side for admin operations.

**When to use:** Budget-sensitive projects needing global performance with minimal hosting costs. Ideal for read-heavy workloads (public calendar) with occasional writes (event creation).

**Trade-offs:**
- **Pros:** Near-zero hosting costs (free tiers), excellent performance, automatic scaling, minimal maintenance
- **Cons:** Cold starts on serverless functions, more complex local development setup, limited to stateless operations

**Example:**
```typescript
// Serverless function: api/events/create.ts
export default async function handler(req, res) {
  // Verify organizer authentication
  const user = await verifyAuth(req);
  if (!user.isOrganizer) return res.status(403).json({ error: 'Unauthorized' });

  // Validate and create event
  const event = await createEvent(req.body);

  // Trigger webhook asynchronously (non-blocking)
  await queueWebhook('event.created', event);

  return res.status(201).json(event);
}
```

### Pattern 2: Role-Based Access Control (RBAC)

**What:** Authorization system where permissions are assigned to roles (e.g., "organizer", "viewer") rather than individual users. Principle of least privilege applied by default.

**When to use:** Any system with multiple user types requiring different access levels. Essential for organizer authentication requirements.

**Trade-offs:**
- **Pros:** Scalable permission management, clear security boundaries, easier auditing
- **Cons:** Requires upfront role design, can be overkill for very simple apps

**Example:**
```typescript
// Auth middleware with RBAC
export const requireRole = (role: 'organizer' | 'admin') => {
  return async (req, res, next) => {
    const user = await getCurrentUser(req);
    if (!user || !user.roles.includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Protected route
app.post('/api/events', requireRole('organizer'), createEventHandler);
```

### Pattern 3: Async Webhook Delivery with Retry Logic

**What:** Webhook notifications queued and delivered asynchronously with exponential backoff retry on failure. Prevents user-facing operations from blocking on external service availability.

**When to use:** Any integration with external webhooks (Discord, Slack, etc.) where reliability matters more than instant delivery.

**Trade-offs:**
- **Pros:** Resilient to external service outages, non-blocking user experience, respects rate limits
- **Cons:** Adds complexity, requires job queue infrastructure (or serverless queue)

**Example:**
```typescript
// Queue webhook for async delivery
export async function queueWebhook(event: string, payload: any) {
  await queue.add('discord-webhook', {
    event,
    payload,
    retries: 0,
    maxRetries: 3
  });
}

// Worker processing webhook queue
export async function processWebhook(job: WebhookJob) {
  try {
    await discordClient.send(job.payload);
  } catch (error) {
    if (job.retries < job.maxRetries) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, job.retries) * 1000;
      await queue.add('discord-webhook', { ...job, retries: job.retries + 1 }, { delay });
    }
    throw error; // Mark job as failed after max retries
  }
}
```

### Pattern 4: OAuth2 Flow for Third-Party Integrations

**What:** Standard OAuth2 authorization for Strava API access. Users grant limited permissions to import routes without exposing credentials.

**When to use:** Any integration requiring user-specific data from third-party services (Strava, Garmin, etc.).

**Trade-offs:**
- **Pros:** Secure, industry-standard, scoped permissions, token refresh handling
- **Cons:** Complex multi-step flow, requires callback URL handling, token storage security concerns

**Example:**
```typescript
// Strava OAuth initialization
export async function initiateStravaAuth(userId: string) {
  const authUrl = `https://www.strava.com/oauth/authorize?` +
    `client_id=${STRAVA_CLIENT_ID}&` +
    `redirect_uri=${CALLBACK_URL}&` +
    `response_type=code&` +
    `scope=read,activity:read`;

  // Store state for CSRF protection
  await storeOAuthState(userId, generateState());

  return authUrl;
}

// OAuth callback handler
export async function handleStravaCallback(code: string, state: string) {
  // Verify state for CSRF protection
  const userId = await verifyOAuthState(state);

  // Exchange code for access token
  const tokens = await stravaClient.exchangeToken(code);

  // Store tokens securely (encrypted)
  await storeUserTokens(userId, 'strava', tokens);

  return userId;
}
```

## Data Flow

### Request Flow: Public Calendar View

```
[User Browser]
    ↓ (GET /calendar)
[Static HTML/JS] ← (served from CDN at build time or cached)
    ↓ (fetch /api/events?public=true)
[API Gateway] → [Events Service] → [Events Store]
    ↓              ↓                     ↓
[Response] ← [Filter public fields] ← [Query events]
    ↓
[Render calendar]
```

### Request Flow: Create Event (Organizer)

```
[Organizer Dashboard]
    ↓ (POST /api/events with auth token)
[Auth Middleware] → [Verify JWT/Session]
    ↓
[Events Service] → [Validate event data]
    ↓
[Events Store] ← [Insert event record]
    ↓
[Webhook Queue] ← [Queue Discord notification]
    ↓ (async)
[Background Worker] → [Discord Webhook API]
    ↓ (return 201 Created)
[Organizer Dashboard] ← [Show success message]
```

### Data Flow: Strava Route Import

```
[Organizer clicks "Import from Strava"]
    ↓
[Initiate OAuth2] → [Redirect to Strava]
    ↓ (user authorizes)
[OAuth Callback] → [Exchange code for tokens]
    ↓
[Store encrypted tokens] → [Users Store]
    ↓ (user selects route to import)
[Fetch route from Strava API]
    ↓
[Parse GPX data] → [GPX Parser]
    ↓
[Create route record] → [Routes Store]
    ↓
[Display imported route]
```

### State Management Flow

For a small application like this, a simple client-side state pattern is sufficient:

```
[Server State] (events, routes, user session)
    ↓ (React Query, SWR, or similar)
[Client Cache] → [Automatic refetch on stale/mutation]
    ↓
[UI State] (form inputs, modal state, filters)
    ↓ (React useState, Vue ref, or Svelte stores)
[Component State]
```

### Key Data Flows

1. **Event Publication:** Organizer creates event → Validate → Store → Trigger Discord webhook → Update public calendar cache
2. **Route Import:** OAuth to Strava → Fetch activity/route → Parse GPX → Store with metadata → Available for event association
3. **Calendar Sync:** Scheduled build/regeneration → Fetch all public events → Render static calendar pages → Deploy to CDN
4. **Authentication:** Login → Verify credentials → Issue JWT/session token → Store in secure cookie → Include in API requests

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users (MVP) | Static site on Vercel/Netlify free tier + PostgreSQL (Supabase/Neon free tier) + serverless functions. Total cost: $0-10/month |
| 1k-10k users | Add Redis cache for event queries, CDN for GPX files, separate webhook worker. Cost: $20-50/month |
| 10k-100k users | Dedicated database instance, job queue (BullMQ/Redis), rate limiting, database read replicas. Cost: $100-300/month |
| 100k+ users | Consider event sourcing for audit trail, separate microservices for Strava/Discord integrations, full-text search. Cost: $500+/month |

### Scaling Priorities

1. **First bottleneck: Database connection limits** (serverless functions exhaust connection pools)
   - **Fix:** Use connection pooling (PgBouncer) or serverless-friendly database (Neon, Supabase with connection pooling)
   - **Prevention:** Start with Supabase/Neon which handle this automatically

2. **Second bottleneck: Static site rebuild times** (as events grow, builds take longer)
   - **Fix:** Implement Incremental Static Regeneration (ISR) or switch to client-side rendering for calendar views
   - **Prevention:** Design calendar pages for ISR from the start (Next.js revalidate, SvelteKit server routes)

3. **Third bottleneck: Webhook delivery failures** (Discord rate limits or downtime)
   - **Fix:** Already addressed with async queue + retry pattern
   - **Prevention:** Implement from day 1, monitor queue depth

## Anti-Patterns

### Anti-Pattern 1: Synchronous Webhook Delivery

**What people do:** Send Discord webhook directly in the API endpoint that creates an event, blocking the HTTP response until Discord confirms receipt.

**Why it's wrong:** If Discord is slow or down (rate limits, outages), users wait or see errors. One flaky integration breaks core functionality.

**Do this instead:** Queue webhooks asynchronously. Return success to user immediately after database write, deliver webhook in background with retry logic. User experience stays fast regardless of Discord's availability.

### Anti-Pattern 2: Storing GPX Files in Database as BLOBs

**What people do:** Store entire GPX file content as BLOB in database records alongside route metadata.

**Why it's wrong:** Database bloat, expensive queries, inefficient for large files. GPX files can be several MB for long routes with detailed tracking points.

**Do this instead:** Store GPX files in object storage (S3, Cloudflare R2, Vercel Blob) with URL reference in database. Parse and store essential metadata (distance, elevation, bounds) in database for querying. Stream GPX from storage only when needed for display/download.

### Anti-Pattern 3: Client-Side Only Authentication

**What people do:** Check user roles only in frontend JavaScript, hide admin UI based on client state without server validation.

**Why it's wrong:** Security through obscurity. Anyone can inspect network requests and call API endpoints directly, bypassing UI restrictions.

**Do this instead:** Enforce authentication and authorization on every API endpoint. Treat frontend auth checks as UX optimization only, never security boundary. Validate JWT/session and role on server side for every protected operation.

### Anti-Pattern 4: Polling for Calendar Updates

**What people do:** Public calendar page polls `/api/events` every few seconds to check for new events.

**Why it's wrong:** Wastes serverless function invocations (costs money), database queries, and bandwidth. 99% of requests return unchanged data.

**Do this instead:** For public views, use static site generation with periodic rebuilds (e.g., every hour via cron). For admin dashboard, use optimistic UI updates after mutations and cache with smart revalidation (React Query, SWR). For real-time needs (rare in this domain), use WebSockets only where actually needed.

### Anti-Pattern 5: Not Handling Strava Rate Limits

**What people do:** Allow users to spam "Import from Strava" button, making rapid consecutive API calls without rate limit tracking.

**Why it's wrong:** Strava API has strict rate limits (100 requests per 15 minutes, 1000 per day). Exceeding limits gets your app blocked temporarily or permanently.

**Do this instead:** Implement client-side button debouncing, server-side rate limit tracking per user, and graceful error handling when limits are approached. Cache Strava responses for a reasonable TTL (5-10 minutes) to avoid redundant API calls.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Strava API** | OAuth2 + REST API with token refresh | Rate limits: 100 req/15min, 1000 req/day per application. Store refresh tokens encrypted. Handle token expiry gracefully. |
| **Discord Webhook** | HTTP POST with JSON payload | Rate limit: 30 req/60sec per webhook URL. Use async queue with rate limiter. No authentication required (URL is secret). |
| **Mapping Library** | Client-side JS (Leaflet/Mapbox GL) | Leaflet is free/open-source, Mapbox requires API key (50k loads/month free). Render GPX tracks on interactive map. |
| **GPX Files** | Object storage (S3/R2/Vercel Blob) | Store files separately from database. Use presigned URLs for secure downloads. Consider CDN caching. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Frontend ↔ API** | REST JSON over HTTPS | JWT in Authorization header or secure httpOnly cookie. All admin endpoints require auth. |
| **API ↔ Database** | SQL queries via ORM/query builder | Use parameterized queries to prevent SQL injection. Connection pooling for serverless environments. |
| **API ↔ Webhook Queue** | In-memory queue (dev) or Redis (prod) | Non-blocking enqueue operation. Worker polls queue and processes jobs. |
| **Embeddable Widget ↔ Main App** | Iframe with postMessage API or CORS-enabled API | Widget fetches `/api/events?public=true` directly or receives data via postMessage. Customizable CSS variables. |

## Budget-Conscious Architecture Recommendation

Given the budget-sensitive requirement, here's the recommended architecture stack:

```
Frontend: Next.js (Vercel) or SvelteKit (Netlify/Cloudflare Pages)
  → Static generation for public pages
  → Server-side rendering for admin dashboard
  → Serverless API routes

Database: Supabase (PostgreSQL) or Neon (serverless Postgres)
  → Free tier: 500MB database, 2GB bandwidth/month
  → Built-in connection pooling for serverless
  → Built-in auth option (can replace custom auth service)

File Storage: Cloudflare R2 or Vercel Blob Storage
  → R2: 10GB free storage, no egress fees
  → Vercel Blob: Pay-as-you-go, ~$0.15/GB/month

Hosting: Vercel, Netlify, or Cloudflare Pages
  → All offer generous free tiers
  → Automatic HTTPS, CDN, CI/CD included
  → Serverless functions for API endpoints

Background Jobs: Vercel Cron (simple) or Upstash QStash (robust)
  → Vercel Cron: Free scheduled functions
  → QStash: 500 requests/day free tier, HTTP-based queue

Monitoring: Sentry (errors) + Vercel Analytics (performance)
  → Both have generous free tiers

Total estimated cost: $0-20/month for first 1000 users
```

### Build Order Implications

Based on component dependencies, recommended build order:

1. **Foundation (Week 1-2)**
   - Database schema (events, routes, users tables)
   - Basic API structure (serverless functions)
   - Authentication service (RBAC with organizer role)

2. **Core Features (Week 3-4)**
   - Events CRUD (API + admin UI)
   - Public calendar view (static generation)
   - Routes library (basic CRUD without imports)

3. **Integrations (Week 5-6)**
   - GPX parser and file storage
   - Strava OAuth + route import
   - Discord webhook integration (async queue)

4. **Polish & Embeddability (Week 7-8)**
   - Calendar widget for existing website
   - UI/UX refinements
   - Error handling and edge cases

**Why this order:**
- Auth and database are dependencies for everything else
- Core event management provides immediate value and can be demoed early
- Integrations are "nice-to-have" features that can be built incrementally
- Widget embeddability requires stable API, so comes last

## Sources

- [Event-Driven Architecture Patterns | Gravitee](https://www.gravitee.io/blog/event-driven-architecture-patterns)
- [System Design: Event-driven architecture | GeeksforGeeks](https://www.geeksforgeeks.org/system-design/event-driven-architecture-system-design/)
- [Calendar Event Database Design | Medium](https://medium.com/tomorrowapp/the-complex-world-of-calendars-database-design-fccb3a71a74b)
- [Google Calendar System Design | Educative](https://www.educative.io/blog/google-calendar-system-design)
- [Design Database For Calendar Event And Reminder | Tutorials24x7](https://www.tutorials24x7.com/mysql/guide-to-design-database-for-calendar-event-and-reminder-in-mysql)
- [Strava API Documentation | Strava Developers](https://developers.strava.com/docs/)
- [Webhook System Design | System Design Handbook](https://www.systemdesignhandbook.com/guides/design-a-webhook-system/)
- [Intro to Discord Webhooks | Discord Support](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks)
- [Authentication vs Authorization Patterns | StackScholar](https://stackscholar.com/blog/understanding-authentication-and-authorization-in-web-apps)
- [Authorization Cheat Sheet | OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [Best Static Website Hosting 2026 | Website Planet](https://www.websiteplanet.com/blog/best-static-site-hosting/)
- [Embeddable Calendar Solutions | AddEvent](https://www.addevent.com/solutions/embeddable-calendar)
- [Running Club Management Best Practices | Endurela](https://endurela.com/blog/running-club-management-best-practices/)

---
*Architecture research for: Event scheduling and route management system (Run club planning tool)*
*Researched: 2026-02-12*
