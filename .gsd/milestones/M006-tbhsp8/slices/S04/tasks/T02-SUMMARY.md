---
id: T02
parent: S04
milestone: M006-tbhsp8
provides:
  - Integration tests for fact-check reroute detection
  - Integration tests for bounded cycle limit exhaustion
  - Test coverage for plan-impacting refutation dispatch routing
key_files:
  - src/resources/extensions/gsd/tests/auto-recovery-loop.test.ts
key_decisions: []
patterns_established:
  - Test fixtures using temp directories with proper directory structure (`.gsd/milestones/{mid}/slices/{sid}/factcheck/claims/`)
  - Helper functions for writing status files and claim annotations in tests
  - Verification of persisted state changes by reading files back from disk
observability_surfaces:
  - Test output shows pass/fail for each test case
duration: 30m
verification_result: passed
completed_at: 2026-03-18T10:45:00-04:00
blocker_discovered: false
---

# T02: Add integration tests for fact-check reroute and exhaustion

**Added 11 integration tests proving `checkFactCheckReroute` correctly reroutes on plan-impacting refutations, increments cycles, halts on exhaustion, and passes through when no reroute is needed.**

## What Happened

Created `auto-recovery-loop.test.ts` with comprehensive test coverage for the fact-check reroute logic implemented in T01. The tests use temp directories with proper GSD directory structure to write and read fact-check status files and claim annotations, verifying both the returned result and the persisted state changes on disk.

Test cases cover:
1. **Null returns**: no factcheck directory, no status file, `planImpacting: false`
2. **Reroute scenarios**: slice-impact claim → `plan-slice`, milestone-impact claim → `plan-milestone`
3. **Exhaustion scenarios**: at cycle limit (`currentCycle: 2, maxCycles: 2`), over cycle limit
4. **Edge cases**: mixed impact levels (milestone wins over slice), missing claim files, unparseable claim files
5. **State verification**: cycle increment persisted to disk, exhaustion status persisted to disk

All tests use synchronous temp directory creation with `mkdtempSync` and cleanup with `rmSync` in `finally` blocks, following the patterns from existing test files.

## Verification

- **TypeScript check**: `npx tsc --noEmit` — zero errors
- **New tests**: `node --test src/resources/extensions/gsd/tests/auto-recovery-loop.test.ts` — 11/11 pass
- **Existing tests**: `auto-recovery.test.ts`, `factcheck.test.ts`, `factcheck-coordinator.test.ts`, `factcheck-ingestion.test.ts` — 93/93 pass

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | ~5s |
| 2 | `node --test src/resources/extensions/gsd/tests/auto-recovery-loop.test.ts` (with TypeScript loader) | 0 | ✅ pass | ~1.7s |
| 3 | `node --test src/resources/extensions/gsd/tests/auto-recovery.test.ts src/resources/extensions/gsd/tests/factcheck.test.ts src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts` (with TypeScript loader) | 0 | ✅ pass | ~1.5s |

## Diagnostics

Tests output individual pass/fail for each test case via TAP format. To inspect test behavior:
- Run individual tests: `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/resources/extensions/gsd/tests/auto-recovery-loop.test.ts`
- Tests write to temp directories under `$TMPDIR/auto-recovery-loop-*` and clean up after each test

## Deviations

None. The task plan specified 8+ test cases; 11 were written to cover additional edge cases (missing claim files, unparseable claim files, confirmed claims ignored).

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/gsd/tests/auto-recovery-loop.test.ts` — new test file with 11 integration tests for `checkFactCheckReroute`
