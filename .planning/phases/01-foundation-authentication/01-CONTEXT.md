# Phase 1: Foundation & Authentication - Context

**Gathered:** 2026-02-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Authentication system where organizers can log in to manage content, while public users can view calendars without authentication. Includes data foundation with database schema, optimistic locking (version fields), and UTC timestamp patterns.

</domain>

<decisions>
## Implementation Decisions

### Login experience & session handling
- Simple email + password form (no "remember me" checkbox)
- Sessions last 7 days before expiring
- Global logout - kills session across all tabs/devices
- Password policy: Claude's discretion

### Public access boundaries
- Public users see full calendar with all event details (read-only)
- Standard public route `/calendar` - not secret/unguessable
- Full route details including GPX maps visible to public
- Basic rate limiting enabled (prevent bot abuse)

### Database & deployment approach
- PostgreSQL - matches common patterns, realistic demo for website team
- Demo runs locally (laptop) - not hosted yet
- ORM/abstraction layer: Claude's discretion
- Local dev setup: Claude's discretion

### Error states & edge cases
- Failed login: Generic "Invalid credentials" error (don't reveal if email exists)
- Session expiry: Show modal "Session expired, please login"
- Protected page access: Claude's discretion
- Error verbosity: Full details in dev mode, user-friendly in production

### Claude's Discretion
- Password policy strength
- ORM/query builder choice (optimize for easy database switching)
- Local development setup (Docker vs local install)
- Redirect behavior for unauthenticated access to protected pages

</decisions>

<specifics>
## Specific Ideas

**Demo-first approach:**
- Building standalone POC to show website development team
- Want flexibility to adapt to their infrastructure later
- PostgreSQL chosen as common pattern they likely use
- Keep database choice swappable via abstraction layer

**Security choices:**
- Generic login errors to avoid revealing registered emails
- Global logout for better security
- Rate limiting to prevent abuse of public endpoints

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-authentication*
*Context gathered: 2026-02-13*
