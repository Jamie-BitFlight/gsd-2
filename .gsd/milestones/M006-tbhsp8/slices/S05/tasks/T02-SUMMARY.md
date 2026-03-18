---
id: T02
parent: S05
milestone: M006-tbhsp8
provides:
  - Fact-check diagnostics integration in completion prompts
  - Instructions for agents to include fact-check data in summaries
key_files:
  - src/resources/extensions/gsd/prompts/complete-slice.md
  - src/resources/extensions/gsd/prompts/complete-milestone.md
  - src/resources/extensions/gsd/tests/factcheck-summary.test.ts
key_decisions:
  - Milestone completion aggregates fact-check data from inlined slice summaries rather than calling generateFactCheckSummary directly
patterns_established:
  - Slice-level fact-check diagnostics inlined in complete-slice prompt
  - Milestone-level aggregation from slice summaries
observability_surfaces:
  - None (prompt templates and pure function integration)
duration: 10m
verification_result: passed
completed_at: 2026-03-18T11:55:00-04:00
blocker_discovered: false
---

# T02: Wire fact-check diagnostics into completion prompts

**Added fact-check diagnostics instructions to completion prompt templates, completing the slice/milestone summary integration.**

## What Happened

Wired the `generateFactCheckSummary` function (built in T01) into the completion prompt workflow:

1. **complete-slice.md**: Updated step 7 to instruct agents that if the inlined context includes a `## Fact-Check Diagnostics` section, they should include it in the slice summary after the narrative sections. This records fact-check verdicts and corrections absorbed during execution.

2. **complete-milestone.md**: Updated step 6 to instruct agents that if any slice summaries include `## Fact-Check Diagnostics` sections, they should summarize the aggregate fact-check state in the milestone summary: total claims verified, refutations absorbed, and any unresolved claims carried forward.

3. **Test fix**: Corrected import path in `factcheck-summary.test.ts` from `.js` to `.ts` extension to match project conventions.

The `buildCompleteSlicePrompt` function in `auto-prompts.ts` already calls `generateFactCheckSummary(slicePath)` and adds it to the inlined context. For milestone completion, the fact-check data is already available via the inlined slice summaries, so no direct call is needed—the milestone instruction tells the agent to aggregate from those summaries.

## Verification

- Ran `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/resources/extensions/gsd/tests/factcheck-summary.test.ts` — all 10 tests pass
- Ran `npx tsc --noEmit` — no type errors
- Manual inspection confirmed both prompt templates reference fact-check diagnostics

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | node --import .../resolve-ts.mjs --experimental-strip-types --test factcheck-summary.test.ts | 0 | ✅ pass | ~1s |
| 2 | npx tsc --noEmit | 0 | ✅ pass | ~2s |
| 3 | grep -n "Fact-Check Diagnostics" complete-slice.md complete-milestone.md | 0 | ✅ pass | <0.1s |

## Diagnostics

To verify the integration works end-to-end, trigger a complete-slice dispatch with fact-check data present and observe that the generated summary includes the `## Fact-Check Diagnostics` section.

## Deviations

None. Implementation followed the task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/gsd/prompts/complete-slice.md` — Added fact-check diagnostics instruction in step 7
- `src/resources/extensions/gsd/prompts/complete-milestone.md` — Added fact-check aggregation instruction in step 6
- `src/resources/extensions/gsd/tests/factcheck-summary.test.ts` — Fixed import path from `.js` to `.ts`
