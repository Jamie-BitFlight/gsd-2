---
id: T01
parent: S06
milestone: M006-tbhsp8
provides:
  - Milestone-level fact-check ingestion for buildPlanMilestonePrompt
key_files:
  - src/resources/extensions/gsd/auto-prompts.ts
  - src/resources/extensions/gsd/prompts/plan-milestone.md
key_decisions:
  - Milestone-level fact-check section filters to impact === "milestone" only (excludes slice-impact)
patterns_established:
  - Milestone-level helper follows same pattern as buildFactCheckIngestSection but iterates all slices
observability_surfaces:
  - none (prompt-builder helper)
duration: 15m
verification_result: passed
completed_at: 2026-03-18
blocker_discovered: false
---

# T01: Wire milestone-level fact-check ingestion into buildPlanMilestonePrompt

**Added buildMilestoneFactCheckIngestSection helper that scans all slices for milestone-impact REFUTED claims and wires it into buildPlanMilestonePrompt.**

## What Happened

Implemented the milestone-level fact-check ingestion following the S03 pattern for slice-level ingestion. The new `buildMilestoneFactCheckIngestSection` function:

1. Resolves the milestone directory using `resolveMilestonePath`
2. Lists all slice subdirectories under the milestone
3. For each slice, checks for `factcheck/FACTCHECK-STATUS.json` existence
4. If present and `planImpacting`, loads claim annotations via `resolveClaimPath`/`parseAnnotation`
5. Filters to only `verdict === "refuted"` AND `impact === "milestone"` claims (excludes slice-impact)
6. Returns formatted markdown section with source slice attribution, or null if no qualifying claims

Wired the helper into `buildPlanMilestonePrompt` after the knowledge inline and before template inlines. Updated `plan-milestone.md` template with a new "Fact-Check Corrections" section that instructs planners to treat corrected values as authoritative.

## Verification

- `npx tsc --noEmit` — passes with zero type errors
- Added `readdirSync` import for slice directory listing
- Helper follows established patterns from `buildFactCheckIngestSection`

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | npx tsc --noEmit | 0 | ✅ pass | 3s |

## Diagnostics

The milestone-level fact-check section can be inspected by calling `buildMilestoneFactCheckIngestSection(base, mid)` with valid paths. The section will appear in `buildPlanMilestonePrompt` output when milestone-impact REFUTED claims exist in any slice under the milestone.

## Deviations

None — followed the task plan exactly.

## Known Issues

None — integration tests will be added in T02.

## Files Created/Modified

- `src/resources/extensions/gsd/auto-prompts.ts` — added `buildMilestoneFactCheckIngestSection` helper, wired into `buildPlanMilestonePrompt`, added `readdirSync` import
- `src/resources/extensions/gsd/prompts/plan-milestone.md` — added "Fact-Check Corrections" section with instructions for using corrected values
