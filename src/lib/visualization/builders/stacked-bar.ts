/**
 * Stacked Bar Chart Builder — Phase 2D
 */

import type { EChartsOption, SeriesOption } from 'echarts';
import type { VizPilotTable } from '@/src/types/dataset';
import type { ChartBuilderContext } from '../types';
import type { FieldResolver } from '../field-resolver';
import { aggregateByTwoDimensions } from '../data-transform';
import { createBaseOption, VIZPILOT_PALETTE } from '../options/base';
import { MAX_RENDER_POINTS } from '../limits';
import { VisualizationError } from '../errors';

export function buildStackedBarChart(
  table: VizPilotTable,
  context: ChartBuilderContext,
  resolver: FieldResolver
): {
  option: EChartsOption;
  renderedRowCount: number;
  aggregated: boolean;
  fieldsUsed: string[];
} {
  const primaryName = context.fields.x;
  if (!primaryName) {
    throw new VisualizationError(
      'VISUALIZATION_FIELD_NOT_FOUND',
      'Stacked bar chart requires a primary dimension field (x).',
      400
    );
  }

  const secondaryName = context.fields.color || context.fields.category;
  if (!secondaryName || secondaryName === primaryName) {
    throw new VisualizationError(
      'VISUALIZATION_FIELD_NOT_FOUND',
      'Stacked bar chart requires a secondary dimension field (color or category).',
      400
    );
  }

  const yColName = context.fields.y?.[0];
  if (!yColName) {
    throw new VisualizationError(
      'VISUALIZATION_FIELD_NOT_FOUND',
      'Stacked bar chart requires at least one measure field (y[0]).',
      400
    );
  }

  const primField = resolver.resolveRequired(primaryName, 'Primary dimension (x)');
  const secField = resolver.resolveRequired(secondaryName, 'Secondary dimension');
  const valField = resolver.resolveRequired(yColName, 'Measure (y)');

  const aggFn = context.aggregation?.function || 'sum';

  const { categories, series: seriesData } = aggregateByTwoDimensions(
    table.rows,
    primField.index,
    secField.index,
    valField.index,
    aggFn
  );

  let renderedCategories = categories;
  if (renderedCategories.length > MAX_RENDER_POINTS) {
    context.warnings.push(
      `Stacked bar chart categories (${renderedCategories.length}) exceeded limit of ${MAX_RENDER_POINTS}. Truncating.`
    );
    renderedCategories = renderedCategories.slice(0, MAX_RENDER_POINTS);
  }

  const base = createBaseOption(`${valField.column.name} by ${primField.column.name} (Stacked)`);

  const series: SeriesOption[] = seriesData.map((s, idx) => ({
    name: s.name,
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    data: renderedCategories.map((_, i) => s.data[i] ?? 0),
    itemStyle: {
      color: VIZPILOT_PALETTE[idx % VIZPILOT_PALETTE.length],
    },
  }));

  const option: EChartsOption = {
    ...base,
    xAxis: {
      type: 'category',
      data: renderedCategories,
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 11,
        rotate: renderedCategories.length > 8 ? 35 : 0,
      },
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.15)' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 11,
      },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.08)', type: 'dashed' } },
    },
    series,
  };

  return {
    option,
    renderedRowCount: renderedCategories.length * seriesData.length,
    aggregated: true,
    fieldsUsed: [primField.column.name, secField.column.name, valField.column.name],
  };
}
