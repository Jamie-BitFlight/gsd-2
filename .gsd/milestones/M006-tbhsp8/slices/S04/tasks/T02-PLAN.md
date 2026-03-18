---
estimated_steps: 3
estimated_files: 1
---

# T02: Add integration tests for fact-check reroute and exhaustion

**Slice:** S04 — Bounded Planner Revision Loop
**Milestone:** M006-tbhsp8

## Description

Create `auto-recovery-loop.test.ts` with integration tests that prove `checkFactCheckReroute` correctly reroutes on plan-impacting refutations, increments cycles, halts on exhaustion, and passes through when no reroute is needed. Uses `node:test` and `node:assert` following the project's test patterns (see `factcheck-coordinator.test.ts` and `factcheck-ingestion.test.ts` for examples). Tests operate on temp directories with fixture `FACTCHECK-STATUS.json` and claim annotation files.

## Steps

1. Create `src/resources/extensions/gsd/tests/auto-recovery-loop.test.ts`. Import `checkFactCheckReroute` from `../auto-recovery.js`, and `formatAggregateStatus`, `formatAnnotation` from `../factcheck.js`. Import `mkdtempSync`, `mkdirSync`, `writeFileSync`, `readFileSync` from `node:fs`, `join` from `node:path`, `tmpdir` from `node:os`.

2. Write test cases using `describe`/`it` from `node:test`:
   - **No factcheck directory**: returns null
   - **No status file**: returns null  
   - **planImpacting false**: write status with `planImpacting: false`, assert null
   - **planImpacting true, under cycle limit, slice-impact claim**: write status with `planImpacting: true`, `currentCycle: 1`, `maxCycles: 2`, plus a REFUTED claim annotation with impact `"slice"`. Assert reroute action with target `"plan-slice"`. Read back status file, assert `currentCycle` incremented to 2.
   - **planImpacting true, under cycle limit, milestone-impact claim**: same but with impact `"milestone"`. Assert target `"plan-milestone"`.
   - **planImpacting true, at cycle limit**: write status with `currentCycle: 2`, `maxCycles: 2`. Assert exhausted action returned. Read back status, assert `overallStatus` is `"exhausted"`.
   - **planImpacting true, over cycle limit**: `currentCycle: 3`, `maxCycles: 2`. Assert exhausted.
   - **Mixed impacts (slice + milestone)**: write two claims, one slice-impact and one milestone-impact. Assert the highest impact wins (milestone → `plan-milestone`).

3. Run all tests and verify: `node --test src/resources/extensions/gsd/tests/auto-recovery-loop.test.ts` passes, `npx tsc --noEmit` passes, and existing test suites are unaffected.

## Must-Haves

- [ ] ≥8 test cases covering reroute, exhaustion, passthrough, and target resolution
- [ ] Tests use temp directories (no pollution of working tree)
- [ ] Cycle increment is verified by reading the persisted status file back from disk
- [ ] Exhaustion status rewrite is verified by reading persisted file
- [ ] All tests pass with `node --test`
- [ ] `npx tsc --noEmit` passes

## Verification

- `node --test src/resources/extensions/gsd/tests/auto-recovery-loop.test.ts` — all tests pass
- `npx tsc --noEmit` — zero errors
- `node --test src/resources/extensions/gsd/tests/factcheck.test.ts src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts` — existing tests still pass

## Inputs

- `src/resources/extensions/gsd/auto-recovery.ts` — T01's `checkFactCheckReroute` function
- `src/resources/extensions/gsd/factcheck.ts` — `formatAggregateStatus`, `formatAnnotation`, `resolveStatusPath`, `resolveClaimPath` for writing test fixtures
- `src/resources/extensions/gsd/types.ts` — `FactCheckAggregateStatus`, `FactCheckAnnotation` types for fixture construction
- `src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts` — reference for test patterns (temp dirs, fixture writing)

## Expected Output

- `src/resources/extensions/gsd/tests/auto-recovery-loop.test.ts` — new test file with ≥8 passing tests
