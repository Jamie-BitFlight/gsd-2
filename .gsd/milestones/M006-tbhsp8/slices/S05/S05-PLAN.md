# S05: Completion Reporting and Diagnostics

**Goal:** Slice and milestone completion summaries include a fact-check diagnostics section reporting verdict counts, revision cycles, unresolved inconclusive claims, and whether corrected facts were absorbed before execution.
**Demo:** After a fact-check cycle completes (or is absent), `complete-slice` produces a summary that includes a `## Fact-Check Diagnostics` section with claim counts and cycle data, or gracefully omits it when no fact-check artifacts exist.

## Must-Haves

- A `generateFactCheckSummary(slicePath)` function that reads `FACTCHECK-STATUS.json` and claim annotations, returning a formatted markdown section with verdict counts, cycle count, max cycles, unresolved claims, and overall status
- Graceful degradation: when no fact-check artifacts exist, the function returns `null` and completion prompts omit the section entirely
- The `complete-slice` prompt template includes the fact-check diagnostics section when available
- Unit tests covering: clean status, has-refutations status, exhausted status, missing artifacts, mixed verdicts

## Verification

- `npx vitest run src/resources/extensions/gsd/tests/factcheck-summary.test.ts` — all tests pass
- `npx tsc --noEmit` — no type errors

## Integration Closure

- Upstream surfaces consumed: `factcheck.ts` (path resolution, parsers), `types.ts` (FactCheckAnnotation, FactCheckAggregateStatus), `auto-prompts.ts` (buildFactCheckIngestSection pattern)
- New wiring introduced in this slice: fact-check summary generation added to `auto-prompts.ts`, completion prompt template updated
- What remains before the milestone is truly usable end-to-end: nothing — this is the final slice

## Tasks

- [x] **T01: Implement generateFactCheckSummary and tests** `est:45m`
  - Why: The core logic to read fact-check artifacts and produce a completion-ready markdown section, plus tests proving all verdict/cycle combinations
  - Files: `src/resources/extensions/gsd/auto-prompts.ts`, `src/resources/extensions/gsd/tests/factcheck-summary.test.ts`
  - Do: Add `generateFactCheckSummary(slicePath)` to `auto-prompts.ts` that reads `FACTCHECK-STATUS.json` and claim annotations, formats verdict counts / cycle data / unresolved claims into a markdown section. Return `null` when no artifacts exist. Write comprehensive tests covering clean, has-refutations, exhausted, missing artifacts, and mixed verdict scenarios.
  - Verify: `npx vitest run src/resources/extensions/gsd/tests/factcheck-summary.test.ts && npx tsc --noEmit`
  - Done when: All tests pass, function returns correct markdown for each status, returns null when no artifacts

- [x] **T02: Wire fact-check diagnostics into completion prompts** `est:30m`
  - Why: The summary generator exists but completion prompts don't call it yet — this wires the output into slice and milestone completion context
  - Files: `src/resources/extensions/gsd/auto-prompts.ts`, `src/resources/extensions/gsd/prompts/complete-slice.md`, `src/resources/extensions/gsd/prompts/complete-milestone.md`
  - Do: In the completion prompt assembly path, call `generateFactCheckSummary(slicePath)` and inject the result as an inlined context section. Update both `complete-slice.md` and `complete-milestone.md` templates to reference the fact-check diagnostics section. Ensure the section is omitted cleanly when `null`.
  - Verify: `npx vitest run src/resources/extensions/gsd/tests/factcheck-summary.test.ts && npx tsc --noEmit`
  - Done when: Completion prompts include fact-check diagnostics when artifacts exist, omit cleanly when absent, existing tests still pass

## Files Likely Touched

- `src/resources/extensions/gsd/auto-prompts.ts`
- `src/resources/extensions/gsd/tests/factcheck-summary.test.ts`
- `src/resources/extensions/gsd/prompts/complete-slice.md`
- `src/resources/extensions/gsd/prompts/complete-milestone.md`
