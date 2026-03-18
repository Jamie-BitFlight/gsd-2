# S04: Bounded Planner Revision Loop

## Summary

This slice implements the automated correction loop required by R069 and R070. When a research unit completes, the runtime inspects the `FACTCHECK-STATUS.json` aggregate artifact. If `planImpacting` is true (indicating at least one REFUTED claim with slice- or milestone-wide impact), the runtime triggers a deterministic reroute to the appropriate planning unit (`plan-slice` or `plan-milestone`). To prevent infinite revision cycles, a cycle counter is maintained within the aggregate status artifact. If cycles exceed the configured maximum, the system halts with a terminal `exhausted` state and an explicit blocker artifact, satisfying the operational verification requirements.

## Recommendation

Implement a new `checkPlanImpactingRefutations` utility in `src/resources/extensions/gsd/auto-recovery.ts` that acts as the source-of-truth for reroute logic, conforming to the `FACTCHECK_ROUTING_RULES` defined in `src/resources/extensions/gsd/factcheck.ts`. Integrate this check into the `handleAgentEnd` dispatch flow; when a research unit finishes, the runtime will evaluate if a reroute is required before auto-mode proceeds to plan or execute. We will inject the cycle count via environment state to ensure visibility across sessions and bounded loop termination.

## Implementation Landscape

### Key Files

- `src/resources/extensions/gsd/auto-recovery.ts` — New utility methods to identify `planImpacting` status and evaluate reroute conditions. This is the central decision point for runtime rerouting.
- `src/resources/extensions/gsd/auto.ts` — Minimal updates to `handleAgentEnd` to invoke the `auto-recovery` logic after research units complete.
- `src/resources/extensions/gsd/tests/auto-recovery-loop.test.ts` — Integration tests (modeled on `worktree-e2e.test.ts` / `integration-lifecycle.test.ts`) to verify that REFUTED claims trigger reroutes and exhaust correctly at the cycle limit.

### Build Order

1. **Implement Reroute Logic:** Update `auto-recovery.ts` to consume existing `FACTCHECK-STATUS.json` and verify routing via a new test suite.
2. **Integrate into Dispatch:** Update `handleAgentEnd` in `auto.ts` to trigger this recovery logic after research unit completion.
3. **Verify Exhaustion:** Implement cycle-bound termination and blocker artifact writing in `auto-recovery.ts`.
4. **Integration Tests:** Verify the full loop: Research → Coordinator → REFUTED → Reroute → Replanning → Success.

### Verification Approach

- **Contract Check:** Unit tests for `auto-recovery.ts` verifying that `planImpacting: true` triggers `reroute` and respects cycle bounds.
- **Integration Test:** `auto-recovery-loop.test.ts` exercising the `handleAgentEnd` flow, verifying `plan-slice` is queued after a research unit returns a refuted claim, and ensuring completion happens after the rerun.
- **Operational Verification:** Confirm that a scenario exceeding the `maxCycles` limit produces the terminal `exhausted` aggregate status and halts with a clear user alert.

## Open Risks

- **Hook Engine Interaction:** The hook engine is currently designed for idempotency. Rerouting requires updating session-level state, which needs to be robust against concurrent events or session crashes. We must ensure the reroute state remains consistent if the process restarts between dispatch completion and the next unit starting.
- **Dispatcher Complexity:** Introducing runtime rerouting makes the state machine harder to debug (`auto.ts` is already large). Clear logging and explicit artifact persistence are critical for operability.

## Sources

- R069 (planner reinvocation) and R070 (revision routing) define the operational requirements for this slice.
- `src/resources/extensions/gsd/post-unit-hooks.ts` — Prior art for `retry_on` logic that we are effectively evolving for cross-unit routing.
- `src/resources/extensions/gsd/factcheck.ts` — Source of truth for `FACTCHECK_ROUTING_RULES`.
