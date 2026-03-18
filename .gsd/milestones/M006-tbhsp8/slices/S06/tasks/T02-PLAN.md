---
estimated_steps: 3
estimated_files: 1
---

# T02: Add integration tests proving milestone-level fact-check ingestion and end-to-end reroute coverage

**Slice:** S06 — Milestone Planner Fact-Check Ingestion
**Milestone:** M006-tbhsp8

## Description

Create `factcheck-milestone-ingestion.test.ts` proving that `buildMilestoneFactCheckIngestSection` correctly aggregates milestone-impact REFUTED claims across slices, and that `buildPlanMilestonePrompt` includes the section in its output. This validates R069 (milestone-impacting REFUTED claims trigger planner reinvocation with corrected evidence) and R070 (reroute target resolves to plan-milestone) at the prompt-building level.

Use the same `node:test` pattern as `factcheck-ingestion.test.ts` from S03. Create temp directories with proper GSD directory structure as fixtures.

## Steps

1. Create `src/resources/extensions/gsd/tests/factcheck-milestone-ingestion.test.ts`. Import `buildMilestoneFactCheckIngestSection` from `auto-prompts.ts`. Import fixture helpers (`mkdtemp`, `writeFile`, `mkdir`).
2. Write test cases:
   - **No factcheck directories**: milestone with slices but no factcheck dirs → returns null
   - **No status file**: factcheck dir exists but no FACTCHECK-STATUS.json → returns null
   - **planImpacting false**: status exists with `planImpacting: false` → returns null
   - **Only task-impact REFUTED**: claims with `impact: "task"` → returns null
   - **Only slice-impact REFUTED**: claims with `impact: "slice"` → returns null (milestone helper filters to milestone-only)
   - **Milestone-impact REFUTED included**: claim with `impact: "milestone"`, `verdict: "refuted"` → returns section with claim details
   - **VERIFIED claims excluded**: milestone-impact but `verdict: "verified"` → returns null
   - **Multiple slices aggregated**: two slices each with milestone-impact REFUTED claims → both appear in output
   - **Mixed impact levels**: milestone + slice + task impact claims → only milestone claims in output
   - **buildPlanMilestonePrompt integration**: set up fixture with milestone-impact REFUTED claim, call `buildPlanMilestonePrompt`, assert output contains "Fact-Check Corrections" section
3. Run `node --test src/resources/extensions/gsd/tests/factcheck-milestone-ingestion.test.ts` and `npx tsc --noEmit`.

## Must-Haves

- [ ] At least 10 test cases covering null returns, filtering, aggregation, and prompt integration
- [ ] All tests pass
- [ ] `npx tsc --noEmit` clean

## Verification

- `node --test src/resources/extensions/gsd/tests/factcheck-milestone-ingestion.test.ts` — all pass
- `npx tsc --noEmit` exits 0

## Inputs

- `src/resources/extensions/gsd/auto-prompts.ts` — T01 output with `buildMilestoneFactCheckIngestSection` and modified `buildPlanMilestonePrompt`
- `src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts` — reference for test patterns, fixture setup, and assertion style from S03
- `src/resources/extensions/gsd/factcheck.ts` — schema types for creating test fixtures (FactCheckAnnotation, FactCheckAggregateStatus)

## Expected Output

- `src/resources/extensions/gsd/tests/factcheck-milestone-ingestion.test.ts` — new test file with ≥10 test cases, all passing

## Observability Impact

- **What changes:** No runtime behavior changes — tests verify existing `buildMilestoneFactCheckIngestSection` and `buildPlanMilestonePrompt` functions.
- **How to inspect:** Run `node --test src/resources/extensions/gsd/tests/factcheck-milestone-ingestion.test.ts` to verify all cases pass. Each test creates isolated temp directories with proper GSD structure as fixtures.
- **Failure visibility:** Test failures surface via Node.js test runner output with assertion details. TypeScript errors surface via `npx tsc --noEmit`.
