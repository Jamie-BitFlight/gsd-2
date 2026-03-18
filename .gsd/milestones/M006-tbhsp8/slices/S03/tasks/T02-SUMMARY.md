---
id: T02
parent: S03
milestone: M006-tbhsp8
provides:
  - 11 integration tests for buildFactCheckIngestSection covering null returns, claim filtering, and full prompt integration
  - Tests use project conventions: node:test, node:assert/strict, and TypeScript imports
key_files:
  - src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts
key_decisions:
  - Tests use node:test with describe/it pattern matching project conventions
  - Mixed verdict test verifies VERIFIED claims are excluded from fact-check section
patterns_established:
  - Fixture pattern: createFixtureBase/cleanup with tmpdir and minimal ROADMAP
  - Helper functions: writeStatus, writeClaim for test data setup
observability_surfaces:
  - None required — pure test file with no runtime observability
duration: 15m
verification_result: passed
completed_at: 2026-03-18T14:15:00Z
blocker_discovered: false
---

# T02: Integration tests for fact-check ingestion

**Rewrote fact-check ingestion tests using node:test pattern with 11 passing test cases.**

## What Happened

The existing test file used a custom test helper pattern incompatible with the project's test runner. Rewrote the tests using the project's standard conventions: `import test from "node:test"` and `import assert from "node:assert/strict"`.

Tests verify:
- Null returns for missing factcheck directory, missing status file, and planImpacting=false
- Null returns when no REFUTED claims with slice/milestone impact exist
- Inclusion of REFUTED claims with slice and milestone impact
- Exclusion of REFUTED claims with task impact only
- Correct handling of multiple claims with mixed verdicts (VERIFIED excluded)
- Section header and instruction text formatting
- Full integration with buildPlanSlicePrompt

## Verification

All 11 tests pass using the project's test runner. Type check passes with no errors.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts` | 0 | ✅ pass | 817ms |
| 2 | `npx tsc --noEmit` | 0 | ✅ pass | 5s |

## Diagnostics

Run tests with: `npm run test:unit` or the specific command from the verification evidence table.

## Deviations

None — implementation followed the task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts` — Rewrote with node:test pattern, 11 test cases covering all required scenarios
