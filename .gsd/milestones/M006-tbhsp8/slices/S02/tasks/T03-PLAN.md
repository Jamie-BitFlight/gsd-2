---
estimated_steps: 3
estimated_files: 1
---

# T03: Implement Artifact Writing in Coordinator Agent

**Slice:** S02 — Coordinator and Scout Execution
**Milestone:** M006-tbhsp8

## Description

Ensure the coordinator agent instructions correctly specify how to write artifacts using the S01 contract. This includes using the correct path functions, JSON formats, and aggregate status building logic. The agent writes files via the `write` tool.

## Steps

1. Verify S01 exports are available:
   - `resolveFactcheckDir(slicePath)` → returns `{slicePath}/factcheck`
   - `resolveClaimPath(slicePath, claimId)` → returns `{slicePath}/factcheck/claims/{claimId}.json`
   - `resolveStatusPath(slicePath)` → returns `{slicePath}/factcheck/FACTCHECK-STATUS.json`
   - `formatAnnotation(annotation)` → returns JSON string
   `parseAnnotation(json)` → returns FactCheckAnnotation
   - `formatAggregateStatus(status)` → returns JSON string
   - `buildAggregateStatus(annotations, opts)` → returns FactCheckAggregateStatus

2. Write agent instructions for annotation files:
   - For each verified claim, create a FactCheckAnnotation object with:
     - claimId (from extraction or generated)
     - verdict (confirmed/refuted/inconclusive/unverified)
     - citations (URLs or references from scout)
     - correctedValue (if refuted and value was corrected)
     - impact (none/task/slice/milestone — assessed by scout or coordinator)
     - checkedBy (agent name, e.g., "gsd-factcheck-coordinator")
     - timestamp (ISO 8601)
   - Write to path from `resolveClaimPath(slicePath, claimId)`
   - Use `formatAnnotation()` for JSON formatting

3. Write agent instructions for aggregate status:
   - Collect all annotation objects into an array
   - Call `buildAggregateStatus(annotations, { milestoneId, sliceId, currentCycle, maxCycles })`
   - Write result to path from `resolveStatusPath(slicePath)`
   - Use `formatAggregateStatus()` for JSON formatting
   - Default maxCycles: 5, currentCycle: 1 (for first pass)

## Must-Haves

- [ ] Agent instructions specify exact file paths using S01 path functions
- [ ] Agent instructions specify FactCheckAnnotation schema fields in order
- [ ] Agent instructions specify FactCheckAggregateStatus schema and buildAggregateStatus usage
- [ ] Impact assessment guidance (how to determine none/task/slice/milestone)
- [ ] Cycle counter initialization (maxCycles=5, currentCycle=1)

## Verification

- Manual trace: Read agent instructions and verify each S01 function is correctly referenced
- Compile-time check: TypeScript would catch wrong function names if agent tried to import them
- Review: Check that JSON output format matches S01 test expectations

## Inputs

- `src/resources/extensions/gsd/factcheck.ts` — S01 path and serialization functions
- `src/resources/extensions/gsd/types.ts` — FactCheckAnnotation and FactCheckAggregateStatus types
- `src/resources/extensions/gsd/tests/factcheck.test.ts` — Expected JSON format examples
- T01-PLAN.md — Agent definition structure

## Expected Output

- `src/resources/agents/gsd-factcheck-coordinator.md` — Updated agent instructions with correct S01 references

## Observability Impact

**Signals changed:**
- Agent logs claim extraction count, verification dispatch, and artifact write paths during execution
- Each annotation write echoes the file path
- Aggregate status write logs overall status, plan-impacting flag, and verdict counts

**How a future agent inspects this task:**
- Read `FACTCHECK-STATUS.json` for aggregate state (overallStatus, planImpacting, counts)
- Read individual claim files in `factcheck/claims/{claimId}.json`
- Directory structure visible on disk under `{slicePath}/factcheck/`

**Failure state visibility:**
- If coordinator crashes mid-execution: partial annotations may exist without aggregate status file
- If aggregate exists but shows `overallStatus: pending`, verification cycle did not complete
- Empty `claimIds` array in aggregate indicates no claims were extracted
