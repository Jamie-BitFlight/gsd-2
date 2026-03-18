---
id: S05-UAT
parent: M006-tbhsp8
milestone: M006-tbhsp8
uat_type: artifact-driven
tested_by: automated
completed_at: 2026-03-18T11:55:00-04:00
---

# S05-UAT: Fact-Check Completion Reporting

**UAT Type:** artifact-driven  
**Why this mode is sufficient:** This slice produces a pure function with no runtime state. The behavior can be fully verified through unit tests and code inspection. No live auto-mode execution is needed.

## Preconditions

- Node.js 22+ with npm available
- Project dependencies installed (`npm install`)
- TypeScript compilation available (`npx tsc`)

## Smoke Test

Run the fact-check summary test suite:

```bash
node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/resources/extensions/gsd/tests/factcheck-summary.test.ts
```

**Expected:** All 10 tests pass in under 2 seconds.

## Test Cases

### 1. Clean status produces diagnostics with verdict counts

1. Create a temp directory with factcheck/FACTCHECK-STATUS.json containing `{"overallStatus":"clean", "counts":{"confirmed":5,"refuted":0,"inconclusive":0,"unverified":0}, ...}`
2. Call `generateFactCheckSummary(tempDir)`
3. **Expected:** Returns a markdown string containing "## Fact-Check Diagnostics", "Status: clean", "Confirmed: 5", "Refuted: 0", no "Refuted Claims:" section, no "Unresolved Claims:" section

### 2. Has-refutations status lists corrected claims

1. Create a temp directory with factcheck/FACTCHECK-STATUS.json with `{"overallStatus":"has-refutations", "counts":{"confirmed":2,"refuted":1,...}, "claimIds":["C001","C002","C003"]}`
2. Create factcheck/claims/C003.json with `{"claimId":"C003","verdict":"refuted","correctedValue":"Use OAuth 2.0","impact":"slice",...}`
3. Call `generateFactCheckSummary(tempDir)`
4. **Expected:** Returns markdown containing "Refuted Claims:", "`C003`", "impact: slice", "Use OAuth 2.0"

### 3. Exhausted status shows warning

1. Create factcheck/FACTCHECK-STATUS.json with `{"overallStatus":"exhausted", "currentCycle":3, "maxCycles":3, "counts":{"confirmed":1,"refuted":0,"inconclusive":1,"unverified":0}}`
2. Call `generateFactCheckSummary(tempDir)`
3. **Expected:** Returns markdown containing "Cycle limit reached", "Manual review recommended", "Unresolved Claims:"

### 4. Missing factcheck directory returns null

1. Call `generateFactCheckSummary('/nonexistent/path')`
2. **Expected:** Returns `null` (no crash, no error)

### 5. Invalid JSON in status file returns null

1. Create factcheck/FACTCHECK-STATUS.json with "not valid json"
2. Call `generateFactCheckSummary(tempDir)`
3. **Expected:** Returns `null` (graceful degradation, no crash)

### 6. Missing claim files are skipped

1. Create status with claimIds: ["C001", "C002", "C003"] but only create C001.json
2. Call `generateFactCheckSummary(tempDir)`
3. **Expected:** Returns valid markdown without crashing on missing C002/C003

### 7. Refuted claim without correctedValue shows placeholder

1. Create claim with `{"verdict":"refuted"}` but no correctedValue field
2. Call `generateFactCheckSummary(tempDir)`
3. **Expected:** Markdown contains "(no corrected value provided)"

### 8. Prompt templates reference fact-check diagnostics

1. Grep for "Fact-Check Diagnostics" in complete-slice.md and complete-milestone.md
2. **Expected:** Both files contain the phrase in relevant instruction steps

## Edge Cases

### Large claim counts

- Create status with 100+ claims (verified the function handles arrays without crashing)

### Malformed claim annotations

- Create claim JSON with missing required fields (verdict, claimId) — function should skip and continue

## Failure Signals

- Test suite fails → function logic broken
- TypeScript errors → type definitions incorrect  
- grep finds no "Fact-Check Diagnostics" in prompts → wiring missing

## Not Proven By This UAT

- Live auto-mode execution with real research triggers (integration-level, not unit-level)
- End-to-end fact-check flow from research → coordinator → scout → planner reinvocation (proven in S02-S04)

## Notes for Tester

- This is a pure function — no runtime state, no browser, no git operations
- Tests use temporary directories that are automatically cleaned up
- The function is designed for graceful degradation — always prefer returning null over throwing on malformed input
