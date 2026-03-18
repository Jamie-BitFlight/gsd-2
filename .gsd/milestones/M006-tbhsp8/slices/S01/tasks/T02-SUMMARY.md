---
id: T02
parent: S01
milestone: M006-tbhsp8
provides:
  - formatAnnotation/parseAnnotation serialization round-trip
  - formatAggregateStatus/parseAggregateStatus serialization round-trip
  - buildAggregateStatus aggregate computation function
  - 37 passing unit tests covering all contract paths
key_files:
  - src/resources/extensions/gsd/factcheck.ts
  - src/resources/extensions/gsd/tests/factcheck.test.ts
key_decisions:
  - D058 (from T01): impact→action mapping encoded as FACTCHECK_ROUTING_RULES constant
patterns_established:
  - JSON serialization with validation throwing descriptive errors
  - Optional field handling: only include in parsed output if present in JSON
observability_surfaces:
  - None (pure functions, no runtime state)
duration: 30m
verification_result: passed
completed_at: 2026-03-17T13:35:00Z
blocker_discovered: false
---

# T02: Implement annotation/status parsers and contract verification tests

**Added serialization functions and 37 unit tests proving the fact-check contract round-trips correctly.**

## What Happened

Implemented five new functions in `factcheck.ts`:
- `formatAnnotation(a)` — JSON.stringify with 2-space indent
- `parseAnnotation(json)` — JSON.parse with validation for required fields (claimId, verdict, citations, impact, checkedBy, timestamp), throws descriptive errors on invalid input
- `formatAggregateStatus(s)` — JSON.stringify with 2-space indent
- `parseAggregateStatus(json)` — validates schemaVersion === 1, required fields, throws on invalid
- `buildAggregateStatus(annotations, opts)` — computes counts, overallStatus, planImpacting, cycleKey, claimIds from annotation list

Created `factcheck.test.ts` with 37 tests covering:
- Annotation round-trip for all 4 verdicts × 4 impacts (16 combos)
- correctedValue: null and correctedValue: string variants
- Aggregate status round-trip
- buildAggregateStatus: empty list → clean, mixed → correct counts, refuted+slice/milestone → planImpacting, max cycle → exhausted
- Path resolution: resolveFactcheckDir, resolveClaimPath, resolveStatusPath
- Validation: throws on missing claimId, invalid verdict, invalid impact, non-array citations, wrong schemaVersion, missing cycleKey, malformed JSON, non-object input

## Verification

All tests pass and TypeScript compiles without errors.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | node --test src/resources/extensions/gsd/tests/factcheck.test.ts | 0 | ✅ pass | 122ms |
| 2 | npx tsc --noEmit | 0 | ✅ pass | ~500ms |

## Diagnostics

No runtime diagnostics — this is pure contract code. Future slices can verify by running:
- `node --test src/resources/extensions/gsd/tests/factcheck.test.ts`
- `npx tsc --noEmit`

## Deviations

None — implemented exactly as specified in T02-PLAN.md.

## Known Issues

None.

## Files Created/Modified

- `src/resources/extensions/gsd/factcheck.ts` — Added 5 serialization/parsing functions (~150 lines)
- `src/resources/extensions/gsd/tests/factcheck.test.ts` — New test file with 37 tests (~320 lines)
- `.gsd/milestones/M006-tbhsp8/slices/S01/S01-PLAN.md` — Marked T02 as complete
- `.gsd/milestones/M006-tbhsp8/slices/S01/tasks/T02-PLAN.md` — Added Observability Impact section (pre-flight fix)
