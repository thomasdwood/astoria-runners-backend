# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-15
**Phases:** 9 | **Plans:** 33 | **Timeline:** 21 days (2026-02-23 → 2026-03-15)

### What Was Built

- Full auth system: bcrypt + Redis sessions, rate-limited login, 7-day sessions, public/organizer split
- Route library: dynamic admin-defined categories (replaced hardcoded enum), distance, start/end locations, 47 real Astoria Runners routes
- Event scheduling: one-off events + complex recurring (weekly, biweekly, nth-weekday via RRule bysetpos) rendered as virtual instances — never materialized
- Public calendar: month grid + chronological list, category filtering, rich event overlay (host, Meetup link, Strava link)
- Discord notifications: fire-and-forget webhooks, category color embeds, graceful degradation when webhook URL absent
- Meetup export: configurable description templates with {{variable}} substitution, host assignment, meetupUrl tracking replacing a boolean checkbox
- Security hardening: EDITABLE_SETTINGS allowlist with per-key Zod schemas, notes max(2000), isNaN+id≤0 guards, sameSite:lax CSRF posture documented

### What Worked

- **Wave-based plan execution:** Small atomic plans (2–8 min each) kept scope contained and decisions traceable. Phase summaries accumulated a reliable decision log.
- **Router-level auth pattern:** Established in Phase 02, applied consistently — never had an unprotected mutation endpoint.
- **Virtual instance strategy:** Not materializing recurring instances proved correct — no orphan cleanup, no sync issues. The on-demand approach also made the cancel/delete/edit distinction clean.
- **Phase 03.1 insertion:** Accumulating TODOs into a single inserted phase rather than retrofitting each original phase kept the milestone clean.
- **Iterative gap closure:** Phases 06, 07, 08 as explicit gap closure phases rather than trying to re-open earlier phases worked well. Each gap got its own audit trail.
- **Audit before milestone close:** The two-pass audit (pre-Phase-07/08 then re-audit after) caught the EXPORT-01 backend gap and the {{distance}} blank before shipping.

### What Was Inefficient

- **Phase 05 DB migration:** drizzle-kit 0.31.x ESM/CJS incompatibility required writing migration SQL manually. Drizzle tooling friction cost a full session to diagnose. Investigate migration approach at the start of v1.1.
- **REQUIREMENTS.md staleness:** 14 traceability checkboxes were still Pending for fully-implemented requirements by Phase 08. Should update traceability table as part of each phase execution, not as a cleanup phase at the end.
- **No test framework from day one:** All 9 phases lack Nyquist-compliant tests. The "add tests later" decision compounded — test framework setup grows harder as codebase grows. This will cost more in v1.1 than it would have in Phase 01.
- **Phase 01 runtime verification deferred:** Reasonable in isolation, but the 12 deferred Docker tests never ran. They became implicit-only validation. Establishes a precedent that's hard to break.

### Patterns Established

- `router.use(requireAuth)` at router level, not per-handler
- `asyncHandler` wrapper on all route handlers (ESM-safe)
- `isNaN(id) || id <= 0` as canonical ID guard in route files
- Soft-delete recurring templates when events reference them; hard-delete otherwise
- Virtual recurring instances generated from RRULE strings, never stored
- Categories as FK table (not pgEnum) for runtime configurability
- `meetupUrl` empty string normalized to `null` in service layer (Zod validates, service converts)
- Fire-and-forget webhooks with `.catch()` for external integrations
- Settings validation extracted to `src/validation/settings.ts` to avoid circular deps

### Key Lessons

1. **Establish test infrastructure in Phase 01.** The cost of adding Vitest after 9 phases is significantly higher than wiring it in before any source files exist. For v1.1, add Vitest + a single smoke test as the first plan.
2. **Update traceability as you go.** A requirements file that diverges from reality becomes a liability, not an asset. Future phases should include a requirements update step in their summary checklist.
3. **Investigate drizzle-kit migration strategy before Phase 01 of v1.1.** The ESM/CJS incompatibility is a known risk. Either pin a working version, switch to raw SQL migrations from the start, or use drizzle-kit with a CJS config shim.
4. **Decimal phase insertions work well.** Phase 03.1 as an explicit insertion was cleaner than retrofitting original phases. Use this pattern for v1.1 urgent work.
5. **Audit before milestone close pays off.** The re-audit after Phases 07+08 found the EXPORT-01 backend gap — a real bug users would hit when configuring custom templates on one-off events.

### Cost Observations

- Model: Claude Sonnet 4.6 throughout
- Sessions: ~20 (estimated from commit clusters)
- Notable: 113 commits over 21 days at consistent 2–8 min/plan velocity. Phase 05 was largest (8 plans) and took longest due to migration debugging.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~20 | 9 | Baseline — established all core patterns |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 0 | 0% | 0 (all deps installed) |

### Top Lessons (Verified Across Milestones)

1. Add test infrastructure in Phase 01 — retrofitting is expensive
2. Keep traceability current per-phase, not as a cleanup batch at the end
