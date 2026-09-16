/**
 * Deterministic Candidate Scoring & Confidence Calibration — Phase 2C
 *
 * Implements a multi-dimensional scoring engine that evaluates:
 * 1. Structural Fit (20-25%): Valid data types & dimension shapes
 * 2. Analytical Fit (30-35%): Deep alignment with analytical intent (trend, comparison, etc.)
 * 3. Temporal Fit (15-20%): Time-series preference for line/area vs category comparison
 * 4. Cardinality Fit (10-15%): Suitable slice/category count
 * 5. Quality Fit (10%): Data completeness and absence of nulls
 * 6. Bounded LLM Influence (15%): Modest, bounded influence when LLM is available
 */

import type { VizPilotDataProfile } from '@/src/types/profiling';
import type { VizPilotVisualizationCandidate, ChartType, AnalyticalIntent } from '../types';

/**
 * Evaluates how strongly a chart type matches the intended analytical question.
 */
export function calculateAnalyticalFit(
  chartType: ChartType,
  intent: AnalyticalIntent,
  isTemporal: boolean
): number {
  switch (intent) {
    case 'trend':
    case 'change_over_time':
      if (chartType === 'line') return 98;
      if (chartType === 'area') return 94;
      if (chartType === 'bar' || chartType === 'horizontal_bar') return 68;
      if (chartType === 'scatter') return 45;
      return 25;

    case 'comparison':
    case 'ranking':
      if (chartType === 'bar' || chartType === 'horizontal_bar') return 93;
      if (chartType === 'grouped_bar' || chartType === 'stacked_bar') return 90;
      if (chartType === 'pie' || chartType === 'donut') return 72;
      // Line is acceptable if temporal, but heavily penalized for arbitrary nominal categories
      if (chartType === 'line') return isTemporal ? 75 : 35;
      return 35;

    case 'relationship':
      if (chartType === 'scatter') return 96;
      return 35;

    case 'distribution':
      if (chartType === 'histogram') return 96;
      if (chartType === 'bar') return 65;
      return 30;

    case 'part_to_whole':
    case 'composition':
      if (chartType === 'pie' || chartType === 'donut') return 92;
      if (chartType === 'stacked_bar') return 90;
      if (chartType === 'bar') return 72;
      return 25;

    case 'kpi':
      if (chartType === 'kpi_card') return 95;
      return 45;

    default:
      return 70;
  }
}

/**
 * Evaluates appropriateness for temporal vs non-temporal dimensions.
 */
export function calculateTemporalFit(chartType: ChartType, isTemporal: boolean): number {
  if (isTemporal) {
    if (chartType === 'line') return 98;
    if (chartType === 'area') return 94;
    if (chartType === 'bar' || chartType === 'horizontal_bar') return 68;
    if (chartType === 'pie' || chartType === 'donut') return 20;
    return 35;
  }

  // Non-temporal categorical
  if (chartType === 'bar' || chartType === 'horizontal_bar') return 93;
  if (chartType === 'grouped_bar' || chartType === 'stacked_bar') return 90;
  if (chartType === 'pie' || chartType === 'donut') return 80;
  if (chartType === 'scatter' || chartType === 'histogram' || chartType === 'kpi_card') return 90;
  // Line chart without temporal dimension is penalized
  if (chartType === 'line' || chartType === 'area') return 35;
  return 70;
}

/**
 * Evaluates category cardinality suitability for specific charts.
 */
export function calculateCardinalityFit(chartType: ChartType, cardinality?: number): number {
  if (cardinality === undefined) return 85;

  if (chartType === 'pie' || chartType === 'donut') {
    if (cardinality <= 6) return 95;
    if (cardinality <= 10) return 70;
    return 10;
  }

  if (chartType === 'bar' || chartType === 'horizontal_bar') {
    if (cardinality >= 3 && cardinality <= 20) return 95;
    if (cardinality <= 35) return 80;
    if (cardinality <= 50) return 65;
    return 40;
  }

  if (chartType === 'line' || chartType === 'area') {
    if (cardinality >= 4) return 95;
    if (cardinality >= 2) return 75;
    return 30;
  }

  return 85;
}

/**
 * Computes deterministic multi-factor recommendation score (0 - 100).
 */
export function calculateCandidateScore(
  candidate: VizPilotVisualizationCandidate,
  profile: VizPilotDataProfile,
  llmConfidence?: number
): number {
  const isTemporal = candidate.constraints.isTemporal === true;
  const structuralFit = candidate.baseScore; // 0 - 100
  const analyticalFit = calculateAnalyticalFit(candidate.chartType, candidate.analyticalIntent, isTemporal);
  const temporalFit = calculateTemporalFit(candidate.chartType, isTemporal);
  const cardinalityFit = calculateCardinalityFit(candidate.chartType, candidate.constraints.cardinality);

  // Quality fit from table completeness
  const table = profile.tables.find((t) => t.tableId === candidate.tableId);
  const qualityFit = table ? Math.round(table.completenessRate * 100) : 85;

  // Severe cardinality penalty for pie / donut charts with > 10 categories
  let penalty = 0;
  if (
    (candidate.chartType === 'pie' || candidate.chartType === 'donut') &&
    candidate.constraints.cardinality &&
    candidate.constraints.cardinality > 10
  ) {
    penalty += 30;
  }

  // Temporal trend boost: time progression is the highest-value analytical story
  const temporalPriorityBonus =
    isTemporal && (candidate.analyticalIntent === 'trend' || candidate.analyticalIntent === 'change_over_time')
      ? 2
      : 0;

  if (llmConfidence !== undefined) {
    const boundedLLM = Math.round(Math.min(1.0, Math.max(0.0, llmConfidence)) * 100);
    const composite =
      0.20 * structuralFit +
      0.30 * analyticalFit +
      0.15 * temporalFit +
      0.10 * cardinalityFit +
      0.10 * qualityFit +
      0.15 * boundedLLM +
      temporalPriorityBonus -
      penalty;
    return Math.round(Math.min(100, Math.max(10, composite)));
  }

  // Deterministic mode (fallback / without LLM)
  const composite =
    0.25 * structuralFit +
    0.35 * analyticalFit +
    0.20 * temporalFit +
    0.10 * cardinalityFit +
    0.10 * qualityFit +
    temporalPriorityBonus -
    penalty;
  return Math.round(Math.min(100, Math.max(10, composite)));
}

/**
 * Calibrates recommendation confidence based on absolute score and margin of separation.
 */
export function calibrateConfidence(
  topScore: number,
  runnerUpScore: number,
  llmConfidence?: number
): number {
  const normTop = Math.max(0, Math.min(100, topScore)) / 100;
  const margin = runnerUpScore > 0 ? (topScore - runnerUpScore) / (topScore + 1e-5) : 0.15;
  const marginFactor = Math.min(1.0, Math.max(0, margin * 2.5));

  let conf: number;
  if (llmConfidence !== undefined) {
    const blended = 0.70 * normTop + 0.30 * llmConfidence;
    conf = 0.85 * blended + 0.15 * (blended * marginFactor);
  } else {
    conf = 0.85 * normTop + 0.15 * (normTop * marginFactor);
  }

  return Math.round(Math.min(0.95, Math.max(0.40, conf)) * 100) / 100;
}
