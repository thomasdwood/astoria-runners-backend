# Security Best Practices

This document captures the security model and coding standards for the Astoria Runners backend. It should be consulted when planning and executing any phase that touches routes, services, or database access.

---

## Auth Stack

- **Sessions:** `express-session` backed by Redis. Cookie named `sid`, `httpOnly`, `secure` in production, `sameSite: lax`.
- **Passwords:** Argon2 with 19 MiB memory cost, 2 time iterations (OWASP-compliant).
- **Rate limiting:** Auth endpoints — 5 attempts / 15 min (`skipSuccessfulRequests: true`). Public endpoints — 100 req / 15 min.
- **Session destruction:** `req.session.destroy()` on logout (logs out all devices).

---

## Authorization Rules

### Route Protection Levels

| Level | Middleware | When to use |
|-------|-----------|-------------|
| Public | None | Read-only public data (calendar, categories) |
| Authenticated | `requireAuth` | Any user may act on the resource |
| Admin/Owner | `requireAuth` + ownership check | Mutations on user-owned resources |

### Ownership Checks — Single-Organizer Model (Phase 6 resolved)

**Single-organizer model:** This app has one organizer role. No resource has a `createdBy` column. Any authenticated user IS the authorized user for all resources.

`requireAuth` middleware IS the ownership check for this system. There is no per-resource ownership comparison because there is only one organizer who could have created any resource.

**If multi-organizer support is ever added:** Add a `createdBy` column to resources and apply this pattern before any mutation:

```ts
// Pattern for future multi-organizer ownership check
const resource = await db.query.events.findFirst({ where: eq(events.id, id) });
if (!resource) return res.status(404).json({ error: 'Not found' });
if (resource.createdBy !== req.session.userId) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

### Settings Endpoint Allowlist (P0 gap — Phase 6)

The `PUT /api/settings/:key` endpoint must validate the key against an allowlist before writing.

```ts
const EDITABLE_SETTINGS = ['default_start_location', 'meetup_description_template', 'discord_notifications_enabled'] as const;

if (!EDITABLE_SETTINGS.includes(req.params.key as any)) {
  return res.status(400).json({ error: 'Unknown setting key' });
}
```

---

## Input Validation

- All request bodies and query strings are validated with **Zod** before reaching service functions.
- Route `/:id` params must be parsed and validated as positive integers:

```ts
const id = parseInt(req.params.id, 10);
if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
```

- Settings values must enforce per-key constraints (max length, format) — do not accept unbounded strings for values that are displayed back to users.

---

## Database Access

- **Always use Drizzle ORM** with its query builder or parameterized expressions. Never string-interpolate user input into queries.
- Raw `pool.query()` is allowed **only** in seed/migration scripts, and must always use `$1`, `$2` placeholders.
- No dynamic `ORDER BY` or `WHERE` clauses constructed from raw user input.

---

## CSRF

**Current mitigation: `sameSite: lax` (intentional — no CSRF token mechanism needed)**

`sameSite: lax` on the `sid` session cookie prevents the browser from sending the cookie on cross-origin non-safe requests (POST, PUT, PATCH, DELETE). This is the standard browser-enforced CSRF defense and is sufficient for a single-origin app.

`csrf-csrf` (token-based CSRF) is intentionally deferred because:
- App is served from a single origin — no CORS with `credentials: true` from external origins
- App is not embedded in third-party iframes

**Revisit this decision if:** CORS policy is opened to allow credentialed cross-origin requests, or the app is embedded in third-party pages. At that point, integrate `csrf-csrf` on all state-changing endpoints.

See `src/config/session.ts` for the session cookie implementation.

---

## Error Handling

- Use `asyncHandler` wrapper on all route handlers — never let unhandled promise rejections escape.
- The centralized error handler returns generic `Internal server error` in production (no stack traces).
- Never return raw database errors or internal details to the client.

---

## Checklist for New Routes

Before opening a PR for any new route:

- [ ] Public vs. authenticated access level is explicitly decided
- [ ] Mutation endpoints verify resource ownership or role
- [ ] Request body/params are validated with Zod
- [ ] No raw string interpolation in DB queries
- [ ] Error responses are generic (no internal detail leakage)
- [ ] Settings keys are allowlisted if the route touches the settings table
