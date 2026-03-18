# S02: Coordinator and Scout Execution

**Goal:** Research units with unresolved claims trigger coordinator execution, scouts verify those claims through a configurable agent/model path, and durable annotations plus aggregate status appear on disk.
**Demo:** After a research-slice unit completes with unresolved claims in its Unknowns Inventory, the fact-check coordinator agent runs, spawns scout verification subagents, and writes per-claim annotation files plus FACTCHECK-STATUS.json to the slice's factcheck/ directory.

## Must-Haves

- A `gsd-factcheck-coordinator` agent definition file with clear instructions for reading research output, extracting unresolved claims, dispatching verification subagents, and writing annotation/status artifacts
- Integration with post_unit_hooks configuration so the coordinator is automatically triggered after `research-milestone` and `research-slice` unit types
- Per-claim annotation files written using the S01 contract (FactCheckAnnotation schema)
- Aggregate FACTCHECK-STATUS.json written using the S01 contract (FactCheckAggregateStatus schema)
- Scout model configurable through `models.subagent` preference (R067)
- Tests verifying the coordinator can extract claims from research output and produce correct artifacts

## Proof Level

- This slice proves: **integration** — multiple components (hooks, agents, file I/O, preferences) working together
- Real runtime required: **yes** — tests must exercise actual agent dispatch and artifact writing
- Human/UAT required: **no** — automated tests sufficient

## Verification

- `node --test src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts` — Unit tests for claim extraction and artifact writing
- `node --test src/resources/extensions/gsd/tests/post-unit-hooks.test.ts` — Existing hook tests should still pass
- Integration test: create a mock research output with unresolved claims, verify coordinator produces annotation files and aggregate status matching expected schema

## Observability / Diagnostics

- Runtime signals: coordinator logs claim extraction count, verification dispatch, and artifact write paths
- Inspection surfaces: factcheck/ directory structure visible on disk; FACTCHECK-STATUS.json can be read directly
- Failure visibility: if coordinator fails mid-execution, partial annotations may exist; aggregate status will be missing or have `overallStatus: pending`
- Redaction constraints: none (no secrets in fact-check artifacts)

## Integration Closure

- Upstream surfaces consumed: S01 types (FactCheckAnnotation, FactCheckAggregateStatus), S01 path functions (resolveFactcheckDir, resolveClaimPath, resolveStatusPath), S01 serialization (formatAnnotation, formatAggregateStatus, buildAggregateStatus)
- New wiring introduced in this slice: `gsd-factcheck-coordinator` agent definition, default post_unit_hooks configuration for research-* units
- What remains before the milestone is truly usable end-to-end: S03 (planner reads fact-check outputs), S04 (planner reinvocation on refutations), S05 (completion reporting)

## Tasks

- [x] **T01: Create gsd-factcheck-coordinator agent definition** `est:1h`
  - Why: D059 mandates a dedicated hook agent (not inline prompt) for maintainability and debugging. The agent reads research output, extracts unresolved claims, coordinates scout verification, and writes artifacts.
  - Files: `src/resources/agents/gsd-factcheck-coordinator.md`
  - Do: Create agent markdown file with YAML frontmatter (name, description, tools). Body describes: (1) read RESEARCH.md from slice/milestone path, (2) extract Unknowns Inventory section, (3) for each unresolved claim, spawn scout subagent with verification task, (4) collect scout results into FactCheckAnnotation objects, (5) write per-claim files to factcheck/claims/, (6) build and write aggregate status using buildAggregateStatus logic.
  - Verify: Agent file exists with valid frontmatter and clear step-by-step instructions; peer review confirms instructions are deterministic and executable.
  - Done when: Agent file exists at `src/resources/agents/gsd-factcheck-coordinator.md` with complete instructions for claim extraction, verification dispatch, and artifact writing.

- [x] **T02: Wire coordinator into post_unit_hooks system** `est:45m`
  - Why: The coordinator must be automatically triggered after research units complete. This requires configuration in the hook system and possibly a default preference entry.
  - Files: `src/resources/extensions/gsd/preferences.ts`, `src/resources/extensions/gsd/post-unit-hooks.ts`
  - Do: (1) Add default post_unit_hooks configuration entry for fact-check coordinator triggered after `research-milestone` and `research-slice` units. (2) Ensure the hook can resolve the agent file path and use `models.subagent` preference for scout model selection. (3) Set appropriate max_cycles (default 1) and artifact path (FACTCHECK-STATUS.json for idempotency).
  - Verify: resolvePostUnitHooks() returns the fact-check hook for research unit types; hook configuration validates correctly.
  - Done when: Hook configuration exists and unit tests verify the hook is returned for research-* unit types.

- [x] **T03: Implement artifact writing in coordinator agent** `est:1h`
  - Why: The coordinator must write durable artifacts following the S01 contract. This requires the agent instructions to use the correct path functions and serialization formats.
  - Files: `src/resources/agents/gsd-factcheck-coordinator.md` (instructions), `src/resources/extensions/gsd/factcheck.ts` (already exists, verify exports)
  - Do: Ensure agent instructions specify: (1) using resolveFactcheckDir/resolveClaimPath/resolveStatusPath for paths, (2) using formatAnnotation for each claim file, (3) using buildAggregateStatus + formatAggregateStatus for the aggregate file. The agent writes files via the `write` tool.
  - Verify: Manual trace through agent instructions confirms all S01 functions are correctly referenced.
  - Done when: Agent instructions clearly specify the exact file paths and JSON formats for artifacts.

- [x] **T04: Add integration tests for coordinator flow** `est:1h`
  - Why: Must prove the coordinator produces correct artifacts from research output. Tests are the objective stopping condition.
  - Files: `src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts`
  - Do: Create test file with: (1) mock research output containing 2-3 unresolved claims with different types (version, API signature, config format), (2) simulate coordinator execution (parse research, extract claims, create mock annotations), (3) verify annotation files are written with correct schema, (4) verify aggregate status has correct counts and planImpacting flag. Test both slice-level and milestone-level research paths.
  - Verify: `node --test src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts` passes with all assertions.
  - Done when: All tests pass and cover claim extraction, annotation writing, and aggregate status generation.

## Files Likely Touched

- `src/resources/agents/gsd-factcheck-coordinator.md` — New agent definition
- `src/resources/extensions/gsd/preferences.ts` — Default hook configuration
- `src/resources/extensions/gsd/post-unit-hooks.ts` — May need minor updates for agent-based hooks
- `src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts` — New test file
- `src/resources/extensions/gsd/tests/post-unit-hooks.test.ts` — May need test additions
