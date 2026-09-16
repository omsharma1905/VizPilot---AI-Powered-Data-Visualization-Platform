/**
 * Data Quality Analysis — Phase 2B
 *
 * Computes quality metrics at column and table level.
 * All calculations are deterministic and transparent.
 *
 * Quality Score Formula (documented inline):
 *   overallScore = 0.4 × avgCompletenessRate
 *                + 0.3 × avgTypeConsistencyRate
 *                + 0.2 × (1 − emptyColumnRate)
 *                + 0.1 × (1 − clamp(avgDuplicateRate, 0, 1))
 */

import type {
  VizPilotColumnQuality,
  VizPilotTableProfile,
  VizPilotDataQuality,
} from '@/src/types/profiling';
import type { DataValue, VizPilotColumn } from '@/src/types/dataset';
import { safeDivide, round, clamp01 } from './utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Duplicate detection is skipped for tables exceeding this row count */
export const DUPLICATE_DETECTION_MAX_ROWS = 100_000;

// ---------------------------------------------------------------------------
// Column quality
// ---------------------------------------------------------------------------

/**
 * Computes quality metrics for a single column.
 *
 * @param column     — canonical VizPilotColumn (from ingestion layer)
 * @param colValues  — extracted DataValue array for this column
 */
export function computeColumnQuality(
  column: VizPilotColumn,
  colValues: DataValue[]
): VizPilotColumnQuality {
  const totalCount = colValues.length;
  const nullCount = colValues.filter((v) => v === null || v === undefined).length;
  const nonNullValues = colValues.filter((v) => v !== null && v !== undefined);
  const nonNullCount = nonNullValues.length;

  const nullRate = round(safeDivide(nullCount, totalCount));
  const isAllNull = nullCount === totalCount;

  // Unique count: number of distinct non-null values
  const distinctSet = new Set(nonNullValues.map(String));
  const uniqueCount = distinctSet.size;
  const uniquenessRate = round(safeDivide(uniqueCount, nonNullCount));

  // isConstant: all non-null values are the same
  const isConstant = !isAllNull && uniqueCount <= 1;

  // Type consistency: re-use ingestion-layer inference signal.
  // The ingestion layer already ran classifyValue on each cell.
  // We approximate consistency from the column's nullCount/totalCount:
  // if the column was already typed by inference, all non-null values passed the 85% threshold.
  // typeConsistencyRate = nonNullCount / totalCount when type != 'unknown', 0 when unknown.
  const typeConsistencyRate = column.inferredType === 'unknown'
    ? 0
    : round(safeDivide(nonNullCount, totalCount));

  return {
    nullCount,
    nullRate,
    uniqueCount,
    uniquenessRate,
    typeConsistencyRate,
    isConstant,
    isAllNull,
  };
}

// ---------------------------------------------------------------------------
// Table-level duplicate detection
// ---------------------------------------------------------------------------

export interface DuplicateResult {
  duplicateRowCount: number;
  duplicateRowRate: number;
  skipped: boolean;
}

/**
 * Detects duplicate rows using JSON string hashing.
 * O(n) time, O(n) space — bounded by DUPLICATE_DETECTION_MAX_ROWS.
 *
 * When skipped due to row count, returns rate = -1 and skipped = true.
 */
export function detectDuplicateRows(rows: DataValue[][]): DuplicateResult {
  if (rows.length > DUPLICATE_DETECTION_MAX_ROWS) {
    return { duplicateRowCount: 0, duplicateRowRate: -1, skipped: true };
  }

  const seen = new Set<string>();
  let duplicateRowCount = 0;

  for (const row of rows) {
    const key = JSON.stringify(row);
    if (seen.has(key)) {
      duplicateRowCount++;
    } else {
      seen.add(key);
    }
  }

  const duplicateRowRate = round(safeDivide(duplicateRowCount, rows.length));
  return { duplicateRowCount, duplicateRowRate, skipped: false };
}

// ---------------------------------------------------------------------------
// Table-level completeness
// ---------------------------------------------------------------------------

/**
 * Computes the fraction of rows that are complete (no nulls in any column).
 */
export function computeCompletenessRate(rows: DataValue[][], columnCount: number): number {
  if (rows.length === 0 || columnCount === 0) return 1;
  let completeRows = 0;
  for (const row of rows) {
    let isComplete = true;
    for (let c = 0; c < columnCount; c++) {
      if (row[c] === null || row[c] === undefined) {
        isComplete = false;
        break;
      }
    }
    if (isComplete) completeRows++;
  }
  return round(safeDivide(completeRows, rows.length));
}

// ---------------------------------------------------------------------------
// Dataset-level quality score
// ---------------------------------------------------------------------------

/**
 * Computes the aggregate VizPilotDataQuality from all table profiles.
 *
 * Formula (transparent):
 *   overallScore = 0.4 × avgCompletenessRate
 *                + 0.3 × avgTypeConsistencyRate
 *                + 0.2 × (1 − emptyColumnRate)
 *                + 0.1 × (1 − clamp(avgDuplicateRate, 0, 1))
 */
export function computeDataQuality(tableProfiles: VizPilotTableProfile[]): VizPilotDataQuality {
  if (tableProfiles.length === 0) {
    return {
      overallScore: 0,
      avgCompletenessRate: 0,
      avgTypeConsistencyRate: 0,
      hasHighNullColumns: false,
      hasHighDuplicateRows: false,
    };
  }

  // Weighted averages (by row count)
  let totalRows = 0;
  let weightedCompleteness = 0;
  let totalColumns = 0;
  let weightedTypeConsistency = 0;
  let emptyColumnCount = 0;
  let hasHighNullColumns = false;
  let hasHighDuplicateRows = false;

  for (const tp of tableProfiles) {
    const w = tp.rowCount;
    totalRows += w;
    weightedCompleteness += tp.completenessRate * w;

    for (const col of tp.columns) {
      totalColumns++;
      weightedTypeConsistency += col.quality.typeConsistencyRate;
      if (col.quality.isAllNull) emptyColumnCount++;
      if (col.quality.nullRate > 0.5) hasHighNullColumns = true;
    }

    if (tp.duplicateRowRate > 0.05) hasHighDuplicateRows = true;
  }

  const avgCompletenessRate = round(safeDivide(weightedCompleteness, totalRows));
  const avgTypeConsistencyRate = round(safeDivide(weightedTypeConsistency, totalColumns));
  const emptyColumnRate = round(safeDivide(emptyColumnCount, totalColumns));

  // Average duplicate rate (skip tables where detection was skipped = -1)
  const validDupRates = tableProfiles
    .map((tp) => tp.duplicateRowRate)
    .filter((r) => r >= 0);
  const avgDuplicateRate = validDupRates.length > 0
    ? safeDivide(validDupRates.reduce((a, b) => a + b, 0), validDupRates.length)
    : 0;

  // Quality score formula
  const overallScore = round(
    clamp01(
      0.4 * avgCompletenessRate +
      0.3 * avgTypeConsistencyRate +
      0.2 * (1 - emptyColumnRate) +
      0.1 * (1 - clamp01(avgDuplicateRate))
    )
  );

  return {
    overallScore,
    avgCompletenessRate,
    avgTypeConsistencyRate,
    hasHighNullColumns,
    hasHighDuplicateRows,
  };
}
