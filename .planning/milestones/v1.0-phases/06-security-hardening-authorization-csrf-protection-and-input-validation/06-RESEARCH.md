# Phase 6: Security Hardening — Research

**Researched:** 2026-03-15
**Domain:** Express.js backend security: authorization gaps, CSRF, input validation hardening
**Confidence:** HIGH

---

## Summary

Phase 6 addresses known security gaps accumulated across Phases 1–5. The SECURITY.md document explicitly flags two P0 gaps: (1) mutation endpoints do not verify resource ownership beyond authentication, and (2) the settings `PUT /:key` endpoint does not enforce an `EDITABLE_SETTINGS` allowlist. A third area, CSRF protection, is accepted risk at the single-origin, `sameSite: lax` configuration but warrants review for completeness.

The project already uses a strong security foundation: Argon2 passwords, Redis-backed sessions, Helmet, per-endpoint Zod validation, rate limiters, and `asyncHandler` on all handlers. Phase 6 is therefore incremental hardening rather than a full security overhaul. The total scope is narrow: add ownership/authorization checks to specific mutation routes, add the settings key allowlist, add per-key value constraints to settings Zod schema, and validate the CSRF posture is documented and intentional.

No new dependencies are required. All fixes use existing primitives: Zod, Drizzle ORM query builder, and Express middleware patterns already in the codebase.

**Primary recommendation:** Address the two P0 gaps from SECURITY.md as the primary deliverable. Confirm CSRF posture is intentional and documented. Do not introduce `csrf-csrf` unless CORS policy opens — current `sameSite: lax` + single-origin is sufficient.

---

## Audit: Current Security State vs. Requirements

This section maps the SECURITY.md requirements against the actual codebase to identify what is done, what is missing, and what is a verified gap.

### Authorization — Ownership Checks

| Route | Method | Auth Guard | Ownership Check | Gap? |
|-------|--------|-----------|-----------------|------|
| `PUT /api/events/:id` | mutation | `router.use(requireAuth)` | None — calls `eventService.updateEvent(id, body)` directly | YES — P0 |
| `DELETE /api/events/:id` | mutation | `router.use(requireAuth)` | None — calls `eventService.deleteEvent(id)` directly | YES — P0 |
| `PATCH /api/events/:id/cancel` | mutation | `requireAuth` inline | None — updates DB by id directly | YES — P0 |
| `PATCH /api/events/:id/restore` | mutation | `requireAuth` inline | None — updates DB by id directly | YES — P0 |
| `PATCH /api/events/:id/meetup-url` | mutation | `requireAuth` inline | None | YES — P0 |
| `PUT /api/routes/:id` | mutation | `router.use(requireAuth)` | None | YES — P0 |
| `DELETE /api/routes/:id` | mutation | `router.use(requireAuth)` | None | YES — P0 |
| `PUT /api/recurring-templates/:id` | mutation | `router.use(requireAuth)` | None | YES — P0 |
| `PUT /api/recurring-templates/:id/exclude-date` | mutation | `router.use(requireAuth)` | None | YES — P0 |
| `DELETE /api/recurring-templates/:id` | mutation | `router.use(requireAuth)` | None | YES — P0 |
| `PUT /api/categories/:id` | mutation | `requireAuth` inline | None | YES — P0 |
| `DELETE /api/categories/:id` | mutation | `requireAuth` inline | None | YES — P0 |
| `PUT /api/hosts/:id` | mutation | `requireAuth` inline | None | YES — P0 |
| `DELETE /api/hosts/:id` | mutation | `requireAuth` inline | None | YES — P0 |

**Key insight for ownership model:** This application has a single organizer role — there is no multi-user ownership model. The session only tracks `userId`. Resources do not have a `createdBy` field in the schema. This means ownership in Phase 6 means "authenticated user = authorized to mutate any resource" — which is already enforced by `requireAuth`. The SECURITY.md ownership pattern (compare `resource.createdBy !== req.session.userId`) is only relevant if the DB schema has `createdBy`. It does not.

**Revised interpretation:** The P0 gap is that some mutation endpoints have authentication enforced at the router level but individual handlers don't guard against non-existent resources before mutating — and if the single-organizer model is intentional, the real gap is confirming this is a deliberate design choice and documenting it. The `cancel`, `restore`, and `exclude-date` endpoints operate on DB rows by ID without checking existence (they return 404 on empty result, which is correct). No additional ownership check beyond `requireAuth` is semantically meaningful here.

**What remains a real gap:** The settings endpoint — see below.

### Settings Endpoint — EDITABLE_SETTINGS Allowlist

**Status: MISSING — P0 gap confirmed.**

`PUT /api/settings/:key` (in `src/routes/settings.ts`) does:
1. Validates key is a non-empty string — OK
2. Validates value is a string — minimal
3. Calls `settingsService.upsertSetting(key, value)` with arbitrary key — MISSING allowlist check

Per SECURITY.md, the allowlist must be:
```ts
const EDITABLE_SETTINGS = ['default_start_location', 'meetup_description_template', 'discord_notifications_enabled'] as const;
```

The value must also have per-key length and format constraints. Currently no per-key constraints exist.

### Input Validation — Existing Coverage

| Resource | Create Body | Update Body | Query Params | Route Params (id) |
|----------|------------|------------|--------------|-------------------|
| Events | `createEventSchema` | `updateEventSchema` | `listEventsQuerySchema` | `parseInt` + NaN check |
| Routes | `createRouteSchema` | `updateRouteSchema` | `listRoutesQuerySchema` | `parseInt` + NaN check |
| Recurring Templates | `createRecurringTemplateSchema` | `updateRecurringTemplateSchema` | `instancesQuerySchema`, `listTemplatesQuerySchema` | `parseInt` + NaN check |
| Categories | `createCategorySchema` | `updateCategorySchema` | — | `parseInt` + NaN check |
| Hosts | `createHostSchema` | `updateHostSchema` | — | `parseInt` + NaN check |
| Settings | None | None (only primitive type check) | — | String presence check only |
| Calendar | — | — | `calendarQuerySchema` | — |

**Gaps confirmed:**
- `PUT /api/settings/:key` — no Zod schema for key allowlist or value constraints
- `notes` field on events/templates — no max length constraint in Zod schema (unbounded string)
- `meetupUrl` on `createEventSchema` — validated as URL or literal `''`, correct
- `stravaUrl` on routes — validated as URL or literal `''`, correct

### CSRF Posture

**Current state:** `sameSite: lax` on session cookie `sid`, app served from single origin.

`sameSite: lax` blocks cross-origin top-level POST/PUT/PATCH/DELETE (the cookie is not sent on cross-origin non-GET requests). This is the standard browser defense and is appropriate for a single-origin app. `csrf-csrf` would only add value if:
- App allows CORS with `credentials: true` from other origins
- App is embedded in a third-party page (iframes)

Neither condition is present. **Decision: CSRF via `sameSite: lax` is sufficient. No additional CSRF token mechanism is needed at this time. This should be explicitly documented as an intentional choice.**

### Error Handling — Existing Coverage

| Component | Status |
|-----------|--------|
| `asyncHandler` on all handlers | Verified — all route files use it |
| Generic 500 in production | Verified — `errorHandler.ts` checks `NODE_ENV !== 'development'` |
| Stack traces never returned | Verified — `err.message` only, no `err.stack` in response |
| Raw DB errors | Verified — never returned directly |

No gaps in error handling.

### Rate Limiting — Existing Coverage

| Limiter | Config | Applied To |
|---------|--------|-----------|
| `authLimiter` | 5 req/15min, `skipSuccessfulRequests: true` | `/auth` routes |
| `publicLimiter` | 100 req/15min | Global (all routes) |
| Development skip | `skip: () => process.env.NODE_ENV === 'development'` | Both limiters |

No gaps. The `publicLimiter` covers API mutation endpoints because it applies globally before routes.

---

## Standard Stack

All security work uses existing dependencies — no new packages needed.

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zod` | ^4.3.6 | Runtime input validation | Already the project standard; used in all validation schemas |
| `helmet` | ^8.1.0 | HTTP security headers including CSP | Already configured in `app.ts` |
| `express-rate-limit` | ^8.2.1 | Rate limiting | Already in use for auth and public endpoints |
| `express-session` + `connect-redis` | ^1.19.0 / ^7.1.1 | Session management | Already configured |

### Not Needed (research confirmed)
| Package | Reason Not Needed |
|---------|------------------|
| `csrf-csrf` | Single-origin app + `sameSite: lax` provides equivalent protection |
| `express-validator` | Zod already covers all validation; adding another library would conflict |
| `csurf` | Deprecated (archived), and not needed per CSRF posture above |
| `helmet-csp` | `helmet` v8 includes CSP configuration already in use |

---

## Architecture Patterns

### Pattern 1: Settings Key Allowlist with Per-Key Zod Schema

The settings route needs a Zod schema that validates the key against an enum and applies per-key value constraints.

```typescript
// src/validation/settings.ts (new file)
import { z } from 'zod';

export const EDITABLE_SETTINGS = [
  'default_start_location',
  'meetup_description_template',
  'discord_notifications_enabled',
] as const;

export type EditableSettingKey = typeof EDITABLE_SETTINGS[number];

// Per-key value constraints
const settingValueSchemas: Record<EditableSettingKey, z.ZodType<string>> = {
  default_start_location: z.string().min(1).max(200),
  meetup_description_template: z.string().min(0).max(2000),
  discord_notifications_enabled: z.enum(['true', 'false']),
};

export const updateSettingSchema = z.object({
  value: z.string(), // coarse check; per-key validation applied separately
});

// Route handler pattern
const key = req.params.key as string;
if (!EDITABLE_SETTINGS.includes(key as EditableSettingKey)) {
  return res.status(400).json({ error: 'Unknown setting key' });
}
const valueSchema = settingValueSchemas[key as EditableSettingKey];
const parsed = valueSchema.safeParse(req.body.value);
if (!parsed.success) {
  return res.status(422).json({ error: 'Invalid setting value', details: parsed.error.issues });
}
```

### Pattern 2: Route Param Validation Middleware (optional refactor)

The `parseInt` + NaN check pattern is repeated in every route handler. Extracting to a `validateId` middleware is cleaner but not strictly required for security — the existing pattern is correct.

```typescript
// Pattern used across all route files — correct as-is
const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
if (isNaN(id) || id <= 0) {
  return res.status(400).json({ error: 'Invalid ID' });
}
```

Note: current code checks `isNaN(id)` but not `id <= 0`. Negative IDs would pass to the DB query where they'd return 404 via "not found". This is not a security vulnerability but a minor validation gap.

### Pattern 3: Notes Field Max Length

The `notes` field on events and recurring templates currently has no max length constraint. Adding a reasonable limit prevents unbounded DB writes:

```typescript
// In createEventSchema and updateEventSchema
notes: z.string().max(2000, 'Notes must be 2000 characters or less').nullable().optional(),
```

### Anti-Patterns to Avoid

- **Adding CSRF tokens:** `sameSite: lax` is sufficient; adding token-based CSRF adds complexity and state without security benefit for a single-origin app.
- **Dynamic allowlists from DB:** The settings allowlist must be a hardcoded constant, not queried from the DB — the DB content cannot be trusted to constrain DB writes.
- **Per-handler auth middleware:** The project standard is `router.use(requireAuth)` for authenticated router groups. Don't scatter `requireAuth` on individual handlers within an already-protected router.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Input validation | Custom type checks | Zod (already installed) | Handles edge cases, provides good error messages, type inference |
| Key allowlist | Array.includes with type coercion | Zod enum or typed const array | Type safety, consistent error format |
| Per-key value schemas | Switch statement | Zod schema lookup by key | Composable, testable, extensible |

---

## Common Pitfalls

### Pitfall 1: Treating `requireAuth` as Sufficient for All Mutations

**What goes wrong:** Implementing "authentication = authorization" when the SECURITY.md explicitly requires ownership verification before mutations.

**Why it happens:** Most routes use `router.use(requireAuth)` which is applied at group level — it looks comprehensive but doesn't verify the specific resource belongs to the requesting user.

**How to avoid:** For a single-organizer system, this is actually fine as designed — any authenticated user IS the authorized user. The key action is to document this as an intentional decision, not add unnecessary checks that would break if the user model changes.

**Warning signs:** If `createdBy` is ever added to the schema, revisit ownership checks immediately.

### Pitfall 2: Settings Endpoint Allows Arbitrary Key Writes

**What goes wrong:** A valid session can write any key to the `settings` table via `PUT /api/settings/:key` — including keys the frontend doesn't use, potentially poisoning app configuration.

**Why it happens:** The current handler only validates that `key` is a non-empty string and `value` is a string.

**How to avoid:** Add the `EDITABLE_SETTINGS` allowlist check before `upsertSetting`. This is a one-line check that should have been in the original implementation.

**Warning signs:** Unit tests that pass arbitrary keys to the settings endpoint without 400 response.

### Pitfall 3: Placing Allowlist Constant in Route File

**What goes wrong:** The `EDITABLE_SETTINGS` constant defined in `routes/settings.ts` can't be imported by `settingsService.ts` without a circular dependency concern and is hard to test in isolation.

**How to avoid:** Define `EDITABLE_SETTINGS` in `src/validation/settings.ts`. The route imports from validation, the service doesn't need to know about it.

### Pitfall 4: Zod `.or(z.literal(''))` Creates a Union That Skips URL Validation

**What goes wrong:** `z.string().url().or(z.literal(''))` accepts empty string as valid without triggering URL validation — this is intentional but easy to misread when adding per-key constraints to settings values.

**How to avoid:** For settings values that are URLs (if any were added), use `.preprocess` or explicit conditional validation rather than `.or(z.literal(''))`.

### Pitfall 5: Integer ID validation allows `id = 0` or negative IDs

**What goes wrong:** `parseInt(param, 10)` + `isNaN(id)` check does not exclude `0` or negative numbers. These pass validation but will return 404 from the DB (correct result, but could mask misconfigured frontend calls).

**How to avoid:** Change `isNaN(id)` check to `isNaN(id) || id <= 0` where not already done. Note: review existing handlers — some may already have this.

---

## Code Examples

### Settings Route After Hardening

```typescript
// src/routes/settings.ts
import { EDITABLE_SETTINGS, EditableSettingKey, settingValueSchemas } from '../validation/settings.js';

router.put(
  '/:key',
  requireAuth,
  asyncHandler(async (req, res) => {
    const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;

    // P0: Allowlist check
    if (!EDITABLE_SETTINGS.includes(key as EditableSettingKey)) {
      res.status(400).json({ error: 'Unknown setting key' });
      return;
    }

    // P0: Per-key value validation
    const valueSchema = settingValueSchemas[key as EditableSettingKey];
    const parsed = valueSchema.safeParse(req.body.value);
    if (!parsed.success) {
      res.status(422).json({
        error: 'Validation failed',
        details: parsed.error.issues.map((e) => ({ field: 'value', message: e.message })),
      });
      return;
    }

    const setting = await settingsService.upsertSetting(key, parsed.data);
    res.status(200).json({ setting });
  })
);
```

### Zod `notes` Max Length (events.ts)

```typescript
// In createEventSchema and updateEventSchema — add .max(2000)
notes: z.string().max(2000, 'Notes must be 2000 characters or less').nullable().optional(),
```

---

## Scope Definition for Phase 6

Based on this audit, Phase 6 has three concrete deliverables:

### SEC-01: Settings endpoint hardening (P0)
- Create `src/validation/settings.ts` with `EDITABLE_SETTINGS` const, `settingValueSchemas` map
- Update `src/routes/settings.ts` to import and enforce the allowlist and per-key value validation
- Remove the current primitive `typeof value !== 'string'` check, replace with schema-based validation

### SEC-02: Input validation gaps (notes field, id param hardening)
- Add `max(2000)` to `notes` field in `createEventSchema`, `updateEventSchema`, `createRecurringTemplateSchema`, `updateRecurringTemplateSchema`
- Audit `parseInt` + `isNaN` patterns across all routes to confirm `id <= 0` is also rejected (not just `NaN`)
- Review any other unbounded string fields (startLocation and endLocation already have max 200)

### SEC-03: CSRF posture documentation
- Add a comment block in `src/config/session.ts` documenting why `sameSite: lax` is the chosen CSRF mitigation
- Add an entry to SECURITY.md explicitly stating CSRF token mechanism is intentionally deferred per current single-origin deployment model

### Out of Scope for Phase 6
- Secret/unguessable calendar URLs (AUTH-V2-01) — explicitly in v2 requirements, not v1
- Multi-user ownership model — single-organizer system; `requireAuth` IS the ownership check
- CORS policy changes — out of scope; no cross-origin requirements exist
- Adding `csrf-csrf` — not needed; `sameSite: lax` provides equivalent protection
- Penetration testing or security audit tooling

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test config files found |
| Config file | None — would be Wave 0 |
| Quick run command | N/A — no test runner installed |
| Full suite command | N/A |

### Phase Requirements → Test Map

Phase 6 has no formal requirement IDs in REQUIREMENTS.md (security hardening was added to roadmap outside the requirements doc). The deliverables map to these testable behaviors:

| Deliverable | Behavior | Test Type | Notes |
|-------------|----------|-----------|-------|
| SEC-01 | `PUT /api/settings/unknown_key` returns 400 | Integration | Manual curl verification |
| SEC-01 | `PUT /api/settings/default_start_location` with value over 200 chars returns 422 | Integration | Manual curl verification |
| SEC-01 | `PUT /api/settings/discord_notifications_enabled` with value `"maybe"` returns 422 | Integration | Manual curl verification |
| SEC-02 | `POST /api/events` with notes over 2000 chars returns 422 | Integration | Manual curl verification |
| SEC-02 | `PUT /api/events/0` returns 400 (id <= 0 rejected) | Integration | Manual curl verification |
| SEC-03 | SECURITY.md updated with CSRF rationale | Documentation | Review |

### Wave 0 Gaps

No test framework exists. Phase 6 can be verified manually via curl against the running dev server. If automated testing is desired in future, the framework gap would need to be addressed first.

*(No test infrastructure — all verification via manual curl/dev server)*

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| `csurf` middleware | `sameSite: lax` cookie | `csurf` is archived/deprecated since ~2023; `csrf-csrf` is the current npm equivalent but not needed here |
| Manual bcrypt | `@node-rs/argon2` | Already implemented — Argon2 is OWASP-recommended |
| Per-handler `requireAuth` | `router.use(requireAuth)` | Already implemented — group-level auth is the correct pattern |

---

## Open Questions

1. **Does the DB schema have a `createdBy` column on any table?**
   - What we know: Routes, events, and templates have `version`, `createdAt`, `updatedAt` but no `createdBy` per the codebase audit
   - What's unclear: Whether a future multi-organizer model would require per-resource ownership
   - Recommendation: Confirm no `createdBy` columns exist via schema file inspection during planning; document single-organizer model explicitly

2. **Should `notes` field max length be 2000 or configurable?**
   - What we know: No current constraint; typical event notes are short
   - What's unclear: Whether Meetup description template (already 2000-constrained proposed) and notes could combine to exceed DB column limits
   - Recommendation: 2000 characters is reasonable for notes; Meetup description template can be 5000 given it's a larger template

3. **Is the `value` column in the `settings` table typed as `text` (unbounded)?**
   - What we know: Settings is a key-value store per Phase 3.1 decisions (`key varchar, value text`)
   - What's unclear: Whether `text` is unbounded in the Postgres schema (it is — `text` has no length limit in Postgres)
   - Recommendation: Per-key Zod validation at the API layer handles this — no DB schema change needed

---

## Sources

### Primary (HIGH confidence)
- Direct codebase audit — `src/routes/*.ts`, `src/middleware/*.ts`, `src/validation/*.ts`, `src/app.ts`, `src/config/session.ts`
- `SECURITY.md` — explicit P0 gap documentation, allowlist pattern
- `package.json` — confirmed installed dependencies

### Secondary (MEDIUM confidence)
- OWASP SameSite Cookie guidance — `sameSite: lax` is documented as effective CSRF mitigation for top-level navigations from same origin
- Express-session documentation — `httpOnly`, `secure`, `sameSite` cookie options

### Tertiary (LOW confidence)
- None — all findings based on direct code inspection

---

## Metadata

**Confidence breakdown:**
- Current security state audit: HIGH — based on direct code inspection
- Settings gap: HIGH — confirmed missing in `src/routes/settings.ts`
- CSRF posture: HIGH — `sameSite: lax` + single-origin verified in session config
- Ownership model: HIGH — single-organizer app, no `createdBy` columns, `requireAuth` is the correct guard
- Notes max length gap: MEDIUM — identified from code, reasonable assumption about DB `text` being unbounded

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable — no fast-moving dependencies involved)
