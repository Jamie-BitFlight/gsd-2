---
id: S02
parent: M006-tbhsp8
milestone: M006-tbhsp8
provides:
  - gsd-factcheck-coordinator agent definition for post-research claim verification
  - Default post_unit_hooks configuration triggering coordinator after research units
  - Integration tests for coordinator claim extraction and artifact writing
requires:
  - slice: S01
    provides: FactCheckAnnotation and FactCheckAggregateStatus schemas, path functions, serialization functions
affects:
  - S03 (consumes coordinator artifacts for planner evidence ingestion)
  - S04 (consumes coordinator artifacts for bounded planner revision loop)
key_files:
  - src/resources/agents/gsd-factcheck-coordinator.md
  - src/resources/extensions/gsd/preferences.ts
  - src/resources/extensions/gsd/post-unit-hooks.ts
  - src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts
key_decisions:
  - D059: Dedicated agent file (not inline hook prompt) for maintainability and debugging
  - D062: Default hooks merged with user hooks, user hooks override by name
  - D063: Agent field resolution reads agent file content as prompt
patterns_established:
  - Seven-step deterministic workflow: locate research → extract claims → init annotations → dispatch scouts → write annotations → build aggregate → report
  - Environment variable injection pattern for slice path, milestone, cycle state
  - Scout subagent dispatch with structured JSON response contract
  - Table parsing with separator detection for Unknowns Inventory extraction
observability_surfaces:
  - Agent logs claim extraction count, dispatch events, and artifact write paths during execution
  - factcheck/ directory with per-claim JSON files and FACTCHECK-STATUS.json aggregate
  - Test output shows passed/failed counts with specific assertion failures
duration: 2h5m
verification_result: passed
completed_at: 2026-03-18T09:30:00-04:00
---

# S02: Coordinator and Scout Execution

**Milestone:** M006-tbhsp8 (Fact-Check Service Layer)

**Delivered:** A research unit with unresolved claims triggers the fact-check coordinator agent, which extracts claims from the Unknowns Inventory, dispatches scout subagents for verification, and writes durable annotation files plus aggregate status to disk.

## What Happened

Slice S02 implemented the coordinator execution layer that bridges research output to fact-check verification:

1. **T01 created the gsd-factcheck-coordinator agent** — A dedicated agent definition with a seven-step deterministic workflow: locate research output, extract Unknowns Inventory claims, initialize annotations with 'unverified' verdict, dispatch scout subagents for verification, write per-claim annotation files using S01 contract, build aggregate status, and report completion.

2. **T02 wired the coordinator into post_unit_hooks** — Added `resolveDefaultPostUnitHooks()` in preferences.ts that returns the factcheck-coordinator hook configuration. The hook triggers after `research-milestone` and `research-slice` units, uses the agent file for prompt resolution, and checks for `factcheck/FACTCHECK-STATUS.json` for idempotency. Added `resolveAgentPrompt()` and `resolveHookModel()` in post-unit-hooks.ts to load agent definitions and respect `models.subagent` preference (R067).

3. **T03 verified artifact writing with S01 contract** — Traced through agent instructions to verify all S01 functions are correctly referenced (`resolveClaimPath`, `resolveStatusPath`, `formatAnnotation`, `formatAggregateStatus`, `buildAggregateStatus`). Fixed maxCycles default from 3 to 5.

4. **T04 added integration tests** — Created 25 test cases covering claim extraction from Unknowns Inventory markdown tables, annotation generation with all verdict types, aggregate status derivation (overallStatus, planImpacting flag), and end-to-end integration with temp directory file writes.

## Verification

All tests pass:

| Test Suite | Tests | Pass | Fail | Duration |
|------------|-------|------|------|----------|
| factcheck-coordinator.test.ts | 25 | 25 | 0 | 156ms |
| post-unit-hooks.test.ts | 44 | 44 | 0 | 720ms |
| factcheck.test.ts (S01) | 37 | 37 | 0 | 155ms |

Total: 106 tests passing.

## New Requirements Surfaced

None — S02 consumed S01 contract requirements (R065, R066) and delivered on R064 and R067 per plan.

## Deviations

None — all tasks followed their plans exactly.

## Known Limitations

- **Scout dispatch is stubbed in tests**: The integration tests create mock annotations rather than actually dispatching subagents. Real runtime would need the subagent system to actually spawn verification tasks.
- **Planner reinvocation not yet wired**: The coordinator writes artifacts but S03/S04 haven't been built yet to consume them and reinvoke planning on refutations.
- **No cycle state persistence**: maxCycles/currentCycle environment variables are injected but cycle state isn't persisted across session restarts (S04 addresses this).

## Follow-ups

- S03 must read FACTCHECK-STATUS.json and inject fact-check outcomes into planner prompts
- S04 must implement bounded cycle counting and explicit blocker behavior when cycles exhaust
- S05 must add completion reporting for fact-check outcomes

## Files Created/Modified

- `src/resources/agents/gsd-factcheck-coordinator.md` — Complete agent definition with seven-step verification workflow
- `src/resources/extensions/gsd/preferences.ts` — Added `resolveDefaultPostUnitHooks()` for default factcheck-coordinator hook
- `src/resources/extensions/gsd/post-unit-hooks.ts` — Added `resolveAgentPrompt()` and `resolveHookModel()` for agent-based hooks
- `src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts` — 25 integration tests for coordinator flow

## Forward Intelligence

### What the next slice should know
- The coordinator writes artifacts to `{slicePath}/factcheck/claims/{claimId}.json` and `{slicePath}/factcheck/FACTCHECK-STATUS.json`
- FACTCHECK-STATUS.json contains `planImpacting: true` when any refuted claim has impact level "slice" or "milestone"
- The aggregate status `overallStatus` field values: "clean", "has-refutations", "pending", "exhausted"
- Scout model selection uses `models.subagent` preference via `resolveHookModel()`

### What's fragile
- Claim extraction assumes Unknowns Inventory in markdown table format — alternative formats (JSON, bulleted list) would need parser updates
- Cycle state is injected via environment variables but not persisted to disk — session restart resets cycle count

### Authoritative diagnostics
- Run `/gsd hooks` to see factcheck-coordinator in the list of configured hooks
- Check `factcheck/FACTCHECK-STATUS.json` after research units to see coordinator output
- Test file `factcheck-coordinator.test.ts` shows exact expected artifact formats

### What assumptions changed
- Originally thought coordinator would dispatch scouts synchronously — actual design dispatches subagents which may run asynchronously
- maxCycles was initially set to 3, corrected to 5 in T03 after tracing through agent instructions
