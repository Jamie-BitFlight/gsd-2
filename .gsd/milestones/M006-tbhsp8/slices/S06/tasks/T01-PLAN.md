---
estimated_steps: 4
estimated_files: 2
---

# T01: Wire milestone-level fact-check ingestion into buildPlanMilestonePrompt

**Slice:** S06 — Milestone Planner Fact-Check Ingestion
**Milestone:** M006-tbhsp8

## Description

Add a `buildMilestoneFactCheckIngestSection` helper that scans all slices under a milestone for milestone-impact REFUTED claims and formats them into a markdown section. Wire it into `buildPlanMilestonePrompt`. Update `plan-milestone.md` template with instructions for using corrected values.

This mirrors the S03 pattern where `buildFactCheckIngestSection` was wired into `buildPlanSlicePrompt`, but operates at milestone scope — iterating all slice directories and filtering to `milestone` impact only.

## Steps

1. In `auto-prompts.ts`, add `buildMilestoneFactCheckIngestSection(milestonePath: string): Promise<string | null>`:
   - Use `resolveMilestonePath` to get the milestone directory. List subdirectories under `<milestoneDir>/slices/`.
   - For each slice directory, call `resolveStatusPath` to check for `factcheck/FACTCHECK-STATUS.json`. If it exists, read and parse it with `parseAggregateStatus`.
   - If `planImpacting` is true, iterate `claimIds`, load each annotation with `resolveClaimPath`/`parseAnnotation`.
   - Filter to `verdict === "refuted"` AND `impact === "milestone"` only (NOT slice-impact — those are for plan-slice).
   - Collect qualifying claims with claimId, impact, correctedValue, citations, and the source slice ID.
   - If no qualifying claims, return null.
   - Format as markdown section titled `### Injected Fact-Check Corrections (Milestone-Level)` with each claim showing claim ID, source slice, corrected value, and citations.
2. In `buildPlanMilestonePrompt`, after the knowledge inline and before the template inlines, call `buildMilestoneFactCheckIngestSection` and push result to `inlined` if non-null. The function takes `base` and `mid` — resolve the milestone path internally.
3. In `plan-milestone.md`, add a step (after existing steps): "When an 'Injected Fact-Check Corrections' section is present, treat the corrected values as authoritative planning inputs and revise your roadmap accordingly. Do not plan work that contradicts corrected facts."
4. Run `npx tsc --noEmit` to verify compilation.

## Must-Haves

- [ ] `buildMilestoneFactCheckIngestSection` exists and returns null when no milestone-impact REFUTED claims
- [ ] `buildMilestoneFactCheckIngestSection` returns formatted markdown section with qualifying claims
- [ ] `buildPlanMilestonePrompt` calls the helper and injects into inlined context
- [ ] `plan-milestone.md` has corrected-values instruction step

## Verification

- `npx tsc --noEmit` exits 0

## Inputs

- `src/resources/extensions/gsd/auto-prompts.ts` — contains `buildPlanSlicePrompt` with `buildFactCheckIngestSection` integration (the pattern to replicate), and `buildPlanMilestonePrompt` (the function to modify)
- `src/resources/extensions/gsd/factcheck.ts` — exports `resolveStatusPath`, `parseAggregateStatus`, `resolveClaimPath`, `parseAnnotation`
- `src/resources/extensions/gsd/paths.ts` — exports `resolveMilestonePath`
- `src/resources/extensions/gsd/prompts/plan-milestone.md` — template to update
- `src/resources/extensions/gsd/prompts/plan-slice.md` — reference for the Step 7 pattern already added in S03

## Expected Output

- `src/resources/extensions/gsd/auto-prompts.ts` — new `buildMilestoneFactCheckIngestSection` export, `buildPlanMilestonePrompt` modified to call it
- `src/resources/extensions/gsd/prompts/plan-milestone.md` — new step for corrected values
