---
id: T02
parent: S02
milestone: M006-tbhsp8
provides:
  - Default post_unit_hooks configuration for fact-check coordinator
  - Agent field resolution in hook engine
key_files:
  - src/resources/extensions/gsd/preferences.ts
  - src/resources/extensions/gsd/post-unit-hooks.ts
  - src/resources/extensions/gsd/tests/post-unit-hooks.test.ts
key_decisions:
  - D062: Default hooks merged with user hooks, user hooks override by name
  - D063: Agent field resolution reads agent file content as prompt
patterns_established:
  - resolveDefaultPostUnitHooks() for system-provided hooks
  - resolveAgentPrompt() for loading agent definitions from search paths
  - resolveHookModel() for model preference fallback (config → models.subagent)
observability_surfaces:
  - Hook status shows factcheck-coordinator when running /gsd hooks
  - Console logs when agent resolution fails
duration: 45m
verification_result: passed
completed_at: 2026-03-17T21:10:00Z
blocker_discovered: false
---

# T02: Wire Coordinator into Post-Unit Hooks System

**Added default fact-check coordinator hook to post_unit_hooks system with agent file resolution.**

## What Happened

Implemented the wiring to automatically trigger the gsd-factcheck-coordinator agent after `research-milestone` and `research-slice` units complete. The implementation consists of three parts:

1. **Default hook configuration in `preferences.ts`**: Added `resolveDefaultPostUnitHooks()` function that returns the factcheck-coordinator hook configuration. The hook triggers after research units, references the agent file, and checks for `factcheck/FACTCHECK-STATUS.json` for idempotency.

2. **Agent field resolution in `post-unit-hooks.ts`**: Added `resolveAgentPrompt()` function that searches for agent files in user, project, and src/resources/agents directories. When a hook has an `agent` field, the engine reads the agent definition and uses its content (after YAML frontmatter) as the prompt.

3. **Model resolution via `models.subagent` preference**: Added `resolveHookModel()` that respects R067 by checking the hook config's model override first, then falling back to the `models.subagent` preference for agent-based hooks.

Updated tests to expect the new default hook behavior. Added test cases for:
- Verifying factcheck-coordinator triggers on research-slice and research-milestone
- Verifying idempotency when FACTCHECK-STATUS.json already exists

## Verification

All tests pass:
- `npx tsx --test src/resources/extensions/gsd/tests/post-unit-hooks.test.ts` — 44 passed, 0 failed
- `npx tsx --test src/resources/extensions/gsd/tests/preferences-hooks.test.ts` — 40 passed, 0 failed

Manual verification:
- Hook configuration has correct `after` array containing `research-milestone` and `research-slice`
- Hook references `gsd-factcheck-coordinator` agent
- Artifact path is `factcheck/FACTCHECK-STATUS.json` for idempotency
- Max cycles is 1 (coordinator runs once per research unit)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsx --test src/resources/extensions/gsd/tests/post-unit-hooks.test.ts` | 0 | ✅ pass | ~780ms |
| 2 | `npx tsx --test src/resources/extensions/gsd/tests/preferences-hooks.test.ts` | 0 | ✅ pass | ~170ms |

## Diagnostics

To inspect hook configuration:
- Run `/gsd hooks` command to see factcheck-coordinator in the list
- Check `factcheck/FACTCHECK-STATUS.json` after research units complete to verify hook ran
- If hook fails to dispatch, console will show `[resolveAgentPrompt] Agent "gsd-factcheck-coordinator" not found`

## Deviations

None. Followed task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/gsd/preferences.ts` — Added `resolveDefaultPostUnitHooks()` and updated `resolvePostUnitHooks()` to merge defaults
- `src/resources/extensions/gsd/post-unit-hooks.ts` — Added `resolveAgentPrompt()` and `resolveHookModel()` for agent-based hooks
- `src/resources/extensions/gsd/tests/post-unit-hooks.test.ts` — Updated tests for default hook behavior and added new test cases
