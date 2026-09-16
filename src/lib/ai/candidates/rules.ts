/**
 * Candidate Compatibility & Protection Rules — Phase 2C
 *
 * Deterministic rules enforcing cardinality protection, identifier blocking,
 * and chart requirement validations.
 */

import type { VizPilotColumnProfile } from '@/src/types/profiling';
import type { ChartType } from '../types';
import { CHART_TAXONOMY } from './taxonomy';

export interface CompatibilityCheck {
  isCompatible: boolean;
  scoreAdjustment: number;
  reasons: string[];
}

/**
 * Checks whether a column is safe to use as a primary dimension/category.
 * Protects against identifiers and excessive cardinality.
 */
export function checkDimensionCompatibility(
  col: VizPilotColumnProfile,
  chartType: ChartType
): CompatibilityCheck {
  const reasons: string[] = [];
  let scoreAdjustment = 0;

  // 1. Identifier Protection
  if (col.semanticRole === 'identifier') {
    return {
      isCompatible: false,
      scoreAdjustment: -100,
      reasons: [`Column "${col.name}" is an identifier (high cardinality/ID) and cannot serve as an analytical category.`],
    };
  }

  // 2. All-Null / Constant Protection
  if (col.quality.isAllNull) {
    return {
      isCompatible: false,
      scoreAdjustment: -100,
      reasons: [`Column "${col.name}" is completely empty.`],
    };
  }
  if (col.quality.isConstant) {
    return {
      isCompatible: false,
      scoreAdjustment: -100,
      reasons: [`Column "${col.name}" has only a single constant value.`],
    };
  }

  // 3. Cardinality Protection
  const cardinality = col.quality.uniqueCount;
  const def = CHART_TAXONOMY[chartType];

  if (def.maxCategoryCardinality !== undefined && cardinality > def.maxCategoryCardinality) {
    return {
      isCompatible: false,
      scoreAdjustment: -100,
      reasons: [
        `Cardinality of "${col.name}" (${cardinality}) exceeds maximum allowed (${def.maxCategoryCardinality}) for ${chartType}.`,
      ],
    };
  }

  // Penalties for high cardinality on general charts
  if (cardinality > 100) {
    return {
      isCompatible: false,
      scoreAdjustment: -100,
      reasons: [`Category count (${cardinality}) is too high for visual clarity.`],
    };
  }

  if (cardinality > 25 && (chartType === 'bar' || chartType === 'horizontal_bar')) {
    scoreAdjustment -= 15;
    reasons.push(`High category count (${cardinality}) may crowd the chart.`);
  }

  // Positive boost for ideal cardinality
  if (cardinality >= 3 && cardinality <= 15) {
    scoreAdjustment += 15;
    reasons.push(`Ideal category cardinality (${cardinality}) for clear comparison.`);
  }

  return { isCompatible: true, scoreAdjustment, reasons };
}

/**
 * Checks whether a column is safe and meaningful as a metric/measure.
 */
export function checkMeasureCompatibility(
  col: VizPilotColumnProfile
): CompatibilityCheck {
  const reasons: string[] = [];
  let scoreAdjustment = 0;

  if (col.quality.isAllNull) {
    return {
      isCompatible: false,
      scoreAdjustment: -100,
      reasons: [`Column "${col.name}" is completely empty.`],
    };
  }

  if (col.quality.isConstant) {
    scoreAdjustment -= 25;
    reasons.push(`Measure "${col.name}" is constant across all records.`);
  }

  // Differentiated scoring for measures based on semantic depth and completeness
  if (col.semanticRole === 'currency-amount') {
    scoreAdjustment += 18;
    reasons.push(`High-value financial metric "${col.name}".`);
  } else if (col.semanticRole === 'measure') {
    scoreAdjustment += 15;
  } else if (col.semanticRole === 'percentage') {
    scoreAdjustment += 13;
  } else {
    scoreAdjustment += 10;
  }

  // Data completeness bonus
  if (col.quality.nullRate === 0) {
    scoreAdjustment += 2;
  }

  if (col.quality.nullRate > 0.3) {
    scoreAdjustment -= 15;
    reasons.push(`High missingness rate (${Math.round(col.quality.nullRate * 100)}%) in measure.`);
  }

  // Information richness and variance differentiation
  if (col.statistics?.kind === 'numeric') {
    const stats = col.statistics.stats;

    // Distinct values ratio: measures with varied numbers offer richer visualization
    const distinctRatio = col.quality.uniquenessRate;
    if (distinctRatio >= 0.4) {
      scoreAdjustment += 2;
    } else if (distinctRatio <= 0.1 && stats.distinctCount <= 2) {
      scoreAdjustment -= 2;
    }

    // Zero-inflation check: highly sparse metrics are less informative as primary charts
    if (stats.zeroCount > stats.distinctCount) {
      scoreAdjustment -= 3;
    } else if (stats.zeroCount === 0) {
      scoreAdjustment += 1;
    }

    // Variance check: CV (stdDev / (|mean| + 1e-5))
    const cv = stats.stdDev / (Math.abs(stats.mean) + 1e-5);
    if (cv >= 0.05) {
      scoreAdjustment += 1;
    } else if (cv < 0.001) {
      scoreAdjustment -= 3;
    }
  }

  // Deterministic schema position tie-breaker (primary business metrics appear first in tables)
  const positionAdjustment = Math.min(3, col.index * 0.5);
  scoreAdjustment -= positionAdjustment;

  return { isCompatible: true, scoreAdjustment, reasons };
}
