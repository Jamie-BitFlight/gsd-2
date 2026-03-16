# M006-tbhsp8: Fact-Check Service Layer

**Gathered:** 2026-03-16
**Status:** Ready for planning

## Project Description

Build the runtime fact-check layer that turns M005-8pv12q's prompt-level evidence discipline into a structural correction loop. Research and planning artifacts can contain unresolved claims; this milestone adds a fact-check coordinator that evaluates those claims, dispatches scouts to verify them, writes durable evidence artifacts, and triggers planner reinvocation when a REFUTED claim changes planning inputs. The goal is not just to annotate uncertainty, but to make corrected facts change the plan before execution proceeds.

This milestone also tightens the process contract for downstream agents. Planner outputs for runtime-control work must eliminate wiggle room for lower-end worker models by naming actors, observable triggers, decision conditions, durable outputs, bounded feedback loops, and terminal states explicitly.

## Why This Milestone

M005-8pv12q gave GSD the vocabulary to describe what it knows versus what it is guessing. It did not solve the structural problem that the same model classifies its own claims. That leaves the pipeline vulnerable to confidently wrong planning inputs. M006 solves that by adding independent verification and a deterministic correction loop.

This needs to happen now because the queued milestones depend on it. M007 telemetry, M008 experiments, and M009 reporting only matter if the runtime can actually verify claims and revise plans when facts change.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Run GSD planning on work that contains external or uncertain claims and know that those claims are independently checked before bad assumptions harden into execution.
- See durable fact-check artifacts on disk and trust that REFUTED plan-impacting claims cause a bounded planning revision instead of being silently logged and ignored.

### Entry point / environment

- Entry point: `/gsd auto` planning flow (`research-*`, `plan-*`, `replan-*` units)
- Environment: local dev, auto-mode runtime, prompt dispatch pipeline
- Live dependencies involved: filesystem, hook engine, auto-dispatch/runtime state machine, subagent execution

## Completion Class

- Contract complete means: annotation file schema, aggregate fact-check status schema, impact classification, and planner-revision routing rules exist and are machine-checkable.
- Integration complete means: research → coordinator → scout verification → aggregate status → planner reinvocation → revised plan works across the real auto-mode dispatch path.
- Operational complete means: revision cycles are bounded, observable, durable across restarts, and pause with evidence instead of looping indefinitely.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- A research unit with unresolved claims triggers coordinator execution, produces per-claim annotation files and an aggregate status artifact, and leaves a durable evidence trail on disk.
- A REFUTED claim marked as slice- or milestone-impacting causes the correct planning unit to be reinvoked with corrected evidence before execution proceeds.
- If correction cycles exceed the configured bound, auto-mode pauses with an explicit blocker artifact instead of continuing with stale assumptions or looping forever.

## Risks and Unknowns

- Planner reinvocation routing is not supported by the current `retry_on` semantics alone — current hook retry re-runs the trigger unit, not a different unit, so runtime changes are required.
- Fact-check artifacts can sprawl if the storage contract is vague — aggregate status and per-claim files need distinct purposes and naming rules.
- Lower-end worker models will follow prose literally — if the planner emits vague control flow, the runtime layer may exist but still fail in execution because the contracts are not deterministic enough.
- Asynchronous verification creates timing risk — the coordinator, runtime, and planner all need a shared durable status surface so corrected facts are visible at the right phase.

## Existing Codebase / Prior Art

- `src/resources/extensions/gsd/post-unit-hooks.ts` — current post-unit and pre-dispatch hook engine; supports artifact idempotency and `retry_on`, but `retry_on` re-runs the trigger unit rather than routing to a different one.
- `src/resources/extensions/gsd/auto-prompts.ts` — current prompt assembly layer; does not yet inline fact-check artifacts into planning prompts.
- `src/resources/extensions/gsd/preferences.ts` — preference validation and model resolution; `models.subagent` already exists for scout execution, hook config has string `model` override and `agent` support.
- `src/resources/extensions/gsd/types.ts` — type definitions for hooks, state, and summaries; likely home for fact-check status and annotation types if formalized.
- `.gsd/milestones/M005-8pv12q/M005-8pv12q-CONTEXT.md` — prior milestone context for evidence-grounded pipeline design.
- `.gsd/QUEUE.md` — queued milestone brief for M006–M009.

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R064 — coordinator must run after research units and evaluate unresolved verifiable claims
- R065 — each verified claim must produce a durable annotation file with verdict and corrected value when applicable
- R066 — aggregate fact-check status must exist as a machine-readable runtime control artifact
- R067 — scout execution must be configurable through preferences/agent selection rather than hardcoded to a specific model
- R068 — planner prompt assembly must include corrected evidence for REFUTED plan-impacting claims
- R069 — REFUTED plan-impacting claims must trigger bounded planner reinvocation
- R070 — revision routing must be deterministic by impact scope
- R071 — completion summaries must report fact-check outcomes and revision cycles
- R072 — planner outputs for this milestone must remove interpretive gaps for lower-end worker models

## Scope

### In Scope

- Fact-check coordinator runtime integration after research units
- Scout verification flow for unresolved claims
- Per-claim annotation schema and storage layout
- Aggregate fact-check status artifact and routing signal
- Planner evidence ingestion from fact-check outputs
- Planner reinvocation rules and bounded correction loop
- Completion reporting for fact-check outcomes and unresolved/inconclusive claims
- Deterministic planning standard for runtime-control workflows

### Out of Scope / Non-Goals

- Telemetry, experiment fixtures, and baseline/treatment comparison infrastructure
- Public reporting, publication workflow, or ARL evidence-ledger updates
- Dedicated `models.factcheck` phase if existing hook model + `models.subagent` configuration is sufficient
- Prioritization/ranking of which claims to verify first beyond what is needed for correct planner revision

## Technical Constraints

- `post_unit_hooks[].retry_on` currently re-runs the same trigger unit; it does not route to `plan-slice`, `plan-milestone`, or `replan-slice`. If planner reinvocation is required, the runtime must gain explicit reroute behavior or equivalent dispatch control.
- Hook artifact idempotency is built around a single named artifact; if we store many per-claim files, we also need one aggregate status artifact for control flow.
- Hook `model` is a string override only; scout execution should rely on existing configurable subagent/model paths rather than assuming richer hook-level routing.
- Prompt size matters — planning should read the aggregate status artifact and only the necessary REFUTED claim annotations, not the entire fact-check directory blindly.

## Integration Points

- Hook engine (`post-unit-hooks.ts`) — triggers coordinator after research units and may need extension for planner rerouting
- Auto-mode dispatch/runtime (`auto.ts`, `auto-dispatch.ts`) — must honor plan-impacting refutation signals and bounded reruns
- Prompt assembly (`auto-prompts.ts`) — must include fact-check outputs in planner and completion prompts
- Preferences (`preferences.ts`, `.gsd/preferences.md`) — controls coordinator/scout execution path and model selection
- Filesystem under `.gsd/milestones/...` — durable storage for status and annotation artifacts
- Subagent execution — scout verification path and configurable lower-cost/alternate agents

## Open Questions

- Should planner reinvocation dispatch `plan-slice` directly or use `replan-slice` once an initial slice plan exists? Current thinking: use `plan-slice` / `plan-milestone` for pre-execution fact-check corrections and reserve `replan-slice` for execution-discovered blockers.
- Should impact classification live in each claim annotation, the aggregate status artifact, or both? Current thinking: both — annotation is the evidence record, aggregate status is the control surface.
- Should the coordinator be an inline hook prompt or a dedicated agent attached to the hook config? Current thinking: dedicated agent is cleaner and more revisable for a control-loop milestone.
- What exact aggregate artifact format is best for runtime control: JSON, Markdown, or both? Current thinking: JSON as source of truth; add a markdown mirror only if debugging proves it valuable.
