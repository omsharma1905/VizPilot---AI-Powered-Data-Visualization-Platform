/**
 * Visualization Intelligence Engine Contracts — Phase 2C
 *
 * Defines the canonical types for chart candidates, analytical intents,
 * recommendations, and LLM input/output contracts.
 */

// ---------------------------------------------------------------------------
// 1. Chart Taxonomy (MVP)
// ---------------------------------------------------------------------------

export type ChartType =
  | 'bar'
  | 'horizontal_bar'
  | 'grouped_bar'
  | 'stacked_bar'
  | 'line'
  | 'area'
  | 'scatter'
  | 'pie'
  | 'donut'
  | 'histogram'
  | 'kpi_card';

// ---------------------------------------------------------------------------
// 2. Analytical Intent Taxonomy
// ---------------------------------------------------------------------------

export type AnalyticalIntent =
  | 'trend'
  | 'comparison'
  | 'ranking'
  | 'distribution'
  | 'relationship'
  | 'composition'
  | 'part_to_whole'
  | 'kpi'
  | 'change_over_time'
  | 'geospatial'
  | 'unknown';

// ---------------------------------------------------------------------------
// 3. Aggregations
// ---------------------------------------------------------------------------

export type AggregationFunction =
  | 'sum'
  | 'avg'
  | 'count'
  | 'min'
  | 'max'
  | 'median';

export interface FieldMapping {
  x?: string;
  y?: string[];
  color?: string;
  size?: string;
  category?: string;
}

export interface AggregationConfig {
  function: AggregationFunction;
  field?: string;
}

// ---------------------------------------------------------------------------
// 4. Candidate Generation
// ---------------------------------------------------------------------------

export interface VizPilotVisualizationCandidate {
  id: string;
  tableId: string;
  chartType: ChartType;
  analyticalIntent: AnalyticalIntent;
  fields: FieldMapping;
  aggregation?: AggregationConfig;
  baseScore: number; // 0 to 100
  reasons: string[];
  constraints: {
    cardinality?: number;
    hasSecondaryDimension?: boolean;
    isTemporal?: boolean;
    isNumeric?: boolean;
  };
}

// ---------------------------------------------------------------------------
// 5. Final Recommendation Schema
// ---------------------------------------------------------------------------

export interface RecommendationAlternative {
  candidateId: string;
  chartType: ChartType;
  analyticalIntent: AnalyticalIntent;
  fields: FieldMapping;
  confidence: number; // 0 to 1
  reasoning: string;
  score: number; // 0 to 100
}

export interface VizPilotVisualizationRecommendation {
  version: string;
  primary: {
    candidateId: string;
    chartType: ChartType;
    analyticalIntent: AnalyticalIntent;
    fields: FieldMapping;
    aggregation?: AggregationConfig;
    confidence: number; // 0 to 1
    reasoning: string;
    score: number; // 0 to 100
  };
  alternatives: RecommendationAlternative[];
  warnings: string[];
  fallbackUsed: boolean;
  providerUsed?: string;
  modelUsed?: string;
  latencyMs: number;
}
