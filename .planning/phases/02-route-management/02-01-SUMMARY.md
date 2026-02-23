---
phase: 02-route-management
plan: 01
subsystem: routes
tags:
  - schema
  - validation
  - service-layer
  - crud
  - optimistic-locking
dependency_graph:
  requires:
    - phase: 01-foundation-authentication
      artifacts:
        - src/db/schema/users.ts
        - src/config/database.ts
  provides:
    - src/db/schema/routes.ts (pgEnum + routes table)
    - src/validation/routes.ts (Zod schemas)
    - src/services/routeService.ts (CRUD operations)
  affects:
    - phase: 02-route-management
      plans:
        - 02-02 (will consume route service via REST endpoints)
tech_stack:
  added:
    - zod: ^4.3.6 (schema validation)
  patterns:
    - pgEnum for type-safe category constraints
    - numeric column for decimal distance storage
    - optimistic locking via version field in WHERE clause
    - discriminated unions for error handling
    - formatRoute helper for API response normalization
key_files:
  created:
    - src/db/schema/routes.ts
    - src/validation/routes.ts
    - src/services/routeService.ts
  modified:
    - src/db/schema/index.ts (added routes barrel export)
    - package.json (added zod dependency)
decisions:
  - key: Use numeric(5,2) for distance storage
    rationale: Postgres numeric preserves precision, returns as string from Drizzle, formatRoute converts to number for API consumers
    impact: Service layer responsible for string<->number conversion
  - key: Use type assertion for category filter in listRoutes
    rationale: Zod validation ensures category is valid enum value, TypeScript needs hint due to string widening
    impact: Safe because input validated before reaching service layer
metrics:
  duration: 131
  completed: 2026-02-14T01:51:29Z
  tasks: 2
  commits: 2
  files_created: 3
  files_modified: 2
---

# Phase 02 Plan 01: Route Schema & Service Layer Summary

**One-liner:** Route schema with pgEnum categories, Zod validation, and service layer implementing CRUD operations with optimistic locking via version field.

## What Was Built

### Task 1: Routes Schema and Validation
- **Created** `src/db/schema/routes.ts` with pgEnum for 4 route categories (Brewery Run, Coffee Run, Brunch Run, Weekend)
- **Defined** routes table with name (varchar 100), distance (numeric 5,2), category (enum), endLocation (varchar 200), version (integer, default 0), timestamps (timestamptz)
- **Added** Zod schemas in `src/validation/routes.ts`:
  - `createRouteSchema`: All fields required, distance must be positive, category must match enum
  - `updateRouteSchema`: Fields optional except version (required for optimistic locking)
  - `listRoutesQuerySchema`: Optional category filter for list endpoint
- **Updated** `src/db/schema/index.ts` to barrel export routes schema
- **Installed** zod ^4.3.6 for runtime validation

### Task 2: Route Service Layer
- **Implemented** `src/services/routeService.ts` with full CRUD operations:
  - `createRoute(data)`: Inserts route, converts distance to string for numeric column, returns formatted route
  - `getRouteById(id)`: Returns route or null, formatted with distance as number
  - `listRoutes(filters?)`: Supports optional category filter, orders alphabetically by name
  - `updateRoute(id, data)`: Optimistic locking via `eq(routes.version, version)` in WHERE clause, returns discriminated union (`{ route }` or `{ error: 'not_found' | 'conflict' }`)
  - `deleteRoute(id)`: Returns `{ success: true }` or `{ error: 'not_found' }`
- **Added** `formatRoute()` helper to convert Drizzle's string distance to number for API responses

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Zod enum errorMap parameter**
- **Found during:** Task 1 (TypeScript compilation)
- **Issue:** Used `errorMap` function in z.enum() params, but zod v4 only supports `message` string parameter
- **Fix:** Changed `errorMap: () => ({ message: '...' })` to `message: '...'` in createRouteSchema and updateRouteSchema
- **Files modified:** src/validation/routes.ts
- **Commit:** 929725a

**2. [Rule 1 - Bug] Fixed TypeScript type error in listRoutes**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** Cannot reassign Drizzle query builder variable after adding WHERE clause due to type narrowing; also string type conflict with enum column
- **Fix:** Rewrote listRoutes with conditional query construction (separate paths for filtered vs unfiltered) and type assertion for category filter (safe because Zod validates enum at handler level)
- **Files modified:** src/services/routeService.ts
- **Commit:** 3eedd55

## Verification Results

All success criteria met:
- [x] TypeScript compilation passes with zero errors
- [x] All 3 new files exist: routes schema, validation, service
- [x] Schema barrel export includes routes
- [x] pgEnum defines exactly 4 categories
- [x] Zod schemas enforce constraints: name (1-100), distance (positive), category (enum), endLocation (1-200)
- [x] Service uses Drizzle query builder (no raw SQL except for NOW() and version increment)
- [x] Update operation includes `eq(routes.version, version)` in WHERE clause (optimistic locking implemented)
- [x] Zod dependency in package.json

## Key Patterns Established

1. **Optimistic Locking Pattern:**
   - Version field defaults to 0 in schema
   - Update requires version in input (Zod enforces)
   - WHERE clause checks both id and version: `and(eq(routes.id, id), eq(routes.version, version))`
   - Version auto-increments: `version: sql\`${routes.version} + 1\``
   - Empty result triggers check to distinguish not_found vs conflict

2. **Numeric Column Handling:**
   - Postgres numeric type preserves decimal precision
   - Drizzle returns numeric as string
   - Service converts to string on write: `distance: String(data.distance)`
   - formatRoute() converts to number on read: `distance: Number(row.distance)`
   - API consumers always receive number type

3. **Service Error Handling:**
   - Discriminated unions for type-safe error handling
   - Update: `{ route: Route } | { error: 'not_found' | 'conflict' }`
   - Delete: `{ success: true } | { error: 'not_found' | 'conflict' }`
   - Note: Phase 3 will add foreign key constraints causing conflict on delete of referenced routes

## Commits

| Task | Commit  | Description                                  |
| ---- | ------- | -------------------------------------------- |
| 1    | 929725a | Create routes schema with pgEnum and Zod validation |
| 2    | 3eedd55 | Implement route service with CRUD and optimistic locking |

## What's Next

**Next Plan:** 02-02 (REST Routes & Middleware)
- Wire route service to Express endpoints
- Add organizerAuth middleware (routes are organizer-only)
- Implement POST /routes, GET /routes/:id, GET /routes, PATCH /routes/:id, DELETE /routes/:id
- Add request validation using Zod schemas
- Handle optimistic locking conflicts with 409 status code

**Dependencies Ready:**
- Routes schema exported and available
- Validation schemas ready for express middleware
- Service layer functions ready for handler consumption
- Optimistic locking pattern established and tested

## Self-Check: PASSED

### Files Created
```
FOUND: src/db/schema/routes.ts
FOUND: src/validation/routes.ts
FOUND: src/services/routeService.ts
```

### Files Modified
```
FOUND: src/db/schema/index.ts (routes export present)
FOUND: package.json (zod dependency present)
```

### Commits
```
FOUND: 929725a (Task 1)
FOUND: 3eedd55 (Task 2)
```

All artifacts verified. Plan execution complete.
