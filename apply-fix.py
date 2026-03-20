import os

file_path = 'src/resources/extensions/gsd/auto.ts'
with open(file_path, 'r') as f:
    content = f.read()

# Pattern to match
pattern = "snapshotUnitMetrics(ctx, currentUnit.type, currentUnit.id, currentUnit.startedAt, modelId, { promptCharCount: lastPromptCharCount, baselineCharCount: lastBaselineCharCount, ...(currentUnitRouting ?? {}) });"

# Replacement
replacement = "const unit = snapshotUnitMetrics(ctx, currentUnit.type, currentUnit.id, currentUnit.startedAt, modelId, { promptCharCount: lastPromptCharCount, baselineCharCount: lastBaselineCharCount, ...(currentUnitRouting ?? {}) }); if (unit) persistUnitMetrics(basePath, unit);"

new_content = content.replace(pattern, replacement)

with open(file_path, 'w') as f:
    f.write(new_content)
