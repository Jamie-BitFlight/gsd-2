# S03: Durable Validation and Closeout — UAT

**Milestone:** M007-aos64t
**Written:** 2026-03-18

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: The slice produces a machine-readable validation report (`M007-VALIDATION-REPORT.json`) that proves the fact-check proof path works. No live human interaction required — the test verifies the report structure and content.

## Preconditions

- Node.js 22+ with `npx` available
- Project dependencies installed (`npm install` completed)
- Test can run from any working directory

## Smoke Test

```bash
npx tsx --test src/resources/extensions/gsd/tests/factcheck-final-audit.test.ts
```

Expected: 3 tests pass, `M007-VALIDATION-REPORT.json` written to `.gsd/milestones/M007-aos64t/`

## Test Cases

### 1. Final audit test writes validation report

1. Run: `npx tsx --test src/resources/extensions/gsd/tests/factcheck-final-audit.test.ts`
2. **Expected:** All 3 tests pass

### 2. Validation report exists and has correct schema

1. Check file exists: `.gsd/milestones/M007-aos64t/M007-VALIDATION-REPORT.json`
2. **Expected:** `schemaVersion: 1`, `result: "PASS"`, `evidence.refutedCount >= 1`, `evidence.rerouteTarget` present

### 3. Full proof suite passes (no regressions)

1. Run: `npx tsx --test src/resources/extensions/gsd/tests/factcheck-*.test.ts`
2. **Expected:** 42 tests pass (3 final-audit, 30 fixture, 9 live)

### 4. Corrected evidence verified in prompt

1. Inspect `evidence.promptExcerptContains` in validation report
2. **Expected:** Contains "5.2.0" (the corrected value from refuted claim C001)

### 5. Dispatch action verified

1. Inspect `evidence.dispatchAction` in validation report
2. **Expected:** `action: "dispatch"`, `unitType: "plan-slice"`

## Edge Cases

- **Missing dependencies:** Tests require `npx tsx` because Node's `--experimental-strip-types` doesn't handle transitive `.js` imports in `.ts` files. If `tsx` is missing, install with: `npm install -D tsx`
- **Temp directory cleanup:** Tests use temp directories that are cleaned up after each run. This is expected behavior.
- **Pre-existing test failures:** The broader project has unrelated test failures (chokidar, @octokit/rest modules). These do not affect factcheck tests.

## Failure Signals

- Test exits with non-zero code → check `npx tsx` is available
- Validation report missing → check test output for write errors
- `result: "FAIL"` in report → inspect `evidence` object for what failed

## Not Proven By This UAT

- Full end-to-end live execution with real LLM calls (covered by S02 live tests)
- Performance under load (not a requirement)
- Browser/interactive functionality (not applicable)

## Notes for Tester

- The test uses `npx tsx --test` NOT `node --test` due to module resolution limitations with the gsd extension's internal `.js` imports
- The validation report is the primary artifact — it's what future milestone closeout will check
- All S01 (fixture) and S02 (live) tests continue to pass alongside S03 (final-audit)
