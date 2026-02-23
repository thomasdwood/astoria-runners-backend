---
status: testing
phase: 01-foundation-authentication
source: 01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md
started: 2026-02-15T00:00:00Z
updated: 2026-02-15T00:00:00Z
---

## Current Test

number: 1
name: Docker Services Start
expected: |
  Running `docker compose up -d` starts PostgreSQL 17 and Redis 7 containers without errors.
  Both services show as "running" in `docker compose ps`.
awaiting: user response

## Tests

### 1. Docker Services Start
expected: Running `docker compose up -d` starts PostgreSQL 17 and Redis 7 containers without errors. Both services show as "running" in `docker compose ps`.
result: [pending]

### 2. Database Schema Deployed
expected: Running `npx drizzle-kit push` creates the users table in PostgreSQL without errors. Schema includes id, email, password_hash, display_name, role, version, created_at, updated_at columns.
result: [pending]

### 3. Server Starts Successfully
expected: Running `npm run dev` starts the Express server on port 3000 without errors. Console shows "Server listening on port 3000" message.
result: [pending]

### 4. Health Check Endpoint Works
expected: Visiting http://localhost:3000/health or running `curl http://localhost:3000/health` returns 200 OK with { status: "ok" } JSON response.
result: [pending]

### 5. Seed Script Creates Demo Accounts
expected: Running `npm run db:seed` creates 2 organizer accounts (admin@astoriarunners.com and thomas.d.wood@gmail.com) with hashed passwords. Script outputs "Seeded users" message and can run multiple times without errors.
result: [pending]

### 6. Database Contains Seeded Users
expected: Querying the database shows 2 users with role 'organizer'. Both have email, display_name, hashed password, version=0, and timestamptz values for created_at/updated_at.
result: [pending]

### 7. Login with Valid Credentials
expected: POST to /auth/login with {"email":"admin@astoriarunners.com","password":"organizer123"} returns 200 with user data JSON and sets a session cookie named 'sid'.
result: [pending]

### 8. Session Cookie Configuration
expected: The session cookie from login has httpOnly=true, sameSite=lax, maxAge=7 days (604800000ms), and secure=true in production.
result: [pending]

### 9. Session Persists Across Requests
expected: After logging in, GET /auth/me returns 200 with user data (id, email, displayName) without needing to send credentials again.
result: [pending]

### 10. Login with Wrong Password
expected: POST to /auth/login with correct email but wrong password returns 401 with generic error message "Invalid credentials" (same message as wrong email to prevent enumeration).
result: [pending]

### 11. Login with Nonexistent Email
expected: POST to /auth/login with email that doesn't exist returns 401 with generic error message "Invalid credentials" (prevents email enumeration).
result: [pending]

### 12. Logout Destroys Session
expected: POST to /auth/logout after being logged in returns 200, destroys the session, and clears the session cookie. Subsequent requests show user is logged out.
result: [pending]

### 13. Session Cleared After Logout
expected: After logout, GET /auth/me returns 401 with "Not authenticated" error (session no longer valid).
result: [pending]

### 14. Protected Route Blocks Unauthenticated
expected: Accessing a protected route (will be created in Phase 2+) without authentication returns 401 for API requests or redirects to /login for browser requests.
result: [pending]

### 15. Public Calendar Accessible Without Auth
expected: GET /calendar without authentication returns 200 with events array (currently empty placeholder). No login required.
result: [pending]

### 16. Rate Limiting on Failed Logins
expected: After 5 failed login attempts within 15 minutes, the 6th attempt returns 429 Too Many Requests. Successful login attempts don't count toward the limit.
result: [pending]

### 17. TypeScript Compilation Succeeds
expected: Running `npx tsc --noEmit` compiles all TypeScript files without type errors. All imports resolve correctly.
result: [pending]

## Summary

total: 17
passed: 0
issues: 0
pending: 17
skipped: 0

## Gaps

[none yet]
