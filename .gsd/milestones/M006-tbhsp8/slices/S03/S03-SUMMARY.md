---
id: S03
parent: M006-tbhsp8
milestone: M006-tbhsp8
provides:
  - buildFactCheckIngestSection async helper for reading fact-check artifacts and formatting REFUTED claims
  - Fact-check corrections injection in buildPlanSlicePrompt as a labeled markdown section
  - Planner template guidance for treating corrected values as authoritative inputs
requires:
  - slice: S01
    provides: Fact-check artifact schemas (FactCheckAnnotation, FactCheckAggregateStatus, impact enum)
  - slice: S02
    provides: Coordinator/scout execution that produces durable claim annotations and aggregate status
affects:
  - slice: S04
    why: Planner reinvocation (S04) requires fact-check outputs to already be in planning context
key_files:
  - src/resources/extensions/gsd/auto-prompts.ts
  - src/resources/extensions/gsd/prompts/plan-slice.md
  - src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts
  - src/resources/extensions/gsd/factcheck.ts
key_decisions:
  - Fact-check corrections appear as a distinct labeled section in the inlined context, not interspersed with research
  - Filter threshold: only REFUTED claims with `slice` or `milestone` impact are injected — task-level refutations are excluded
  - Null returns when no corrections exist — avoids adding empty sections to prompts
patterns_established:
  - Async helper pattern matching `inlineGsdRootFile`: takes milestone/slice paths, returns formatted string or null
  - Claim annotation filtering based on verdict (REFUTED) and impact (slice/milestone) fields
  - Section formatting includes claim ID, impact level, corrected value, and citation sources
observability_surfaces:
  - None required — pure function with explicit inputs/outputs, tested via integration tests
drill_down_paths:
  - .gsd/milestones/M006-tbhsp8/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M006-tbhsp8/slices/S03/tasks/T02-SUMMARY.md
duration: 60m
verification_result: passed
completed_at: 2026-03-18T14:15:00Z
---

# S03: Planner Evidence Ingestion

**Planning prompts include fact-check outputs so REFUTED claims with corrected values appear as concrete planning inputs rather than side-channel notes.**

## What Happened

Implemented the `buildFactCheckIngestSection` helper function in `auto-prompts.ts` that:
1. Locates the factcheck directory via `resolveStatusPath` using milestone/slice paths
2. Reads `FACTCHECK-STATUS.json` via `parseAggregateStatus`
3. If `planImpacting` is true, iterates through each claim ID in the status
4. Loads each claim annotation via `resolveClaimPath`/`parseAnnotation`
5. Filters to only REFUTED claims with impact level `slice` or `milestone`
6. Formats qualifying claims into a markdown section with claim ID, impact level, corrected value, and citations
7. Returns null when no qualifying corrections exist

Integrated this helper into `buildPlanSlicePrompt` — the section is appended to the `inlined` array only when non-null, keeping prompts clean when no corrections exist.

Updated `plan-slice.md` template with Step 7: "When an 'Injected Fact-Check Corrections' section is present, treat the corrected values as authoritative and revise your plan accordingly."

T02 rewrote integration tests using the project's node:test pattern. All 11 tests pass, verifying:
- Null returns for missing factcheck directory, missing status file, planImpacting=false
- Null returns when only task-level REFUTED claims exist
- Inclusion of slice-impact and milestone-impact REFUTED claims
- Exclusion of VERIFIED claims
- Full integration with buildPlanSlicePrompt

## Verification

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 5s |
| 2 | `node --test` factcheck-ingestion.test.ts | 0 | ✅ pass (11/11) | 1s |

## New Requirements Surfaced

None — R068 (core capability for planner prompt assembly including fact-check status) is now addressed by this slice. R069 (planner reinvocation) remains for S04.

## Deviations

None — implementation followed the slice plan exactly.

## Known Limitations

- S03 only injects corrections into plan-slice prompts. Other planning prompts (plan-milestone, plan-task) would need similar integration if required.
- The helper currently reads from the local filesystem. In distributed scenarios, the paths would need to resolve to the correct worktree.
- No runtime verification yet — this slice proves the prompt-building contract works, but S04 will prove the actual planner reinvocation loop.

## Follow-ups

- S04 will wire the planner reinvocation: when a REFUTED claim has slice/milestone impact, auto-mode should reroute to `plan-slice` or `plan-milestone` with corrected evidence
- Consider extending fact-check ingestion to other planning prompts if needed

## Files Created/Modified

- `src/resources/extensions/gsd/auto-prompts.ts` — Added `buildFactCheckIngestSection` helper and integrated with `buildPlanSlicePrompt`
- `src/resources/extensions/gsd/prompts/plan-slice.md` — Added Step 7 with instructions for using corrected values
- `src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts` — New test file with 11 test cases covering all scenarios

## Forward Intelligence

### What the next slice should know
- The helper `buildFactCheckIngestSection` in `auto-prompts.ts` is the pattern to replicate for other planning prompts
- The filter logic (REFUTED + slice/milestone impact) is explicit and can be adjusted if requirements change
- The fact-check directory structure is: `<milestone>/<slice>/factcheck/FACTCHECK-STATUS.json` and `<milestone>/<slice>/factcheck/claims/<claimId>.json`

### What's fragile
- Path resolution assumes local filesystem with milestone/slice directories under the GSD root — distributed execution would need path remapping

### Authoritative diagnostics
- Test file `factcheck-ingestion.test.ts` shows all expected behaviors — run these to verify any changes don't break ingestion
- TypeScript compilation will catch schema mismatches between the helper and the fact-check types

### What assumptions changed
- Initially, we might have assumed all REFUTED claims should be injected — the requirement explicitly filters to slice/milestone impact only, which aligns with the milestone's bounded revision loop goal
