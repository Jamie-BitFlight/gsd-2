---
id: S04
parent: M006-tbhsp8
milestone: M006-tbhsp8
provides:
  - Runtime reroute path from fact-check status to plan-slice/plan-milestone
  - Bounded cycle counter with exhaustion/blocker behavior
  - Observable planner reinvocation records tied to fact-check outcomes
requires:
  - slice: S02
    provides: Coordinator and scout execution with durable annotations and aggregate status
  - slice: S03
    provides: Planner evidence ingestion with fact-check outputs in planning prompts
affects:
  - slice: S05
key_files:
  - src/resources/extensions/gsd/auto-recovery.ts
  - src/resources/extensions/gsd/auto-dispatch.ts
  - src/resources/extensions/gsd/tests/auto-recovery-loop.test.ts
key_decisions:
  - FactCheckRerouteResult uses discriminated union for reroute/exhausted states
  - Highest impact level determined by scanning claim annotations (milestone > slice)
  - Dispatch rule positioned before normal planning rule to intercept first
patterns_established:
  - Async utility functions for disk-persisted state mutations
  - Dispatch rules with early-return null pattern for rule chaining
  - Test fixtures using temp directories with proper GSD directory structure
observability_surfaces:
  - FACTCHECK-STATUS.json currentCycle field shows cycle count
  - overallStatus: "exhausted" shows terminal state
  - Dispatch action logs show reroute target on refutation
  - Stop action reason contains slice ID and cycle count
drill_down_paths:
  - .gsd/milestones/M006-tbhsp8/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M006-tbhsp8/slices/S04/tasks/T02-SUMMARY.md
duration: 75m
verification_result: passed
completed_at: 2026-03-18T10:45:00-04:00
---

# S04: Bounded Planner Revision Loop

**Runtime detects plan-impacting refutations, reroutes to the correct planning unit with corrected evidence, and halts with explicit blocker after configured cycle limit.**

## What Happened

Implemented the bounded planner revision loop that closes the fact-check correction cycle:

**T01 - Core Implementation:**
- Added `FactCheckRerouteResult` discriminated union type in `auto-recovery.ts` with three states: `{action: 'reroute', target: 'plan-slice'|'plan-milestone', cycle, maxCycles}`, `{action: 'exhausted', reason}`, and `null`
- Implemented `checkFactCheckReroute(basePath, mid, sid)` async function that:
  - Locates `FACTCHECK-STATUS.json` via `resolveStatusPath` and parses with `parseAggregateStatus`
  - Returns `null` if no status file, file missing, or `planImpacting: false`
  - On exhaustion (`currentCycle >= maxCycles`): sets `overallStatus: "exhausted"`, writes to disk, returns stop action
  - On reroute needed: increments `currentCycle`, scans claim annotations to find highest impact (milestone > slice), returns appropriate target
- Added dispatch rule `"factcheck-reroute (plan-impacting refutation)"` in `auto-dispatch.ts` positioned before the normal "planning → plan-slice" rule
- The dispatch rule guards on `state.phase === "planning"`, calls `checkFactCheckReroute`, and routes to `plan-slice` or `plan-milestone` based on impact level

**T02 - Integration Tests:**
- Created `auto-recovery-loop.test.ts` with 11 test cases covering:
  - Null returns: no factcheck directory, no status file, `planImpacting: false`
  - Reroute: slice-impact → `plan-slice`, milestone-impact → `plan-milestone`
  - Exhaustion: at cycle limit, over cycle limit
  - Edge cases: mixed impact (milestone wins), missing claim files, unparseable claim files
- All tests verify both return value AND persisted state on disk (cycle increment, exhaustion status)

## Verification

| Command | Exit Code | Verdict |
|---------|-----------|---------|
| npx tsc --noEmit | 0 | ✅ pass |
| auto-recovery-loop.test.ts | 11/11 | ✅ pass |
| factcheck*.test.ts + auto-recovery.test.ts | 73/73 | ✅ pass |

## Requirements Covered

- **R069** (active → validated): REFUTED claims marked as slice- or milestone-impacting trigger planner reinvocation with corrected evidence before execution proceeds, bounded by a configured cycle limit — proven via 11 integration tests
- **R070** (active → validated): Revision routing is explicit: pre-execution fact-check corrections rerun `plan-slice` or `plan-milestone` by impact scope — proven via reroute target resolution tests

## New Requirements Validated

- R069: Proven by integration tests showing reroute dispatch and cycle bounding
- R070: Proven by tests showing target resolution based on impact level

## Deviations

None. Implementation follows the task plan exactly.

## Known Limitations

None remaining after this slice.

## Follow-ups

S05 (Completion Reporting) needs to consume the cycle and exhaustion data from `FACTCHECK-STATUS.json` to report in completion summaries.

## Files Created/Modified

- `src/resources/extensions/gsd/auto-recovery.ts` — Added `FactCheckRerouteResult` type and `checkFactCheckReroute` function
- `src/resources/extensions/gsd/auto-dispatch.ts` — Added factcheck-reroute dispatch rule
- `src/resources/extensions/gsd/tests/auto-recovery-loop.test.ts` — New test file with 11 integration tests

## Forward Intelligence

### What the next slice should know
- The bounded revision loop is complete — S05 only needs to surface the cycle/revision data in completion summaries
- The dispatch rule already handles routing; S05 completion reporting reads from the same `FACTCHECK-STATUS.json` that S04 writes

### What's fragile
- None. The implementation is straightforward disk I/O with deterministic state transitions.

### Authoritative diagnostics
- `FACTCHECK-STATUS.json` — Check `currentCycle` for cycle count, `overallStatus: "exhausted"` for terminal state
- Dispatch logs — Look for reroute target in auto-mode output

### What assumptions changed
- None significant. The original plan assumed the dispatcher would need complex logic, but the rule-based approach with early-return pattern was cleaner.
