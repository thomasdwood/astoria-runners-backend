---
phase: 7
slug: feature-gap-closure-host-edit-ui-and-meetup-distance-fix
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no jest, vitest, or pytest config detected in project |
| **Config file** | none — manual verification is the gate |
| **Quick run command** | N/A |
| **Full suite command** | N/A |
| **Estimated runtime** | ~5 minutes manual check |

---

## Sampling Rate

- **After every task commit:** Manual verification per task instructions below
- **After every plan wave:** Confirm both behaviors in running dev environment
- **Before `/gsd:verify-work`:** Both manual checks must be green
- **Max feedback latency:** ~5 minutes per task

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 1 | EXPORT-02 | manual | N/A | ❌ manual-only | ⬜ pending |
| 7-01-02 | 01 | 1 | EXPORT-02 | manual | N/A | ❌ manual-only | ⬜ pending |
| 7-02-01 | 02 | 1 | (host edit) | manual | N/A | ❌ manual-only | ⬜ pending |
| 7-02-02 | 02 | 1 | (host edit) | manual | N/A | ❌ manual-only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

*No test framework configured — no Wave 0 stubs needed. Manual verification is the gate for all tasks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `{{distance}}` renders route distance in client-side Meetup template for virtual recurring instances | EXPORT-02 | No frontend test runner configured in project | 1. Start dev with `npm run dev:all`. 2. Open a virtual recurring event in the calendar. 3. Click "Export to Meetup". 4. In the popover, use a template containing `{{distance}}`. 5. Verify the distance value (e.g. `6.2`) renders instead of a blank. |
| Host can be edited via Settings page edit dialog | (host edit) | No frontend test runner configured in project | 1. Navigate to Admin → Settings. 2. Find a host in the Hosts table. 3. Click the Pencil icon — dialog should open pre-filled with current name and email. 4. Change name/email and submit. 5. Table should reflect updated values; success toast should appear. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5 minutes
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
