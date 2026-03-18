---
id: T01
parent: S05
milestone: M006-tbhsp8
provides:
  - generateFactCheckSummary function for completion summaries
  - Fact-check diagnostics section with verdict counts and claim details
key_files:
  - src/resources/extensions/gsd/auto-prompts.ts
  - src/resources/extensions/gsd/tests/factcheck-summary.test.ts
key_decisions:
  - Reused existing pattern from buildFactCheckIngestSection for consistency
patterns_established:
  - Graceful null-return pattern for missing fact-check artifacts
  - Markdown diagnostics section format with status, cycles, verdicts, and claims
observability_surfaces:
  - None (pure function with no runtime state)
duration: 15m
verification_result: passed
completed_at: 2026-03-18T11:40:00-04:00
blocker_discovered: false
---

# T01: Implement generateFactCheckSummary and tests

**Added generateFactCheckSummary function to produce fact-check diagnostics sections for completion summaries.**

## What Happened

Implemented the `generateFactCheckSummary(slicePath: string): Promise<string | null>` function in `auto-prompts.ts` following the same pattern as the existing `buildFactCheckIngestSection`. The function reads the `FACTCHECK-STATUS.json` aggregate status and individual claim annotation files, then formats a markdown section with:

- Overall status (clean/has-refutations/pending/exhausted)
- Cycle count and max cycles
- Verdict counts (confirmed, refuted, inconclusive, unverified)
- List of refuted claims with corrected values and impact level
- List of unresolved claims (inconclusive/unverified) with claim IDs
- Exhaustion warning when cycle limit reached with unresolved claims

Created comprehensive test file with 10 test cases covering:
1. No factcheck directory → returns null
2. Missing status file → returns null
3. Invalid JSON in status file → returns null
4. Clean status with all confirmed → correct counts, no claims lists
5. Has-refutations status → lists refuted claims with corrected values
6. Exhausted status → includes exhaustion warning
7. Mixed verdicts → correct counts and claim lists
8. Missing claim files → gracefully skips without crashing
9. Refuted claim without correctedValue → shows placeholder text
10. Pending status with unverified claims → shows unresolved list

## Verification

Ran `npx vitest run src/resources/extensions/gsd/tests/factcheck-summary.test.ts` — all 10 tests passed in 22ms. Ran `npx tsc --noEmit` — no type errors.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | npx vitest run src/resources/extensions/gsd/tests/factcheck-summary.test.ts | 0 | ✅ pass | 2.42s |
| 2 | npx tsc --noEmit | 0 | ✅ pass | ~3s |

## Diagnostics

Pure function with no runtime state. To verify behavior, run the test suite: `npx vitest run src/resources/extensions/gsd/tests/factcheck-summary.test.ts`

## Deviations

None. Implementation followed the task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/gsd/auto-prompts.ts` — Added generateFactCheckSummary function (38 lines)
- `src/resources/extensions/gsd/tests/factcheck-summary.test.ts` — Created test file with 10 test cases
