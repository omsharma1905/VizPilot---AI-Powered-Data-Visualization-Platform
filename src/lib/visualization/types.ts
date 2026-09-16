/**
 * Deterministic Visualization Engine Contracts — Phase 2D
 */

import type { EChartsOption } from 'echarts';
import type { ChartType, AggregationFunction, FieldMapping } from '@/src/lib/ai/types';

export interface AggregationSpec {
  function: AggregationFunction;
  field?: string;
}

export interface VisualizationMetadata {
  rowCount: number;
  renderedRowCount: number;
  aggregated: boolean;
  aggregation?: AggregationSpec;
  fieldsUsed: string[];
  chartType: ChartType;
  tableId: string;
  tableName: string;
}

export interface VizPilotVisualizationResult {
  chartType: ChartType;
  option: EChartsOption;
  metadata: VisualizationMetadata;
  warnings: string[];
}

export interface ChartBuilderContext {
  tableId: string;
  tableName: string;
  fields: FieldMapping;
  aggregation?: AggregationSpec;
  warnings: string[];
}
