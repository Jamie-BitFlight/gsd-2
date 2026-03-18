---
estimated_steps: 5
estimated_files: 1
---

# T01: Create gsd-factcheck-coordinator Agent Definition

**Slice:** S02 — Coordinator and Scout Execution
**Milestone:** M006-tbhsp8

## Description

Create a dedicated hook agent definition file for the fact-check coordinator. This agent is triggered after research units complete, reads the research output to extract unresolved claims from the Unknowns Inventory, dispatches verification tasks to scout subagents, and writes per-claim annotation files plus an aggregate status artifact.

Per decision D059, this is a dedicated agent file rather than an inline hook prompt for maintainability, debuggability, and future extensibility.

## Steps

1. Create `src/resources/agents/gsd-factcheck-coordinator.md` with YAML frontmatter:
   - `name: gsd-factcheck-coordinator`
   - `description: Verifies unresolved claims from research output and writes fact-check artifacts`
   - `tools: read, write, subagent, grep, bash`

2. Write the agent body with these sections:
   - **Context**: Explain that this agent runs after research units and must write artifacts to a specific directory
   - **Input**: Describe how to read the RESEARCH.md file and extract the Unknowns Inventory section
   - **Claim Extraction**: Specify the regex/pattern for finding claim entries (claim ID, description, evidence basis)
   - **Verification Dispatch**: Instructions for spawning scout subagents to verify each claim
   - **Artifact Writing**: Use S01 path functions (resolveFactcheckDir, resolveClaimPath, resolveStatusPath) and serialization (formatAnnotation, formatAggregateStatus)

3. Define claim extraction logic:
   - Parse Unknowns Inventory section from RESEARCH.md
   - Each entry has: claimId (generate if not present), claim text, evidence basis (why it's unverified), resolution path
   - Convert to FactCheckAnnotation with initial verdict='unverified'

4. Define scout dispatch logic:
   - For each claim, dispatch a scout subagent with the verification task
   - Scout uses `models.subagent` preference (R067) — agent should reference this in instructions
   - Scout returns: verdict (confirmed/refuted/inconclusive), citations, corrected value (if refuted), impact assessment

5. Define artifact writing logic:
   - Write each annotation to `{slicePath}/factcheck/claims/{claimId}.json` using formatAnnotation
   - Build aggregate status using buildAggregateStatus logic
   - Write aggregate to `{slicePath}/factcheck/FACTCHECK-STATUS.json` using formatAggregateStatus

## Must-Haves

- [ ] Agent file exists at `src/resources/agents/gsd-factcheck-coordinator.md`
- [ ] YAML frontmatter with name, description, tools
- [ ] Clear instructions for reading research output and extracting Unknowns Inventory
- [ ] Instructions for dispatching scout subagents with verification tasks
- [ ] Instructions for writing annotation files and aggregate status using S01 contract
- [ ] Deterministic step-by-step flow (no vague handoffs)

## Verification

- Agent file parses correctly (valid YAML frontmatter)
- Instructions reference correct S01 functions (resolveFactcheckDir, formatAnnotation, buildAggregateStatus)
- Peer review confirms instructions are complete and executable

## Observability Impact

- Signals added/changed: Agent logs claim count, verification dispatch events, and artifact write paths during execution
- How a future agent inspects this: Read FACTCHECK-STATUS.json for aggregate state; read individual claim files for details
- Failure state exposed: If coordinator crashes mid-execution, factcheck/ directory may have partial annotations without aggregate status

## Inputs

- `src/resources/extensions/gsd/types.ts` — FactCheckAnnotation, FactCheckAggregateStatus types from S01
- `src/resources/extensions/gsd/factcheck.ts` — Path functions and serialization from S01
- `src/resources/agents/scout.md` — Reference for scout subagent structure

## Expected Output

- `src/resources/agents/gsd-factcheck-coordinator.md` — Complete agent definition file
