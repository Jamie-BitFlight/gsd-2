---
id: S06
parent: M006-tbhsp8
milestone: M006-tbhsp8
provides:
  - Milestone-level fact-check ingestion for buildPlanMilestonePrompt
  - Integration tests proving milestone reroute coverage (R069, R070)
requires:
  - slice: S03
    provides: Planner Evidence Ingestion pattern (buildFactCheckIngestSection)
  - slice: S04
    provides: Bounded Planner Revision Loop with dispatch rules
affects:
  - milestone: M006-tbhsp8 (final slice)
key_files:
  - src/resources/extensions/gsd/auto-prompts.ts
  - src/resources/extensions/gsd/prompts/plan-milestone.md
  - src/resources/extensions/gsd/tests/factcheck-milestone-ingestion.test.ts
key_decisions:
  - Milestone-level fact-check section filters to impact === "milestone" only (excludes slice-impact)
  - Section heading uses "### Injected Fact-Check Corrections (Milestone-Level)" to distinguish from template instructions
patterns_established:
  - Milestone-level helper follows same pattern as buildFactCheckIngestSection but iterates all slices
  - Test fixture pattern mirrors slice-level tests from S03
observability_surfaces:
  - none (prompt-builder helper - no runtime signals)
duration: 40m
verification_result: passed
completed_at: 2026-03-18
---

# S06: Milestone Planner Fact-Check Ingestion

**Milestone-level fact-check ingestion wired into buildPlanMilestonePrompt, completing the end-to-end correction loop for both reroute targets.**

## What Happened

This final slice completes the fact-check service layer by wiring milestone-level fact-check ingestion into the milestone planner. The implementation follows the established pattern from S03 (slice-level ingestion) but operates at the milestone level:

1. **buildMilestoneFactCheckIngestSection** - New helper that:
   - Resolves the milestone directory using `resolveMilestonePath`
   - Lists all slice subdirectories under the milestone
   - For each slice with `factcheck/FACTCHECK-STATUS.json`, loads claim annotations
   - Filters to only `verdict === "refuted"` AND `impact === "milestone"` claims
   - Returns formatted markdown section with source slice attribution, or null if no qualifying claims

2. **buildPlanMilestonePrompt integration** - The helper is called and its output injected into the prompt when non-null, appearing under "### Injected Fact-Check Corrections (Milestone-Level)"

3. **plan-milestone.md template update** - Added "Fact-Check Corrections" section instructing planners to treat corrected values as authoritative

4. **Integration tests** - 13 tests covering:
   - Null returns: no slices, no factcheck dirs, no status file, planImpacting=false, task-impact only, slice-impact only
   - Positive: milestone-impact included, VERIFIED excluded, multiple slices aggregated, mixed impact filtered
   - Integration: buildPlanMilestonePrompt includes section when milestone claims exist

## Verification

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | npx tsc --noEmit | 0 | ✅ pass | 3s |
| 2 | node --test src/resources/extensions/gsd/tests/factcheck-milestone-ingestion.test.ts | 0 | ✅ pass (13 tests) | 1.5s |

## Requirements Proven By This Slice

- **R069** [core-capability] — milestone-impacting REFUTED claims trigger reroute with corrected evidence
- **R070** [core-capability] — reroute target resolves to plan-milestone for milestone-level corrections

## Deviations

None — followed the task plan exactly.

## Known Limitations

None — this is the final slice and completes the milestone.

## Files Created/Modified

- `src/resources/extensions/gsd/auto-prompts.ts` — added `buildMilestoneFactCheckIngestSection`, wired into `buildPlanMilestonePrompt`, added `resolveMilestonePath` import
- `src/resources/extensions/gsd/prompts/plan-milestone.md` — added "Fact-Check Corrections" section
- `src/resources/extensions/gsd/tests/factcheck-milestone-ingestion.test.ts` — new test file with 13 integration tests

## Forward Intelligence

### What the next slice should know
- This is the final slice of M006-tbhsp8 — the fact-check service layer is now complete
- Both reroute targets (plan-slice and plan-milestone) are wired for fact-check ingestion
- S01-S05 established: contract (S01), coordinator/scout (S02), slice-level ingestion (S03), bounded revision loop (S04), completion reporting (S05)

### What's fragile
- No runtime live-test has been performed — only prompt-builder contract tests exist. The end-to-end path from research → fact-check → planner reinvocation would benefit from a live integration test.

### Authoritative diagnostics
- `buildMilestoneFactCheckIngestSection(milestonePath)` returns null or markdown section
- Test file at `src/resources/extensions/gsd/tests/factcheck-milestone-ingestion.test.ts` documents all edge cases

### What assumptions changed
- None — the milestone was planned with this slice as the final integration point
