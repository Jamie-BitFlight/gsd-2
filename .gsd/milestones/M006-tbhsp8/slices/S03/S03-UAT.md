# S03: Planner Evidence Ingestion — UAT

**Milestone:** M006-tbhsp8
**Written:** 2026-03-18

## UAT Type

- **UAT mode:** artifact-driven (unit/integration tests with temp directories)
- **Why this mode is sufficient:** The slice delivers a prompt-building function that reads fact-check artifacts and injects corrected values. This is a pure function with deterministic inputs/outputs — testing via temp directories with mock artifacts proves the contract works without requiring full auto-mode runtime.

## Preconditions

1. TypeScript compilation succeeds: `npx tsc --noEmit` exits 0
2. Test runner available: `node --test` with experimental strip types
3. Working directory is the M006-tbhsp8 worktree

## Smoke Test

```bash
cd /home/ubuntulinuxqa2/repos/gsd-2/.gsd/worktrees/M006-tbhsp8
node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts
```

Expected: 11/11 tests pass in under 2 seconds.

## Test Cases

### 1. No factcheck directory exists

1. Create a temp directory structure: `<tmp>/M006/factcheck/` (missing the factcheck directory entirely)
2. Call `buildFactCheckIngestSection(milestonePath, slicePath)` where milestonePath points to the temp dir
3. **Expected:** Returns `null` — no errors, no sections added

### 2. FACTCHECK-STATUS.json does not exist

1. Create: `<tmp>/M006/s03/factcheck/` (directory exists but no status file)
2. Call `buildFactCheckIngestSection` with paths to this directory
3. **Expected:** Returns `null`

### 3. planImpacting is false in FACTCHECK-STATUS.json

1. Create `factcheck/FACTCHECK-STATUS.json` with:
   ```json
   {
     "planImpacting": false,
     "claimIds": ["claim-001"],
     "checkedAt": "2026-03-18T00:00:00Z"
   }
   ```
2. Call `buildFactCheckIngestSection`
3. **Expected:** Returns `null` — planImpacting=false means no corrections needed for planning

### 4. No REFUTED claims with slice/milestone impact

1. Create status with `planImpacting: true` and `claimIds: ["claim-001"]`
2. Create `factcheck/claims/claim-001.json` with:
   ```json
   {
     "id": "claim-001",
     "verdict": "refuted",
     "impact": "task",
     "correctedValue": "should not appear"
   }
   ```
3. Call `buildFactCheckIngestSection`
4. **Expected:** Returns `null` — task-level impact is filtered out

### 5. REFUTED claim with slice impact is included

1. Create status: `planImpacting: true`, `claimIds: ["claim-002"]`
2. Create claim annotation:
   ```json
   {
     "id": "claim-002",
     "verdict": "refuted",
     "impact": "slice",
     "originalClaim": "The plugin uses @gsd/pi-tui v2",
     "correctedValue": "@gsd/pi-tui v3",
     "citations": [{"source": "package.json", "context": "\"@gsd/pi-tui\": \"^3.0.0\""}]
   }
   ```
3. Call `buildFactCheckIngestSection`
4. **Expected:** Returns a string containing:
   - "Injected Fact-Check Corrections" header
   - "claim-002"
   - "slice" (impact level)
   - "@gsd/pi-tui v3" (the corrected value)
   - NOT "task" or the original incorrect claim

### 6. REFUTED claim with milestone impact is included

1. Create claim annotation with `"impact": "milestone"`
2. Call `buildFactCheckIngestSection`
3. **Expected:** Returns string containing the milestone-impact claim with corrected value

### 7. VERIFIED claims are excluded

1. Create status with `claimIds: ["claim-003", "claim-004"]`
2. claim-003: `verdict: "verified"`, `impact: "slice"`
3. claim-004: `verdict: "refuted"`, `impact: "slice"`
4. Call `buildFactCheckIngestSection`
5. **Expected:** Only claim-004 appears in output — verified claims are not corrections

### 8. buildPlanSlicePrompt includes corrections when present

1. Set up factcheck directory with a REFUTED slice-impact claim
2. Call `buildPlanSlicePrompt("M006", "Fact-Check Service Layer", "S03", "Planner Evidence Ingestion", basePath)`
3. **Expected:** Generated prompt contains "### Injected Fact-Check Corrections" section with the claim data

### 9. buildPlanSlicePrompt omits section when no corrections

1. Do NOT create factcheck directory
2. Call `buildPlanSlicePrompt` with same args
3. **Expected:** Generated prompt does NOT contain "Injected Fact-Check Corrections"

### 10. Multiple claims with mixed verdict/impact

1. Create status with 4 claims:
   - claim-a: verified, slice (should appear? NO)
   - claim-b: refuted, task (should appear? NO)
   - claim-c: refuted, slice (should appear? YES)
   - claim-d: refuted, milestone (should appear? YES)
2. Call `buildFactCheckIngestSection`
3. **Expected:** Output includes claim-c and claim-d only

## Edge Cases

### Empty claimIds array

- Create status with `"planImpacting": true` but `"claimIds": []`
- **Expected:** Returns `null` — no claims to check

### Missing claim annotation file

- Status references claim-005 but `claims/claim-005.json` doesn't exist
- **Expected:** Returns `null` or gracefully skips missing claim (test should verify behavior)

### Malformed JSON in claim annotation

- Create a claim file with invalid JSON
- **Expected:** Should handle gracefully (test verifies error is caught)

## Failure Signals

- Tests fail with assertion errors — indicates filtering logic or path resolution is broken
- TypeScript compilation fails — schema mismatch between helper and fact-check types
- Null is not returned when it should be — prompts would include empty or incorrect sections
- Section appears when it shouldn't — plan-slice prompts would be bloated with irrelevant content

## Not Proven By This UAT

- **Live runtime behavior:** The helper is tested with mock artifacts, but the actual planner reinvocation loop (S04) is not exercised
- **Coordination path:** S02's coordinator execution that produces the factcheck artifacts is assumed to work; this UAT only tests the planning-side consumption
- **Path resolution in distributed scenarios:** Assumes local filesystem; S04 or later work may need adjustment for remote worktrees

## Notes for Tester

- The test file uses `node:test` with `node:assert/strict` — follow that pattern for any additions
- Test setup uses a `createFixtureBase` helper that builds minimal ROADMAP structure — reuse this pattern
- All tests run against temp directories that are cleaned up after each test — no manual cleanup needed
- If adding new test cases, ensure the claim annotation JSON matches the schema in `factcheck.ts` (verdict, impact, correctedValue, citations)
