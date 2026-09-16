/**
 * Relationship Detection — Phase 2B
 *
 * Deterministic relationship detection between columns within tables.
 * NO AI. NO causal claims.
 *
 * Supported relationships:
 * 1. 'correlated' — Pearson correlation between two numeric measures (|r| >= threshold)
 * 2. 'date-hierarchy' — Temporal column paired with a numeric measure (temporal -> measure)
 * 3. 'categorical-measure' — Categorical dimension paired with a numeric measure (category -> measure)
 * 4. 'primary-key' — Single column with identifier role, high uniqueness, 0 nulls
 */

import type {
  VizPilotColumnProfile,
  VizPilotRelationship,
  VizPilotTableProfile,
} from '@/src/types/profiling';
import type { DataValue, VizPilotTable } from '@/src/types/dataset';
import { parseNumericValue, round } from './utils';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Minimum number of paired non-null numeric observations required for correlation */
export const MIN_CORRELATION_OBSERVATIONS = 10;

/** Minimum absolute Pearson correlation coefficient to report */
export const CORRELATION_THRESHOLD = 0.3;

/** Maximum relationships to report per table to prevent clutter */
export const MAX_RELATIONSHIPS_PER_TABLE = 20;

// ---------------------------------------------------------------------------
// Pearson Correlation Calculation
// ---------------------------------------------------------------------------

/**
 * Calculates the Pearson correlation coefficient between two numeric column arrays.
 * Returns null if insufficient observations, zero variance, or non-numeric.
 */
export function calculatePearsonCorrelation(
  colA: DataValue[],
  colB: DataValue[]
): number | null {
  const n = Math.min(colA.length, colB.length);
  const pairedA: number[] = [];
  const pairedB: number[] = [];

  for (let i = 0; i < n; i++) {
    const valA = parseNumericValue(colA[i]);
    const valB = parseNumericValue(colB[i]);
    if (valA !== null && valB !== null) {
      pairedA.push(valA);
      pairedB.push(valB);
    }
  }

  const count = pairedA.length;
  if (count < MIN_CORRELATION_OBSERVATIONS) {
    return null;
  }

  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < count; i++) {
    sumA += pairedA[i];
    sumB += pairedB[i];
  }
  const meanA = sumA / count;
  const meanB = sumB / count;

  let num = 0;
  let denA = 0;
  let denB = 0;

  for (let i = 0; i < count; i++) {
    const diffA = pairedA[i] - meanA;
    const diffB = pairedB[i] - meanB;
    num += diffA * diffB;
    denA += diffA * diffA;
    denB += diffB * diffB;
  }

  const den = Math.sqrt(denA * denB);
  if (den === 0 || !Number.isFinite(den)) {
    return null;
  }

  const r = num / den;
  return Number.isFinite(r) ? round(Math.max(-1, Math.min(1, r))) : null;
}

// ---------------------------------------------------------------------------
// Table Relationships Detection
// ---------------------------------------------------------------------------

export function detectTableRelationships(
  table: VizPilotTable,
  tableProfile: VizPilotTableProfile
): VizPilotRelationship[] {
  const relationships: VizPilotRelationship[] = [];
  const tableId = table.id;
  const columns = tableProfile.columns;

  // 1. Primary Key identification
  for (const col of columns) {
    if (
      col.semanticRole === 'identifier' &&
      col.quality.nullCount === 0 &&
      col.quality.uniquenessRate === 1.0
    ) {
      relationships.push({
        kind: 'primary-key',
        fromTableId: tableId,
        fromColumnId: col.columnId,
        toTableId: tableId,
        toColumnId: col.columnId,
        confidence: 0.99,
      });
    }
  }

  // Group columns by semantic category
  const measures: VizPilotColumnProfile[] = [];
  const temporals: VizPilotColumnProfile[] = [];
  const categories: VizPilotColumnProfile[] = [];

  for (const col of columns) {
    if (
      col.semanticRole === 'measure' ||
      col.semanticRole === 'currency-amount' ||
      col.semanticRole === 'percentage'
    ) {
      measures.push(col);
    } else if (col.semanticRole === 'timestamp') {
      temporals.push(col);
    } else if (
      col.semanticRole === 'category' ||
      col.semanticRole === 'geolocation'
    ) {
      categories.push(col);
    }
  }

  // 2. Numeric <-> Numeric Correlation
  for (let i = 0; i < measures.length; i++) {
    for (let j = i + 1; j < measures.length; j++) {
      if (relationships.length >= MAX_RELATIONSHIPS_PER_TABLE) break;

      const m1 = measures[i];
      const m2 = measures[j];
      const colAValues = table.rows.map((r) => r[m1.index]);
      const colBValues = table.rows.map((r) => r[m2.index]);

      const r = calculatePearsonCorrelation(colAValues, colBValues);
      if (r !== null && Math.abs(r) >= CORRELATION_THRESHOLD) {
        relationships.push({
          kind: 'correlated',
          fromTableId: tableId,
          fromColumnId: m1.columnId,
          toTableId: tableId,
          toColumnId: m2.columnId,
          correlationCoefficient: r,
          confidence: round(Math.abs(r)),
        });
      }
    }
  }

  // 3. Temporal -> Measure relationships (date-hierarchy)
  for (const tCol of temporals) {
    for (const mCol of measures) {
      if (relationships.length >= MAX_RELATIONSHIPS_PER_TABLE) break;
      relationships.push({
        kind: 'date-hierarchy',
        fromTableId: tableId,
        fromColumnId: tCol.columnId,
        toTableId: tableId,
        toColumnId: mCol.columnId,
        confidence: 0.85,
      });
    }
  }

  // 4. Categorical -> Measure relationships (categorical-measure)
  for (const cCol of categories) {
    // Avoid constant categories or excessive cardinality
    if (cCol.quality.isConstant || cCol.quality.uniquenessRate > 0.8) continue;

    for (const mCol of measures) {
      if (relationships.length >= MAX_RELATIONSHIPS_PER_TABLE) break;
      relationships.push({
        kind: 'categorical-measure',
        fromTableId: tableId,
        fromColumnId: cCol.columnId,
        toTableId: tableId,
        toColumnId: mCol.columnId,
        confidence: 0.8,
      });
    }
  }

  return relationships.slice(0, MAX_RELATIONSHIPS_PER_TABLE);
}
