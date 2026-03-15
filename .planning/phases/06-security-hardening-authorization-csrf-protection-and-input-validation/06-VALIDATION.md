---
phase: 6
slug: security-hardening-authorization-csrf-protection-and-input-validation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no test framework installed |
| **Config file** | none — no Wave 0 setup needed (manual verification) |
| **Quick run command** | Manual curl against dev server (see Per-Task Verification Map) |
| **Full suite command** | Run all curl commands below |
| **Estimated runtime** | ~5 minutes (manual) |

---

## Sampling Rate

- **After every task commit:** Run the relevant curl command from the Per-Task Verification Map
- **After every plan wave:** Run all curl commands in the full suite
- **Before `/gsd:verify-work`:** All manual checks must pass
- **Max feedback latency:** ~5 minutes

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 1 | SEC-01 | manual | `curl -X PUT http://localhost:3000/api/settings/unknown_key -H "Content-Type: application/json" -d '{"value":"test"}' -b "sid=<session>"` → expect 400 | ❌ W0 | ⬜ pending |
| 6-01-02 | 01 | 1 | SEC-01 | manual | `curl -X PUT http://localhost:3000/api/settings/default_start_location -H "Content-Type: application/json" -d '{"value":"<201-char-string>"}' -b "sid=<session>"` → expect 422 | ❌ W0 | ⬜ pending |
| 6-01-03 | 01 | 1 | SEC-01 | manual | `curl -X PUT http://localhost:3000/api/settings/discord_notifications_enabled -H "Content-Type: application/json" -d '{"value":"maybe"}' -b "sid=<session>"` → expect 422 | ❌ W0 | ⬜ pending |
| 6-02-01 | 02 | 1 | SEC-02 | manual | `curl -X POST http://localhost:3000/api/events -H "Content-Type: application/json" -d '{"notes":"<2001-char-string>", ...}' -b "sid=<session>"` → expect 422 | ❌ W0 | ⬜ pending |
| 6-02-02 | 02 | 1 | SEC-02 | manual | `curl -X PUT http://localhost:3000/api/events/0 -H "Content-Type: application/json" -d '{}' -b "sid=<session>"` → expect 400 | ❌ W0 | ⬜ pending |
| 6-03-01 | 03 | 1 | SEC-03 | manual | Review SECURITY.md for CSRF rationale section | ❌ W0 | ⬜ pending |
| 6-03-02 | 03 | 1 | SEC-03 | manual | Review `src/config/session.ts` for CSRF documentation comment | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No automated test framework exists. All verification is manual via curl against the running dev server. No Wave 0 test file setup is required.

*Existing infrastructure: dev server at http://localhost:3000 (API) started with `npm run dev:all`*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `PUT /api/settings/unknown_key` returns 400 | SEC-01 | No test framework | Start dev server, curl with arbitrary key, confirm 400 response |
| `PUT /api/settings/default_start_location` with 201-char value returns 422 | SEC-01 | No test framework | curl with value exceeding max(200), confirm 422 with validation error |
| `PUT /api/settings/discord_notifications_enabled` with `"maybe"` returns 422 | SEC-01 | No test framework | curl with non-enum value, confirm 422 |
| `POST /api/events` with 2001-char notes returns 422 | SEC-02 | No test framework | curl with oversized notes field, confirm 422 |
| `PUT /api/events/0` returns 400 | SEC-02 | No test framework | curl with id=0, confirm 400 (not 404) |
| SECURITY.md updated with CSRF rationale | SEC-03 | Documentation review | Read SECURITY.md, verify CSRF section present |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 300s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
