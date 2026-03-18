---
estimated_steps: 4
estimated_files: 2
---

# T01: Implement fact-check reroute logic and dispatch rule

**Slice:** S04 — Bounded Planner Revision Loop
**Milestone:** M006-tbhsp8

## Description

Add the `checkFactCheckReroute` utility function to `auto-recovery.ts` and a corresponding dispatch rule to `auto-dispatch.ts`. This wires the runtime to detect plan-impacting refutations from the fact-check coordinator (S02) and reroute auto-mode to re-plan the affected slice or milestone before execution proceeds, respecting a bounded cycle limit.

## Steps

1. In `auto-recovery.ts`, add an exported async function `checkFactCheckReroute(basePath: string, mid: string, sid: string)` that:
   - Uses `resolveStatusPath` from `factcheck.ts` to locate `FACTCHECK-STATUS.json` under the slice's factcheck directory
   - Returns `null` if the file doesn't exist
   - Parses it with `parseAggregateStatus`
   - Returns `null` if `planImpacting` is false
   - If `currentCycle >= maxCycles`: sets `overallStatus` to `"exhausted"`, rewrites the file via `formatAggregateStatus`, returns `{ action: 'exhausted' as const, reason: string }` with a message naming the cycle count
   - Otherwise: increments `currentCycle`, rewrites the status file, determines the reroute target by reading claim annotations to find the highest impact level (milestone > slice), maps via `FACTCHECK_ROUTING_RULES`, returns `{ action: 'reroute' as const, target: 'plan-slice' | 'plan-milestone', cycle: number, maxCycles: number }`

2. In `auto-dispatch.ts`, add a new dispatch rule named `"factcheck-reroute (plan-impacting refutation)"` inserted into the `DISPATCH_RULES` array immediately before the `"planning → plan-slice"` rule:
   - Only matches when `state.phase === "planning"` (same guard as plan-slice)
   - Calls `checkFactCheckReroute(basePath, mid, state.activeSlice!.id)`
   - On `null` result: returns `null` (fall through to normal planning rules)
   - On `reroute`: dispatches the appropriate unit type (`plan-slice` or `plan-milestone`) using the existing prompt builders (`buildPlanSlicePrompt` / `buildPlanMilestonePrompt`)
   - On `exhausted`: returns `{ action: 'stop', reason: result.reason, level: 'warning' }`

3. Add necessary imports to both files: `resolveStatusPath`, `parseAggregateStatus`, `formatAggregateStatus`, `FACTCHECK_ROUTING_RULES`, `resolveClaimPath`, `parseAnnotation` from `factcheck.ts`, and filesystem functions as needed.

4. Run `npx tsc --noEmit` to verify compilation.

## Must-Haves

- [ ] `checkFactCheckReroute` is exported from `auto-recovery.ts`
- [ ] Reroute increments `currentCycle` and persists updated status to disk
- [ ] Exhaustion sets `overallStatus` to `"exhausted"` and persists
- [ ] Dispatch rule is positioned before `"planning → plan-slice"` in the rules array
- [ ] `FACTCHECK_ROUTING_RULES` determines target (plan-slice vs plan-milestone)
- [ ] `npx tsc --noEmit` passes with zero errors

## Verification

- `npx tsc --noEmit` exits 0
- Existing tests still pass: `node --test src/resources/extensions/gsd/tests/auto-recovery.test.ts`

## Inputs

- `src/resources/extensions/gsd/factcheck.ts` — provides `resolveStatusPath`, `parseAggregateStatus`, `formatAggregateStatus`, `FACTCHECK_ROUTING_RULES`, `resolveClaimPath`, `parseAnnotation`
- `src/resources/extensions/gsd/types.ts` — `FactCheckAggregateStatus`, `FactCheckAnnotation`, `FactCheckImpact`
- `src/resources/extensions/gsd/auto-dispatch.ts` — dispatch rule system with `DISPATCH_RULES` array and `DispatchAction` type
- `src/resources/extensions/gsd/auto-prompts.ts` — `buildPlanSlicePrompt`, `buildPlanMilestonePrompt` prompt builders

## Expected Output

- `src/resources/extensions/gsd/auto-recovery.ts` — new `checkFactCheckReroute` function exported
- `src/resources/extensions/gsd/auto-dispatch.ts` — new dispatch rule added before planning rules

## Observability Impact

**Signals changed:**
- `ctx.ui.notify` messages for reroute events: "Fact-check reroute: replanning {sliceId} — cycle {N}/{max}" and exhaustion events: "Fact-check exhausted: {N} cycles for {sliceId} — pausing auto-mode"
- `FACTCHECK-STATUS.json` now reflects `currentCycle` increments on each reroute, and `overallStatus: "exhausted"` when the cycle limit is hit

**Inspection surfaces:**
- `FACTCHECK-STATUS.json` in the slice's factcheck directory shows the current cycle count (`currentCycle` field) and terminal state (`overallStatus: "exhausted"`)
- Dispatch action logs will show the reroute target (`plan-slice` or `plan-milestone`) when a refutation triggers replanning

**Failure visibility:**
- Exhaustion produces a `stop` dispatch action with an explicit reason string naming the affected slice and cycle count, visible in auto-mode logs
- The `resolveDispatch` function returns `{ action: 'stop', reason: string, level: 'warning' }` with the exhaustion message
