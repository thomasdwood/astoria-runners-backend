# Mac Mini Setup Checklist

Quick reference for setting up Astoria Runners on your new Mac Mini.

## Before You Start

Download these installers:
- [ ] [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
- [ ] [Node.js LTS](https://nodejs.org/) (if not already installed)

## Setup Steps (15 minutes)

### 1. Install Prerequisites

```bash
# Verify Node.js is installed
node --version  # Should be 18+
npm --version

# If not installed, download from nodejs.org
```

Install Docker Desktop:
- Open the downloaded `.dmg` file
- Drag Docker to Applications
- Launch Docker Desktop
- Wait for "Docker Desktop is running" status

### 2. Navigate to Project

```bash
cd ~/Documents/Developer/astoria-runners
```

### 3. Install Dependencies

```bash
npm install
```

Expected output: ~19 packages installed in 30 seconds

### 4. Configure Environment

```bash
# Copy example config
cp .env.example .env

# OPTIONAL: Edit .env if you want to change defaults
# nano .env
# (defaults work fine for local development)
```

### 5. Start Database Services

```bash
# Start PostgreSQL and Redis in background
docker compose up -d

# Verify they're running (should see both containers)
docker compose ps
```

Expected output:
```
NAME                        STATUS
astoria-runners-postgres    Up
astoria-runners-redis       Up
```

### 6. Initialize Database

```bash
# Create database schema
npm run db:push

# Load sample data (routes, users, events)
npm run db:seed
```

Expected output:
- Schema push: ~10 tables created
- Seed: 2 users, 9 routes, 3 recurring templates, 3 events

### 7. Start Application

```bash
npm run dev
```

Expected output:
```
Server running on http://localhost:3000
```

### 8. Test It Out

Open your browser to: **http://localhost:3000/health**

Should see:
```json
{
  "status": "ok",
  "timestamp": "2026-..."
}
```

### 9. Log In

1. Go to: http://localhost:3000/auth/login
2. Use demo credentials:
   - Email: `admin@astoriarunners.com`
   - Password: `organizer123`

### 10. Explore

**Try these API calls:**

```bash
# View public calendar (no auth needed)
curl http://localhost:3000/calendar?view=list

# Login and get session cookie
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@astoriarunners.com","password":"organizer123"}' \
  -c cookies.txt

# List routes (using session)
curl http://localhost:3000/api/routes \
  -b cookies.txt

# Create a new route (using session)
curl -X POST http://localhost:3000/api/routes \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Test Route",
    "distance": "5.00",
    "category": "Weekend",
    "endLocation": "Test Location"
  }'
```

## Troubleshooting

### "Port 3000 already in use"

Change port in `.env`:
```env
PORT=3001
```

### "Cannot connect to database"

Check Docker is running:
```bash
docker compose ps

# If stopped, restart:
docker compose up -d
```

### "Command not found: docker"

Docker Desktop isn't running. Launch it from Applications folder.

### Start Fresh

If something goes wrong, reset everything:

```bash
# Stop and remove all Docker data
docker compose down -v

# Start fresh
docker compose up -d
npm run db:push
npm run db:seed
npm run dev
```

## Quick Commands Reference

```bash
# Start everything
docker compose up -d && npm run dev

# Stop everything
docker compose down
# (press Ctrl+C to stop dev server)

# View logs
docker compose logs postgres
docker compose logs redis

# Reset database
docker compose down -v
docker compose up -d
npm run db:push
npm run db:seed
```

## Next Steps

- [ ] Review API endpoints in README.md
- [ ] Set up Discord webhook (optional)
- [ ] Import real route data
- [ ] Customize for your club's needs
- [ ] Deploy to production (see README.md)

## Success!

If you can:
- ✅ Log in at `/auth/login`
- ✅ See routes at `/api/routes`
- ✅ View calendar at `/calendar`

**You're ready to go!** 🎉

See `README.md` for full documentation.
