# S05 — Research: Completion Reporting and Diagnostics

## Summary

This slice adds completion reporting and diagnostic observability to the fact-check service layer. While S04 implemented the bounded planner revision loop and reroute logic, completion and diagnostic reporting needs to surfaced in the automated reports to provide human-readable (and machine-parseable) feedback on fact-check outcomes and revision cycles.

The goal is to ensure that when a milestone or slice is complete, the user and the system can clearly see a "fact-check trail": what claims were checked, what was refuted, how many correction cycles were triggered, and whether inconclusive claims remain. This is essential for auditing the reliability of the fact-check service and ensuring no plan-impacting refutations were ignored.

## Recommendation

The best approach is to enhance the existing completion artifacts (`SUMMARY.md`) to aggregate diagnostic data from the `FACTCHECK-STATUS.json` artifact and claim repositories. We should NOT create a new artifact format, but rather improve the existing ones. We will implement a `generateFactCheckSummary` helper that:
1. Reads `FACTCHECK-STATUS.json` for summary-level stats (cycle count, status).
2. Traverses the `factcheck/` directory to read individual annotations, categorizing them by verdict.
3. Injects this data into the milestone/slice `SUMMARY.md` artifacts.

This approach honors the "Artifact Contract" decision in M006 (keeping things simple and reusable) while fulfilling the visibility requirements in S05.

## Implementation Landscape

### Key Files

- `src/resources/extensions/gsd/auto-prompts.ts` — Completion prompt assembly; needs to include a section summarizing fact-check outcomes if they exist.
- `src/resources/extensions/gsd/factcheck.ts` — Status file management; potentially add a parser for summary generation.
- `src/resources/extensions/gsd/complete.ts` (assuming existence) or the relevant completion logic module — Needs to collect the summary data and inject it into the final output.

### Build Order

1. **Verify fact-check status file access:** Ensure the completion summary can reliably traverse fact-check artifacts in already-completed units.
2. **Implement summary generation:** Write the diagnostic collection logic to pull metadata from `FACTCHECK-STATUS.json` and claim result annotations.
3. **Enhance completion prompts:** Update completion templates to display the collected data, including cycle counts and inconclusive claim warnings.

### Verification Approach

1. **Unit tests:** Create tests in `factcheck-ingestion.test.ts` (or similar) that simulate completed units (with and without fact-checks) and verify the generated summary data matches expectation.
2. **Integration test:** Run a mock research/fact-check/correction-loop flow and verify the slice `SUMMARY.md` correctly reports the number of cycles and claim verdicts.

## Constraints

- Must rely on durable artifacts existing on disk (no live-memory dependency during post-unit completion).
- Completion summaries MUST behave predictably even if fact-check artifacts are missing (graceful degradation).

## Open Risks

- S04 cycle counting might drift if `FACTCHECK-STATUS.json` is manually tampered with; completion summaries should note if data appears incomplete.

## Sources

- M006-tbhsp8 Roadmap and Context documents for requirements R071.

Slice S05 researched.
