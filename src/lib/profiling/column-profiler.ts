/**
 * Column Profiler — Phase 2B
 *
 * Coordinates profiling for a single column.
 * Integrates statistics, quality, and semantic-role classification.
 */

import type {
  VizPilotColumnProfile,
  VizPilotColumnStatistics,
} from '@/src/types/profiling';
import type { DataValue, VizPilotColumn } from '@/src/types/dataset';
import {
  isNumericType,
  isTemporalType,
  isBooleanType,
  parseNumericValue,
  round,
  safeDivide,
} from './utils';
import { computeNumericStats } from './statistics';
import { computeStringStats } from './categorical';
import { computeTemporalStats } from './temporal';
import { computeColumnQuality } from './quality';
import { classifySemanticRole } from './semantic-role';

export function profileColumn(
  column: VizPilotColumn,
  colValues: DataValue[],
  totalRowCount: number
): VizPilotColumnProfile {
  const inferredType = column.inferredType;

  // 1. Compute column quality
  const quality = computeColumnQuality(column, colValues);

  // 2. Compute statistics depending on inferred type
  let statistics: VizPilotColumnStatistics = { kind: 'none' };

  if (isNumericType(inferredType)) {
    const numericValues = colValues.map(parseNumericValue);
    const stats = computeNumericStats(numericValues);
    statistics = { kind: 'numeric', stats };
  } else if (isTemporalType(inferredType)) {
    const stats = computeTemporalStats(colValues);
    statistics = { kind: 'temporal', stats };
  } else if (isBooleanType(inferredType)) {
    let trueCount = 0;
    let falseCount = 0;
    let nullCount = 0;

    for (const v of colValues) {
      if (v === null || v === undefined) {
        nullCount++;
      } else {
        const s = String(v).trim().toLowerCase();
        if (s === 'true' || s === 'yes' || s === '1' || v === true) {
          trueCount++;
        } else if (s === 'false' || s === 'no' || s === '0' || v === false) {
          falseCount++;
        } else {
          nullCount++;
        }
      }
    }

    const nonNull = trueCount + falseCount;
    const trueRate = round(safeDivide(trueCount, nonNull));

    statistics = {
      kind: 'boolean',
      stats: {
        trueCount,
        falseCount,
        nullCount,
        trueRate,
      },
    };
  } else {
    // String / unknown / label / category
    const stats = computeStringStats(colValues, totalRowCount);
    statistics = { kind: 'string', stats };
  }

  // 3. Classify semantic role
  const semanticRole = classifySemanticRole(
    inferredType,
    column.name,
    quality,
    statistics,
    column.sampleValues
  );

  return {
    columnId: column.id,
    name: column.name,
    index: column.index,
    inferredType,
    semanticRole,
    statistics,
    quality,
    sampleValues: column.sampleValues,
  };
}
