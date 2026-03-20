import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/resources/extensions/gsd/auto.ts';
let content = readFileSync(path, 'utf8');

// The original sed failed to capture all cases because of the specific structure
// I need a regex that matches the function call and captures the args.
// Example:
// snapshotUnitMetrics(ctx, currentUnit.type, currentUnit.id, currentUnit.startedAt, modelId, { promptCharCount: lastPromptCharCount, baselineCharCount: lastBaselineCharCount, ...(currentUnitRouting ?? {}) });

// regex: snapshotUnitMetrics\(([^)]+)\);
// replacement: const unit = snapshotUnitMetrics($1); if (unit) persistUnitMetrics(basePath, unit);

const pattern = /snapshotUnitMetrics\(([^)]+)\);/g;
const replacement = 'const unit = snapshotUnitMetrics($1); if (unit) persistUnitMetrics(basePath, unit);';

content = content.replace(pattern, replacement);

writeFileSync(path, content, 'utf8');
