---
estimated_steps: 5
estimated_files: 1
---

# T04: Add Integration Tests for Coordinator Flow

**Slice:** S02 — Coordinator and Scout Execution
**Milestone:** M006-tbhsp8

## Description

Create comprehensive tests verifying the fact-check coordinator flow: extracting claims from research output, creating annotations, and writing aggregate status. Tests prove the slice's objective stopping condition — that research units with unresolved claims produce durable artifacts.

## Steps

1. Create test file at `src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts`

2. Write claim extraction tests:
   - Create mock research output with Unknowns Inventory section containing 2-3 claims
   - Test claim parsing: version claim, API signature claim, config format claim
   - Verify each claim is extracted with correct fields (claimId, description, evidence basis)

3. Write annotation generation tests:
   - Given mock claim extraction results, create FactCheckAnnotation objects
   - Test each verdict type: confirmed, refuted, inconclusive, unverified
   - Test impact assessment logic for each level: none, task, slice, milestone
   - Verify `formatAnnotation()` produces valid JSON matching schema

4. Write aggregate status tests:
   - Given array of annotations, verify `buildAggregateStatus()` produces correct:
     - counts (total, confirmed, refuted, inconclusive, unverified)
     - overallStatus derivation (clean, has-refutations, pending, exhausted)
     - planImpacting flag (true if any refuted claim has slice/milestone impact)
     - cycleKey format ({milestoneId}/{sliceId}/cycle-{n})
   - Test edge case: empty annotations → clean status

5. Write integration test simulating full coordinator flow:
   - Mock research output → extract claims → create annotations → write files → verify artifacts
   - Use temp directory for file writes
   - Verify annotation files exist at correct paths
   - Verify FACTCHECK-STATUS.json exists with correct content
   - Clean up temp files after test

## Must-Haves

- [ ] Test file exists at `src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts`
- [ ] Tests for claim extraction from Unknowns Inventory format
- [ ] Tests for annotation generation with all verdict/impact combinations
- [ ] Tests for aggregate status building and planImpacting derivation
- [ ] Integration test writing actual files to temp directory
- [ ] All tests pass: `node --test src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts`

## Verification

- Run tests: `node --test src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts`
- All assertions pass
- No test timeouts or errors
- Verify test coverage includes all S02 requirements (R064, R065, R066, R067)

## Observability Impact

- Tests serve as executable documentation of expected coordinator behavior
- Test failures clearly indicate which part of the flow is broken
- Mock data patterns can be referenced when debugging real coordinator runs

## Inputs

- `src/resources/extensions/gsd/factcheck.ts` — Functions under test
- `src/resources/extensions/gsd/types.ts` — Types for test assertions
- `src/resources/extensions/gsd/tests/factcheck.test.ts` — Existing test patterns to follow
- Mock research output examples from S01 research

## Expected Output

- `src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts` — Complete test file with 15-20 test cases
