# M007-aos64t: Live Runtime Proof for Fact-Check Loop

**Gathered:** 2026-03-18
**Status:** Ready for planning

## Project Description

Build the missing live proof layer for M006-tbhsp8. The fact-check service loop is already implemented and requirement-validated by contract and integration tests, but milestone closeout failed because the roadmap required a live end-to-end runtime re-check through the real auto-mode path. This milestone creates deterministic runtime fixtures and executes the assembled system so GSD can prove, not just infer, that research-triggered fact-checking causes real planner reroutes with corrected evidence.

## Why This Milestone

M006 proved the architecture in parts but not as a single runtime sequence. Without a live proof run, M007 telemetry and later experiment milestones would be measuring a loop that has never been demonstrated end-to-end in the real dispatch path. This milestone closes that gap now, while the implementation context is fresh and before more instrumentation obscures whether the base correction loop actually works.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Run a deterministic verification flow that exercises research → fact-check coordinator → planner reroute → corrected planning input through the real auto-mode runtime.
- Inspect durable artifacts and validation output showing that stale planning inputs were replaced before execution continued.

### Entry point / environment

- Entry point: `/gsd auto` runtime path plus test/verification harnesses
- Environment: local dev, auto-mode runtime, filesystem-backed `.gsd/` worktree state
- Live dependencies involved: filesystem, auto dispatcher, post-unit hooks, subagent execution path or controlled runtime fixture equivalent

## Completion Class

- Contract complete means: deterministic fixture inputs and validation scripts/tests exist for runtime-proof scenarios.
- Integration complete means: the assembled runtime path produces coordinator artifacts, reroute decisions, and reinvoked planner inputs from one live flow.
- Operational complete means: the verification flow is repeatable, failure-visible, and captures enough state to debug live-loop failures without re-reading all logs.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- A live runtime scenario starting from research output with a known verifiable false claim triggers the fact-check coordinator and writes durable claim/status artifacts.
- The dispatcher observes the resulting plan-impacting refutation and reroutes to the correct planning unit before stale execution proceeds.
- The reinvoked planner receives the corrected evidence in its real prompt assembly path, and the verification output shows the correction was absorbed.

## Risks and Unknowns

- The existing integration tests may have mocked away runtime behavior that behaves differently under real dispatch sequencing — this matters because M006 failed exactly on missing live proof.
- Subagent/coordinator execution may be harder to make deterministic than the planner/runtime pieces — this matters because a flaky proof fixture is nearly as bad as no proof.
- It may be cleaner to prove the runtime with a controlled verification harness than with full autonomous free-running `/gsd auto` — this matters because the milestone should close the evidence gap, not add noise.

## Existing Codebase / Prior Art

- `src/resources/extensions/gsd/post-unit-hooks.ts` — current post-research hook execution path for coordinator invocation.
- `src/resources/extensions/gsd/auto-dispatch.ts` — dispatch rule ordering, including factcheck reroute interception.
- `src/resources/extensions/gsd/auto-recovery.ts` — reroute and cycle-bound logic for plan-impacting refutations.
- `src/resources/extensions/gsd/auto-prompts.ts` — real prompt assembly for slice- and milestone-level fact-check correction injection.
- `src/resources/extensions/gsd/tests/factcheck-coordinator.test.ts` — current coordinator integration coverage to build on.
- `src/resources/extensions/gsd/tests/auto-recovery-loop.test.ts` — current reroute/cycle coverage to extend toward live proof.
- `.gsd/milestones/M006-tbhsp8/M006-tbhsp8-SUMMARY.md` — explicit record of the missing live runtime proof.

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R064 — now needs live runtime confirmation of coordinator triggering behavior.
- R068 — now needs live runtime confirmation that corrected evidence reaches real planner prompts.
- R069 — now needs live runtime confirmation that reroute happens before stale execution proceeds.
- R070 — now needs live runtime confirmation that impact scope selects the correct reroute target in runtime.
- R071 — completion reporting can consume the live-proof artifacts once the runtime scenario exists.

## Scope

### In Scope

- Deterministic fixture or harness inputs for known refutation scenarios
- Live runtime verification of coordinator artifact writing
- Live runtime verification of dispatcher reroute behavior
- Live runtime verification of planner prompt ingestion of corrected evidence
- Validation artifact/reporting for the proof run

### Out of Scope / Non-Goals

- Broad telemetry/metrics expansion beyond what is needed to prove the runtime loop
- New fact-check prioritization or model-routing features
- Public reporting and experiment analysis across many fixtures

## Technical Constraints

- The proof must use the real runtime/control path, not only call helper functions in isolation.
- The fixture must be deterministic enough to run repeatedly; if scout execution is nondeterministic, the milestone must constrain or stub only the evidence source while still exercising the real dispatch path.
- Verification must leave durable artifacts that future agents can inspect without relying on transient console output.

## Integration Points

- Post-unit hook engine — must trigger coordinator after research completion.
- Auto dispatcher — must intercept planning with fact-check reroute rule.
- Prompt assembly — must expose corrected evidence in the reinvoked planner path.
- Completion/validation artifacts — must summarize what happened in the proof run.

## Open Questions

- Should the live proof use a tightly controlled runtime harness instead of a free-running full auto session? — Current thinking: yes, if the harness still exercises the real hook/dispatch/prompt code paths.
- Should scout verification be mocked at the external-source edge while keeping coordinator/runtime behavior real? — Current thinking: yes, if needed for determinism, but only at the evidence acquisition edge, not at the dispatcher/prompt layer.
