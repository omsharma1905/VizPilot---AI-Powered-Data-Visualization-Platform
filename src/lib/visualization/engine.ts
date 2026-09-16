/**
 * Deterministic Visualization Engine Orchestrator — Phase 2D
 *
 * Converts a canonical VizPilotDataset + VizPilotVisualizationRecommendation
 * into a production-grade, interactive, typed EChartsOption.
 *
 * Fully deterministic: identical input always produces identical visualization.
 * Zero AI or LLM dependencies in the rendering path.
 */

import type { VizPilotDataset, VizPilotTable } from '@/src/types/dataset';
import type { VizPilotDataProfile } from '@/src/types/profiling';
import type {
  ChartType,
  VizPilotVisualizationRecommendation,
  VizPilotVisualizationCandidate,
  FieldMapping,
} from '@/src/lib/ai/types';
import type { VizPilotVisualizationResult, ChartBuilderContext } from './types';
import { FieldResolver } from './field-resolver';
import { VisualizationError } from './errors';

// Builders
import { buildBarChart } from './builders/bar';
import { buildGroupedBarChart } from './builders/grouped-bar';
import { buildStackedBarChart } from './builders/stacked-bar';
import { buildLineChart } from './builders/line';
import { buildAreaChart } from './builders/area';
import { buildScatterChart } from './builders/scatter';
import { buildPieChart } from './builders/pie';
import { buildDonutChart } from './builders/donut';
import { buildHistogramChart } from './builders/histogram';
import { buildKpiCard } from './builders/kpi';

export interface GenerateVisualizationOptions {
  overrideChartType?: ChartType;
  profile?: VizPilotDataProfile;
}

export function generateVisualization(
  dataset: VizPilotDataset,
  recommendation: VizPilotVisualizationRecommendation | VizPilotVisualizationCandidate,
  options: GenerateVisualizationOptions = {}
): VizPilotVisualizationResult {
  if (!dataset || !dataset.tables || dataset.tables.length === 0) {
    throw new VisualizationError(
      'VISUALIZATION_INVALID_DATASET',
      'Dataset is invalid or contains no tables.',
      400
    );
  }

  // Extract active candidate if recommendation wrapper was provided
  const candidate: any =
    'primary' in recommendation ? recommendation.primary : (recommendation as VizPilotVisualizationCandidate);

  // 1. Locate Target Table
  let table: VizPilotTable | undefined;
  if (candidate.tableId) {
    table = dataset.tables.find(
      (t) => t.id === candidate.tableId || t.name === candidate.tableId
    );
  }
  if (!table) {
    table = dataset.tables[0];
  }

  if (table.rows.length === 0) {
    throw new VisualizationError(
      'VISUALIZATION_EMPTY_TABLE',
      `Table "${table.name}" contains zero rows.`,
      400,
      { tableId: table.id, tableName: table.name }
    );
  }

  const warnings: string[] = [];
  const resolver = new FieldResolver(table);

  // 2. Determine Chart Type
  let chartType: ChartType = options.overrideChartType || candidate.chartType;

  // Clone fields to avoid mutating source recommendation
  const fields: FieldMapping = {
    x: candidate.fields?.x,
    y: candidate.fields?.y ? [...candidate.fields.y] : undefined,
    color: candidate.fields?.color,
    size: candidate.fields?.size,
    category: candidate.fields?.category,
  };

  // 3. Fallback / Adaptive Fields for Chart Switching
  // If switching to a chart type requiring category and only x is present, normalize it
  if (!fields.x && fields.category) {
    fields.x = fields.category;
  }
  if (!fields.category && fields.x) {
    fields.category = fields.x;
  }

  // If measure y is missing or empty, find the first numeric column
  if (!fields.y || fields.y.length === 0) {
    const numCol = table.columns.find(
      (c) =>
        c.inferredType === 'number' ||
        c.inferredType === 'integer' ||
        c.inferredType === 'currency'
    );
    if (numCol) {
      fields.y = [numCol.name];
      warnings.push(`Measure field automatically resolved to "${numCol.name}".`);
    }
  }

  const context: ChartBuilderContext = {
    tableId: table.id,
    tableName: table.name,
    fields,
    aggregation: candidate.aggregation
      ? {
          function: candidate.aggregation.function,
          field: candidate.aggregation.field,
        }
      : undefined,
    warnings,
  };

  // 4. Dispatch to Chart Builder with Deterministic Fallbacks
  return executeBuilderWithFallback(table, chartType, context, resolver, options.profile);
}

function executeBuilderWithFallback(
  table: VizPilotTable,
  targetChartType: ChartType,
  context: ChartBuilderContext,
  resolver: FieldResolver,
  profile?: VizPilotDataProfile
): VizPilotVisualizationResult {
  try {
    const built = dispatchChart(targetChartType, table, context, resolver, profile);
    return {
      chartType: targetChartType,
      option: built.option,
      metadata: {
        rowCount: table.rows.length,
        renderedRowCount: built.renderedRowCount,
        aggregated: built.aggregated,
        aggregation: context.aggregation,
        fieldsUsed: built.fieldsUsed,
        chartType: targetChartType,
        tableId: table.id,
        tableName: table.name,
      },
      warnings: context.warnings,
    };
  } catch (err: any) {
    // If a complex chart type fails (e.g. missing secondary dimension in grouped bar),
    // provide a deterministic fallback to vertical bar
    if (targetChartType !== 'bar') {
      context.warnings.push(
        `Failed to render ${targetChartType} (${err.message}). Deterministically falling back to standard bar chart.`
      );
      const fallbackBuilt = buildBarChart(table, context, resolver, false);
      return {
        chartType: 'bar',
        option: fallbackBuilt.option,
        metadata: {
          rowCount: table.rows.length,
          renderedRowCount: fallbackBuilt.renderedRowCount,
          aggregated: fallbackBuilt.aggregated,
          aggregation: context.aggregation,
          fieldsUsed: fallbackBuilt.fieldsUsed,
          chartType: 'bar',
          tableId: table.id,
          tableName: table.name,
        },
        warnings: context.warnings,
      };
    }
    throw err;
  }
}

function dispatchChart(
  type: ChartType,
  table: VizPilotTable,
  context: ChartBuilderContext,
  resolver: FieldResolver,
  profile?: VizPilotDataProfile
): {
  option: any;
  renderedRowCount: number;
  aggregated: boolean;
  fieldsUsed: string[];
} {
  switch (type) {
    case 'bar':
      return buildBarChart(table, context, resolver, false);
    case 'horizontal_bar':
      return buildBarChart(table, context, resolver, true);
    case 'grouped_bar':
      return buildGroupedBarChart(table, context, resolver);
    case 'stacked_bar':
      return buildStackedBarChart(table, context, resolver);
    case 'line':
      return buildLineChart(table, context, resolver);
    case 'area':
      return buildAreaChart(table, context, resolver);
    case 'scatter':
      return buildScatterChart(table, context, resolver);
    case 'pie':
      return buildPieChart(table, context, resolver, false);
    case 'donut':
      return buildDonutChart(table, context, resolver);
    case 'histogram':
      return buildHistogramChart(table, context, resolver, profile);
    case 'kpi_card':
      return buildKpiCard(table, context, resolver);
    default:
      throw new VisualizationError(
        'VISUALIZATION_UNSUPPORTED_TYPE',
        `Unsupported chart type "${type}".`,
        400
      );
  }
}
