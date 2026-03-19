/**
 * GSD Experiment Runner — Fidelity Scoring and Bounded Iteration Protocol
 *
 * Provides:
 * - FidelityRubric schema for subjective quality scoring
 * - Scoring capture that writes into comparison reports
 * - Bounded iteration runner for experiment loops (max 3 iterations)
 *
 * @module experiment-runner
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { CompareReport } from "./compare-runner.js";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Human fidelity scoring rubric dimensions (1-5 scale). */
export interface FidelityRubric {
  /** Accuracy of facts and claims (1 = many errors, 5 = fully accurate) */
  factualAccuracy: number;
  /** Coverage of required information (1 = missing key points, 5 = comprehensive) */
  completeness: number;
  /** Logical flow and organization (1 = disjointed, 5 = well-structured) */
  coherence: number;
  /** Clarity and brevity (1 = verbose/unclear, 5 = concise and clear) */
  conciseness: number;
  /** Optional free-form notes from the human evaluator */
  notes?: string;
}

/** Scoring slot in CompareReport, populated after human evaluation. */
export interface ScoringSlot {
  baseline?: FidelityRubric;
  treatment?: FidelityRubric;
}

/** Custom error for rubric validation failures. */
export class FidelityRubricError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FidelityRubricError";
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

const RUBRIC_DIMENSIONS: (keyof Omit<FidelityRubric, "notes">)[] = [
  "factualAccuracy",
  "completeness",
  "coherence",
  "conciseness",
];

/**
 * Validate a fidelity rubric.
 *
 * Checks that:
 * - All required dimensions are present
 * - All dimension values are integers in range 1-5
 *
 * @param rubric - The rubric to validate
 * @throws FidelityRubricError if validation fails
 */
export function validateRubric(rubric: unknown): asserts rubric is FidelityRubric {
  if (typeof rubric !== "object" || rubric === null) {
    throw new FidelityRubricError("Rubric must be an object");
  }

  const r = rubric as Record<string, unknown>;

  for (const dim of RUBRIC_DIMENSIONS) {
    const value = r[dim];

    if (value === undefined) {
      throw new FidelityRubricError(`Missing required dimension: ${dim}`);
    }

    if (typeof value !== "number") {
      throw new FidelityRubricError(`Dimension ${dim} must be a number, got ${typeof value}`);
    }

    if (!Number.isInteger(value)) {
      throw new FidelityRubricError(`Dimension ${dim} must be an integer, got ${value}`);
    }

    if (value < 1 || value > 5) {
      throw new FidelityRubricError(`Dimension ${dim} must be in range 1-5, got ${value}`);
    }
  }

  // notes is optional, but if present must be a string
  if (r.notes !== undefined && typeof r.notes !== "string") {
    throw new FidelityRubricError(`notes must be a string if present, got ${typeof r.notes}`);
  }
}

/**
 * Check if a rubric is valid without throwing.
 * Useful for conditional logic before capture.
 */
export function isValidRubric(rubric: unknown): rubric is FidelityRubric {
  try {
    validateRubric(rubric);
    return true;
  } catch {
    return false;
  }
}

// ─── Scoring Capture ───────────────────────────────────────────────────────────

/**
 * Capture a fidelity rubric score into a comparison report.
 *
 * Reads the report from disk, merges the rubric into the scoring section
 * for the specified path (baseline or treatment), and writes back.
 *
 * @param reportPath - Path to the COMPARE-REPORT.json file
 * @param path - Which path to score ('baseline' or 'treatment')
 * @param rubric - The fidelity rubric to capture
 * @throws FidelityRubricError if rubric validation fails
 * @throws Error if report file doesn't exist or is invalid JSON
 */
export function captureScoring(
  reportPath: string,
  path: "baseline" | "treatment",
  rubric: FidelityRubric,
): void {
  // Validate rubric first
  validateRubric(rubric);

  // Check report exists
  if (!existsSync(reportPath)) {
    throw new Error(`Report file not found: ${reportPath}`);
  }

  // Read and parse report
  let report: CompareReport;
  try {
    const raw = readFileSync(reportPath, "utf-8");
    report = JSON.parse(raw) as CompareReport;
  } catch (e) {
    throw new Error(`Failed to parse report at ${reportPath}: ${e}`);
  }

  // Ensure scoring object exists
  if (!report.scoring || typeof report.scoring !== "object") {
    report.scoring = {};
  }

  // Merge rubric into scoring section
  const scoring = report.scoring as ScoringSlot;
  scoring[path] = rubric;
  report.scoring = scoring;

  // Write back
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf-8");

  // Log capture for observability
  console.log(`[EXPERIMENT] scoring captured for ${path} in ${reportPath}`);
}

/**
 * Read scoring from a comparison report.
 * Returns the scoring slot or null if not present.
 */
export function readScoring(reportPath: string): ScoringSlot | null {
  if (!existsSync(reportPath)) {
    return null;
  }

  try {
    const raw = readFileSync(reportPath, "utf-8");
    const report = JSON.parse(raw) as CompareReport;

    if (!report.scoring || typeof report.scoring !== "object") {
      return null;
    }

    return report.scoring as ScoringSlot;
  } catch {
    return null;
  }
}

/**
 * Compute average score across all dimensions.
 * Useful for quick comparisons.
 */
export function averageScore(rubric: FidelityRubric): number {
  const sum = RUBRIC_DIMENSIONS.reduce((acc, dim) => acc + rubric[dim], 0);
  return sum / RUBRIC_DIMENSIONS.length;
}

/**
 * Compare two rubrics and return the difference.
 * Positive values mean treatment is better.
 */
export function compareRubrics(
  baseline: FidelityRubric,
  treatment: FidelityRubric,
): Record<keyof Omit<FidelityRubric, "notes">, number> {
  return {
    factualAccuracy: treatment.factualAccuracy - baseline.factualAccuracy,
    completeness: treatment.completeness - baseline.completeness,
    coherence: treatment.coherence - baseline.coherence,
    conciseness: treatment.conciseness - baseline.conciseness,
  };
}
