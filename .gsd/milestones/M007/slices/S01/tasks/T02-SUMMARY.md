---
id: T02
parent: S01
milestone: M007
provides:
  - JSON round-trip contract test for UnitMetrics schema
key_files:
  - src/resources/extensions/gsd/tests/telemetry-contract.test.ts
key_decisions: []
patterns_established:
  - Contract test pattern using helper functions for nested object assertions
observability_surfaces:
  - Test execution output (111 assertions) confirms schema stability
duration: 5min
verification_result: passed
completed_at: 2026-03-19T21:22:00-04:00
blocker_discovered: false
---

# T02: Add JSONL schema documentation and telemetry contract test

**Created comprehensive contract test proving JSON round-trip fidelity for all UnitMetrics fields including M007 additions.**

## What Happened

Created `telemetry-contract.test.ts` with 111 assertions covering:
- Full UnitMetrics round-trip with all required and optional fields
- Minimal metrics round-trip proving optional fields remain absent when omitted
- Partial optional fields (skills-only, interventions-only, factCheck-only, wallClockMs-only)
- Edge cases: zero values in nested objects, empty skills array, large token/cost numbers
- JSONL line format validation (single-line, parseable, contains expected fields)

The test uses helper functions (`assertTokenCountsEqual`, `assertInterventionsEqual`, `assertFactCheckEqual`) to reduce repetition and improve readability for nested object comparisons.

Also added the missing `## Observability Impact` section to T02-PLAN.md per pre-flight requirements.

## Verification

Ran `npx tsx --test src/resources/extensions/gsd/tests/telemetry-contract.test.ts` — all 111 assertions pass, proving JSON serialization preserves all field values for both required and optional fields, and correctly omits optional fields when not provided.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsx --test src/resources/extensions/gsd/tests/telemetry-contract.test.ts` | 0 | ✅ pass | ~180ms |

## Diagnostics

Run `npx tsx --test src/resources/extensions/gsd/tests/telemetry-contract.test.ts` to verify schema stability. Test failure indicates a breaking change to the UnitMetrics interface that would break JSONL persistence or aggregation.

## Deviations

None — implemented exactly as planned.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/gsd/tests/telemetry-contract.test.ts` — new contract test with 111 assertions for JSON round-trip fidelity
- `.gsd/milestones/M007/slices/S01/tasks/T02-PLAN.md` — added missing Observability Impact section
