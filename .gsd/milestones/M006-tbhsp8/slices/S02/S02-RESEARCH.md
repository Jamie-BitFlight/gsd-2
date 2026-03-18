# S02 — Research

**Date:** 2026-03-17

## Summary

The fact-check service layer requires an asynchronous coordinator to verify research claims. The research shows that implementing this as a dedicated hook agent is the most robust approach, following decision D059. This coordinator will trigger after research units, fan out verification tasks to configurable subagents, and persist results as per-claim annotation files and an aggregate JSON status artifact, satisfying requirements R064, R065, R066, and R067.

## Recommendation

Implement a new hook agent `gsd-factcheck-coordinator` triggered in `post_unit_hooks` after `research-*` units. Use the existing subagent preference (`models.subagent`) for individual claim verification to satisfy R067's configuration requirement. The coordinator will read the research unit output, identify unresolved claims, coordinate parallel verification, and write durable artifacts following the schema defined in S01.

## Implementation Landscape

### Key Files

- `src/resources/extensions/gsd/auto.ts` — Integration point for hook dispatching; needs to be ensured research units trigger the coordinator.
- `src/resources/extensions/gsd/hooks/factcheck-coordinator.ts` — The new dedicated coordinator agent implementation (D059).
- `src/resources/extensions/gsd/preferences.ts` — Likely needs a small update to ensure factcheck coordinator model configuration is handled.

### Build Order

1. Implement the `gsd-factcheck-coordinator` agent.
2. Integrate the agent into `post_unit_hooks` for `research-*` unit types.
3. Test that research units with unresolved claims trigger the coordinator work.

### Verification Approach

- Trigger a research unit containing dummy unresolved claims.
- Verify that `gsd-factcheck-coordinator` logs the initiation.
- Check that per-claim annotation files and `FACTCHECK-STATUS.json` appear correctly in `.gsd/milestones/M006-tbhsp8/slices/S02/`.
- Validate that the aggregate status matches the expected output using the S01 tools.

## Open Risks

- The runtime hook engine's asynchronous nature means fact-check artifacts may not be ready when the planner starts if planning begins immediately after research completion; may need a wait-for-factcheck gate in auto-mode.
