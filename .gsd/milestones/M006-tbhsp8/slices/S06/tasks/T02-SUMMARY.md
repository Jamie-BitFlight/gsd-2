---
id: T02
parent: S06
milestone: M006-tbhsp8
provides:
  - Integration tests for milestone-level fact-check ingestion
  - Test coverage for R069 and R070 at prompt-building level
key_files:
  - src/resources/extensions/gsd/tests/factcheck-milestone-ingestion.test.ts
  - src/resources/extensions/gsd/auto-prompts.ts
key_decisions:
  - Test checks for `### Injected Fact-Check Corrections` (section) not template instructions (`## Fact-Check Corrections`)
patterns_established:
  - Milestone-level tests follow same fixture pattern as slice-level tests from S03
  - Each test creates isolated temp directories with proper GSD structure
observability_surfaces:
  - none (test file)
duration: 25m
verification_result: passed
completed_at: 2026-03-18
blocker_discovered: false
---

# T02: Add integration tests proving milestone-level fact-check ingestion and end-to-end reroute coverage

**Added 13 integration tests proving milestone-level fact-check ingestion works correctly, including buildPlanMilestonePrompt integration.**

## What Happened

Created `factcheck-milestone-ingestion.test.ts` with comprehensive test coverage following the same `node:test` pattern established in S03. The tests verify:

1. **Null return cases**: No slices directory, no factcheck directories, no status file, planImpacting=false, only task-impact claims, only slice-impact claims
2. **Positive cases**: Milestone-impact REFUTED claims included with source slice attribution, multiple slices aggregated, mixed impact levels filtered correctly
3. **Integration**: `buildPlanMilestonePrompt` includes the section when milestone claims exist, omits it when only slice claims exist

Fixed a missing import (`resolveMilestonePath`) in `auto-prompts.ts` discovered during test execution. Also fixed a test assertion that was incorrectly matching template instruction text instead of the actual injected section (template uses `## Fact-Check Corrections` while injected sections use `### Injected Fact-Check Corrections`).

## Verification

- TypeScript compiles clean with `npx tsc --noEmit`
- All 13 tests pass with `node --test src/resources/extensions/gsd/tests/factcheck-milestone-ingestion.test.ts`

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | npx tsc --noEmit | 0 | ✅ pass | 3s |
| 2 | node --test src/resources/extensions/gsd/tests/factcheck-milestone-ingestion.test.ts | 0 | ✅ pass | 1.4s |

## Diagnostics

Tests can be run via `npm run test:unit` or directly with `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/resources/extensions/gsd/tests/factcheck-milestone-ingestion.test.ts`. Each test creates isolated temp directories and cleans up after completion.

## Deviations

Fixed a test assertion issue where the check for "Injected Fact-Check Corrections (Milestone-Level)" was matching template instruction text rather than the actual injected section. Updated to check for `### Injected Fact-Check Corrections (Milestone-Level)` (with `###` prefix) which distinguishes the actual section from template text.

## Known Issues

None — all tests pass.

## Files Created/Modified

- `src/resources/extensions/gsd/tests/factcheck-milestone-ingestion.test.ts` — new test file with 13 integration tests
- `src/resources/extensions/gsd/auto-prompts.ts` — added missing `resolveMilestonePath` import
- `.gsd/milestones/M006-tbhsp8/slices/S06/S06-PLAN.md` — added observability section, marked T02 complete
- `.gsd/milestones/M006-tbhsp8/slices/S06/tasks/T02-PLAN.md` — added observability impact section
