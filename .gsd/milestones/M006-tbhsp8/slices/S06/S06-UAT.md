# S06: Milestone Planner Fact-Check Ingestion — UAT

**Milestone:** M006-tbhsp8
**Written:** 2026-03-18

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: The slice implements prompt-builder integration. The core behavior (building markdown sections from fact-check artifacts) is deterministic and fully testable through unit/integration tests. Real runtime execution would require a complete GSD setup with research-triggered fact-checks, which is covered by the operational verification class in the milestone's verification strategy.

## Preconditions

- TypeScript project compiles: `npx tsc --noEmit` passes
- Test runner available: `node --test` with experimental-strip-types

## Smoke Test

```bash
# Quick verification that the module loads without errors
node -e "
import('./src/resources/extensions/gsd/auto-prompts.ts').then(m => {
  console.log('buildMilestoneFactCheckIngestSection exists:', typeof m.buildMilestoneFactCheckIngestSection === 'function');
});
"
```

Expected: Outputs `true` for function existence.

## Test Cases

### 1. Null return when milestone has no slices directory

1. Create a temp directory with no `slices/` subdirectory
2. Call `buildMilestoneFactCheckIngestSection(tempDir, 'M999')`
3. **Expected:** Returns `null`

### 2. Null return when slices have no factcheck directories

1. Create milestone with slices but no `factcheck/` subdirectories
2. Call the helper function
3. **Expected:** Returns `null`

### 3. Null return when FACTCHECK-STATUS.json doesn't exist

1. Create milestone with slices containing `factcheck/` dirs but no status file
2. Call the helper function
3. **Expected:** Returns `null`

### 4. Null return when planImpacting is false

1. Create milestone with slices containing `factcheck/FACTCHECK-STATUS.json` where `planImpacting: false`
2. Call the helper function
3. **Expected:** Returns `null`

### 5. Null return when only task-impact REFUTED claims exist

1. Create milestone with slices containing REFUTED claims with `impact: "task"`
2. Call the helper function
3. **Expected:** Returns `null` (milestone-level section only includes milestone-impact)

### 6. Null return when only slice-impact REFUTED claims exist

1. Create milestone with slices containing REFUTED claims with `impact: "slice"`
2. Call the helper function
3. **Expected:** Returns `null` (milestone-level section filters to milestone-impact only)

### 7. Includes milestone-impact REFUTED claims

1. Create milestone with slices containing REFUTED claims with `impact: "milestone"`
2. Call the helper function
3. **Expected:** Returns markdown section containing:
   - Claim text
   - Corrected value
   - Source slice attribution

### 8. Excludes VERIFIED claims even with milestone impact

1. Create milestone with slices containing VERIFIED claims with `impact: "milestone"`
2. Call the helper function
3. **Expected:** Returns `null` (only REFUTED claims included)

### 9. Aggregates milestone-impact claims from multiple slices

1. Create milestone with 3 slices, 2 containing milestone-impact REFUTED claims
2. Call the helper function
3. **Expected:** Markdown section includes claims from both slices with correct attribution

### 10. Mixed impact levels — only milestone included

1. Create milestone with slices containing task, slice, and milestone-impact REFUTED claims
2. Call the helper function
3. **Expected:** Only milestone-impact claims appear in the section

### 11. buildPlanMilestonePrompt includes fact-check corrections section

1. Call `buildPlanMilestonePrompt` with a milestone that has milestone-impact REFUTED claims
2. **Expected:** Output contains `### Injected Fact-Check Corrections (Milestone-Level)` heading

### 12. buildPlanMilestonePrompt omits section when no corrections

1. Call `buildPlanMilestonePrompt` with a milestone that has no factcheck directories
2. **Expected:** Output does NOT contain "Injected Fact-Check Corrections"

### 13. Graceful handling of mixed slices

1. Create milestone with 3 slices: one with no factcheck, one with slice-impact only, one with milestone-impact
2. Call the helper function
3. **Expected:** Returns milestone-impact claims only, gracefully skips missing/inapplicable slices

## Edge Cases

### Empty slice directory names

- Slices with empty or whitespace-only directory names are gracefully skipped
- No error thrown, empty results returned

### Unparseable FACTCHECK-STATUS.json

- Invalid JSON is logged via the parseAggregateStatus error path
- Slice is gracefully skipped, no error propagates

### Missing claim annotation files

- If status references a claim file that doesn't exist, the claim is silently skipped
- Other claims in the same slice are still processed

## Failure Signals

- TypeScript compilation errors in auto-prompts.ts
- Test failures in factcheck-milestone-ingestion.test.ts
- Missing exports from auto-prompts.ts module
- Section appears with wrong heading format (should be `###` not `##`)

## Not Proven By This UAT

- **Live runtime execution** — The artifact-driven tests prove the prompt-building contract works. A full end-to-end test from research trigger → fact-check → planner reinvocation would require a running GSD instance with real research units.
- **Session persistence** — The milestone's cycle counter and blocker behavior on exhaustion were proven in S04, not this slice.

## Notes for Tester

- The helper function requires both `base` (project root) and `mid` (milestone ID) parameters
- All tests use isolated temp directories that are cleaned up after each test
- Run tests via: `node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test src/resources/extensions/gsd/tests/factcheck-milestone-ingestion.test.ts`
- The section heading uses `###` (H3) to distinguish injected content from template instructions (`##` / H2)
