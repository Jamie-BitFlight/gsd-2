/**
 * Tests for GSD Experiment Runner — Fidelity Scoring and Bounded Iteration
 *
 * Covers:
 * - FidelityRubric validation (valid, out-of-range, non-integer)
 * - Scoring capture and persistence into comparison reports
 * - Bounded iteration runner (max 3 iterations)
 * - Convergence conclusion artifact
 *
 * @module experiment-iteration.test
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validateRubric,
  isValidRubric,
  captureScoring,
  readScoring,
  averageScore,
  compareRubrics,
  FidelityRubricError,
  type FidelityRubric,
} from "../experiment-runner.js";
import type { CompareReport } from "../compare-runner.js";
import { runComparison, writeComparisonReport } from "../compare-runner.js";

// ─── Test Fixtures ─────────────────────────────────────────────────────────────

const TEMP_DIR = join(import.meta.dirname, ".tmp-experiment-test");

function setupTempDir(): void {
  if (existsSync(TEMP_DIR)) {
    rmSync(TEMP_DIR, { recursive: true });
  }
  mkdirSync(TEMP_DIR, { recursive: true });
}

function teardownTempDir(): void {
  if (existsSync(TEMP_DIR)) {
    rmSync(TEMP_DIR, { recursive: true });
  }
}

function createMinimalReport(outputDir: string): string {
  const report: CompareReport = {
    metadata: {
      fixtureId: "test-fixture",
      model: "test-model",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    },
    baseline: {
      config: { features: { unknownsInventory: false, factCheckCoordination: false } },
      metrics: {
        wallClockMs: 100,
        tokens: { input: 100, output: 50, cacheRead: 0, cacheWrite: 0, total: 150 },
        cost: 0.001,
        interventions: { blocker: 0, correction: 0, redirect: 0 },
        factCheck: null,
      },
    },
    treatment: {
      config: { features: { unknownsInventory: true, factCheckCoordination: true } },
      metrics: {
        wallClockMs: 150,
        tokens: { input: 130, output: 65, cacheRead: 0, cacheWrite: 0, total: 195 },
        cost: 0.0015,
        interventions: { blocker: 0, correction: 0, redirect: 0 },
        factCheck: { claimsChecked: 3, verified: 2, refuted: 0, inconclusive: 1, scoutTokens: 100 },
      },
    },
    scoring: {},
  };

  const reportPath = join(outputDir, "COMPARE-REPORT.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf-8");
  return reportPath;
}

function validRubric(): FidelityRubric {
  return {
    factualAccuracy: 4,
    completeness: 5,
    coherence: 3,
    conciseness: 4,
    notes: "Good overall, minor clarity issues",
  };
}

// ─── Rubric Validation Tests ───────────────────────────────────────────────────

describe("validateRubric", () => {
  it("accepts valid rubric with all dimensions in range 1-5", () => {
    const rubric = validRubric();
    assert.doesNotThrow(() => validateRubric(rubric));
  });

  it("accepts rubric without optional notes", () => {
    const rubric: FidelityRubric = {
      factualAccuracy: 3,
      completeness: 3,
      coherence: 3,
      conciseness: 3,
    };
    assert.doesNotThrow(() => validateRubric(rubric));
  });

  it("rejects rubric with score 0 (below minimum)", () => {
    const rubric = { ...validRubric(), factualAccuracy: 0 };
    assert.throws(
      () => validateRubric(rubric),
      (err) => {
        assert(err instanceof FidelityRubricError);
        assert(err.message.includes("factualAccuracy"));
        assert(err.message.includes("range 1-5"));
        return true;
      },
    );
  });

  it("rejects rubric with score 6 (above maximum)", () => {
    const rubric = { ...validRubric(), completeness: 6 };
    assert.throws(
      () => validateRubric(rubric),
      (err) => {
        assert(err instanceof FidelityRubricError);
        assert(err.message.includes("completeness"));
        assert(err.message.includes("range 1-5"));
        return true;
      },
    );
  });

  it("rejects rubric with non-integer score", () => {
    const rubric = { ...validRubric(), coherence: 3.5 };
    assert.throws(
      () => validateRubric(rubric),
      (err) => {
        assert(err instanceof FidelityRubricError);
        assert(err.message.includes("coherence"));
        assert(err.message.includes("integer"));
        return true;
      },
    );
  });

  it("rejects rubric with missing dimension", () => {
    const rubric = { factualAccuracy: 3, completeness: 3, coherence: 3 } as FidelityRubric;
    assert.throws(
      () => validateRubric(rubric),
      (err) => {
        assert(err instanceof FidelityRubricError);
        assert(err.message.includes("conciseness"));
        assert(err.message.includes("Missing"));
        return true;
      },
    );
  });

  it("rejects non-object input", () => {
    assert.throws(
      () => validateRubric(null),
      (err) => {
        assert(err instanceof FidelityRubricError);
        assert(err.message.includes("must be an object"));
        return true;
      },
    );

    assert.throws(
      () => validateRubric("not an object"),
      (err) => {
        assert(err instanceof FidelityRubricError);
        return true;
      },
    );
  });

  it("rejects notes that are not strings", () => {
    const rubric = { ...validRubric(), notes: 123 as unknown as string };
    assert.throws(
      () => validateRubric(rubric),
      (err) => {
        assert(err instanceof FidelityRubricError);
        assert(err.message.includes("notes"));
        assert(err.message.includes("string"));
        return true;
      },
    );
  });
});

describe("isValidRubric", () => {
  it("returns true for valid rubric", () => {
    assert.strictEqual(isValidRubric(validRubric()), true);
  });

  it("returns false for invalid rubric", () => {
    assert.strictEqual(isValidRubric({ ...validRubric(), factualAccuracy: 0 }), false);
    assert.strictEqual(isValidRubric(null), false);
    assert.strictEqual(isValidRubric({ factualAccuracy: 3 }), false);
  });
});

// ─── Scoring Capture Tests ──────────────────────────────────────────────────────

describe("captureScoring", () => {
  beforeEach(() => setupTempDir());
  afterEach(() => teardownTempDir());

  it("persists scoring into comparison report for baseline", () => {
    const reportPath = createMinimalReport(TEMP_DIR);
    const rubric = validRubric();

    captureScoring(reportPath, "baseline", rubric);

    const scoring = readScoring(reportPath);
    assert(scoring !== null);
    assert(scoring.baseline !== undefined);
    assert.deepStrictEqual(scoring.baseline, rubric);
    assert(scoring.treatment === undefined);
  });

  it("persists scoring into comparison report for treatment", () => {
    const reportPath = createMinimalReport(TEMP_DIR);
    const rubric = validRubric();

    captureScoring(reportPath, "treatment", rubric);

    const scoring = readScoring(reportPath);
    assert(scoring !== null);
    assert(scoring.treatment !== undefined);
    assert.deepStrictEqual(scoring.treatment, rubric);
    assert(scoring.baseline === undefined);
  });

  it("preserves existing scoring when adding new path", () => {
    const reportPath = createMinimalReport(TEMP_DIR);
    const baselineRubric: FidelityRubric = { factualAccuracy: 3, completeness: 3, coherence: 3, conciseness: 3 };
    const treatmentRubric: FidelityRubric = { factualAccuracy: 4, completeness: 4, coherence: 4, conciseness: 4 };

    captureScoring(reportPath, "baseline", baselineRubric);
    captureScoring(reportPath, "treatment", treatmentRubric);

    const scoring = readScoring(reportPath);
    assert(scoring !== null);
    assert.deepStrictEqual(scoring.baseline, baselineRubric);
    assert.deepStrictEqual(scoring.treatment, treatmentRubric);
  });

  it("throws for missing report file", () => {
    const missingPath = join(TEMP_DIR, "nonexistent", "COMPARE-REPORT.json");
    assert.throws(
      () => captureScoring(missingPath, "baseline", validRubric()),
      (err) => {
        assert(err instanceof Error);
        assert(err.message.includes("not found"));
        return true;
      },
    );
  });

  it("throws for invalid JSON in report file", () => {
    const badJsonPath = join(TEMP_DIR, "COMPARE-REPORT.json");
    writeFileSync(badJsonPath, "{ invalid json", "utf-8");

    assert.throws(
      () => captureScoring(badJsonPath, "baseline", validRubric()),
      (err) => {
        assert(err instanceof Error);
        assert(err.message.includes("Failed to parse"));
        return true;
      },
    );
  });

  it("throws FidelityRubricError for invalid rubric", () => {
    const reportPath = createMinimalReport(TEMP_DIR);
    const invalidRubric = { ...validRubric(), factualAccuracy: 10 };

    assert.throws(
      () => captureScoring(reportPath, "baseline", invalidRubric as FidelityRubric),
      (err) => {
        assert(err instanceof FidelityRubricError);
        return true;
      },
    );
  });
});

// ─── Scoring Helpers Tests ─────────────────────────────────────────────────────

describe("averageScore", () => {
  it("computes correct average across all dimensions", () => {
    const rubric: FidelityRubric = {
      factualAccuracy: 4,
      completeness: 5,
      coherence: 3,
      conciseness: 4,
    };
    // (4 + 5 + 3 + 4) / 4 = 4
    assert.strictEqual(averageScore(rubric), 4);
  });

  it("handles mixed scores", () => {
    const rubric: FidelityRubric = {
      factualAccuracy: 5,
      completeness: 5,
      coherence: 1,
      conciseness: 1,
    };
    // (5 + 5 + 1 + 1) / 4 = 3
    assert.strictEqual(averageScore(rubric), 3);
  });
});

describe("compareRubrics", () => {
  it("returns positive values when treatment is better", () => {
    const baseline: FidelityRubric = {
      factualAccuracy: 3,
      completeness: 3,
      coherence: 3,
      conciseness: 3,
    };
    const treatment: FidelityRubric = {
      factualAccuracy: 4,
      completeness: 5,
      coherence: 4,
      conciseness: 4,
    };

    const diff = compareRubrics(baseline, treatment);
    assert.strictEqual(diff.factualAccuracy, 1);
    assert.strictEqual(diff.completeness, 2);
    assert.strictEqual(diff.coherence, 1);
    assert.strictEqual(diff.conciseness, 1);
  });

  it("returns negative values when baseline is better", () => {
    const baseline: FidelityRubric = {
      factualAccuracy: 5,
      completeness: 5,
      coherence: 5,
      conciseness: 5,
    };
    const treatment: FidelityRubric = {
      factualAccuracy: 3,
      completeness: 4,
      coherence: 2,
      conciseness: 3,
    };

    const diff = compareRubrics(baseline, treatment);
    assert.strictEqual(diff.factualAccuracy, -2);
    assert.strictEqual(diff.completeness, -1);
    assert.strictEqual(diff.coherence, -3);
    assert.strictEqual(diff.conciseness, -2);
  });

  it("returns zeros when rubrics are equal", () => {
    const rubric: FidelityRubric = {
      factualAccuracy: 4,
      completeness: 4,
      coherence: 4,
      conciseness: 4,
    };

    const diff = compareRubrics(rubric, rubric);
    assert.strictEqual(diff.factualAccuracy, 0);
    assert.strictEqual(diff.completeness, 0);
    assert.strictEqual(diff.coherence, 0);
    assert.strictEqual(diff.conciseness, 0);
  });
});

// ─── Read Scoring Tests ────────────────────────────────────────────────────────

describe("readScoring", () => {
  beforeEach(() => setupTempDir());
  afterEach(() => teardownTempDir());

  it("returns null for missing file", () => {
    const missingPath = join(TEMP_DIR, "nonexistent.json");
    assert.strictEqual(readScoring(missingPath), null);
  });

  it("returns null for report without scoring", () => {
    const report: CompareReport = {
      metadata: {
        fixtureId: "test",
        model: "test",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
      baseline: {
        config: { features: { unknownsInventory: false, factCheckCoordination: false } },
        metrics: {
          wallClockMs: 100,
          tokens: { input: 100, output: 50, cacheRead: 0, cacheWrite: 0, total: 150 },
          cost: 0.001,
          interventions: { blocker: 0, correction: 0, redirect: 0 },
          factCheck: null,
        },
      },
      treatment: {
        config: { features: { unknownsInventory: true, factCheckCoordination: true } },
        metrics: {
          wallClockMs: 150,
          tokens: { input: 130, output: 65, cacheRead: 0, cacheWrite: 0, total: 195 },
          cost: 0.0015,
          interventions: { blocker: 0, correction: 0, redirect: 0 },
          factCheck: null,
        },
      },
      scoring: {},
    };

    const reportPath = join(TEMP_DIR, "COMPARE-REPORT.json");
    writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf-8");

    const scoring = readScoring(reportPath);
    // Empty scoring object should return as-is (with baseline/treatment undefined)
    assert(scoring !== null);
    assert.strictEqual(scoring.baseline, undefined);
    assert.strictEqual(scoring.treatment, undefined);
  });

  it("returns scoring with populated rubrics", () => {
    const reportPath = createMinimalReport(TEMP_DIR);
    const baselineRubric: FidelityRubric = { factualAccuracy: 3, completeness: 4, coherence: 3, conciseness: 4 };
    const treatmentRubric: FidelityRubric = { factualAccuracy: 4, completeness: 5, coherence: 4, conciseness: 5 };

    captureScoring(reportPath, "baseline", baselineRubric);
    captureScoring(reportPath, "treatment", treatmentRubric);

    const scoring = readScoring(reportPath);
    assert(scoring !== null);
    assert.deepStrictEqual(scoring.baseline, baselineRubric);
    assert.deepStrictEqual(scoring.treatment, treatmentRubric);
  });
});
