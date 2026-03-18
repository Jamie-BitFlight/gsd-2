---
id: S03
parent: M007-aos64t
milestone: M007-aos64t
provides:
  - Durable validation report (M007-VALIDATION-REPORT.json) with machine-readable evidence
  - Final audit test that exercises dispatch reroute + prompt assembly proof path
  - Schema-validated milestone closeout artifact for automated verification
requires:
  - slice: S02
    provides: Live proof artifacts, proof-output directory, reroute evidence
affects:
  - milestone: M007-aos64t (completes it)
key_files:
  - src/resources/extensions/gsd/tests/factcheck-final-audit.test.ts
  - .gsd/milestones/M007-aos64t/M007-VALIDATION-REPORT.json
key_decisions:
  - Used npx tsx --test instead of node --test due to module resolution limitations with transitive .js imports in .ts files
  - Validation report schema versioned (v1) for future compatibility
  - Report includes dispatch action, prompt excerpt, corrected value, and timestamps
patterns_established:
  - Final audit tests write structured validation reports to milestone directory as durable evidence
  - Tests use tsx for execution due to gsd extension lacking dist/ build output
observability_surfaces:
  - M007-VALIDATION-REPORT.json — machine-parseable milestone closeout artifact
  - Run command: npx tsx --test src/resources/extensions/gsd/tests/factcheck-final-audit.test.ts
drill_down_paths:
  - T01-SUMMARY.md — final audit test creation
  - T02-SUMMARY.md — schema validation and proof suite verification
duration: 30 minutes
verification_result: passed
completed_at: 2026-03-18T20:00:00Z
---

# S03: Durable Validation and Closeout

**Created final audit test that writes a machine-readable validation report, completing the milestone with repeatable, inspectable evidence.**

## What Happened

S03 completes M007-aos64t by creating a durable validation artifact and ensuring the milestone can be closed on repeatable evidence rather than test inference.

### T01: Final Audit Test

Created `factcheck-final-audit.test.ts` that:
1. Copies S01 fixtures to a temp directory (same pattern as S02 live test)
2. Runs dispatch rules against the planImpacting=true fixture data using real production code
3. Runs prompt builders to extract evidence
4. Constructs and writes `M007-VALIDATION-REPORT.json` to the milestone directory
5. Reads back the report to verify structural validity

The test exercises real dispatch rules and prompt builders (not mocks), capturing:
- Reroute action: `action=dispatch, unitType=plan-slice, unitId=M999-PROOF/S01`
- Corrected value: "5.2.0" present in prompt evidence section
- Refuted claim count: 1

### T02: Full Proof Suite Verification

Ran all three factcheck test files together:
- `factcheck-runtime-fixture.test.ts` — 30 tests (S01)
- `factcheck-runtime-live.test.ts` — 9 tests (S02)
- `factcheck-final-audit.test.ts` — 3 tests (S03)

All 42 tests pass, confirming no regressions from S01 or S02.

### Module Resolution Note

The slice plan specified `node --test` but the gsd extension tests require `npx tsx --test` because:
- Node's `--experimental-strip-types` doesn't handle transitive `.js` imports within `.ts` files
- The gsd extension has no `dist/` build output
- All local imports use `.js` extensions internally, which tsx handles correctly

This was documented in both T01 and T02 task summaries.

## Verification

| # | Command | Exit Code | Verdict |
|---|---------|-----------|---------|
| 1 | `npx tsx --test src/resources/extensions/gsd/tests/factcheck-final-audit.test.ts` | 0 | ✅ pass |
| 2 | Validate M007-VALIDATION-REPORT.json schema | 0 | ✅ pass |
| 3 | `npx tsx --test src/resources/extensions/gsd/tests/factcheck-*.test.ts` | 0 | ✅ pass (42 tests) |

## New Requirements Surfaced

None. R068, R069, R070, R071 remain active — this slice validates their implementation rather than adding new requirements.

## Deviations

- **Test execution method**: Slice plan specified `node --test` but tests require `npx tsx --test` due to module resolution limitations with `--experimental-strip-types` not handling transitive `.js` imports in local TypeScript files.

## Known Limitations

None. All must-haves satisfied.

## Follow-ups

None required. M007-aos64t is complete.

## Files Created/Modified

- `src/resources/extensions/gsd/tests/factcheck-final-audit.test.ts` — New test file exercising dispatch reroute + prompt assembly proof path, writing durable validation report
- `.gsd/milestones/M007-aos64t/M007-VALIDATION-REPORT.json` — Durable validation artifact with schema version 1, dispatch evidence, and PASS result

## Forward Intelligence

### What the next slice should know
- The fact-check proof path is now validated end-to-end with durable artifacts
- The validation report format is stable (schemaVersion: 1) and can be relied upon for milestone closeout

### What's fragile
- Test execution requires `npx tsx` — if this becomes unavailable, tests will fail. The project doesn't have a build step for the gsd extension.

### Authoritative diagnostics
- `.gsd/milestones/M007-aos64t/M007-VALIDATION-REPORT.json` — the source of truth for milestone completion
- Run `npx tsx --test src/resources/extensions/gsd/tests/factcheck-final-audit.test.ts` to regenerate

### What assumptions changed
- Original assumption: `node --test` would work for all tests
- What actually happened: gsd extension's internal `.js` imports require tsx for module resolution
