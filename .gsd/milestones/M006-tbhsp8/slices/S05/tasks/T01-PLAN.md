---
estimated_steps: 4
estimated_files: 2
---

# T01: Implement generateFactCheckSummary and tests

**Slice:** S05 — Completion Reporting and Diagnostics
**Milestone:** M006-tbhsp8

## Description

Build a `generateFactCheckSummary(slicePath: string): Promise<string | null>` function that reads the `FACTCHECK-STATUS.json` aggregate status and individual claim annotation files, then formats a markdown section suitable for injection into completion summaries. The function follows the same pattern as the existing `buildFactCheckIngestSection` in `auto-prompts.ts` — same imports, same graceful null-return on missing data.

The markdown output should include:
- Overall status (clean / has-refutations / pending / exhausted)
- Cycle count and max cycles
- Verdict counts (confirmed, refuted, inconclusive, unverified)
- List of unresolved claims (inconclusive/unverified) with claim IDs
- List of refuted claims with corrected values and impact level
- A note if the status is exhausted (cycle limit reached with unresolved claims)

## Steps

1. In `src/resources/extensions/gsd/auto-prompts.ts`, add `generateFactCheckSummary(slicePath: string): Promise<string | null>` as an exported async function. Read `FACTCHECK-STATUS.json` via `resolveStatusPath` + `parseAggregateStatus`. If the file doesn't exist or can't be parsed, return `null`. If it exists, iterate `claimIds` to read annotations via `resolveClaimPath` + `parseAnnotation`. Build a markdown section titled `## Fact-Check Diagnostics` with the data described above.
2. Create `src/resources/extensions/gsd/tests/factcheck-summary.test.ts` with tests using temp directories and fixture files. Test cases:
   - No factcheck directory → returns null
   - Clean status with all confirmed → returns section with 0 refuted, 0 inconclusive
   - Has-refutations status → returns section listing refuted claims with corrected values
   - Exhausted status → returns section with exhaustion warning
   - Mixed verdicts (some confirmed, some refuted, some inconclusive) → correct counts
   - Missing claim files referenced in status → gracefully skips, counts still correct
3. Run `npx vitest run src/resources/extensions/gsd/tests/factcheck-summary.test.ts` — all pass
4. Run `npx tsc --noEmit` — no type errors

## Must-Haves

- [ ] `generateFactCheckSummary` returns `null` when no fact-check artifacts exist
- [ ] `generateFactCheckSummary` returns a markdown string with verdict counts, cycle data, and claim details when artifacts exist
- [ ] Exhausted status includes explicit warning text
- [ ] At least 6 test cases covering the scenarios above
- [ ] `npx tsc --noEmit` passes

## Verification

- `npx vitest run src/resources/extensions/gsd/tests/factcheck-summary.test.ts` — all tests pass
- `npx tsc --noEmit` — exit 0

## Inputs

- `src/resources/extensions/gsd/auto-prompts.ts` — existing module; contains `buildFactCheckIngestSection` as a reference pattern for reading fact-check artifacts
- `src/resources/extensions/gsd/factcheck.ts` — exports `resolveStatusPath`, `resolveClaimPath`, `parseAggregateStatus`, `parseAnnotation`
- `src/resources/extensions/gsd/types.ts` — exports `FactCheckAnnotation`, `FactCheckAggregateStatus`, `FactCheckOverallStatus`

## Expected Output

- `src/resources/extensions/gsd/auto-prompts.ts` — new exported function `generateFactCheckSummary`
- `src/resources/extensions/gsd/tests/factcheck-summary.test.ts` — new test file with 6+ passing tests
