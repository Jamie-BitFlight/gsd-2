# S02: Coordinator and Scout Execution — UAT

**Milestone:** M006-tbhsp8 (Fact-Check Service Layer)
**Written:** 2026-03-18
**UAT Mode:** artifact-driven (tests verify file outputs, no live runtime required)

## Why This Mode Is Sufficient

S02 delivers a coordinator agent that parses research output, extracts claims, and writes artifacts. The core logic is testable without running the full auto-mode pipeline. Integration tests (`factcheck-coordinator.test.ts`) exercise the complete flow: extracting claims from markdown tables → creating annotations → writing files → verifying artifact content. Live runtime verification would require the full planner/executor loop which S03/S04 will build.

## Preconditions

- Node.js with TypeScript resolver available (`--import ./src/resources/extensions/gsd/tests/resolve-ts.mjs`)
- All S01 contract functions available in `factcheck.ts`
- Test dependencies: Node.js built-in `fs`, `path`, `os` modules

## Smoke Test

Run the coordinator test suite — all 25 tests must pass:

```bash
node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --test \
  src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts
```

Expected: `# pass 25`, `# fail 0`

## Test Cases

### 1. Claim Extraction from Unknowns Inventory

1. Create mock RESEARCH.md with Unknowns Inventory table:
   ```markdown
   ## Unknowns Inventory

   | Claim ID | Claim | Source | Status |
   |----------|-------|--------|--------|
   | C001 | actions/checkout@v4 exists | training | unverified |
   | C002 | Node.js 20 is LTS | training | unverified |
   ```
2. Run `extractClaimsFromUnknowns(researchContent)`
3. **Expected:** Returns array with 2 claims, each with id, claim, source, status fields

### 2. Annotation File Writing

1. Create annotation object with verdict "confirmed":
   ```typescript
   const annotation = {
     claimId: "C001",
     claim: "actions/checkout@v4 exists",
     source: "training",
     verdict: "confirmed",
     evidence: "Verified at https://github.com/actions/checkout/releases",
     citations: ["https://github.com/actions/checkout/releases"],
     impact: "none" as const,
   };
   ```
2. Write to temp directory using `formatAnnotation()` and `fs.writeFileSync()`
3. **Expected:** File exists at `{tempDir}/factcheck/claims/C001.json` with valid JSON containing all fields

### 3. Aggregate Status Derivation with Refutations

1. Create 3 annotations: 1 confirmed, 1 refuted (impact: slice), 1 unverified
2. Call `buildAggregateStatus(annotations, { cycle: 1, maxCycles: 5, cycleKey: "M001/S01" })`
3. **Expected:** Aggregate status has:
   - `overallStatus: "has-refutations"`
   - `planImpacting: true` (because refutation has slice impact)
   - `counts: { confirmed: 1, refuted: 1, inconclusive: 0, unverified: 1 }`

### 4. Plan-Impacting Detection

1. Create annotation with `verdict: "refuted"` and `impact: "task"`
2. Call `derivePlanImpacting([annotation])`
3. **Expected:** Returns `false` (task impact is not plan-impacting)

4. Create annotation with `verdict: "refuted"` and `impact: "milestone"`
5. Call `derivePlanImpacting([annotation])`
6. **Expected:** Returns `true` (milestone impact is plan-impacting)

### 5. Hook Configuration for Research Units

1. Call `resolvePostUnitHooks()` with empty user hooks
2. **Expected:** Returns array containing factcheck-coordinator hook with:
   - `name: "factcheck-coordinator"`
   - `after: ["research-milestone", "research-slice"]`
   - `agent: "gsd-factcheck-coordinator"`
   - `artifact: "factcheck/FACTCHECK-STATUS.json"`

### 6. Idempotency Check

1. Pre-create `factcheck/FACTCHECK-STATUS.json` with `overallStatus: "clean"`
2. Call `shouldTriggerHook(hook, slicePath)` where hook has artifact path
3. **Expected:** Returns `false` (artifact already exists, skip rerun)

## Edge Cases

### Empty Unknowns Inventory

1. RESEARCH.md has no Unknowns Inventory section
2. Call `extractClaimsFromUnknowns(content)`
3. **Expected:** Returns empty array, no error

### Malformed Table (Fewer Columns)

1. RESEARCH.md has table row with only 2 columns instead of 4
2. Call `extractClaimsFromUnknowns(content)`
3. **Expected:** Returns partial claim data where available, missing fields as undefined

### Cycle Exhaustion Status

1. Create annotations at maxCycles (5) with unverified claims remaining
2. Call `buildAggregateStatus(annotations, { cycle: 5, maxCycles: 5, cycleKey: "M001/S01" })`
3. **Expected:** `overallStatus: "exhausted"`, not "pending"

## Failure Signals

- Test suite fails with assertion errors → Check claim extraction logic or annotation schema mismatch
- Hook not returned from `resolvePostUnitHooks()` → Check default hooks configuration in preferences.ts
- Artifact files missing fields → Verify S01 contract functions (formatAnnotation, formatAggregateStatus) are called correctly
- planImpacting incorrectly false → Verify impact level enum includes "slice" and "milestone" correctly

## Not Proven By This UAT

- **Live subagent dispatch**: Tests stub scout verification with mock annotations. Real runtime would need working subagent system.
- **Planner reinvocation**: S02 writes artifacts but S03/S04 not built yet to read them and trigger planning revision.
- **Cycle persistence across restarts**: Environment variables set maxCycles/currentCycle but not persisted to disk.
- **Actual auto-mode integration**: The hook is configured but the full trigger path (research unit → hook dispatch → agent execution) not exercised end-to-end.

## Notes for Tester

- The test file `factcheck-coordinator.test.ts` uses temp directories (`/tmp/factcheck-test-*`) that are cleaned up after each test
- All 25 tests run in ~156ms — fast feedback loop
- To debug individual tests, add `console.log()` in the test or run single test with `--test-name-pattern`
- The coordinator agent definition at `src/resources/agents/gsd-factcheck-coordinator.md` contains the full seven-step workflow — reference it for expected behavior
