---
id: S01-UAT
parent: M006-tbhsp8
milestone: M006-tbhsp8
slice: S01
verification_mode: artifact-driven
why_sufficient: This is a pure contract slice — no runtime hooks or live execution. All verification is compile-time (tsc --noEmit) and test-time (vitest/node --test). The contract is proven by successful serialization round-trips and type compilation.
---

# S01: Fact-Check Control Contract — UAT

**UAT Mode:** artifact-driven  
**Why sufficient:** This slice defines the fact-check contract (types + serialization). No runtime hooks exist yet. Verification is purely compile-time and test-time.

## Preconditions

- Node.js 22+ with npm installed
- TypeScript project builds (`npx tsc --noEmit` passes)
- No external services required

## Smoke Test

```bash
node --test src/resources/extensions/gsd/tests/factcheck.test.ts
npx tsc --noEmit
```

**Expected:** All 37 tests pass, TypeScript compiles with zero errors.

## Test Cases

### 1. Annotation Schema: Full Round-Trip

1. Create a FactCheckAnnotation with all fields populated
2. Call `formatAnnotation(annotation)` → JSON string
3. Call `parseAnnotation(json)` → parsed annotation
4. Compare original vs parsed

**Expected:** Identical objects — all fields round-trip correctly.

### 2. Annotation Schema: All Verdict × Impact Combinations

1. For each verdict in `['confirmed', 'refuted', 'inconclusive', 'unverified']`
2. For each impact in `['none', 'task', 'slice', 'milestone']`
3. Create annotation, format, parse, verify round-trip

**Expected:** 16/16 combinations pass (verified by tests 1-16).

### 3. Annotation Schema: Corrected Value Variants

1. Create annotation with `correctedValue: null`
2. Create annotation with `correctedValue: "corrected value"`
3. Round-trip both

**Expected:** Both variants serialize and parse correctly (tests 17-18).

### 4. Aggregate Status: Full Round-Trip

1. Create FactCheckAggregateStatus with all fields
2. Call `formatAggregateStatus(status)` → JSON
3. Call `parseAggregateStatus(json)` → parsed status
4. Compare

**Expected:** Identical objects (test 19).

### 5. Aggregate Status: buildAggregateStatus Empty List

1. Call `buildAggregateStatus([], { cycleKey: 'M001-S01-1', maxCycles: 2, currentCycle: 1 })`
2. Check: overallStatus === 'clean', planImpacting === false, all counts === 0

**Expected:** Status computed correctly (test 20).

### 6. Aggregate Status: buildAggregateStatus Mixed Annotations

1. Build annotations array with: 2 confirmed, 1 refuted, 1 inconclusive, 1 unverified
2. Call buildAggregateStatus
3. Verify counts match: total=5, confirmed=2, refuted=1, inconclusive=1, unverified=1

**Expected:** Counts correct (test 21).

### 7. Aggregate Status: Plan-Impacting Derivation (Slice)

1. Create annotation with verdict='refuted', impact='slice'
2. Call derivePlanImpacting([annotation])
3. Verify returns true

**Expected:** Plan-impacting correctly detected (test 22).

### 8. Aggregate Status: Plan-Impacting Derivation (Milestone)

1. Create annotation with verdict='refuted', impact='milestone'
2. Call derivePlanImpacting([annotation])
3. Verify returns true

**Expected:** Plan-impacting correctly detected (test 23).

### 9. Aggregate Status: Exhausted Cycle Detection

1. Call buildAggregateStatus with currentCycle >= maxCycles (e.g., 2 >= 2)
2. Verify overallStatus === 'exhausted'

**Expected:** Exhausted status when cycle limit reached (test 24).

### 10. File Path Resolution: Factcheck Directory

1. Call `resolveFactcheckDir('/some/milestone/slices/S01')`
2. Verify returns `/some/milestone/slices/S01/factcheck`

**Expected:** Correct directory path (test 26).

### 11. File Path Resolution: Claim File

1. Call `resolveClaimPath('/some/milestone/slices/S01', 'claim-123')`
2. Verify returns `/some/milestone/slices/S01/factcheck/claims/claim-123.json`

**Expected:** Correct per-claim file path (test 27).

### 12. File Path Resolution: Status File

1. Call `resolveStatusPath('/some/milestone/slices/S01')`
2. Verify returns `/some/milestone/slices/S01/factcheck/FACTCHECK-STATUS.json`

**Expected:** Correct aggregate status path (test 28).

### 13. Validation: Missing Claim ID

1. Parse JSON with missing claimId field
2. Verify throws descriptive error

**Expected:** Error message mentions "claimId" (test 29).

### 14. Validation: Invalid Verdict

1. Parse JSON with verdict: 'invalid'
2. Verify throws descriptive error

**Expected:** Error message mentions "verdict" (test 30).

### 15. Validation: Invalid Impact

1. Parse JSON with impact: 'invalid'
2. Verify throws descriptive error

**Expected:** Error message mentions "impact" (test 31).

### 16. Validation: Wrong Schema Version

1. Parse aggregate status with schemaVersion: 99
2. Verify throws descriptive error

**Expected:** Error message mentions "schemaVersion" (test 33).

## Edge Cases

### Empty Claims List
- Create aggregate status from empty annotation array
- Verify overallStatus === 'clean', planImpacting === false

### Max Cycle Exhaustion
- Set currentCycle === maxCycles (e.g., 2 === 2) with unresolved claims
- Verify overallStatus === 'exhausted'

### Missing Optional Fields
- Parse annotation without correctedValue (should default to undefined in parsed output, not throw)
- Verified by tests 17-18 handling null vs string correctedValue

## Failure Signals

- Any test in `factcheck.test.ts` fails → contract broken
- `npx tsc --noEmit` errors → type exports missing or malformed
- Path functions return wrong format → S02/S03 will write to wrong locations
- parseAnnotation/parseAggregateStatus don't throw on invalid input → downstream consumers get bad data

## Requirements Proved By This UAT

- R065 (annotation durability) — Proven by 18 annotation round-trip tests
- R066 (aggregate status machine-readability) — Proven by 8 aggregate status tests
- R072 (deterministic routing rules) — FACTCHECK_ROUTING_RULES constant exists and is testable

## Not Proven By This UAT

- R064 (coordinator evaluates claims) — S02 adds coordinator
- R068 (planner reads fact-check outputs) — S03 integrates into prompts
- R070 (explicit revision routing) — S04 implements reroute logic

## Notes for Tester

- All functions are pure — no I/O, no side effects, no network
- Tests run in ~100ms — very fast feedback loop
- If you add new test cases, put them in `factcheck.test.ts` alongside existing tests
- The contract is stable — breaking changes would be caught by the round-trip tests
