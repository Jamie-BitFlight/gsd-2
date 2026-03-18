---
estimated_steps: 4
estimated_files: 2
---

# T02: Wire Coordinator into Post-Unit Hooks System

**Slice:** S02 — Coordinator and Scout Execution
**Milestone:** M006-tbhsp8

## Description

Configure the post-unit hooks system to automatically trigger the fact-check coordinator after `research-milestone` and `research-slice` units complete. This involves adding a default hook configuration and ensuring the hook engine can resolve agent-based hooks.

## Steps

1. Examine existing post_unit_hooks configuration in `preferences.ts`:
   - Understand the PostUnitHookConfig type structure
   - Check if agent-based hooks are already supported via the `agent` field

2. Add default fact-check hook configuration:
   - Name: `factcheck-coordinator`
   - After: `["research-milestone", "research-slice"]`
   - Agent: `gsd-factcheck-coordinator` (references agent file)
   - Model: Use `models.subagent` preference (R067) or fall back to configured subagent model
   - Max_cycles: 1 (coordinator should run once per research unit)
   - Artifact: `factcheck/FACTCHECK-STATUS.json` (for idempotency — skip if exists)

3. Update `post-unit-hooks.ts` if needed:
   - Ensure agent field in hook config can be resolved to agent file path
   - If hook uses `agent` field, read the agent file and use its prompt as the hook prompt
   - Preserve model override from hook config if specified

4. Verify integration:
   - `resolvePostUnitHooks()` returns the fact-check hook for research unit types
   - `checkPostUnitHooks()` correctly identifies research-* as trigger types
   - Existing hook tests continue to pass

## Must-Haves

- [ ] Default hook configuration for fact-check coordinator exists in preferences or is added dynamically
- [ ] Hook triggers after `research-milestone` and `research-slice` unit types
- [ ] Agent field resolves to the agent definition file
- [ ] Idempotency via artifact check (skip if FACTCHECK-STATUS.json exists)
- [ ] Model selection respects `models.subagent` preference (R067)

## Verification

- Unit test: `resolvePostUnitHooks()` returns hook with name "factcheck-coordinator"
- Unit test: Hook's `after` array includes "research-milestone" and "research-slice"
- Existing tests: `node --test src/resources/extensions/gsd/tests/post-unit-hooks.test.ts` passes

## Observability Impact

- Signals added/changed: Hook dispatch logs mention "factcheck-coordinator" triggered after research units
- How a future agent inspects this: Run `/gsd hooks` to see configured hooks and their status
- Failure state exposed: If hook fails to dispatch, standard hook error handling applies (retry or skip)

## Inputs

- `src/resources/extensions/gsd/types.ts` — PostUnitHookConfig type definition
- `src/resources/extensions/gsd/preferences.ts` — resolvePostUnitHooks() function
- `src/resources/extensions/gsd/post-unit-hooks.ts` — checkPostUnitHooks() function
- S01-PLAN.md for context on idempotency patterns

## Expected Output

- `src/resources/extensions/gsd/preferences.ts` — May include default hook config or logic to add it
- `src/resources/extensions/gsd/post-unit-hooks.ts` — May need update for agent-based hook resolution
