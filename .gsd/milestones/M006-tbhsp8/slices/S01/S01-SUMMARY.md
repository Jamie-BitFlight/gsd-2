---
id: S01
parent: M006-tbhsp8
milestone: M006-tbhsp8
provides:
  - Per-claim annotation JSON schema with claimId, verdict, citations, correctedValue, impact, checkedBy, timestamp
  - Aggregate FACTCHECK-STATUS.json schema with schemaVersion, cycleKey, overallStatus, planImpacting, counts, maxCycles, currentCycle, claimIds
  - Three path-resolution functions for factcheck directory layout
  - FACTCHECK_ROUTING_RULES constant encoding deterministic impact→action mapping
  - Serialization round-trips (formatAnnotation/parseAnnotation, formatAggregateStatus/parseAggregateStatus)
  - buildAggregateStatus for computing aggregate from annotation list
requires: []
affects:
  - S02
  - S03
key_files:
  - src/resources/extensions/gsd/types.ts
  - src/resources/extensions/gsd/factcheck.ts
  - src/resources/extensions/gsd/tests/factcheck.test.ts
key_decisions:
  - D058: FACTCHECK_ROUTING_RULES constant encodes deterministic impact→action mapping (none→no-action, task→flag-executor, slice→plan-slice, milestone→plan-milestone)
patterns_established:
  - Literal union types for finite enums (FactCheckVerdict, FactCheckImpact, FactCheckOverallStatus)
  - Pure path-resolution functions using node:path.join following existing files.ts pattern
  - Derivation functions that compute aggregate state from annotation arrays (deriveOverallStatus, derivePlanImpacting)
  - JSON serialization with validation throwing descriptive errors on invalid input
observability_surfaces:
  - None (pure contract code, no runtime state)
  - LSP hover on exported types shows schema structure
  - Tests can be run via: node --test src/resources/extensions/gsd/tests/factcheck.test.ts
drill_down_paths:
  - .gsd/milestones/M006-tbhsp8/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M006-tbhsp8/slices/S01/tasks/T02-SUMMARY.md
duration: 45m
verification_result: passed
completed_at: 2026-03-17T17:45:00Z
---

# S01: Fact-Check Control Contract

**Machine-readable fact-check contract — per-claim annotation schema, aggregate JSON status artifact, impact enum, cycle key, and routing rules defined for runtime and planner consumption without interpretation.**

## What Happened

This slice established the foundational contract for the fact-check service layer. Two tasks delivered the complete contract:

**T01: Types and Path Resolution**
- Added five TypeScript types to `types.ts`: `FactCheckVerdict` (4-state), `FactCheckImpact` (4-state), `FactCheckOverallStatus` (4-state), `FactCheckAnnotation` (per-claim), `FactCheckAggregateStatus` (aggregate)
- Created `factcheck.ts` with three path-resolution functions: `resolveFactcheckDir`, `resolveClaimPath`, `resolveStatusPath` following the existing `files.ts` pattern
- Added `FACTCHECK_ROUTING_RULES` constant encoding deterministic impact→action mapping (D058)
- Implemented pure derivation functions: `deriveOverallStatus` and `derivePlanImpacting`

**T02: Serialization and Tests**
- Implemented `formatAnnotation`/`parseAnnotation` with JSON serialization and validation (throws descriptive errors on missing claimId, invalid verdict, invalid impact, non-array citations)
- Implemented `formatAggregateStatus`/`parseAggregateStatus` with schemaVersion validation (requires ===1, throws on mismatch)
- Implemented `buildAggregateStatus` that computes counts, overallStatus, planImpacting, cycleKey, and claimIds from annotation array
- Created 37 unit tests covering all verdict×impact combinations, round-trips, edge cases, and validation errors

## Verification

All tests pass and TypeScript compiles without errors:

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | node --test src/resources/extensions/gsd/tests/factcheck.test.ts | 0 | ✅ pass | 98ms |
| 2 | npx tsc --noEmit | 0 | ✅ pass | ~500ms |

## Requirements Advanced

- R065 — Per-claim annotation schema now exists and is machine-checkable
- R066 — Aggregate FACTCHECK-STATUS.json schema now defined with plan-impacting flag and cycle tracking
- R072 — Deterministic routing rules encoded as FACTCHECK_ROUTING_RULES constant for planner consumption

## Requirements Validated

No requirements fully validated in this slice — validation requires S02 (coordinator execution writes artifacts) and S03 (planner reads them).

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None — implementation followed T01-PLAN.md and T02-PLAN.md exactly.

## Known Limitations

- Pre-existing build error in `packages/pi-coding-agent/src/modes/interactive/components/extension-input.ts:65` — blocks `npm run build` but doesn't affect this slice's contract verification
- No runtime wiring yet — S02 will wire coordinator to write artifacts, S03 will wire planner to read them

## Follow-ups

- S02 must implement coordinator that writes per-claim annotations and aggregate status from real research triggers
- S03 must integrate fact-check outputs into planning prompts so corrected evidence reaches planners

## Files Created/Modified

- `src/resources/extensions/gsd/types.ts` — Added 5 type exports (FactCheckVerdict, FactCheckImpact, FactCheckOverallStatus, FactCheckAnnotation, FactCheckAggregateStatus)
- `src/resources/extensions/gsd/factcheck.ts` — New module (~250 lines): path resolution, routing rules, derivation functions, serialization/parsing, buildAggregateStatus
- `src/resources/extensions/gsd/tests/factcheck.test.ts` — New test file with 37 tests (~320 lines)
- `src/resources/extensions/gsd/worktree-manager.ts` — Added npm install after worktree creation (unrelated fix)
- `.gsd/milestones/M006-tbhsp8/slices/S01/S01-PLAN.md` — Added Observability/Diagnostics section
- `.gsd/milestones/M006-tbhsp8/slices/S01/tasks/T01-PLAN.md` — Added Observability Impact section
- `.gsd/milestones/M006-tbhsp8/slices/S01/tasks/T02-PLAN.md` — Added Observability Impact section

## Forward Intelligence

### What the next slice should know
- The contract is stable and tested — all serialization round-trips work
- FACTCHECK_ROUTING_RULES defines the impact→action mapping: none→no-action, task→flag-executor, slice→reroute-plan-slice, milestone→reroute-plan-milestone
- buildAggregateStatus automatically derives overallStatus and planImpacting from annotation lists — coordinator doesn't need to compute these manually

### What's fragile
- No runtime wiring yet — S02 must call the path functions and serialization functions to actually write files
- The validation throws descriptive errors but doesn't have a formal schema validator (JSON Schema or Zod) — downstream consumers must call parse functions

### Authoritative diagnostics
- Tests: `node --test src/resources/extensions/gsd/tests/factcheck.test.ts` — 37 tests cover all code paths
- TypeScript: `npx tsc --noEmit` — verifies all types export correctly

### What assumptions changed
- Original assumption: might need JSON Schema for validation
- What actually happened: TypeScript types + manual validation in parse functions is sufficient and simpler
