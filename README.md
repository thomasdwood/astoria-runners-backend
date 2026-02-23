# Astoria Runners Planning Tool

A web-based planning tool for Astoria Runners where organizers schedule future runs from a library of pre-defined routes, and members can view the schedule.

## What This Does

**For Organizers:**
- Create and manage a library of running routes (with distance, category, end location)
- Schedule one-off runs or recurring weekly events
- Automatic Discord notifications when events are created/updated/deleted
- Export event descriptions to Meetup format with one click
- Track which events have been posted to Meetup

**For Members (Public):**
- View upcoming runs in calendar format (month grid or list view)
- Filter by category (Brewery Run, Coffee Run, Brunch Run, Weekend)
- No login required - public access

## Tech Stack

- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL 16
- **Sessions:** Redis
- **Schema:** Drizzle ORM
- **Validation:** Zod
- **Integrations:** Discord webhooks

## Prerequisites

Install these before starting:

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)

That's it! Docker will provide PostgreSQL and Redis.

## Quick Start

### 1. Clone and Install Dependencies

```bash
cd astoria-runners
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults work for local development):

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=astoria_runners
DB_USER=postgres
DB_PASSWORD=postgres
SESSION_SECRET=change-me-to-a-random-string-at-least-32-chars
REDIS_URL=redis://localhost:6379

# Discord Integration (optional - leave empty to disable notifications)
DISCORD_WEBHOOK_URL=
```

**Important:** Change `SESSION_SECRET` to a secure random string before deploying to production.

### 3. Start Database Services

Start PostgreSQL and Redis with Docker:

```bash
docker compose up -d
```

Verify they're running:

```bash
docker compose ps
```

You should see both `astoria-runners-postgres` and `astoria-runners-redis` running.

### 4. Initialize Database

Push the schema to PostgreSQL:

```bash
npm run db:push
```

Seed with sample data (demo users, routes, events):

```bash
npm run db:seed
```

### 5. Start the Application

```bash
npm run dev
```

The app will start at **http://localhost:3000**

## Demo Accounts

The seed script creates two organizer accounts:

| Email | Password | Name |
|-------|----------|------|
| `admin@astoriarunners.com` | `organizer123` | Demo Organizer |
| `sarah@astoriarunners.com` | `organizer123` | Sarah |

Use these to log in and test the application.

## API Endpoints

### Public Routes (No Auth Required)

```
GET  /health                              Health check
GET  /calendar?view=month&year=2026&month=2  Calendar view (month grid)
GET  /calendar?view=list&start=...&end=...   Calendar view (chronological list)
```

### Authentication

```
POST /auth/login                          Login (email, password)
POST /auth/logout                         Logout
GET  /auth/me                             Get current user
```

### Routes (Organizer Only)

```
GET    /api/routes                        List all routes (optional: ?category=Brewery+Run)
POST   /api/routes                        Create route
GET    /api/routes/:id                    Get route by ID
PUT    /api/routes/:id                    Update route (requires version for optimistic locking)
DELETE /api/routes/:id                    Delete route (fails if referenced by events)
```

### Events (Organizer Only)

```
GET    /api/events                        List events (optional: ?category=...&start=...&end=...)
POST   /api/events                        Create event
GET    /api/events/:id                    Get event by ID
PUT    /api/events/:id                    Update event (requires version)
DELETE /api/events/:id                    Delete event
GET    /api/events/:id/meetup-export      Generate Meetup description
PUT    /api/events/:id/meetup-status      Mark as posted to Meetup
```

### Recurring Templates (Organizer Only)

```
GET    /api/recurring-templates           List all recurring templates
POST   /api/recurring-templates           Create recurring template
GET    /api/recurring-templates/:id       Get template by ID
GET    /api/recurring-templates/:id/instances  Generate event instances (optional: ?count=12)
PUT    /api/recurring-templates/:id       Update template (requires version)
DELETE /api/recurring-templates/:id       Delete template
```

## Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm run db:generate  # Generate migration files from schema changes
npm run db:migrate   # Run migrations
npm run db:push      # Push schema directly to database (dev only)
npm run db:seed      # Seed database with sample data
```

## Sample Data

The seed script creates:

**Routes (9 total):**
- 3 Brewery Runs (ICONYC, SingleCut, Astoria Bier & Cheese)
- 3 Coffee Runs (Kinship, The Queens Kickshaw, Mighty Oak)
- 2 Brunch Runs (Comfortland, Bareburger)
- 1 Weekend Run (Astoria Park 5-Miler)

**Recurring Templates (3 weekly runs):**
- Tuesday evenings at SingleCut Brewing
- Thursday evenings at Kinship Coffee
- Saturday mornings for Bareburger brunch

**One-off Events (3 upcoming runs):**
- Dynamically dated based on current date

## Discord Integration (Optional)

To enable Discord notifications:

1. Create a Discord webhook in your server:
   - Server Settings → Integrations → Webhooks → New Webhook
   - Copy the webhook URL

2. Add it to `.env`:
   ```env
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
   ```

3. Restart the app

The app will now post to Discord when:
- Events are created
- Events are updated
- Events are deleted

Notifications are fire-and-forget (non-blocking) - if Discord is down, the event operations still succeed.

## Database Management

### Stop Services

```bash
docker compose down
```

### Reset Database (Nuclear Option)

```bash
docker compose down -v      # Stop and remove volumes
docker compose up -d        # Start fresh
npm run db:push            # Recreate schema
npm run db:seed            # Reseed data
```

### Access Database Directly

```bash
docker exec -it astoria-runners-postgres psql -U postgres -d astoria_runners
```

Then run SQL queries:
```sql
SELECT * FROM users;
SELECT * FROM routes;
SELECT * FROM events;
\q  -- quit
```

## Troubleshooting

### Port Already in Use

If port 3000 is taken, change `PORT` in `.env`:
```env
PORT=3001
```

### Database Connection Failed

Check if PostgreSQL is running:
```bash
docker compose ps
```

If stopped, start it:
```bash
docker compose up -d
```

### Redis Connection Failed

Same as above - verify Redis container is running.

### Session Not Persisting

Check that Redis is running and `REDIS_URL` in `.env` matches your setup (default: `redis://localhost:6379`).

### TypeScript Errors

Rebuild:
```bash
npm run build
```

If errors persist, check that all dependencies are installed:
```bash
npm install
```

## Architecture Notes

### Optimistic Locking

All updates require a `version` field to prevent concurrent modification conflicts:

```json
PUT /api/routes/1
{
  "name": "Updated Name",
  "version": 0
}
```

If the version doesn't match the database, the update fails with a 409 Conflict error.

### Timestamp Storage

All timestamps use PostgreSQL `timestamptz` (timestamp with time zone) for UTC storage. The app handles timezone conversions.

### Recurring Events

Recurring templates use RRULE (iCalendar standard) to generate event instances on-the-fly. They're not materialized in the database - instances are computed when requested.

### Public Access Model

The `/calendar` endpoint is public (no authentication required) to reduce friction for new members discovering the club.

## Production Deployment

Before deploying to production:

1. **Change `SESSION_SECRET`** to a strong random value (32+ characters)
2. **Use managed database** instead of Docker (e.g., Neon, Railway, Render)
3. **Use managed Redis** (e.g., Upstash, Redis Cloud)
4. **Set `NODE_ENV=production`** in environment
5. **Enable HTTPS** (required for secure cookies)
6. **Review rate limits** in `src/middleware/rateLimiter.ts`
7. **Set up monitoring** for Discord webhook failures

## License

ISC

## Questions?

Built with the Get Shit Done (GSD) workflow.
Project completed: 2026-02-13
