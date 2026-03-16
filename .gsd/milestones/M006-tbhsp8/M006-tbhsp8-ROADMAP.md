# M006-tbhsp8: Fact-Check Service Layer

**Vision:** Turn evidence-grounded planning from self-classification into a deterministic runtime correction loop: unresolved claims get independently checked, refuted planning inputs write durable evidence, and the planner is reinvoked with corrected facts before execution proceeds.

## Success Criteria

- Research units with unresolved claims automatically trigger fact-check coordination and produce durable per-claim annotation files plus an aggregate fact-check status artifact.
- REFUTED claims marked as slice- or milestone-impacting cause the correct planning unit to be reinvoked with corrected evidence before execution continues.
- Revision cycles are bounded, visible in artifacts/summaries, and pause with an explicit blocker instead of looping forever.
- Planner outputs for the control loop use explicit actors, observable triggers, decision conditions, durable outputs, and terminal states so weaker downstream agents can execute them without interpretation.

## Key Risks / Unknowns

- Planner reinvocation requires runtime behavior beyond current `retry_on` semantics — the existing hook engine retries the trigger unit rather than dispatching a different planning unit.
- Coordinator/scout orchestration has to fan out and aggregate claim verification while producing artifacts the runtime and planners can both consume.
- A vague artifact contract will create control-flow ambiguity — per-claim evidence and aggregate runtime control need distinct roles.
- If planners continue to describe control flow loosely, lower-end worker models may mis-execute the loop even if the runtime pieces exist.

## Proof Strategy

- Planner reroute semantics → retire in S04 by proving a plan-impacting REFUTED claim routes auto-mode back into `plan-slice` / `plan-milestone` with corrected evidence.
- Coordinator/scout fan-out and evidence writing → retire in S02 by proving multiple unresolved claims produce durable annotations plus aggregate status from one research trigger.
- Artifact contract ambiguity → retire in S01 by proving a machine-checkable status schema and per-claim annotation schema exist and can drive later slices.
- Planner determinism for weaker workers → retire in S03 by proving the planner consumes fact-check outputs and emits explicit control logic without vague handoffs.

## Verification Classes

- Contract verification: schema checks for annotation/status artifacts, file existence checks, parser/formatter tests, prompt-builder unit tests.
- Integration verification: real research → hook/agent coordinator → scout verification → artifact writing → planner reinvocation path exercised through auto-mode dispatch.
- Operational verification: bounded revision cycles, persisted status across sessions, explicit pause/blocker behavior after cycle exhaustion.
- UAT / human verification: inspect artifacts and revised plans to confirm the process reads as deterministic and auditable, or none if automated verification proves sufficient.

## Milestone Definition of Done

This milestone is complete only when all are true:

- The fact-check artifact contract exists and is used consistently by runtime, planner, and completion flows.
- Research-triggered coordinator execution writes per-claim evidence and aggregate runtime control artifacts.
- The planner is actually reinvoked on plan-impacting refutations, using corrected evidence rather than stale research alone.
- Revision cycles are bounded and visible; exhaustion pauses the system with a blocker instead of silently continuing.
- Completion summaries report what was checked, what was refuted, what was revised, and what remains inconclusive.
- Success criteria are re-checked against live runtime behavior, not just prompt text or file presence.

## Requirement Coverage

- Covers: R064, R065, R066, R067, R068, R069, R070, R071, R072
- Partially covers: none
- Leaves for later: R073, R074
- Orphan risks: none

## Slices

- [ ] **S01: Fact-Check Control Contract** `risk:high` `depends:[]`
  > After this: The project has a concrete fact-check contract — per-claim annotation schema, aggregate JSON status artifact, impact enum, cycle key, and routing rules are defined clearly enough for runtime and planners to consume without interpretation.
- [ ] **S02: Coordinator and Scout Execution** `risk:high` `depends:[S01]`
  > After this: A research unit with unresolved claims triggers coordinator execution, scouts verify those claims through a configurable agent/model path, and durable annotations plus aggregate status appear on disk.
- [ ] **S03: Planner Evidence Ingestion** `risk:medium` `depends:[S01,S02]`
  > After this: Planning prompts include fact-check outputs, and REFUTED claims with corrected values show up in planning context as concrete planning inputs rather than side-channel notes.
- [ ] **S04: Bounded Planner Revision Loop** `risk:high` `depends:[S02,S03]`
  > After this: A slice- or milestone-impacting REFUTED claim causes auto-mode to rerun the correct planning unit with corrected evidence, capped at 2 cycles with explicit blocker behavior on exhaustion.
- [ ] **S05: Completion Reporting and Diagnostics** `risk:low` `depends:[S04]`
  > After this: Slice and milestone summaries report verdict counts, revision cycles, unresolved inconclusive claims, and whether corrected facts were successfully absorbed before execution.

## Boundary Map

### S01 → S02

Produces:
- Fact-check directory layout under milestone/slice paths
- Per-claim annotation schema with claim ID, verdict, citations, corrected value, and impact classification
- Aggregate `FACTCHECK-STATUS.json` contract with plan-impacting flags, cycle counters, and routing hints
- Deterministic impact enum (`none`, `task`, `slice`, `milestone`) and reroute policy

Consumes:
- nothing (first slice)

### S02 → S03

Produces:
- Coordinator execution path attached to research completion
- Configurable scout invocation contract via preferences/agent selection
- Durable annotation files and aggregate status artifacts written from real research triggers

Consumes:
- S01 control contract and file layout

### S03 → S04

Produces:
- Planner prompt-builder support for fact-check status + relevant REFUTED claim annotations
- Revised planning contract that treats corrected evidence as first-class planning input
- Deterministic planner wording standard for lower-end worker agents

Consumes:
- S01 schemas and S02 produced artifacts

### S04 → S05

Produces:
- Runtime reroute path from fact-check status to `plan-slice` / `plan-milestone`
- Bounded cycle counter and exhaustion/blocker behavior
- Observable planner reinvocation records tied to fact-check outcomes

Consumes:
- S03 planner evidence ingestion surfaces

### S04 → milestone complete

Produces:
- End-to-end correction loop from research through revised planning

Consumes:
- S02 coordinator/scout evidence trail
- S03 planning-context integration

### S05 → milestone complete

Produces:
- Completion and diagnostic reporting surfaces for fact-check outcomes and correction-loop behavior

Consumes:
- S04 reroute and cycle artifacts
