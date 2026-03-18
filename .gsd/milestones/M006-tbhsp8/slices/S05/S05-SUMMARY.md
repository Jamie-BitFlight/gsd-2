---
id: S05
parent: M006-tbhsp8
milestone: M006-tbhsp8
provides:
  - generateFactCheckSummary function for completion summaries
  - Fact-check diagnostics section in slice/milestone summaries
  - Graceful degradation when no fact-check artifacts exist
key_files:
  - src/resources/extensions/gsd/auto-prompts.ts (generateFactCheckSummary function)
  - src/resources/extensions/gsd/tests/factcheck-summary.test.ts (10 passing tests)
  - src/resources/extensions/gsd/prompts/complete-slice.md
  - src/resources/extensions/gsd/prompts/complete-milestone.md
key_decisions:
  - Reused existing buildFactCheckIngestSection pattern for consistency
  - Milestone completion aggregates fact-check data from inlined slice summaries rather than calling generateFactCheckSummary directly
patterns_established:
  - Graceful null-return pattern for missing fact-check artifacts
  - Markdown diagnostics section format with status, cycles, verdicts, and claims
  - Slice-level diagnostics inlined in complete-slice prompt
  - Milestone-level aggregation from slice summaries
observability_surfaces:
  - None (pure function, no runtime state)
duration: 25m
verification_result: passed
completed_at: 2026-03-18T11:55:00-04:00
---

# S05: Completion Reporting and Diagnostics

**Slice and milestone completion summaries now include fact-check diagnostics reporting verdict counts, revision cycles, unresolved claims, and whether corrected facts were absorbed before execution.**

## What Happened

This final slice of M006-tbhsp8 completes the fact-check service layer by ensuring completion summaries report what was verified, what was refuted, what was revised, and what remains inconclusive.

### T01: Implement generateFactCheckSummary and tests

Implemented `generateFactCheckSummary(slicePath: string): Promise<string | null>` in `auto-prompts.ts`. This function:

- Reads `FACTCHECK-STATUS.json` aggregate status from the slice's factcheck directory
- Iterates through all claim annotation files to collect verdict information
- Returns `null` gracefully when no factcheck artifacts exist
- Formats a markdown section with:
  - Overall status (clean/has-refutions/pending/exhausted)
  - Cycle count and max cycles
  - Verdict counts (confirmed, refuted, inconclusive, unverified)
  - List of refuted claims with corrected values and impact levels
  - List of unresolved claims (inconclusive + unverified)
  - Exhaustion warning when cycle limit reached

Created comprehensive test file with 10 test cases covering all scenarios:
1. No factcheck directory → returns null
2. Missing status file → returns null  
3. Invalid JSON → returns null
4. Clean status → correct counts, no claim lists
5. Has-refutations → lists refuted claims with corrections
6. Exhausted → includes exhaustion warning
7. Mixed verdicts → correct counts and all claim lists
8. Missing claim files → graceful skip
9. Refuted without correctedValue → shows placeholder
10. Pending with unverified → shows unresolved list

### T02: Wire fact-check diagnostics into completion prompts

Updated `complete-slice.md` step 7 to instruct agents to include the `## Fact-Check Diagnostics` section (if present in inlined context) in slice summaries.

Updated `complete-milestone.md` step 6 to instruct agents to aggregate fact-check state from any slice summaries that include diagnostics sections: total claims verified, refutations absorbed, unresolved claims carried forward.

Fixed import path in test file from `.js` to `.ts` extension to match project conventions.

## Verification

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | node --import .../resolve-ts.mjs --experimental-strip-types --test factcheck-summary.test.ts | 0 | ✅ pass | ~1s |
| 2 | npx tsc --noEmit | 0 | ✅ pass | ~2s |
| 3 | grep -n "Fact-Check Diagnostics" complete-slice.md complete-milestone.md | 0 | ✅ pass | <0.1s |

## New Requirements Validated

- R071 — Completion reporting for fact-check outcomes: The function and prompt wiring prove this requirement works. Status changes from active → validated.

## Deviations

None. Implementation followed the task plan exactly.

## Known Limitations

None.

## Files Created/Modified

- `src/resources/extensions/gsd/auto-prompts.ts` — Added `generateFactCheckSummary` function (~38 lines)
- `src/resources/extensions/gsd/tests/factcheck-summary.test.ts` — Created test file with 10 test cases
- `src/resources/extensions/gsd/prompts/complete-slice.md` — Added fact-check diagnostics instruction in step 7
- `src/resources/extensions/gsd/prompts/complete-milestone.md` — Added fact-check aggregation instruction in step 6

## Forward Intelligence

### What the next slice should know
- The fact-check service layer (M006-tbhsp8) is now complete. All pieces are in place: artifact contracts (S01), coordinator execution (S02), planner ingestion (S03), bounded revision loop (S04), and completion reporting (S05).
- The milestone is ready for end-to-end testing with real research triggers.

### What's fragile
- The completion prompts rely on the agent to include diagnostics sections when present. This is behavioral, not structural. If the agent ignores the instruction, the diagnostics won't appear.

### Authoritative diagnostics
- Run `npx vitest run src/resources/extensions/gsd/tests/factcheck-summary.test.ts` to verify the summary function works correctly.
- Check `generateFactCheckSummary` in `auto-prompts.ts` for the exact markdown format produced.

### What assumptions changed
- None. This slice delivered exactly what was planned.
