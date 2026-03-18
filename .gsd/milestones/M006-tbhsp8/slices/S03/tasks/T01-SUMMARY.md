---
id: T01
parent: S03
milestone: M006-tbhsp8
provides:
  - buildFactCheckIngestSection async helper for reading and formatting refuted claims
  - Fact-check corrections section injection in buildPlanSlicePrompt
  - Planner instructions for using corrected values as authoritative inputs
key_files:
  - src/resources/extensions/gsd/auto-prompts.ts
  - src/resources/extensions/gsd/prompts/plan-slice.md
  - src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts
key_decisions:
  - Fact-check corrections appear as a labeled section in the inlined context, not inline with research
patterns_established:
  - Async helper pattern matching inlineGsdRootFile: return string or null
  - Filter to only REFUTED claims with slice/milestone impact
  - Format with claim ID, impact level, corrected value, and citations
observability_surfaces:
  - None required — pure function with explicit inputs/outputs
duration: 45m
verification_result: passed
completed_at: 2026-03-18T14:00:00Z
blocker_discovered: false
---

# T01: Add fact-check ingestion to plan-slice prompt builder and template

**Added fact-check ingestion to plan-slice prompt builder, injecting corrected values from REFUTED claims as authoritative planning inputs.**

## What Happened

Implemented the `buildFactCheckIngestSection` helper function in `auto-prompts.ts` that reads `FACTCHECK-STATUS.json` and individual claim annotations, filters to only REFUTED claims with `slice` or `milestone` impact, and formats them into a clearly labeled markdown section. The helper returns `null` when no factcheck directory exists, no status file exists, `planImpacting` is false, or no qualifying claims remain.

Integrated the helper into `buildPlanSlicePrompt` by calling it after assembling other inlined content and pushing the result onto the `inlined` array when non-null.

Updated the `plan-slice.md` template with step 7 instructing planners to treat corrected values as authoritative when an "Injected Fact-Check Corrections" section is present.

Created comprehensive tests verifying: null returns for missing files, false `planImpacting`, and non-qualifying claims; inclusion of slice/milestone impact refutations; exclusion of task impact refutations; and full integration with `buildPlanSlicePrompt`.

## Verification

All 20 tests pass, covering edge cases (no factcheck dir, no status file, planImpacting false), claim filtering (only slice/milestone impact), and full prompt integration. Type check passes with no errors.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 5s |
| 2 | `npx tsx src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts` | 0 | ✅ pass | 3s |

## Diagnostics

To verify fact-check ingestion manually:
1. Create `factcheck/FACTCHECK-STATUS.json` with `planImpacting: true` and `claimIds` array
2. Create `factcheck/claims/<claimId>.json` with `verdict: "refuted"` and `impact: "slice"` or `"milestone"`
3. Call `buildPlanSlicePrompt(mid, midTitle, sid, sTitle, base)` and inspect the prompt for the "### Injected Fact-Check Corrections" section

## Deviations

None — implementation followed the task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/gsd/auto-prompts.ts` — Added `buildFactCheckIngestSection` helper and integration with `buildPlanSlicePrompt`
- `src/resources/extensions/gsd/prompts/plan-slice.md` — Added step 7 instructing planners to use corrected values as authoritative
- `src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts` — New test file with 10 test cases (20 assertions)
