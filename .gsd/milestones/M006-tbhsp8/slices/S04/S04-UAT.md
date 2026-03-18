# S04: Bounded Planner Revision Loop — UAT

**Milestone:** M006-tbhsp8
**Written:** 2026-03-18

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: The reroute logic is pure functions + filesystem operations. The contract is deterministic — inputs produce specific outputs. 11 integration tests already prove the behavior. Manual verification would re-verify what tests already confirm.

## Preconditions

- TypeScript compiles cleanly: `npx tsc --noEmit` passes
- Test infrastructure works: node with TypeScript loader available

## Smoke Test

Run the integration tests and confirm all pass:

```bash
node --test --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types src/resources/extensions/gsd/tests/auto-recovery-loop.test.ts
```

Expected: 11/11 tests pass

## Test Cases

### 1. Returns null when no factcheck directory exists

1. Ensure no `.gsd/milestones/{mid}/slices/{sid}/factcheck/` directory exists
2. Call `checkFactCheckReroute(basePath, mid, sid)`
3. **Expected:** `null` returned

### 2. Returns null when no status file exists

1. Create factcheck directory but no `FACTCHECK-STATUS.json`
2. Call `checkFactCheckReroute(basePath, mid, sid)`
3. **Expected:** `null` returned

### 3. Returns null when planImpacting is false

1. Create `FACTCHECK-STATUS.json` with `planImpacting: false`, `overallStatus: "has-refutations"`
2. Call `checkFactCheckReroute(basePath, mid, sid)`
3. **Expected:** `null` returned (no reroute needed)

### 4. Reroutes to plan-slice for slice-impact claim

1. Create `FACTCHECK-STATUS.json` with `planImpacting: true`, `overallStatus: "has-refutations"`, `currentCycle: 0`, `maxCycles: 2`
2. Add a claim annotation with `impact: "slice"`
3. Call `checkFactCheckReroute(basePath, mid, sid)`
4. **Expected:** `{action: 'reroute', target: 'plan-slice', cycle: 1, maxCycles: 2}` returned
5. **Verify:** `currentCycle` in status file incremented to 1

### 5. Reroutes to plan-milestone for milestone-impact claim

1. Create `FACTCHECK-STATUS.json` with `planImpacting: true`, `overallStatus: "has-refutations"`, `currentCycle: 1`, `maxCycles: 2`
2. Add a claim annotation with `impact: "milestone"`
3. Call `checkFactCheckReroute(basePath, mid, sid)`
4. **Expected:** `{action: 'reroute', target: 'plan-milestone', cycle: 2, maxCycles: 2}` returned

### 6. Returns exhausted when at cycle limit

1. Create `FACTCHECK-STATUS.json` with `planImpacting: true`, `currentCycle: 2`, `maxCycles: 2`
2. Call `checkFactCheckReroute(basePath, mid, sid)`
3. **Expected:** `{action: 'exhausted', reason: "Fact-check exhausted: 2 cycles for {sid}"}` returned
4. **Verify:** `overallStatus` in status file set to `"exhausted"`

### 7. Returns exhausted when over cycle limit

1. Create `FACTCHECK-STATUS.json` with `planImpacting: true`, `currentCycle: 5`, `maxCycles: 2`
2. Call `checkFactCheckReroute(basePath, mid, sid)`
3. **Expected:** `{action: 'exhausted', reason: ...}` returned

### 8. Milestone impact wins over slice impact

1. Create status with `planImpacting: true`
2. Add two claim annotations: one with `impact: "slice"`, one with `impact: "milestone"`
3. Call `checkFactCheckReroute(basePath, mid, sid)`
4. **Expected:** `{action: 'reroute', target: 'plan-milestone', ...}` — milestone wins

### 9. Dispatch rule intercepts planning phase

1. Set up auto-mode with fact-check status showing `planImpacting: true`
2. Trigger auto-dispatch in planning phase
3. **Expected:** Dispatch rule evaluates and routes to `plan-slice` or `plan-milestone` before normal planning rule

## Edge Cases

### Missing claim annotation files

- When status says `has-refutations` but claim files are missing, should still attempt reroute based on available data

### Unparseable claim annotation files

- Should handle gracefully and skip unparseable files

### Confirmed claims ignored

- Claims with `verdict: "CONFIRMED"` should not influence target determination

## Failure Signals

- TypeScript compilation errors → implementation broken
- Test failures → contract violated
- Status file not updated after reroute → state not persisted
- Wrong target (plan-slice vs plan-milestone) → impact resolution broken

## Not Proven By This UAT

- Live runtime dispatch (not just unit tests) — would require full auto-mode invocation with real fact-check data
- End-to-end from research trigger → coordinator → dispatch → planner reinvocation — S02+S03+S04 integration is proven via contracts but not exercised together
- UI notifications via `ctx.ui.notify` — not verified in these tests

## Notes for Tester

- Tests use temp directories that are cleaned up after each test
- The dispatch rule is positioned BEFORE the normal planning rule, so it intercepts first
- Cycle counter starts at 0 in status file, increments on each reroute
- Max cycles is configurable per-slice via `maxCycles` in status file
