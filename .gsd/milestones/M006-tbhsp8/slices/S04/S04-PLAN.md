# S04: Bounded Planner Revision Loop

**Goal:** A slice- or milestone-impacting REFUTED claim causes auto-mode to rerun the correct planning unit with corrected evidence, capped at a configured cycle limit with explicit blocker behavior on exhaustion.
**Demo:** Given a `FACTCHECK-STATUS.json` with `planImpacting: true` and `overallStatus: "has-refutations"`, auto-mode dispatches `plan-slice` (or `plan-milestone` for milestone-impact claims) instead of proceeding to execution. If `currentCycle >= maxCycles`, auto-mode stops with an explicit blocker message instead of looping.

## Must-Haves

- `checkFactCheckReroute` utility in `auto-recovery.ts` that reads `FACTCHECK-STATUS.json`, evaluates `planImpacting` + cycle bounds, increments `currentCycle`, writes updated status, and returns a reroute or exhaustion action.
- A dispatch rule in `auto-dispatch.ts` that fires before the normal `planning → plan-slice` rule when fact-check reroute conditions are met, routing to `plan-slice` or `plan-milestone` per `FACTCHECK_ROUTING_RULES`.
- Exhaustion behavior: when `currentCycle >= maxCycles`, dispatch stops with a clear blocker message naming the exhausted claims.
- Integration tests proving: (a) `planImpacting: true` triggers reroute to correct planning unit, (b) cycle counter increments, (c) exhaustion stops auto-mode, (d) `planImpacting: false` passes through normally.

## Proof Level

- This slice proves: integration
- Real runtime required: no (dispatch logic is pure functions + filesystem)
- Human/UAT required: no

## Verification

- `npx tsc --noEmit` — zero type errors
- `node --test src/resources/extensions/gsd/tests/auto-recovery-loop.test.ts` — all tests pass
- Existing tests still pass: `node --test src/resources/extensions/gsd/tests/auto-recovery.test.ts src/resources/extensions/gsd/tests/factcheck.test.ts src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts`

## Observability / Diagnostics

- Runtime signals: `ctx.ui.notify` message when rerouting ("Fact-check reroute: replanning {sliceId} — cycle {N}/{max}") and when exhausted ("Fact-check exhausted: {N} cycles for {sliceId} — pausing auto-mode")
- Inspection surfaces: `FACTCHECK-STATUS.json` `currentCycle` field shows cycle count; `overallStatus: "exhausted"` shows terminal state
- Failure visibility: exhaustion produces a `stop` dispatch action with explicit reason naming the claims and cycle count

## Integration Closure

- Upstream surfaces consumed: `factcheck.ts` (`parseAggregateStatus`, `formatAggregateStatus`, `FACTCHECK_ROUTING_RULES`, `resolveStatusPath`), `auto-prompts.ts` (`buildPlanSlicePrompt`, `buildPlanMilestonePrompt`), `auto-dispatch.ts` (dispatch rule system)
- New wiring introduced in this slice: dispatch rule in `auto-dispatch.ts` that checks fact-check reroute before normal planning dispatch
- What remains before the milestone is truly usable end-to-end: S05 completion reporting

## Tasks

- [x] **T01: Implement fact-check reroute logic and dispatch rule** `est:1h`
  - Why: This is the core of S04 — the runtime needs to detect plan-impacting refutations, increment cycle state, and either reroute to the correct planning unit or halt on exhaustion. Without this, refuted claims are advisory only.
  - Files: `src/resources/extensions/gsd/auto-recovery.ts`, `src/resources/extensions/gsd/auto-dispatch.ts`
  - Do: (1) Add `checkFactCheckReroute(basePath, mid, sid)` to `auto-recovery.ts` that reads `FACTCHECK-STATUS.json` via `resolveStatusPath`/`parseAggregateStatus`, checks `planImpacting` and cycle bounds, returns `{action: 'reroute', target: 'plan-slice'|'plan-milestone', cycle, maxCycles}` or `{action: 'exhausted', reason}` or `null` (no reroute needed). When rerouting, increment `currentCycle` and rewrite the status file. When exhausted, set `overallStatus` to `"exhausted"` and rewrite. (2) Add a dispatch rule in `auto-dispatch.ts` named `"factcheck-reroute (plan-impacting refutation)"` inserted before the `"planning → plan-slice"` rule. The rule calls `checkFactCheckReroute`; on reroute it dispatches `plan-slice` or `plan-milestone`; on exhaustion it returns a `stop` action. Use `FACTCHECK_ROUTING_RULES` from `factcheck.ts` to determine the target. The reroute dispatch should use the existing `buildPlanSlicePrompt`/`buildPlanMilestonePrompt` builders — S03 already injects fact-check corrections into those prompts.
  - Verify: `npx tsc --noEmit` passes
  - Done when: `checkFactCheckReroute` exported from `auto-recovery.ts`, dispatch rule added, TypeScript compiles cleanly

- [x] **T02: Add integration tests for fact-check reroute and exhaustion** `est:45m`
  - Why: R069 and R070 require proven behavior, not just code. Tests verify the reroute triggers correctly, cycles increment, exhaustion stops dispatch, and non-impacting statuses pass through.
  - Files: `src/resources/extensions/gsd/tests/auto-recovery-loop.test.ts`
  - Do: Create test file using `node:test` + `node:assert`. Tests should: (1) Write a `FACTCHECK-STATUS.json` with `planImpacting: true`, `overallStatus: "has-refutations"`, `currentCycle: 1`, `maxCycles: 2` to a temp dir, call `checkFactCheckReroute`, assert it returns reroute action and incremented cycle is written to disk. (2) Write status with `currentCycle: 2`, `maxCycles: 2`, assert exhaustion action returned and `overallStatus` rewritten to `"exhausted"`. (3) Write status with `planImpacting: false`, assert null returned (no reroute). (4) Test with no `FACTCHECK-STATUS.json` file, assert null. (5) Test reroute target resolution: slice-impact → `plan-slice`, milestone-impact → `plan-milestone` (requires reading claim annotations to determine highest impact). (6) Verify existing test suites still pass.
  - Verify: `node --test src/resources/extensions/gsd/tests/auto-recovery-loop.test.ts` — all tests pass; `npx tsc --noEmit` passes
  - Done when: ≥8 test cases pass covering reroute, exhaustion, passthrough, and target resolution

## Files Likely Touched

- `src/resources/extensions/gsd/auto-recovery.ts`
- `src/resources/extensions/gsd/auto-dispatch.ts`
- `src/resources/extensions/gsd/tests/auto-recovery-loop.test.ts`
