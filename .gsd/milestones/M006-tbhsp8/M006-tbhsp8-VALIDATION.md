---
verdict: needs-remediation
remediation_round: 0
---

# Milestone Validation: M006-tbhsp8

## Success Criteria Checklist
- [x] Criterion 1 — Research units with unresolved claims automatically trigger fact-check coordination and produce durable per-claim annotation files plus an aggregate fact-check status artifact. Evidence: S02 delivered the `gsd-factcheck-coordinator` hook agent, wired default `post_unit_hooks` for `research-milestone` and `research-slice`, and verified artifact writing with 25 coordinator integration tests plus 44 hook tests.
- [ ] Criterion 2 — REFUTED claims marked as slice- or milestone-impacting cause the correct planning unit to be reinvoked with corrected evidence before execution continues. Gap: S04 correctly reroutes slice-impact claims to `plan-slice` and milestone-impact claims to `plan-milestone`, but S03 only injects fact-check corrections into `buildPlanSlicePrompt`. Its summary explicitly states `plan-milestone` was not wired. That means milestone-impact reroutes do not yet have proven corrected-evidence ingestion.
- [x] Criterion 3 — Revision cycles are bounded, visible in artifacts/summaries, and pause with an explicit blocker instead of looping forever. Evidence: S04 persists `currentCycle`, writes `overallStatus: "exhausted"`, and returns an explicit exhausted/stop result, proven by 11 integration tests. S05 surfaces cycle counts and exhaustion state in completion diagnostics.
- [x] Criterion 4 — Planner outputs for the control loop use explicit actors, observable triggers, decision conditions, durable outputs, and terminal states so weaker downstream agents can execute them without interpretation. Evidence: the roadmap, context, and D061 deterministic-planning standard were carried into slice plans/summaries; S03 updated planner instructions to treat injected corrections as authoritative, and the slice set consistently uses explicit routing/state artifacts rather than vague retry prose.

## Slice Delivery Audit
| Slice | Claimed | Delivered | Status |
|-------|---------|-----------|--------|
| S01 | Machine-checkable fact-check contract with per-claim annotations, aggregate status, cycle key, and routing rules | Delivered typed schemas, path helpers, parsers/formatters, `buildAggregateStatus`, and `FACTCHECK_ROUTING_RULES`; 37 tests + `tsc --noEmit` | pass |
| S02 | Research completion triggers coordinator/scout execution and writes durable artifacts | Delivered coordinator agent, default research hooks, configurable model/agent resolution, and artifact-writing integration tests | pass |
| S03 | Planner evidence ingestion so corrected facts become direct planning inputs | Delivered ingestion helper and prompt wiring for `plan-slice`, but not for `plan-milestone`; sufficient for slice-impact path only | partial |
| S04 | Bounded reroute loop to `plan-slice` / `plan-milestone` with cycle exhaustion behavior | Delivered reroute/exhaustion logic and dispatch interception with 11 integration tests | pass |
| S05 | Completion reporting for verdict counts, revision cycles, unresolved claims, and revisions | Delivered `generateFactCheckSummary`, prompt wiring, and 10 tests | pass |

## Cross-Slice Integration
- **S03 → S04 mismatch:** S04 routes milestone-impact refutations to `plan-milestone`, but S03 only wired corrected-evidence ingestion into `buildPlanSlicePrompt`. The boundary contract says planner evidence ingestion should support the reroute surfaces S04 consumes; that is only partially true.
- **S04 → milestone complete gap:** The end-to-end correction loop is fully substantiated for slice-impact refutations. It is not fully substantiated for milestone-impact refutations because the target planner prompt lacks proven fact-check ingestion.
- No other boundary mismatches were evident from the summaries. S01→S02, S02→S03, and S04→S05 align with delivered files/tests.

## Requirement Coverage
- **Addressed by slices:** R064 (S02), R065 (S01/S02), R066 (S01/S02), R067 (S02), R068 (S03, but only fully for `plan-slice`), R069 (S04), R070 (S04), R071 (S05), R072 (planning standard carried through the milestone artifacts).
- **Outstanding validation concern:** R068 is not fully satisfied for milestone-level reroutes because corrected evidence is not yet proven to reach `plan-milestone`.

## Verdict Rationale
The milestone is close, but there is one material integration gap: the runtime can reroute milestone-impacting refutations to `plan-milestone`, yet the planner-ingestion slice only wired fact-check corrections into `plan-slice`. That breaks the milestone's second success criterion for the milestone-impact path and leaves the end-to-end correction loop only partially proven. Because this affects control-flow correctness rather than polish, the verdict is `needs-remediation` rather than `needs-attention`.

## Remediation Plan
- **S06: Milestone Planner Fact-Check Ingestion** `risk:medium` `depends:[S03,S04]`
  > After this: `plan-milestone` consumes aggregate fact-check status and milestone-impact REFUTED claim annotations exactly like `plan-slice`, so milestone-level reroutes are reinvoked with corrected evidence and can be validated end-to-end.
