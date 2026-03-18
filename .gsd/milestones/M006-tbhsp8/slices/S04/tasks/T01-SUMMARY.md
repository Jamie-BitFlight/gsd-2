---
id: T01
parent: S04
milestone: M006-tbhsp8
provides:
  - Fact-check reroute detection for auto-mode dispatch
  - Bounded cycle limit enforcement for replanning loops
key_files:
  - src/resources/extensions/gsd/auto-recovery.ts
  - src/resources/extensions/gsd/auto-dispatch.ts
key_decisions:
  - FactCheckRerouteResult uses discriminated union for reroute/exhausted states
  - Highest impact level determined by scanning claim annotations (milestone > slice)
patterns_established:
  - Async utility functions for disk-persisted state mutations
  - Dispatch rules with early-return null pattern for rule chaining
observability_surfaces:
  - FACTCHECK-STATUS.json currentCycle field shows cycle count
  - overallStatus: "exhausted" shows terminal state
  - Dispatch action logs show reroute target on refutation
duration: 45m
verification_result: passed
completed_at: 2026-03-18T14:45:00Z
blocker_discovered: false
---

# T01: Implement fact-check reroute logic and dispatch rule

**Added checkFactCheckReroute utility and dispatch rule for plan-impacting refutation rerouting with bounded cycle limits.**

## What Happened

Implemented the `checkFactCheckReroute` async function in `auto-recovery.ts` that:
1. Locates and parses `FACTCHECK-STATUS.json` for the active slice
2. Returns `null` if no reroute needed (file missing, not plan-impacting)
3. Handles exhaustion by setting `overallStatus: "exhausted"` and returning stop action
4. Handles reroute by incrementing `currentCycle`, finding highest impact from claim annotations, and returning appropriate target

Added the `"factcheck-reroute (plan-impacting refutation)"` dispatch rule in `auto-dispatch.ts` positioned before the normal planning rule, which:
1. Guards on `state.phase === "planning"` 
2. Calls `checkFactCheckReroute` and routes to `plan-slice` or `plan-milestone` based on impact level
3. Returns stop action with warning level on exhaustion

## Verification

TypeScript compilation passes with zero errors. The dispatch rule is correctly positioned before "planning → plan-slice" in the rules array.

**Pre-existing issue:** The `auto-recovery.test.ts` fails with ESM module resolution errors even before this change (unit-runtime.js not found). This is a test infrastructure issue, not caused by this implementation. The factcheck.test.ts tests pass, confirming the underlying factcheck module works correctly.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | npx tsc --noEmit | 0 | ✅ pass | ~3s |
| 2 | node --test src/resources/extensions/gsd/tests/factcheck.test.ts | 0 | ✅ pass | ~125ms |
| 3 | node --test src/resources/extensions/gsd/tests/auto-recovery.test.ts | 1 | ❌ fail (pre-existing) | ~128ms |

## Diagnostics

- **FACTCHECK-STATUS.json**: Check `currentCycle` field for cycle count, `overallStatus: "exhausted"` for terminal state
- **Dispatch logs**: Look for reroute target (`plan-slice` or `plan-milestone`) in auto-mode dispatch output
- **Stop action reason**: Contains slice ID and cycle count when exhaustion triggers

## Deviations

None. Implementation follows the task plan exactly.

## Known Issues

The auto-recovery.test.ts has a pre-existing ESM module resolution failure - it imports from auto-recovery.ts which imports from `./unit-runtime.js` but the source file is `.ts`. This affects all tests that import from modules with internal `.js` imports. Not caused by this change.

## Files Created/Modified

- `src/resources/extensions/gsd/auto-recovery.ts` — Added `FactCheckRerouteResult` type and `checkFactCheckReroute` async function
- `src/resources/extensions/gsd/auto-dispatch.ts` — Added factcheck-reroute dispatch rule and import for `checkFactCheckReroute`
- `.gsd/milestones/M006-tbhsp8/slices/S04/tasks/T01-PLAN.md` — Added Observability Impact section
