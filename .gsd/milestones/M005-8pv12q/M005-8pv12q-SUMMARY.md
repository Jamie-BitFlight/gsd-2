---
id: M005-8pv12q
provides:
  - Research output template with required Unknowns Inventory section (evidence basis + typed resolution paths)
  - Evidence classification instructions in research-milestone.md and research-slice.md
  - Unknowns-aware planning in plan-milestone.md and plan-slice.md
  - Verification protocol (evidence check before acting) + bug-fix protocol in execute-task.md
  - Unknowns resolution check in complete-slice.md
key_decisions:
  - D055 — Evidence-grounded pipeline replaces adaptive rigor / constraint classification
  - D056 — Fact-check as async service layer, not pipeline stage
  - D057 — M005-8pv12q prompt-only, M006 fact-check infrastructure
patterns_established:
  - Training data recall is not observation — every recalled fact needs a verification path
  - Unknowns inventory flows research → plan → execute → complete as a first-class artifact
  - Evidence check before acting is structural (numbered step), not optional ceremony
  - Bug-fix protocol (reproduce → define success → apply → verify) embedded in execute-task
observability_surfaces:
  - none
requirement_outcomes:
  - id: R060
    from_status: active
    to_status: validated
    proof: research.md template has Unknowns Inventory section with evidence basis classification (observed/training-data/inferred/assumption/unknown) and typed resolution paths. research-milestone.md and research-slice.md both include step 7 instructing researchers to classify implementation-affecting claims.
  - id: R061
    from_status: active
    to_status: validated
    proof: plan-slice.md step 6 and plan-milestone.md step 6 both instruct the planner to read the Unknowns Inventory and convert unresolved items into concrete resolution steps. Empty inventory is handled gracefully (section is optional/conditional on presence).
  - id: R062
    from_status: active
    to_status: validated
    proof: execute-task.md step 3 contains the full evidence check protocol (name claim, is it observed, if not verify first, did verification change anything). Step 4 contains the 4-step bug-fix protocol (reproduce → define success → apply → verify). Both are numbered steps in the execution sequence, not advice text.
  - id: R063
    from_status: active
    to_status: validated
    proof: complete-slice.md step 6 instructs the completer to check each unknown's resolution status from task summaries and report "Unknowns resolved: N/M. Remaining: [list]." REFUTED claims and unresolved items are explicitly handled.
duration: 1 day (2026-03-15 to 2026-03-16)
verification_result: passed
completed_at: 2026-03-16
---

# M005-8pv12q: Evidence-Grounded Pipeline

**Embedded evidence discipline into all four GSD pipeline phases: research produces unknowns inventories, planners consume them, executors verify before acting, completers check resolution status.**

## What Happened

M005-8pv12q was delivered in a single integrated commit (01059a8) that modified seven prompt/template files. All four slices — Research Phase (S01), Plan Phase (S02), Execute Phase (S03), and Complete Phase (S04) — were implemented together as a coherent pipeline change rather than sequentially.

**S01 — Research Phase:** The `templates/research.md` output template gained a required `## Unknowns Inventory` section with a structured table (claim, basis, affects, resolution, status). Evidence basis values are explicit: `observed`, `training-data`, `inferred`, `assumption`, `unknown`. Resolution strategy types are typed: `check-docs`, `read-code`, `experiment`, `ask-user`, `fetch-reference`, `search`. The empty inventory case is valid and explicitly defined ("None identified — all implementation-affecting claims verified..."). Both `research-milestone.md` and `research-slice.md` prompts gained a mandatory step 7 classifying implementation-affecting claims.

**S02 — Plan Phase:** Both `plan-milestone.md` and `plan-slice.md` gained step 6 instructing the planner to read the Unknowns Inventory and convert unresolved items into concrete resolution steps. The contract is clear: trivial resolutions become sub-steps, non-trivial ones become dedicated tasks, `ask-user` items are noted as potential blockers. Silently dropping unknowns is explicitly prohibited.

**S03 — Execute Phase:** `execute-task.md` gained two structural protocols as numbered steps:
- Step 3: Evidence check before acting — name the claim, is it observed, if not verify first, did verification change anything
- Step 4: Bug-fix protocol — reproduce → define success → apply → verify
These are numbered execution steps, not advisory notes. The evidence check handles the case where the task plan includes unknowns inventory resolution steps ("follow them").

**S04 — Complete Phase:** `complete-slice.md` gained step 6 for unknowns resolution checking — the completer queries task summaries for resolution status and reports a count. REFUTED claims that adjusted implementation are explicitly noted. Unresolved items are flagged with explanation.

The `dist/` tree has an older version of these prompts (the integration commits haven't rebuilt it), but `src/` is the authoritative source and contains all changes. The architectural decisions (D055–D057) were recorded in DECISIONS.md alongside the knowledge register entries (K001–K005) capturing the design rationale.

## Cross-Slice Verification

**Success criterion: Research output template has `## Unknowns Inventory` section** ✅
Verified: `src/resources/extensions/gsd/templates/research.md` contains the section with full column definitions, evidence basis vocabulary, resolution strategy types, and the empty-inventory fallback text.

**Success criterion: Research prompts instruct researchers to flag verifiable claims** ✅
Verified: `research-milestone.md` step 7 and `research-slice.md` step 7 both contain the explicit unknowns classification instruction including the list of what counts as a claim (version numbers, API signatures, CLI flags, config schemas, magic numbers, external tool behavior).

**Success criterion: Plan prompts instruct planners to read unknowns inventory and build resolution steps** ✅
Verified: `plan-slice.md` step 6 and `plan-milestone.md` step 6 contain the unknowns-aware planning instruction with handling for trivial/non-trivial/ask-user unknowns and the prohibition on silently dropping them.

**Success criterion: Execute-task prompt contains verification protocol** ✅
Verified: `execute-task.md` step 3 — "Evidence check before acting" — contains the four-sub-step protocol: name claim, is it observed, if not verify, did verification change anything.

**Success criterion: Execute-task prompt contains bug-fix protocol** ✅
Verified: `execute-task.md` step 4 — "Bug-fix protocol" — contains the four-step protocol: reproduce → define success → apply → verify.

**Success criterion: Complete-slice prompt checks unknowns resolution status** ✅
Verified: `complete-slice.md` step 6 — "Unknowns resolution check" — instructs the completer to check status per unknown, report "Unknowns resolved: N/M. Remaining: [list]", note REFUTED adjustments, and flag unresolved items with explanation.

**Success criterion: A task with many unknowns gets proportionally more resolution steps** ✅
Structural: the planner converts each unresolved unknown into a concrete step. More unknowns = longer task list. No artificial caps or limits are imposed. Empty inventory = zero extra steps. The pipeline scales naturally.

**Success criterion: Empty inventory valid for straightforward work** ✅
Verified: `templates/research.md` Unknowns Inventory section explicitly defines the empty case: "None identified — all implementation-affecting claims were verified by reading project files and running commands this session."

## Requirement Changes

- R060: active → validated — research.md template has Unknowns Inventory; research prompts have claim classification instructions in step 7 of both research-milestone.md and research-slice.md
- R061: active → validated — plan-slice.md and plan-milestone.md step 6 convert unresolved unknowns to concrete resolution steps; prohibition on silently dropping them is explicit
- R062: active → validated — execute-task.md steps 3 and 4 contain evidence check protocol and bug-fix protocol as numbered execution steps
- R063: active → validated — complete-slice.md step 6 checks unknowns resolution status, reports count, notes REFUTED adjustments and unresolved items

## Forward Intelligence

### What the next milestone should know
- The `dist/` directory contains an older compiled version of the prompts. The `src/` tree is authoritative. If M006 or later milestones modify prompts, the dist rebuild step must be included in the slice plan — otherwise `dist/` will lag behind `src/`.
- The unknowns inventory flows through the pipeline as a section heading in the research doc. The planner finds it by heading name (`## Unknowns Inventory`). If the research template changes the heading, plan-slice.md step 6 needs a corresponding update.
- The verification protocol in execute-task is step 3 and bug-fix is step 4. Steps 5+ have been renumbered (this was reflected in the commit). Any tooling that references step numbers by index needs to be aware of this.
- M006 (fact-check service layer) will add a coordinator agent + haiku scouts that independently verify the claims the researcher self-classifies. M005-8pv12q's self-classification is acknowledged as imperfect (K003); M006 makes it structural.

### What's fragile
- Self-classification without the fact-checker — researchers self-classify evidence basis, which is subject to the same blind spots that produced the claims. This is by design for M005-8pv12q (it's better than nothing) but M006 is the structural fix. Don't rely on self-classification accuracy for high-stakes claims.
- The unknowns inventory depends on the researcher actually populating it. The prompt instruction exists, but there's no enforcement hook. M006's coordinator provides structural enforcement.

### Authoritative diagnostics
- `src/resources/extensions/gsd/prompts/execute-task.md` — look here to confirm step numbering and protocol text; `dist/` may be stale
- `src/resources/extensions/gsd/templates/research.md` — Unknowns Inventory section definition
- `git show 01059a8 --stat` — shows the exact set of files changed in the single delivery commit

### What assumptions changed
- Original design assumed four separate slice commits. Actual delivery happened in one integrated commit implementing all four slices simultaneously. This reflects the nature of the changes — pure prompt/template edits with tight interdependencies, where implementing them sequentially in separate commits offered no practical isolation benefit.

## Files Created/Modified

- `src/resources/extensions/gsd/templates/research.md` — Added required `## Unknowns Inventory` section with evidence basis vocabulary and resolution strategy types
- `src/resources/extensions/gsd/prompts/research-milestone.md` — Added step 7: classify implementation-affecting claims into unknowns inventory
- `src/resources/extensions/gsd/prompts/research-slice.md` — Added step 7: classify implementation-affecting claims into unknowns inventory
- `src/resources/extensions/gsd/prompts/plan-milestone.md` — Added step 6: read unknowns inventory and build resolution steps
- `src/resources/extensions/gsd/prompts/plan-slice.md` — Added step 6: read unknowns inventory and build resolution steps
- `src/resources/extensions/gsd/prompts/execute-task.md` — Added step 3 (evidence check before acting) and step 4 (bug-fix protocol); renumbered subsequent steps
- `src/resources/extensions/gsd/prompts/complete-slice.md` — Added step 6: unknowns resolution check with N/M reporting
- `.gsd/DECISIONS.md` — Appended D048–D057 documenting the design evolution and architectural choices
- `.gsd/KNOWLEDGE.md` — Appended K001–K005 capturing training-data-vs-observation principle, Structure Over Instruction, self-evaluation limits, async fact-check rationale, and source attribution for ARL/HOOTL references
- `.gsd/REQUIREMENTS.md` — Added R060–R063 (evidence classification, unknowns-driven planning, verification protocol, resolution verification)
- `.gsd/milestones/M005-8pv12q/M005-8pv12q-CONTEXT.md` — Created milestone context document
- `.gsd/milestones/M005-8pv12q/M005-8pv12q-ROADMAP.md` — Created milestone roadmap
- `.gsd/QUEUE.md` — Queued M006–M009 (fact-check service layer, telemetry, experiments, publish)
- `.gsd/PROJECT.md` — Updated milestone sequence
