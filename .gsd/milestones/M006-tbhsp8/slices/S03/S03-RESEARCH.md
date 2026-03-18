# S03: Planner Evidence Ingestion — Research

**Date:** 2026-03-18

## Summary

This slice integrates the fact-check service layer with the planning process. The planner must read the aggregate `FACTCHECK-STATUS.json` artifact produced by the coordinator (S02) and inject relevant `REFUTED` plan-impacting claim annotations directly into the planning prompt as corrected input. This ensures that the planner is working with ground-truth facts rather than stale/unverified training-data assumptions.

## Recommendation

Implement a fact-check ingestion layer in the planner prompt-builder that detects the presence of the `FACTCHECK-STATUS.json` artifact. If found and it signals plan-impacting refutations, the builder must read the relevant claim annotations (from `factcheck/claims/{claimId}.json`) and include their `correctedValue` in the planning context. This implementation should leverage existing `src/resources/extensions/gsd/auto-prompts.ts` machinery, treating fact-check status as a high-priority context source.

## Implementation Landscape

### Key Files

- `src/resources/extensions/gsd/auto-prompts.ts` — The primary file for planning prompt assembly. Must be updated to read `FACTCHECK-STATUS.json` and inject corrected claim evidence.
- `src/resources/extensions/gsd/factcheck.ts` — Provides path resolution and parsing definitions if ingestion needs to touch the filesystem directly.
- `src/resources/extensions/gsd/prompts/plan-slice.md` — The template for planning prompts. Needs a new section for Injected Fact-Check Corrections to guide the downstream model.
- `src/resources/extensions/gsd/types.ts` — Provides `FactCheckAggregateStatus` and `FactCheckAnnotation` schema support.

### Build Order

1. **Prompt Builder Logic** — Implement ingestion logic in `auto-prompts.ts` that checks for `FACTCHECK-STATUS.json`, parses it, and gathers corresponding annotation files for `REFUTED` claims.
2. **Template Update** — Update `plan-slice.md` template with a clearly defined "Injected Fact-Check Corrections" block. This forces structural adherence (R072).
3. **Integration Test** — Create an integration test suite that mocks a research unit output, triggers the coordinator to write artifacts, then verifies that the planner prompt builder correctly picks up the refuted evidence.

### Verification Approach

Mock the fact-check environment: write an aggregate status file signaling `planImpacting: true` and a corresponding `REFUTED` claim annotation to the slice's `factcheck/` directory. Run the `plan-slice.md` prompt builder and assert that the generated string contains the `correctedValue` of the refuted claim in the "Injected Fact-Check Corrections" block.

## Common Pitfalls

- **Stale Evidence** — Ingestion should only pull `REFUTED` claims where `impact` is `slice` or `milestone`. Verify claim impact classification is respected.
- **Vague Prompting** — Don't bury refutations in "context" blobs. The prompt must explicitly label refutations (e.g., "Refuted Plan Input: [Fact ID], Corrected: [Value]").

## Open Risks

- The runtime integration (invoking the planner after verification) is the domain of S04; this slice only ensures that *if* planning happens, the evidence is present.

## Sources

- R068 (Planner prompt assembly requirement)
- R072 (Planner determinism requirement)
- S01/S02 Summary documentation (contract definitions)
