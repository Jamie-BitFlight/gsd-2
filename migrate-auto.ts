import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/resources/extensions/gsd/auto.ts';
let content = readFileSync(path, 'utf8');

// Replace snapshotUnitMetrics with assignment + persistence
const pattern = /snapshotUnitMetrics\(([^)]*), ({ promptCharCount: lastPromptCharCount, baselineCharCount: lastBaselineCharCount, \.\.\.\(currentUnitRouting \?\? \{\}\) \});/g;
const replacement = 'const unit = snapshotUnitMetrics($1, $2); if (unit) persistUnitMetrics(basePath, unit);';

content = content.replace(pattern, replacement);

writeFileSync(path, content, 'utf8');
