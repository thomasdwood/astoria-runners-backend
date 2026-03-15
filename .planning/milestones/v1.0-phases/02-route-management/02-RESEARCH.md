# Phase 2: Route Management - Research

**Researched:** 2026-02-13
**Domain:** CRUD operations with Drizzle ORM, Express REST API patterns, PostgreSQL schema design
**Confidence:** HIGH

## Summary

Phase 2 implements a classic CRUD resource (routes) with category filtering, referential integrity protection, and organizer-only access. This is a well-understood domain with mature tooling and established patterns.

The existing Phase 1 infrastructure already includes all necessary dependencies and patterns: Drizzle ORM for database access, Express routing with TypeScript, session-based authentication middleware, optimistic locking via version fields, and asyncHandler for promise error propagation. Phase 2 extends this foundation with a new `routes` table, a dedicated routes service layer, and REST endpoints.

Key architectural decisions align with existing patterns:
- **PostgreSQL enums for categories** using `pgEnum` (type-safe, validated at database level)
- **Foreign key with NO ACTION** prevents deletion of routes referenced by events (Phase 3 dependency)
- **Zod for input validation** (TypeScript-first, automatic type inference, composable schemas)
- **Service layer pattern** following `authService.ts` precedent (database logic separate from HTTP handlers)
- **Optimistic locking** via version field (already established in Phase 1)

**Primary recommendation:** Use pgEnum for route categories, implement foreign key constraint with NO ACTION for referential integrity (validates "cannot delete referenced routes" requirement), validate inputs with Zod schemas, and follow the existing service + route handler pattern.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | 0.45.1 | Type-safe SQL query builder and ORM | Already in use, excellent TypeScript integration, zero runtime overhead |
| pg | 8.18.0 | PostgreSQL client for Node.js | Required by Drizzle, battle-tested, high performance |
| zod | Latest (4.x) | Schema validation with TypeScript inference | TypeScript-first, zero dependencies, automatic type inference, composable |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| express | 5.2.1 | HTTP server and routing | Already in use for all HTTP handling |
| helmet | 8.1.0 | Security headers middleware | Already in use for security best practices |
| express-rate-limit | 8.2.1 | Rate limiting middleware | Already in use, apply to routes endpoints |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zod | Joi | Joi is mature but not TypeScript-first; requires separate type definitions |
| Zod | express-validator | express-validator works but doesn't provide automatic type inference |
| pgEnum | varchar with check constraint | varchar loses type safety and requires manual validation |
| Service layer | Direct DB calls in routes | Mixing concerns makes testing harder and violates existing patterns |

**Installation:**
```bash
npm install zod
```

All other dependencies already installed in Phase 1.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── db/
│   └── schema/
│       ├── routes.ts       # Route table schema with pgEnum categories
│       └── index.ts        # Export all schemas
├── services/
│   └── routeService.ts     # CRUD operations, business logic
├── routes/
│   └── routes.ts           # HTTP handlers for /routes endpoints
└── middleware/
    └── auth.ts             # requireAuth already exists
```

### Pattern 1: pgEnum for Categories

**What:** Define route categories as PostgreSQL enums for type safety and database-level validation

**When to use:** When you have a fixed set of allowed values that won't change frequently (route categories: Brewery Run, Coffee Run, Brunch Run, Weekend)

**Example:**
```typescript
// Source: https://orm.drizzle.team/docs/column-types/pg
import { pgEnum } from 'drizzle-orm/pg-core';

export const routeCategoryEnum = pgEnum('route_category', [
  'Brewery Run',
  'Coffee Run',
  'Brunch Run',
  'Weekend'
]);

export const routes = pgTable('routes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: routeCategoryEnum().notNull(),
  // ... other fields
});
```

**Why this pattern:**
- TypeScript automatically infers allowed values
- Database enforces valid categories at constraint level
- Better than varchar with manual validation
- Adding/removing categories requires migration (intentional - forces deliberate schema changes)

### Pattern 2: Foreign Key with NO ACTION for Referential Integrity

**What:** Define foreign key constraint with `onDelete: 'no action'` to prevent deletion of routes referenced by events

**When to use:** When child records (events) depend on parent records (routes) and deleting a parent would orphan children

**Example:**
```typescript
// Source: https://orm.drizzle.team/docs/indexes-constraints
// In events.ts (Phase 3):
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  routeId: integer('route_id')
    .notNull()
    .references(() => routes.id, { onDelete: 'no action' }),
  // ... other fields
});
```

**Why this pattern:**
- Satisfies ROUTE-03 requirement: "cannot delete routes referenced by events"
- Database enforces integrity automatically (no application-level checks needed)
- Returns clear error when constraint violated (catch in service layer, return 409 Conflict)
- Alternative CASCADE would delete events when route deleted (wrong for this use case)
- NO ACTION is PostgreSQL default but specify explicitly for clarity

### Pattern 3: Zod Schema Validation

**What:** Define Zod schemas for request validation with automatic TypeScript type inference

**When to use:** For all incoming request data to validate before database operations

**Example:**
```typescript
// Source: https://zod.dev/
import { z } from 'zod';

const createRouteSchema = z.object({
  name: z.string().min(1).max(255),
  distance: z.number().positive(),
  category: z.enum(['Brewery Run', 'Coffee Run', 'Brunch Run', 'Weekend']),
  endLocation: z.string().min(1).max(255),
});

// Automatic type inference
type CreateRouteInput = z.infer<typeof createRouteSchema>;

// In route handler:
const result = createRouteSchema.safeParse(req.body);
if (!result.success) {
  return res.status(422).json({ error: result.error.issues });
}
// result.data is now typed as CreateRouteInput
```

**Why this pattern:**
- Single source of truth for validation logic and TypeScript types
- safeParse() provides detailed error messages for client debugging
- Composable schemas can share common patterns (e.g., distance validation)
- Zero runtime overhead beyond validation itself

### Pattern 4: Service Layer for Database Operations

**What:** Separate database operations into service files, keeping route handlers thin

**When to use:** Always - follows existing pattern from `authService.ts`

**Example:**
```typescript
// services/routeService.ts
import { db } from '../config/database.js';
import { routes } from '../db/schema/index.js';
import { eq, and } from 'drizzle-orm';

export async function createRoute(data: CreateRouteInput) {
  const [route] = await db.insert(routes)
    .values(data)
    .returning();
  return route;
}

export async function findRouteById(id: number) {
  const [route] = await db.select()
    .from(routes)
    .where(eq(routes.id, id));
  return route;
}

export async function updateRoute(id: number, version: number, data: UpdateRouteInput) {
  const [updated] = await db.update(routes)
    .set({ ...data, version: version + 1 })
    .where(and(eq(routes.id, id), eq(routes.version, version)))
    .returning();

  if (!updated) {
    throw new Error('Route not found or version conflict');
  }
  return updated;
}

export async function deleteRoute(id: number) {
  const [deleted] = await db.delete(routes)
    .where(eq(routes.id, id))
    .returning();
  return deleted;
}

export async function listRoutes(category?: string) {
  const query = db.select().from(routes);

  if (category) {
    query.where(eq(routes.category, category));
  }

  return await query.orderBy(routes.name);
}
```

**Why this pattern:**
- Matches existing `authService.ts` structure
- Testable in isolation from HTTP layer
- Reusable across different HTTP endpoints or CLI tools
- Clear separation of concerns (HTTP vs business logic)

### Pattern 5: Optimistic Locking with Version Field

**What:** Include version field in WHERE clause for updates to detect concurrent modifications

**When to use:** For all update operations on tables with version fields (established pattern in Phase 1)

**Example:**
```typescript
// Source: https://medium.com/@sumit-s/optimistic-locking-concurrency-control-with-a-version-column-2e3db2a8120d
export async function updateRoute(id: number, currentVersion: number, data: UpdateRouteInput) {
  const [updated] = await db.update(routes)
    .set({
      ...data,
      version: currentVersion + 1,
      updatedAt: sql`NOW()`
    })
    .where(and(
      eq(routes.id, id),
      eq(routes.version, currentVersion)
    ))
    .returning();

  if (!updated) {
    // Either route doesn't exist or version conflict
    const existing = await findRouteById(id);
    if (!existing) {
      throw new Error('Route not found');
    }
    throw new Error('Version conflict - route was modified by another user');
  }

  return updated;
}
```

**Why this pattern:**
- Prevents lost updates when two organizers edit same route simultaneously
- Database-level conflict detection (no race conditions)
- Client receives clear error to refresh and retry
- Already established in Phase 1 users table

### Anti-Patterns to Avoid

- **Manual SQL strings:** Never use raw SQL for CRUD operations - Drizzle provides type-safe query builders
- **Skipping validation:** Always validate input with Zod before database operations - prevents invalid data and SQL injection vectors
- **Varchar for categories:** Don't use `varchar` with manual validation when `pgEnum` provides type safety and database constraints
- **Cascade delete for routes:** Don't use `onDelete: 'cascade'` - would delete events when route deleted (wrong for this domain)
- **Direct DB calls in routes:** Don't skip service layer - makes testing harder and violates separation of concerns
- **Ignoring version field:** Don't skip version check in updates - risks lost updates from concurrent modifications

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Input validation | Manual field checking with if statements | Zod schemas with safeParse() | Zod handles nested objects, arrays, type coercion, custom validators, and detailed error messages; manual validation misses edge cases |
| SQL query building | String concatenation or template literals | Drizzle query builder | Drizzle provides type safety, prevents SQL injection, and catches errors at compile time |
| Enum validation | Array.includes() checks or switch statements | pgEnum + Zod enum | Database and TypeScript both enforce valid values; manual checks can drift from schema |
| Concurrent update handling | Timestamp comparison or last-write-wins | Version field with optimistic locking | Timestamps have race conditions; version field is atomic and database-enforced |
| Foreign key checks | Application-level "find events by routeId" before delete | PostgreSQL foreign key constraint | Database constraint is atomic, can't have race conditions, and provides clear error codes |

**Key insight:** The database is your friend for data integrity. Constraints (foreign keys, enums, unique indexes) catch errors that application code might miss under concurrent load or edge cases. Use them.

## Common Pitfalls

### Pitfall 1: Forgetting WHERE Clause in DELETE

**What goes wrong:** Calling `db.delete(routes)` without `.where()` deletes ALL routes from the table

**Why it happens:** Drizzle doesn't require WHERE clause (valid to delete all rows in some scenarios), easy to forget during refactoring

**How to avoid:**
- Always include `.where()` clause in delete operations
- Use `returning()` to verify exactly what was deleted
- Add unit tests that verify delete only affects target row

**Warning signs:** Delete operation succeeds but returns unexpected number of rows

**Example:**
```typescript
// WRONG - deletes all routes!
await db.delete(routes);

// CORRECT - deletes specific route
const [deleted] = await db.delete(routes)
  .where(eq(routes.id, id))
  .returning();

if (!deleted) {
  throw new Error('Route not found');
}
```

### Pitfall 2: Wrong HTTP Status Code for Validation Errors

**What goes wrong:** Returning 400 Bad Request for semantic validation failures instead of 422 Unprocessable Entity

**Why it happens:** Confusion between syntax errors (400) and semantic errors (422)

**How to avoid:**
- Use 400 for malformed JSON or missing required headers
- Use 422 for well-formed requests with invalid data (e.g., distance: -5)
- Use 404 for missing resources
- Use 409 for constraint violations (e.g., foreign key, unique, version conflict)

**Warning signs:** Client developers confused about what to fix when validation fails

**Example:**
```typescript
// Zod validation failure -> 422 Unprocessable Entity
const result = createRouteSchema.safeParse(req.body);
if (!result.success) {
  return res.status(422).json({
    error: 'Validation failed',
    details: result.error.issues
  });
}

// Missing resource -> 404 Not Found
const route = await findRouteById(id);
if (!route) {
  return res.status(404).json({ error: 'Route not found' });
}

// Foreign key constraint violation -> 409 Conflict
try {
  await deleteRoute(id);
} catch (err) {
  if (err.code === '23503') { // PostgreSQL foreign key violation
    return res.status(409).json({
      error: 'Cannot delete route referenced by events'
    });
  }
  throw err;
}
```

### Pitfall 3: Not Handling Version Conflicts Gracefully

**What goes wrong:** Update fails silently or returns generic error when version conflict occurs

**Why it happens:** Forgetting that version mismatch returns zero rows (not an exception), client doesn't know to refresh

**How to avoid:**
- Check if update returned a row (`.returning()` returns empty array on version conflict)
- Distinguish between "not found" and "version conflict"
- Return 409 Conflict with clear message telling client to refresh
- Include current version in error response

**Warning signs:** Organizers complain that edits "don't save" without explanation

**Example:**
```typescript
export async function updateRoute(id: number, version: number, data: UpdateRouteInput) {
  const [updated] = await db.update(routes)
    .set({ ...data, version: version + 1 })
    .where(and(eq(routes.id, id), eq(routes.version, version)))
    .returning();

  if (!updated) {
    // Distinguish not found vs version conflict
    const current = await findRouteById(id);
    if (!current) {
      throw new Error('Route not found');
    }
    throw new Error(`Version conflict: expected v${version}, current v${current.version}`);
  }

  return updated;
}

// In route handler:
try {
  const updated = await updateRoute(id, req.body.version, data);
  res.json(updated);
} catch (err) {
  if (err.message.includes('not found')) {
    return res.status(404).json({ error: err.message });
  }
  if (err.message.includes('Version conflict')) {
    return res.status(409).json({
      error: err.message,
      hint: 'Refresh and try again'
    });
  }
  throw err;
}
```

### Pitfall 4: Exposing Database Errors to Clients

**What goes wrong:** PostgreSQL error messages leak to HTTP responses, exposing schema details or causing confusion

**Why it happens:** Letting unhandled exceptions propagate through error handler without translation

**How to avoid:**
- Catch specific error codes (PostgreSQL error codes documented: https://www.postgresql.org/docs/current/errcodes-appendix.html)
- Translate to user-friendly messages
- Log original error for debugging, return clean message to client
- Never expose stack traces in production

**Warning signs:** Error responses contain "column", "table", "constraint" or SQL syntax

**Example:**
```typescript
// In route handler:
try {
  await deleteRoute(id);
  res.status(204).send();
} catch (err) {
  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(409).json({
      error: 'Cannot delete route that is used by scheduled events'
    });
  }

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'A route with this name already exists'
    });
  }

  // Log unexpected errors, return generic message
  console.error('Unexpected error deleting route:', err);
  return res.status(500).json({
    error: 'Failed to delete route'
  });
}
```

### Pitfall 5: Not Using Transactions for Multi-Step Operations

**What goes wrong:** Partial updates leave database in inconsistent state when error occurs mid-operation

**Why it happens:** Phase 2 doesn't require transactions (single table operations), but forgetting pattern for Phase 3

**How to avoid:**
- Use transactions when operation touches multiple tables
- Drizzle provides `db.transaction()` wrapper
- Atomic operations (single INSERT/UPDATE/DELETE) don't need transactions

**Warning signs:** Data inconsistencies after errors, orphaned records

**Example (for future reference in Phase 3):**
```typescript
// Source: https://orm.drizzle.team/docs/transactions
await db.transaction(async (tx) => {
  const [event] = await tx.insert(events).values(eventData).returning();
  await tx.insert(eventNotifications).values({ eventId: event.id, ... });
  // If second insert fails, first insert is rolled back automatically
});
```

## Code Examples

Verified patterns from official sources and existing codebase:

### Database Schema Definition

```typescript
// src/db/schema/routes.ts
import { pgTable, serial, varchar, numeric, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Define route category enum
export const routeCategoryEnum = pgEnum('route_category', [
  'Brewery Run',
  'Coffee Run',
  'Brunch Run',
  'Weekend'
]);

export const routes = pgTable('routes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  distance: numeric('distance', { precision: 5, scale: 2 }).notNull(), // e.g., 123.45 miles
  category: routeCategoryEnum().notNull(),
  endLocation: varchar('end_location', { length: 255 }).notNull(),
  version: integer('version').notNull().default(0), // Optimistic locking
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Export inferred types
export type Route = InferSelectModel<typeof routes>;
export type NewRoute = InferInsertModel<typeof routes>;
```

### Zod Validation Schemas

```typescript
// services/routeService.ts or schemas/route.ts
import { z } from 'zod';

const routeCategories = ['Brewery Run', 'Coffee Run', 'Brunch Run', 'Weekend'] as const;

export const createRouteSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  distance: z.number().positive('Distance must be positive'),
  category: z.enum(routeCategories),
  endLocation: z.string().min(1, 'End location is required').max(255),
});

export const updateRouteSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  distance: z.number().positive().optional(),
  category: z.enum(routeCategories).optional(),
  endLocation: z.string().min(1).max(255).optional(),
  version: z.number().int().nonnegative(), // Required for optimistic locking
}).refine(data => {
  // At least one field must be provided for update
  return data.name || data.distance || data.category || data.endLocation;
}, {
  message: 'At least one field must be provided for update'
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
```

### CRUD Service Layer

```typescript
// services/routeService.ts
import { db } from '../config/database.js';
import { routes } from '../db/schema/index.js';
import { eq, and, sql } from 'drizzle-orm';
import type { CreateRouteInput, UpdateRouteInput } from './schemas.js';

export async function createRoute(data: CreateRouteInput) {
  const [route] = await db.insert(routes)
    .values(data)
    .returning();
  return route;
}

export async function findRouteById(id: number) {
  const [route] = await db.select()
    .from(routes)
    .where(eq(routes.id, id));
  return route;
}

export async function listRoutes(category?: string) {
  let query = db.select().from(routes);

  if (category) {
    query = query.where(eq(routes.category, category));
  }

  return await query.orderBy(routes.name);
}

export async function updateRoute(id: number, version: number, data: UpdateRouteInput) {
  const [updated] = await db.update(routes)
    .set({
      ...data,
      version: version + 1,
      updatedAt: sql`NOW()`
    })
    .where(and(eq(routes.id, id), eq(routes.version, version)))
    .returning();

  if (!updated) {
    const current = await findRouteById(id);
    if (!current) {
      throw new Error('Route not found');
    }
    throw new Error(`Version conflict: expected v${version}, current v${current.version}`);
  }

  return updated;
}

export async function deleteRoute(id: number) {
  const [deleted] = await db.delete(routes)
    .where(eq(routes.id, id))
    .returning();

  if (!deleted) {
    throw new Error('Route not found');
  }

  return deleted;
}
```

### REST API Route Handlers

```typescript
// routes/routes.ts
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import * as routeService from '../services/routeService.js';
import { createRouteSchema, updateRouteSchema } from '../services/schemas.js';

const router = Router();

// All routes require authentication (organizer-only)
router.use(requireAuth);

/**
 * GET /routes
 * List all routes, optionally filtered by category
 */
router.get('/', asyncHandler(async (req, res) => {
  const { category } = req.query;

  const routes = await routeService.listRoutes(
    typeof category === 'string' ? category : undefined
  );

  res.json(routes);
}));

/**
 * GET /routes/:id
 * Get single route by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid route ID' });
  }

  const route = await routeService.findRouteById(id);

  if (!route) {
    return res.status(404).json({ error: 'Route not found' });
  }

  res.json(route);
}));

/**
 * POST /routes
 * Create new route
 */
router.post('/', asyncHandler(async (req, res) => {
  const result = createRouteSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(422).json({
      error: 'Validation failed',
      details: result.error.issues
    });
  }

  const route = await routeService.createRoute(result.data);

  res.status(201).json(route);
}));

/**
 * PUT /routes/:id
 * Update existing route
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid route ID' });
  }

  const result = updateRouteSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(422).json({
      error: 'Validation failed',
      details: result.error.issues
    });
  }

  try {
    const { version, ...data } = result.data;
    const route = await routeService.updateRoute(id, version!, data);
    res.json(route);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ error: err.message });
      }
      if (err.message.includes('Version conflict')) {
        return res.status(409).json({
          error: err.message,
          hint: 'Refresh and try again'
        });
      }
    }
    throw err;
  }
}));

/**
 * DELETE /routes/:id
 * Delete route (fails if referenced by events)
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid route ID' });
  }

  try {
    await routeService.deleteRoute(id);
    res.status(204).send();
  } catch (err) {
    // PostgreSQL foreign key violation
    if (err && typeof err === 'object' && 'code' in err && err.code === '23503') {
      return res.status(409).json({
        error: 'Cannot delete route that is used by scheduled events'
      });
    }

    if (err instanceof Error && err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }

    throw err;
  }
}));

export default router;
```

### Registering Routes in App

```typescript
// src/app.ts (add to existing app)
import routesRouter from './routes/routes.js';

// ... existing middleware ...

// Routes
app.use('/auth', authLimiter, authRouter);
app.use('/calendar', calendarRouter);
app.use('/routes', routesRouter); // NEW - organizer-only routes

// ... existing error handler ...
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual validation with if/else | Zod schemas with type inference | 2020-2021 | Validation logic is now single source of truth for both runtime and TypeScript types |
| String concatenation for SQL | Type-safe query builders (Drizzle, Kysely) | 2022-2023 | Compile-time SQL error detection, prevents SQL injection |
| Varchar for enums | pgEnum with TypeScript integration | Always available but underutilized | Database enforces valid values, TypeScript infers types automatically |
| Timestamp-based optimistic locking | Integer version fields | Always preferred | Version fields are atomic, no race conditions from clock skew |
| CASCADE delete everywhere | Explicit onDelete actions per relationship | Best practice evolution | Forces deliberate decisions about data integrity per use case |

**Deprecated/outdated:**
- **express-validator**: Still works but Zod provides better TypeScript integration and composability
- **Joi**: Mature but requires separate TypeScript type definitions (not TypeScript-first)
- **express-async-errors**: Has ESM compatibility issues; asyncHandler wrapper is more reliable

## Open Questions

1. **Should routes have a unique constraint on name?**
   - What we know: Users table has unique constraint on email, requirement doesn't specify
   - What's unclear: Can two routes have the same name? (e.g., "Bridge Loop" at different distances)
   - Recommendation: Start without unique constraint, easy to add later if needed via migration

2. **Should distance be stored as numeric or integer (miles * 100)?**
   - What we know: PostgreSQL `numeric` is exact, JavaScript number is float (precision issues)
   - What's unclear: Do we need decimal precision (e.g., 5.25 miles) or whole numbers?
   - Recommendation: Use `numeric(5, 2)` to support decimals (future-proof), convert to number in application if needed

3. **Should category filter be case-sensitive?**
   - What we know: pgEnum values are case-sensitive in PostgreSQL
   - What's unclear: Will query param match enum exactly? (e.g., "Brewery Run" vs "brewery run")
   - Recommendation: Validate query param against enum values, return 422 if invalid (forces exact match)

4. **Do we need pagination for list routes?**
   - What we know: Small club likely has < 50 routes total
   - What's unclear: Performance implications, future growth
   - Recommendation: Defer pagination to Phase 3 or later, add `LIMIT 100` as safety valve for now

## Sources

### Primary (HIGH confidence)

- [Drizzle ORM - Insert](https://orm.drizzle.team/docs/insert) - INSERT operations syntax
- [Drizzle ORM - Select](https://orm.drizzle.team/docs/select) - SELECT operations and filtering
- [Drizzle ORM - Update](https://orm.drizzle.team/docs/update) - UPDATE operations with WHERE and returning
- [Drizzle ORM - Indexes & Constraints](https://orm.drizzle.team/docs/indexes-constraints) - Foreign keys and unique constraints
- [Drizzle ORM - PostgreSQL Column Types](https://orm.drizzle.team/docs/column-types/pg) - pgEnum and varchar usage
- [Zod Documentation](https://zod.dev/) - Schema validation patterns
- [PostgreSQL Documentation - Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) - Foreign key cascade options

### Secondary (MEDIUM confidence)

- [How to Build a REST API with TypeScript in 2026](https://encore.dev/articles/build-rest-api-typescript-2026) - Modern REST API patterns
- [REST API Design Best Practices](https://www.freecodecamp.org/news/rest-api-design-best-practices-build-a-rest-api/) - HTTP status codes and error handling
- [API Error Codes Cheat Sheet (2026)](https://apistatuscheck.com/blog/api-error-codes-cheat-sheet) - HTTP status code usage
- [Optimistic Locking with Version Column](https://medium.com/@sumit-s/optimistic-locking-concurrency-control-with-a-version-column-2e3db2a8120d) - Version field patterns
- [Postgres DELETE CASCADE Guide](https://www.dbvis.com/thetable/postgres-on-delete-cascade-a-guide/) - Cascade delete options
- [Soft Delete vs Hard Delete](https://oscmarb.com/blog/soft-delete-and-hard-delete-everything-you-need-to-know/) - Delete strategy tradeoffs

### Tertiary (LOW confidence)

- [Express.js Tutorial 2026](https://thelinuxcode.com/expressjs-tutorial-2026-practical-scalable-patterns-for-real-projects/) - Route organization patterns (verified against existing codebase)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Drizzle and Zod are well-documented, official docs available, widely used in 2026
- Architecture: HIGH - Patterns verified from official docs and existing Phase 1 codebase
- Pitfalls: MEDIUM-HIGH - Common CRUD mistakes are well-known, specific examples verified from docs and experience reports

**Research date:** 2026-02-13
**Valid until:** 2026-03-13 (30 days - stack is stable, unlikely to change)
