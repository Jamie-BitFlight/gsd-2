---
estimated_steps: 3
estimated_files: 3
---

# T02: Wire fact-check diagnostics into completion prompts

**Slice:** S05 — Completion Reporting and Diagnostics
**Milestone:** M006-tbhsp8

## Description

Wire the `generateFactCheckSummary` function (built in T01) into the completion prompt assembly so that `complete-slice` and `complete-milestone` prompts include fact-check diagnostics when available.

## Steps

1. In `src/resources/extensions/gsd/auto-prompts.ts`, find the completion context assembly logic (look for where `complete-slice` / `complete-milestone` context is built — likely near where `buildFactCheckIngestSection` is called for planning prompts). Add a call to `generateFactCheckSummary(slicePath)` and, if non-null, append the result to the inlined context sections.
2. In `src/resources/extensions/gsd/prompts/complete-slice.md`, add a note in the instructions telling the completion agent to include the fact-check diagnostics section (if present in inlined context) in the slice summary it writes. Add after the summary-writing instruction (step 7).
3. In `src/resources/extensions/gsd/prompts/complete-milestone.md`, add the same instruction for milestone summaries.
4. Run `npx vitest run src/resources/extensions/gsd/tests/factcheck-summary.test.ts` — still passes
5. Run `npx tsc --noEmit` — no type errors

## Must-Haves

- [ ] Completion prompt assembly calls `generateFactCheckSummary` and includes result in inlined context
- [ ] `complete-slice.md` template instructs agent to include fact-check diagnostics in summary
- [ ] `complete-milestone.md` template instructs agent to include fact-check diagnostics in summary
- [ ] Section is cleanly omitted when `generateFactCheckSummary` returns null
- [ ] `npx tsc --noEmit` passes

## Verification

- `npx vitest run src/resources/extensions/gsd/tests/factcheck-summary.test.ts` — all tests pass
- `npx tsc --noEmit` — exit 0
- Manual inspection: read `complete-slice.md` and confirm the instruction references fact-check diagnostics

## Inputs

- `src/resources/extensions/gsd/auto-prompts.ts` — T01 added `generateFactCheckSummary`
- `src/resources/extensions/gsd/prompts/complete-slice.md` — existing completion prompt template
- `src/resources/extensions/gsd/prompts/complete-milestone.md` — existing completion prompt template

## Expected Output

- `src/resources/extensions/gsd/auto-prompts.ts` — modified to call `generateFactCheckSummary` during completion context assembly
- `src/resources/extensions/gsd/prompts/complete-slice.md` — updated with fact-check diagnostics instruction
- `src/resources/extensions/gsd/prompts/complete-milestone.md` — updated with fact-check diagnostics instruction
