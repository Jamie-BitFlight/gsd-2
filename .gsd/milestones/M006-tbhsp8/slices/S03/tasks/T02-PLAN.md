---
estimated_steps: 3
estimated_files: 1
---

# T02: Integration tests for fact-check ingestion

**Slice:** S03 — Planner Evidence Ingestion
**Milestone:** M006-tbhsp8

## Description

Create integration tests that verify `buildFactCheckIngestSection` correctly reads factcheck artifacts from disk and produces the expected prompt section. Tests use real temp directories with actual JSON files written via S01's serialization functions.

## Steps

1. Create `src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts` using `node:test` and `node:assert`. Import `buildFactCheckIngestSection` from `../auto-prompts.js`. Import `formatAnnotation`, `formatAggregateStatus`, `resolveFactcheckDir`, `resolveClaimPath`, `resolveStatusPath` from `../factcheck.js`. Import `mkdtempSync`, `mkdirSync`, `writeFileSync`, `rmSync` from `node:fs`. Import `join` from `node:path`. Import `tmpdir` from `node:os`.

2. Write test cases using `describe`/`it` pattern:
   - **"returns null when no factcheck directory exists"** — create a tmp dir, call `buildFactCheckIngestSection(tmpDir)`, assert result is `null`.
   - **"returns null when planImpacting is false"** — create factcheck dir and write a FACTCHECK-STATUS.json with `planImpacting: false` (use `formatAggregateStatus` with a `buildAggregateStatus` from a single `verified` annotation). Call helper, assert `null`.
   - **"includes REFUTED slice-impact claim"** — write a REFUTED annotation with `impact: 'slice'` and a `correctedValue`, write aggregate status with `planImpacting: true`. Call helper, assert result contains the `correctedValue` string and claim ID.
   - **"excludes REFUTED task-impact claim"** — write a REFUTED annotation with `impact: 'task'`, write aggregate with `planImpacting: true` (must also have a slice/milestone claim to be planImpacting). Call helper, assert the task-impact claim's correctedValue does NOT appear.
   - **"handles multiple claims with mixed verdicts"** — write 3 annotations: one REFUTED/slice, one VERIFIED/slice, one REFUTED/milestone. Write matching aggregate. Assert only the two REFUTED slice/milestone claims appear.
   - **"includes section header and instructions"** — with valid artifacts, assert result includes "Injected Fact-Check Corrections" heading and "corrected values as planning inputs" instruction text.

3. Run `node --test src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts` and verify all pass.

## Must-Haves

- [ ] ≥5 test cases covering: no artifacts, planImpacting false, qualifying REFUTED claim included, task-impact excluded, mixed verdicts filtered
- [ ] Tests use real filesystem (tmp dirs) and S01 serialization functions
- [ ] All tests pass

## Verification

- `node --test src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts` — all pass
- `npx tsc --noEmit` — no type errors

## Inputs

- `src/resources/extensions/gsd/auto-prompts.ts` — the `buildFactCheckIngestSection` function from T01
- `src/resources/extensions/gsd/factcheck.ts` — `formatAnnotation`, `formatAggregateStatus`, `buildAggregateStatus`, path resolution functions
- `src/resources/extensions/gsd/types.ts` — `FactCheckAnnotation`, `FactCheckAggregateStatus` types
- T01 summary — confirms the function signature and behavior

## Expected Output

- `src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts` — ≥5 passing integration tests
