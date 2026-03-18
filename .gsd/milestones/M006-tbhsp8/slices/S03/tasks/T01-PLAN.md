---
estimated_steps: 4
estimated_files: 2
---

# T01: Add fact-check ingestion to plan-slice prompt builder and template

**Slice:** S03 — Planner Evidence Ingestion
**Milestone:** M006-tbhsp8

## Description

Wire fact-check artifact reading into `buildPlanSlicePrompt` so that REFUTED plan-impacting claims appear as explicit corrected inputs in the planning prompt. This delivers R068 (planner prompt includes fact-check status) and supports R072 (deterministic planner outputs).

The S01 contract provides all the parsing/path machinery — this task uses it to read artifacts from disk and format them into a clearly labeled prompt section.

## Steps

1. In `auto-prompts.ts`, add a new async helper function `buildFactCheckIngestSection(slicePath: string): Promise<string | null>`:
   - Import `resolveStatusPath`, `resolveClaimPath`, `parseAggregateStatus`, `parseAnnotation` from `./factcheck.js`
   - Import `readFile` from `node:fs/promises` and `existsSync` from `node:fs`
   - Read `FACTCHECK-STATUS.json` via `resolveStatusPath(slicePath)`. If file doesn't exist, return `null`.
   - Parse with `parseAggregateStatus`. If `planImpacting` is false, return `null`.
   - For each `claimId` in the aggregate's `claimIds` array, read the claim annotation via `resolveClaimPath(slicePath, claimId)` and `parseAnnotation`.
   - Filter to only annotations where `verdict === 'refuted'` AND (`impact === 'slice'` OR `impact === 'milestone'`).
   - If no qualifying claims remain, return `null`.
   - Format as a markdown section titled "### Injected Fact-Check Corrections" with each claim showing: claim ID, corrected value, impact level, and citations (if any). Use a structured format like:
     ```
     ### Injected Fact-Check Corrections
     Source: `factcheck/FACTCHECK-STATUS.json`
     
     The following claims from prior research were independently refuted. Use the corrected values as planning inputs — do not rely on the original research claims.
     
     - **Claim `{claimId}`** (impact: {impact}): Corrected value: {correctedValue}. Citations: {citations joined}.
     ```

2. In `buildPlanSlicePrompt`, after the existing inlined content assembly (before the `inlinedContext` join), call `buildFactCheckIngestSection`. The function needs the resolved slice path — use `resolveSlicePath(base, mid, sid)`. If the result is non-null, push it onto the `inlined` array.

3. Update `src/resources/extensions/gsd/prompts/plan-slice.md` template: add a paragraph in the instructions (near step 6 about reading Unknowns Inventory) that says: "If an **Injected Fact-Check Corrections** section is present in the inlined context, treat each corrected value as authoritative — it replaces the corresponding claim from prior research. Reference the corrected values in your plan and note which research findings were superseded."

4. Run `npx tsc --noEmit` to verify no type errors.

## Must-Haves

- [ ] `buildFactCheckIngestSection` exported from `auto-prompts.ts`
- [ ] Returns `null` when no factcheck dir, no status file, or `planImpacting` is false
- [ ] Only includes REFUTED claims with impact `slice` or `milestone`
- [ ] `buildPlanSlicePrompt` calls the helper and includes result in the prompt when non-null
- [ ] `plan-slice.md` instructs the planner to use corrected values as authoritative inputs

## Verification

- `npx tsc --noEmit` passes with no errors
- Manual inspection: the new function uses S01 imports correctly and the template has the new instruction

## Inputs

- `src/resources/extensions/gsd/factcheck.ts` — provides `resolveStatusPath`, `resolveClaimPath`, `parseAggregateStatus`, `parseAnnotation`, `FACTCHECK_ROUTING_RULES`. Path functions take `slicePath` as first argument. Parse functions take JSON string and return typed objects.
- `src/resources/extensions/gsd/types.ts` — provides `FactCheckAnnotation` (fields: claimId, verdict, citations, correctedValue, impact, checkedBy, timestamp) and `FactCheckAggregateStatus` (fields: schemaVersion, cycleKey, overallStatus, planImpacting, counts, maxCycles, currentCycle, claimIds)
- `src/resources/extensions/gsd/auto-prompts.ts` — the existing `buildPlanSlicePrompt` function assembles inlined content into an array and joins it. The new helper should follow the same pattern as `inlineGsdRootFile` (return string or null).
- `src/resources/extensions/gsd/paths.ts` — `resolveSlicePath(base, mid, sid)` returns the absolute path to the slice directory

## Expected Output

- `src/resources/extensions/gsd/auto-prompts.ts` — new `buildFactCheckIngestSection` function + call from `buildPlanSlicePrompt`
- `src/resources/extensions/gsd/prompts/plan-slice.md` — updated with fact-check correction instructions
