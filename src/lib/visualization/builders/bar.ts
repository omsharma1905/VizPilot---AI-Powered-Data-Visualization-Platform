/**
 * Bar & Horizontal Bar Chart Builder — Phase 2D
 */

import type { EChartsOption, SeriesOption } from 'echarts';
import type { VizPilotTable } from '@/src/types/dataset';
import type { ChartBuilderContext } from '../types';
import type { FieldResolver } from '../field-resolver';
import { aggregateByDimension } from '../data-transform';
import { createBaseOption, VIZPILOT_PALETTE } from '../options/base';
import { MAX_RENDER_POINTS } from '../limits';
import { VisualizationError } from '../errors';

export function buildBarChart(
  table: VizPilotTable,
  context: ChartBuilderContext,
  resolver: FieldResolver,
  isHorizontal: boolean = false
): {
  option: EChartsOption;
  renderedRowCount: number;
  aggregated: boolean;
  fieldsUsed: string[];
} {
  const xColName = context.fields.x || context.fields.category;
  if (!xColName) {
    throw new VisualizationError(
      'VISUALIZATION_FIELD_NOT_FOUND',
      'Bar chart requires a category/dimension field (x or category).',
      400
    );
  }

  const yColName = context.fields.y?.[0];
  if (!yColName) {
    throw new VisualizationError(
      'VISUALIZATION_FIELD_NOT_FOUND',
      'Bar chart requires at least one measure field (y[0]).',
      400
    );
  }

  const dimField = resolver.resolveRequired(xColName, 'Dimension (x)');
  const valField = resolver.resolveRequired(yColName, 'Measure (y)');

  const isTemporal =
    dimField.column.inferredType === 'date' ||
    dimField.column.inferredType === 'datetime';
  const aggFn = context.aggregation?.function || 'sum';

  let aggregatedData = aggregateByDimension(
    table.rows,
    dimField.index,
    valField.index,
    aggFn,
    isTemporal
  );

  if (aggregatedData.length > MAX_RENDER_POINTS) {
    context.warnings.push(
      `Bar chart categories (${aggregatedData.length}) exceeded limit of ${MAX_RENDER_POINTS}. Displaying top ${MAX_RENDER_POINTS}.`
    );
    aggregatedData = aggregatedData.slice(0, MAX_RENDER_POINTS);
  }

  const categories = aggregatedData.map((d) => d.category);
  const values = aggregatedData.map((d) => d.value);

  const base = createBaseOption(`${valField.column.name} by ${dimField.column.name}`);

  const categoryAxis = {
    type: 'category' as const,
    data: categories,
    axisLabel: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: 11,
      rotate: !isHorizontal && categories.length > 8 ? 35 : 0,
      interval: 0,
      overflow: 'truncate' as const,
      width: isHorizontal ? 100 : 80,
    },
    axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.15)' } },
    axisTick: { show: false },
    splitLine: { show: false },
  };

  const valueAxis = {
    type: 'value' as const,
    axisLabel: {
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: 11,
      formatter: (val: number) => {
        if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
        if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
        return String(val);
      },
    },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.08)', type: 'dashed' as const } },
  };

  const series: SeriesOption[] = [
    {
      name: valField.column.name,
      type: 'bar',
      data: values,
      itemStyle: {
        borderRadius: isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: isHorizontal ? 1 : 0,
          y2: isHorizontal ? 0 : 1,
          colorStops: [
            { offset: 0, color: VIZPILOT_PALETTE[0] },
            { offset: 1, color: VIZPILOT_PALETTE[1] },
          ],
        },
      },
      emphasis: {
        itemStyle: {
          color: VIZPILOT_PALETTE[2],
        },
      },
    },
  ];

  const option: EChartsOption = {
    ...base,
    xAxis: isHorizontal ? valueAxis : categoryAxis,
    yAxis: isHorizontal ? categoryAxis : valueAxis,
    series,
  };

  return {
    option,
    renderedRowCount: aggregatedData.length,
    aggregated: true,
    fieldsUsed: [dimField.column.name, valField.column.name],
  };
}
