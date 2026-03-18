# S03: Planner Evidence Ingestion

**Goal:** Planning prompts include fact-check outputs so REFUTED claims with corrected values appear as concrete planning inputs rather than side-channel notes.
**Demo:** Given a `FACTCHECK-STATUS.json` with `planImpacting: true` and a REFUTED claim annotation on disk, running the plan-slice prompt builder produces a prompt containing an "Injected Fact-Check Corrections" section with the claim's corrected value.

## Must-Haves

- `buildPlanSlicePrompt` reads `FACTCHECK-STATUS.json` from the slice's factcheck directory and, when `planImpacting` is true, reads corresponding REFUTED claim annotation files
- Corrected values from REFUTED annotations appear in a clearly labeled "Injected Fact-Check Corrections" block in the generated prompt
- Only REFUTED claims with impact `slice` or `milestone` are injected — `task`-level and `none` claims are excluded
- When no factcheck artifacts exist or `planImpacting` is false, the prompt is unchanged (no empty sections)
- `plan-slice.md` template includes guidance for the planner on how to use injected corrections
- Integration tests verify ingestion with mock factcheck artifacts on disk

## Proof Level

- This slice proves: integration (prompt builder reads real files, emits correct prompt content)
- Real runtime required: no (unit/integration tests with temp directories)
- Human/UAT required: no

## Verification

- `node --test src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts` — all tests pass
- `npx tsc --noEmit` — no type errors

## Integration Closure

- Upstream surfaces consumed: `factcheck.ts` (path resolution, parsing), `types.ts` (FactCheckAnnotation, FactCheckAggregateStatus)
- New wiring introduced in this slice: `buildPlanSlicePrompt` calls new helper to read factcheck artifacts and inject into prompt
- What remains before the milestone is truly usable end-to-end: S04 (planner reinvocation loop), S05 (completion reporting)

## Tasks

- [x] **T01: Add fact-check ingestion to plan-slice prompt builder and template** `est:45m`
  - Why: This is the core delivery — without this, corrected evidence never reaches the planner (R068, R072)
  - Files: `src/resources/extensions/gsd/auto-prompts.ts`, `src/resources/extensions/gsd/prompts/plan-slice.md`
  - Do: Add a helper function `buildFactCheckIngestSection` that reads FACTCHECK-STATUS.json via `resolveStatusPath`/`parseAggregateStatus`, and if `planImpacting` is true, reads each REFUTED claim annotation via `resolveClaimPath`/`parseAnnotation`. Filter to impact `slice` or `milestone` only. Format as a labeled section with claim ID, original claim context, corrected value, and impact level. Call this helper from `buildPlanSlicePrompt` and append the section to `inlined` when non-null. Update `plan-slice.md` template with instructions for how the planner should treat injected corrections.
  - Verify: `npx tsc --noEmit` passes
  - Done when: `buildPlanSlicePrompt` emits fact-check corrections when artifacts exist, emits nothing extra when they don't, and `plan-slice.md` has the new section

- [x] **T02: Integration tests for fact-check ingestion** `est:30m`
  - Why: Proves the ingestion actually works with real files on disk and validates edge cases
  - Files: `src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts`
  - Do: Create test file using node:test. Tests: (1) no factcheck dir → prompt unchanged, (2) planImpacting false → prompt unchanged, (3) planImpacting true with one REFUTED slice-impact claim → prompt contains corrected value in labeled section, (4) REFUTED task-impact claim excluded, (5) multiple claims with mixed verdicts/impacts → only qualifying REFUTED claims appear. Use tmp directories with real factcheck artifacts written via `formatAnnotation`/`formatAggregateStatus`.
  - Verify: `node --test src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts` — all pass
  - Done when: ≥5 tests pass covering the cases above

## Files Likely Touched

- `src/resources/extensions/gsd/auto-prompts.ts`
- `src/resources/extensions/gsd/prompts/plan-slice.md`
- `src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts`
