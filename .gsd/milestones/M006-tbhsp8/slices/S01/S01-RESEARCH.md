# Fact-Check Control Contract — Research

## Summary

The fact-check control contract serves as the foundation for the Fact-Check Service Layer (M006). It introduces a structured and machine-readable way to capture evidence, track claim status, and trigger runtime correction loops. The recommendation is to model the fact-check lifecycle as a JSON-first contract (the aggregate status artifact) complemented by per-claim JSON annotation files. This dual-layer approach provides the machine-readability needed by the runtime and the granular evidence required by planners and downstream verification agents.

## Recommendation

The Fact-Check Control Contract (S01) should define three things:
1. **Per-claim Annotation Schema:** A JSON definition for durable storage of individual claim findings (IDs, verdict, citations, corrected value, impact scope).
2. **Aggregate Fact-Check Status Artifact schema (`FACTCHECK-STATUS.json`):** A machine-readable runtime controller containing cycle counters, unresolved claim identifiers, refutation impact flags, and routing hints.
3. **Deterministic Impact Enum:** A standard `Impact` enum (`none`, `task`, `slice`, `milestone`) that planners follow strictly to decide if a REFUTED claim necessitates a rerun or a pause.

This contract must be stable, versioned, and usable by both runtime (to trigger planner reruns) and planners (to ingest corrected facts).

## Implementation Landscape

### Key Files

- `src/resources/extensions/gsd/types.ts` — Update to include new FactCheck types (Status, Annotation, Verdict, ImpactEnum).
- `src/resources/extensions/gsd/post-unit-hooks.ts` — The existing hook engine needs potential augmentation or a dedicated coordinator hook to trigger verification after `research-*` units.
- `src/resources/extensions/gsd/auto-prompts.ts` — Update to consume the aggregate `FACTCHECK-STATUS.json` during planning prompt assembly.

### Build Order

1. **Schema Definition:** Implement the contract schemas and types.
2. **Storage Layout:** Standardize the file naming and location scheme for annotations and aggregate status under `milestones/M006/.../factcheck/`.
3. **Contract Integration:** Ensure current auto-mode hooks and planners can locate the aggregate status.

### Verification Approach

- **Schema Validations:** Unit tests against JSON schema/types for annotations and aggregate status.
- **Contract Existence:** Verify factcheck directories/files are created with the expected structure after a test research-unit run.

## Open Risks

- **Planner Reroute Semantics:** The current `retry_on` mechanism re-runs the *same* trigger unit. Implementing pre-execution fact-check-driven planning revision (to `plan-slice` / `plan-milestone`) likely requires structural runtime changes to explicitly reroute, not just retry.
- **Artifact Sprawl:** With many per-claim files, we must ensure the aggregate status artifact acts as the single source-of-truth for runtime control, while per-claim annotations act purely as evidence.
