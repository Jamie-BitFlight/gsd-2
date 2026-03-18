---
id: T02
parent: S02
milestone: M007-aos64t
provides:
  - Live integration test proving dispatch reroute works with real production code
  - Test proving corrected evidence (5.2.0) appears in generated plan-slice prompts
  - Proof artifact generation for S03 consumption
key_files:
  - src/resources/extensions/gsd/tests/factcheck-runtime-live.test.ts
  - src/resources/extensions/gsd/tests/dist-redirect.mjs
key_decisions:
  - Used .ts imports with --experimental-strip-types for ESM compatibility
  - Updated dist-redirect.mjs to reference main repo packages for worktree test execution
patterns_established:
  - Integration tests use temp directories with isolated .gsd project structures
  - Dispatch tests use DispatchContext construction with planning phase and activeSlice
  - Prompt tests verify corrected values appear in generated output
observability_surfaces:
  - Test output shows which stage passed (setup, dispatch, prompt, negative, artifacts)
  - Proof artifacts written to temp dir (reroute-action.json, prompt-excerpt.txt)
duration: 20m
verification_result: passed
completed_at: 2026-03-18T19:45:00Z
blocker_discovered: false
---

# T02: Write live integration test proving dispatch reroute and corrected-evidence prompt

**Created live integration test proving factcheck-reroute dispatch rule and loadFactcheckEvidence prompt injection work with real production code and S01 fixture data.**

## What Happened

Implemented the core proof artifact for the milestone — a live integration test that exercises real dispatch rules and real prompt builders (not mocks) to confirm reroute and evidence injection. The test creates an isolated temp directory with S01 fixture data structured as a real .gsd/ project, then tests four scenarios: (1) dispatch rule matches when planImpacting=true, (2) prompt contains corrected value 5.2.0 from refuted claim C001, (3) negative cases where dispatch falls through when FACTCHECK-STATUS.json is missing or planImpacting=false, and (4) proof artifacts written to disk for S03 consumption.

Key implementation detail: updated dist-redirect.mjs in the worktree to reference the main repo's built packages (packages/pi-ai/dist, packages/pi-coding-agent/dist) since worktrees share the same packages but don't have separate builds. This allows tests to import production modules like auto-dispatch.ts and auto-prompts.ts with their transitive dependencies resolving correctly.

## Verification

- All 9 tests in factcheck-runtime-live.test.ts pass
- Test asserts dispatch rule returns `{ action: "dispatch", unitType: "plan-slice" }` when FACTCHECK-STATUS.json has planImpacting=true
- Test asserts generated prompt contains "5.2.0" (corrected value from C001)
- Test asserts generated prompt contains "REFUTED" and "Fact-Check Evidence" markers
- Test writes proof artifacts (reroute-action.json, prompt-excerpt.txt) to temp dir
- S01 fixture tests still pass (30/30 tests)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/resources/extensions/gsd/tests/factcheck-runtime-live.test.ts` | 0 | ✅ pass (9/9) | 775ms |
| 2 | `node --test src/resources/extensions/gsd/tests/factcheck-runtime-fixture.test.ts` | 0 | ✅ pass (30/30) | 105ms |

## Diagnostics

- Test output shows stage progress: setup → dispatch → prompt → negative → artifacts
- Dispatch test logs: "Rule names: rewrite-docs (override gate), summarizing → complete-slice..."
- Prompt test logs: "Prompt length: 14728 chars, Contains 5.2.0: true"
- Artifacts test logs: "reroute-action.json: {\"action\":\"dispatch\",\"unitType\":\"plan-slice\"..."

## Deviations

Updated dist-redirect.mjs to reference main repo packages at `/home/ubuntulinuxqa2/repos/gsd-2/packages/` instead of relative paths. This was necessary because worktrees don't have separate package builds, and the import chain requires built packages for transitive dependencies (pi-ai, pi-coding-agent).

## Known Issues

None. All tests pass as expected.

## Files Created/Modified

- `src/resources/extensions/gsd/tests/factcheck-runtime-live.test.ts` — Created live integration test with 9 test cases proving dispatch reroute and evidence injection
- `src/resources/extensions/gsd/tests/dist-redirect.mjs` — Updated to reference main repo packages for worktree test execution
