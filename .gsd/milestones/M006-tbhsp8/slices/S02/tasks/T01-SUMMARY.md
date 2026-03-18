---
id: T01
parent: S02
milestone: M006-tbhsp8
provides:
  - gsd-factcheck-coordinator agent definition for post-research claim verification
key_files:
  - src/resources/agents/gsd-factcheck-coordinator.md
key_decisions:
  - D059: Dedicated agent file (not inline hook prompt) for maintainability and extensibility
patterns_established:
  - Seven-step deterministic workflow: locate research → extract claims → init annotations → dispatch scouts → write annotations → build aggregate → report
  - Environment variable injection pattern for slice path, milestone, cycle state
  - Scout subagent dispatch with structured JSON response contract
observability_surfaces:
  - Agent logs claim count, dispatch events, and artifact write paths during execution
  - factcheck/ directory with per-claim JSON files and FACTCHECK-STATUS.json aggregate
duration: 20m
verification_result: passed
completed_at: 2026-03-17T21:03:00Z
blocker_discovered: false
---

# T01: Create gsd-factcheck-coordinator Agent Definition

**Created gsd-factcheck-coordinator agent that verifies unresolved claims from research output and writes fact-check artifacts.**

## What Happened

Created the dedicated hook agent definition file at `src/resources/agents/gsd-factcheck-coordinator.md`. The agent implements a seven-step deterministic workflow:

1. **Locate and read research output** — Reads RESEARCH.md from the slice directory
2. **Extract Unknowns Inventory** — Parses the markdown table to extract claim entries
3. **Initialize claim annotations** — Creates initial `FactCheckAnnotation` objects with `verdict: 'unverified'`
4. **Dispatch scout subagents** — Sends verification tasks to scout with structured JSON response contract
5. **Write annotation files** — Uses `resolveClaimPath()` and `formatAnnotation()` from S01 contract
6. **Build and write aggregate status** — Uses `buildAggregateStatus()` and `formatAggregateStatus()` from S01
7. **Report completion** — Outputs summary for downstream planner consumption

The agent references all S01 path functions (`resolveFactcheckDir`, `resolveClaimPath`, `resolveStatusPath`) and serialization functions (`formatAnnotation`, `formatAggregateStatus`, `buildAggregateStatus`). Includes error handling for missing files, empty inventories, and partial scout failures.

## Verification

- YAML frontmatter parses correctly with multiline `description` field using `|` block scalar
- All required frontmatter fields present: `name`, `description`, `model`, `color`, `tools`
- All S01 function references present in agent body
- Seven-step flow defined with deterministic transitions

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node -e "yaml.parse(frontmatter)"` | 0 | ✅ pass | <1s |
| 2 | `grep -c "## Step" agent.md` (7 steps) | 0 | ✅ pass | <1s |
| 3 | `grep -E "resolveClaimPath\|buildAggregateStatus" agent.md` | 0 | ✅ pass | <1s |

## Diagnostics

To inspect this agent's output after execution:
- Read `FACTCHECK-STATUS.json` for aggregate state (overallStatus, planImpacting, counts)
- Read individual claim files in `factcheck/claims/{claimId}.json`
- Failure state: if coordinator crashes mid-execution, partial annotations may exist without aggregate status

## Deviations

None. Followed task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `src/resources/agents/gsd-factcheck-coordinator.md` — Complete agent definition with seven-step verification workflow
