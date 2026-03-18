# S06: Milestone Planner Fact-Check Ingestion

**Goal:** `buildPlanMilestonePrompt` consumes aggregate fact-check status and milestone-impact REFUTED claim annotations so milestone-level reroutes are reinvoked with corrected evidence.
**Demo:** When a milestone contains slices with milestone-impact REFUTED claims, `buildPlanMilestonePrompt` output includes an "Injected Fact-Check Corrections" section with those claims. The `plan-milestone.md` template instructs the planner to treat corrected values as authoritative. Integration tests prove the end-to-end correction loop for both reroute targets (plan-slice already proven in S03, plan-milestone proven here).

## Must-Haves

- `buildMilestoneFactCheckIngestSection` scans all slices under a milestone for REFUTED claims with `milestone` impact and formats them into a labeled markdown section
- `buildPlanMilestonePrompt` injects the section when non-null
- `plan-milestone.md` template includes a step for treating corrected fact-check values as authoritative
- Integration tests covering: no factcheck data → null, slice-only impact → excluded, milestone-impact REFUTED → included, multiple slices aggregated, full prompt integration

## Proof Level

- This slice proves: integration (prompt assembly + reroute target coverage for both plan-slice and plan-milestone)
- Real runtime required: no (prompt-builder contract tests are sufficient)
- Human/UAT required: no

## Verification

- `npx tsc --noEmit` — zero type errors
- `node --test src/resources/extensions/gsd/tests/factcheck-milestone-ingestion.test.ts` — all tests pass
- Tests cover R069 (milestone-impacting REFUTED triggers reroute with corrected evidence) and R070 (reroute target resolves to plan-milestone)

## Observability / Diagnostics

- **Runtime signals:** `buildMilestoneFactCheckIngestSection` returns a markdown section string when milestone-impact REFUTED claims exist, or null otherwise. Callers can log the return value for debugging.
- **Inspection surfaces:** The milestone-level fact-check section appears in `buildPlanMilestonePrompt` output under the heading "### Injected Fact-Check Corrections (Milestone-Level)". Each claim includes source slice attribution.
- **Failure visibility:** If a claim file is missing or unparseable, the helper skips it silently (graceful degradation). Invalid `FACTCHECK-STATUS.json` logs a warning to stderr via the parseAggregateStatus error path.
- **Redaction constraints:** No secrets or sensitive data in fact-check artifacts. Citations may contain URLs but no credentials.

## Integration Closure

- Upstream surfaces consumed: `buildFactCheckIngestSection` pattern from S03 (`auto-prompts.ts`), `resolveStatusPath`/`parseAggregateStatus`/`resolveClaimPath`/`parseAnnotation` from `factcheck.ts`, `resolveMilestonePath` from `paths.ts`, `checkFactCheckReroute` dispatch rule from S04 (`auto-dispatch.ts`)
- New wiring introduced in this slice: milestone-level fact-check section injected into `buildPlanMilestonePrompt`, `plan-milestone.md` template updated
- What remains before the milestone is truly usable end-to-end: nothing — this is the final slice

## Tasks

- [x] **T01: Wire milestone-level fact-check ingestion into buildPlanMilestonePrompt** `est:45m`
  - Why: `buildPlanMilestonePrompt` currently has no fact-check ingestion. S03 only wired `buildPlanSlicePrompt`. This task adds the milestone-level equivalent so milestone reroutes get corrected evidence.
  - Files: `src/resources/extensions/gsd/auto-prompts.ts`, `src/resources/extensions/gsd/prompts/plan-milestone.md`
  - Do: (1) Add `buildMilestoneFactCheckIngestSection(milestonePath: string)` that lists slice subdirectories under the milestone, calls `buildFactCheckIngestSection` for each, filters to milestone-impact claims only, and returns a combined markdown section or null. (2) Call it from `buildPlanMilestonePrompt` and inject into the `inlined` array when non-null. (3) Add Step 7 to `plan-milestone.md` matching the pattern from `plan-slice.md`.
  - Verify: `npx tsc --noEmit` passes
  - Done when: TypeScript compiles clean with the new helper wired in

- [x] **T02: Add integration tests proving milestone-level fact-check ingestion and end-to-end reroute coverage** `est:30m`
  - Why: Proves R069 and R070 for the milestone reroute target. S03 tests only cover plan-slice ingestion. This task proves the milestone path works.
  - Files: `src/resources/extensions/gsd/tests/factcheck-milestone-ingestion.test.ts`
  - Do: Create test file using `node:test` pattern (matching `factcheck-ingestion.test.ts`). Test cases: (1) null when no slices have factcheck dirs, (2) null when only task-impact REFUTED claims exist, (3) includes milestone-impact REFUTED claims, (4) excludes slice-impact claims from milestone section, (5) aggregates across multiple slices, (6) null when claims are VERIFIED not REFUTED, (7) full `buildPlanMilestonePrompt` integration showing section appears in output. Use temp directories with proper GSD directory structure as fixtures.
  - Verify: `node --test src/resources/extensions/gsd/tests/factcheck-milestone-ingestion.test.ts` — all pass
  - Done when: All tests pass and `npx tsc --noEmit` is clean

## Files Likely Touched

- `src/resources/extensions/gsd/auto-prompts.ts`
- `src/resources/extensions/gsd/prompts/plan-milestone.md`
- `src/resources/extensions/gsd/tests/factcheck-milestone-ingestion.test.ts`
