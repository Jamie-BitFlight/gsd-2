# S06 — Research

**Date:** 2026-03-18

## Summary

This slice integrates the fact-check correction loop at the **milestone level**. S04 implemented the runtime reroute path for `plan-slice` / `plan-milestone` based on fact-check refutations, but `plan-milestone` is not yet actively consuming the fact-check aggregate status and milestone-impact claim annotations. Completion requires ensuring that when a milestone-impact REFUTED claim occurs, `plan-milestone` is reinvoked with the corrected evidence.

## Recommendation

Extend the existing fact-check ingestion pattern from `plan-slice` to `plan-milestone`. This involves updating `buildPlanMilestonePrompt` in `auto-prompts.ts` to consume the aggregate status and claim annotations. Since `plan-milestone` often deals with higher-level planning context, we must ensure the fact-check section is injected properly and milestone-impact refutations are prioritized.

## Implementation Landscape

### Key Files

- `src/resources/extensions/gsd/auto-prompts.ts` — Update `buildPlanMilestonePrompt` to use `buildFactCheckIngestSection`.
- `src/resources/extensions/gsd/prompts/plan-milestone.md` — Add the prompt instruction for treating corrected facts as authoritative (similar to `plan-slice.md`).
- `src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts` — Add test cases focusing on `plan-milestone` context.

### Build Order

1. Update `auto-prompts.ts` to handle milestone-level fact-check ingestion.
2. Update `plan-milestone.md` prompt injection instructions.
3. Update and verify integration tests in `factcheck-ingestion.test.ts`.

### Verification Approach

- Unit tests: verify `buildPlanMilestonePrompt` correctly includes the fact-check section when refutations exist.
- Integration verification: verify the runtime reroute behavior now correctly pulls the corrected evidence into the milestone plan.

## Open Risks

- Milestone-level correction injection might impact prompt size more than slice-level. Monitor for excessive context usage.
