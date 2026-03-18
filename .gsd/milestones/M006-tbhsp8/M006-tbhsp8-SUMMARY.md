---
id: M006-tbhsp8
provides:
  - Durable fact-check artifacts: per-claim annotations plus aggregate FACTCHECK-STATUS.json control surfaces
  - Research-triggered coordinator execution with configurable scout routing and default post-unit hook wiring
  - Planner ingestion for slice- and milestone-level corrected evidence
  - Bounded planner reroute loop with explicit exhaustion behavior and completion diagnostics
key_decisions:
  - D058: Pre-execution fact-check revisions reroute to plan-slice or plan-milestone by impact scope; replan-slice remains blocker-only
  - D061: Runtime-control planner artifacts must explicitly name actors, triggers, decisions, outputs, feedback loops, and terminal states
  - D064: Milestone planner ingestion includes only milestone-impact refutations to avoid slice-level context pollution
patterns_established:
  - Split contract/runtime/prompt-loop design: schemas first, coordinator writes artifacts, planners ingest corrected evidence, dispatcher reroutes on plan-impacting refutations
  - Aggregate JSON control artifact plus per-claim evidence files, with runtime reading only the minimum needed surface for routing
  - Distinct injected fact-check markdown sections in planner/completion prompts, with H3 headings for runtime-added evidence
observability_surfaces:
  - FACTCHECK-STATUS.json currentCycle, maxCycles, overallStatus, planImpacting, and claimIds
  - factcheck/claims/*.json annotation files with verdict, correctedValue, citations, and impact
  - Integration tests: factcheck.test.ts, factcheck-coordinator.test.ts, factcheck-ingestion.test.ts, auto-recovery-loop.test.ts, factcheck-summary.test.ts, factcheck-milestone-ingestion.test.ts
requirement_outcomes:
  - id: R064
    from_status: active
    to_status: validated
    proof: S02 wired the default post_unit_hooks factcheck coordinator after research-slice and research-milestone; 25 factcheck-coordinator integration tests and 44 post-unit hook tests prove trigger and execution wiring.
  - id: R065
    from_status: active
    to_status: validated
    proof: S01 defined and tested the FactCheckAnnotation contract with 37 factcheck tests; S02 proved coordinator-written per-claim JSON annotations on disk.
  - id: R066
    from_status: active
    to_status: validated
    proof: S01 defined FACTCHECK-STATUS.json with machine-checkable parsing/building; S02 and S04 proved runtime inspection for routing and cycle control through coordinator and reroute tests.
  - id: R067
    from_status: active
    to_status: validated
    proof: S02 added resolveHookModel and agent-based hook prompt resolution so coordinator/scout execution follows preferences and agent selection instead of a hardcoded model family.
  - id: R068
    from_status: active
    to_status: validated
    proof: S03 injected slice-level refuted corrections into buildPlanSlicePrompt and S06 injected milestone-impact corrections into buildPlanMilestonePrompt, covered by 11 plus 13 integration tests.
  - id: R069
    from_status: active
    to_status: validated
    proof: S04 added bounded reroute logic and proved reroute, exhaustion, cycle increment, and highest-impact resolution in 11 auto-recovery-loop integration tests.
  - id: R070
    from_status: active
    to_status: validated
    proof: S04 dispatch tests prove slice-impact refutations route to plan-slice and milestone-impact refutations route to plan-milestone, leaving replan-slice reserved for execution blockers.
  - id: R071
    from_status: active
    to_status: validated
    proof: S05 added generateFactCheckSummary and prompt wiring, with 10 tests covering clean, refuted, exhausted, mixed, and missing-artifact scenarios.
  - id: R072
    from_status: active
    to_status: validated
    proof: The milestone roadmap, D061, and S03-S06 prompt wiring collectively enforced deterministic runtime-control planning surfaces with explicit correction sections, reroute targets, cycle bounds, and terminal reporting.
duration: 1d
verification_result: failed
completed_at: 2026-03-18
---

# M006-tbhsp8: Fact-Check Service Layer

**GSD now turns unresolved research claims into durable fact-check artifacts, injects corrected evidence into planners, and reroutes planning on plan-impacting refutations with bounded cycles — but the milestone still lacks a live end-to-end runtime proof through the full auto-mode path.**

## What Happened

M006-tbhsp8 converted M005-8pv12q's evidence-discipline vocabulary into a structural correction loop.

S01 established the contract: typed per-claim annotations, aggregate FACTCHECK-STATUS.json, path helpers, derivation helpers, and deterministic routing rules. That gave later slices a machine-checkable surface instead of free-form prose.

S02 turned the contract into runtime production behavior. A dedicated `gsd-factcheck-coordinator` agent was added as a default post-unit hook after `research-slice` and `research-milestone`, with configurable model/agent resolution. The coordinator extracts verifiable unresolved claims, dispatches scout work, and writes both annotation files and aggregate status artifacts.

S03 and S06 made corrected evidence actionable. Slice planning now ingests REFUTED claims with `slice` or `milestone` impact, while milestone planning ingests only `milestone`-impact refutations. Both prompt paths present corrected values in explicit injected sections and instruct planners to treat them as authoritative inputs.

S04 closed the runtime loop by teaching the dispatcher to inspect FACTCHECK-STATUS.json before ordinary planning dispatch. Plan-impacting refutations now reroute to `plan-slice` or `plan-milestone`, cycle counts are persisted in the aggregate artifact, and exhaustion flips the aggregate status to `exhausted` with an explicit stop reason instead of allowing silent looping.

S05 completed the reporting side. Completion prompt assembly can now summarize verdict counts, revision cycles, unresolved claims, and refuted corrections so the system can report whether the loop actually revised planning inputs rather than merely logging them.

Taken together, the slices deliver the intended architecture: research emits checkable claims, the coordinator writes durable evidence, planners ingest corrected facts, the dispatcher reroutes on plan-impacting refutations, and completion surfaces what happened.

## Cross-Slice Verification

### Success criteria check

1. **Research units with unresolved claims automatically trigger fact-check coordination and produce durable per-claim annotation files plus an aggregate fact-check status artifact.**
   - **Met by evidence:** S02 added the default post-unit hook for `research-slice` and `research-milestone`, plus the `gsd-factcheck-coordinator` agent. Proof comes from 25 passing `factcheck-coordinator.test.ts` cases and 44 passing post-unit hook tests. S01 contract tests prove the artifact schema and serializers.

2. **REFUTED claims marked as slice- or milestone-impacting cause the correct planning unit to be reinvoked with corrected evidence before execution continues.**
   - **Met by evidence:** S04 proved dispatcher reroute behavior in 11 `auto-recovery-loop.test.ts` integration tests. S03 and S06 proved the reinvoked planners actually ingest corrected evidence via 11 `factcheck-ingestion.test.ts` and 13 `factcheck-milestone-ingestion.test.ts` cases.

3. **Revision cycles are bounded, visible in artifacts/summaries, and pause with an explicit blocker instead of looping forever.**
   - **Met by evidence:** S04 persists `currentCycle`, `maxCycles`, and `overallStatus: "exhausted"` in FACTCHECK-STATUS.json and returns an explicit exhausted stop reason. S05 surfaces those values in completion diagnostics, covered by 10 `factcheck-summary.test.ts` cases.

4. **Planner outputs for the control loop use explicit actors, observable triggers, decision conditions, durable outputs, and terminal states so weaker downstream agents can execute them without interpretation.**
   - **Partially met by structural evidence, but not fully re-verified in live runtime execution:** D061 set the standard, and S03-S06 prompt wiring makes correction sections, reroute targets, and terminal states explicit. However, the milestone summaries also note that no live end-to-end runtime test was run through the full auto-mode path.

### Definition of done check

- **All slices marked complete:** yes — S01 through S06 are present and marked `[x]`.
- **All slice summaries exist:** yes — verified on disk for S01-S06.
- **Cross-slice integration points work in tests:** yes — contract → coordinator → planner ingestion → reroute → reporting is covered by the slice test suites.
- **Success criteria re-checked against live runtime behavior, not just prompt text or file presence:** **no** — this milestone lacks a live end-to-end auto-mode execution proof. S06 explicitly records this gap as a known limitation.

### Verification conclusion

The milestone is **functionally assembled and requirement-complete by test evidence**, but it is **not passing final milestone verification** because the roadmap definition of done required a live runtime re-check and that proof was not produced in this closeout packet.

## Requirement Changes

- R064: active → validated — S02 default post-unit hook plus 25 coordinator tests and 44 hook tests prove automatic fact-check coordination after research units.
- R065: active → validated — S01 schema/serialization tests plus S02 artifact-writing integration tests prove durable per-claim annotation files.
- R066: active → validated — S01 aggregate status contract and S02/S04 runtime inspection tests prove a machine-readable routing/cycle-control artifact.
- R067: active → validated — S02 preference-driven hook/agent/model resolution proves configurable scout execution without hardcoded model family assumptions.
- R068: active → validated — S03 and S06 planner-ingestion tests prove corrected fact-check evidence becomes a direct planning input for both reroute targets.
- R069: active → validated — S04 proves bounded planner reinvocation with cycle tracking and exhaustion behavior via 11 integration tests.
- R070: active → validated — S04 proves deterministic reroute target selection: slice-impact → `plan-slice`, milestone-impact → `plan-milestone`.
- R071: active → validated — S05 proves completion reporting of verdicts, cycles, unresolved claims, and correction outcomes via 10 tests.
- R072: active → validated — the roadmap/process standard plus implemented prompt surfaces provide the required deterministic runtime-control structure, though live runtime confirmation is still missing.

## Forward Intelligence

### What the next milestone should know
- The fact-check loop is now structurally complete in code: artifact contract, coordinator hook, planner ingestion, reroute logic, and completion diagnostics all exist and are tested. M007 should treat FACTCHECK-STATUS.json and per-claim annotations as the canonical observability surfaces.
- Milestone-level planning intentionally ingests only `impact === "milestone"` refutations; slice-impact corrections belong in slice reroutes and should not be reintroduced into milestone prompts.
- The best starting diagnostics for future work are the six focused test suites added across S01-S06; they isolate failures by stage of the loop rather than forcing a full auto-mode reproduction.

### What's fragile
- There is still **no live end-to-end auto-mode proof** that exercises research → coordinator → reroute → reinvoked planner in one runtime pass — this matters because the milestone definition of done required live runtime confirmation, and future telemetry/experiment work will otherwise rest on test-only evidence.

### Authoritative diagnostics
- `src/resources/extensions/gsd/tests/auto-recovery-loop.test.ts` — best proof that routing and cycle exhaustion semantics are correct.
- `src/resources/extensions/gsd/tests/factcheck-ingestion.test.ts` and `src/resources/extensions/gsd/tests/factcheck-milestone-ingestion.test.ts` — authoritative for what corrected evidence planners actually see.
- `factcheck/FACTCHECK-STATUS.json` inside a slice directory — authoritative runtime control surface for currentCycle, maxCycles, overallStatus, and planImpacting.

### What assumptions changed
- Original assumption: prompt and unit-level integration tests would likely be sufficient to close the milestone.
- What actually happened: the code and requirement proofs are strong, but the roadmap explicitly demanded a live runtime re-check, and S06 still recorded that gap.

## Files Created/Modified

- `.gsd/milestones/M006-tbhsp8/M006-tbhsp8-SUMMARY.md` — Final milestone closeout summary with success-criteria verification, requirement transitions, and remaining verification gap.
- `.gsd/REQUIREMENTS.md` — Updated R064-R068 and R072 from active to validated with evidence-backed validation notes.
- `.gsd/PROJECT.md` — Updated current state and milestone sequence wording to reflect M006 closeout and the remaining live-runtime verification gap.
- `.gsd/KNOWLEDGE.md` — Added reusable milestone lesson about test-complete control loops still needing explicit live runtime proof when the roadmap requires it.
