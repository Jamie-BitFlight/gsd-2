---
id: T04
parent: S02
milestone: M006-tbhsp8
provides:
  - Integration tests for factcheck coordinator flow
  - Claim extraction from Unknowns Inventory markdown tables
  - End-to-end coordinator workflow verification with file writes
key_files:
  - src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts
key_decisions:
  - D059: Claim extraction helper implemented in test file for testability; can be moved to factcheck.ts if needed by coordinator runtime
patterns_established:
  - Table parsing with separator detection to skip header rows
  - Preserving empty columns to correctly identify missing claim IDs
  - Integration test pattern: temp dir → extract → create annotations → write files → verify artifacts → cleanup
observability_surfaces:
  - Test output shows passed/failed counts and specific assertion failures
  - Integration tests write to temp directories for isolation
duration: 45m
verification_result: passed
completed_at: 2026-03-18T09:30:00-04:00
blocker_discovered: false
---

# T04: Add Integration Tests for Coordinator Flow

**Added comprehensive integration tests verifying the factcheck coordinator flow from claim extraction through artifact writing.**

## What Happened

Created `factcheck-coordinator.test.ts` with 25 test cases covering:

1. **Claim extraction tests** — parsing Unknowns Inventory markdown tables with various formats (standard, empty, malformed, missing columns). Implemented `extractClaimsFromUnknowns` helper function that correctly handles table headers by detecting the separator row.

2. **Annotation generation tests** — creating initial annotations from extracted claims, round-tripping annotations with all verdict types (confirmed, refuted, inconclusive, unverified), and handling correctedValue field.

3. **Aggregate status tests** — deriving overall status (clean, has-refutations, pending, exhausted), deriving planImpacting flag based on refutation impact level (slice/milestone impact = true), and building aggregate status with correct counts.

4. **Integration tests** — end-to-end workflow creating temp directories, extracting claims from mock research output, creating annotations, writing to actual files, verifying artifacts exist with correct content, and cleanup.

Key implementation insight: Empty claim ID cells were being filtered out by the initial parser. Fixed by preserving empty columns when splitting table rows, then generating sequential C001/C002/etc IDs for missing values.

## Verification

All 25 tests pass with Node test runner using the TypeScript resolver:
- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --test src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts` — 25/25 pass
- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --test src/resources/extensions/gsd/tests/post-unit-hooks.test.ts` — 44/44 pass (includes factcheck-coordinator hook tests)
- `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --test src/resources/extensions/gsd/tests/factcheck.test.ts` — 37/37 pass (existing S01 tests)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --test src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts` | 0 | ✅ pass | 167ms |
| 2 | `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --test src/resources/extensions/gsd/tests/post-unit-hooks.test.ts` | 0 | ✅ pass | 782ms |
| 3 | `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --test src/resources/extensions/gsd/tests/factcheck.test.ts` | 0 | ✅ pass | 167ms |

## Diagnostics

To inspect test coverage:
- Run individual test file with `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --test src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts`
- Tests write to temp directories (`/tmp/factcheck-test-*`) which are cleaned up after each test
- Test summary shows passed/failed counts with `All tests passed` confirmation

## Deviations

None — implemented exactly as specified in task plan.

## Known Issues

None — all tests pass.

## Files Created/Modified

- `src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts` — New file with 25 test cases for coordinator flow including claim extraction, annotation generation, aggregate status derivation, and file-write integration tests
