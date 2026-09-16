/**
 * Area Chart Builder — Phase 2D
 */

import type { EChartsOption, SeriesOption } from 'echarts';
import type { VizPilotTable } from '@/src/types/dataset';
import type { ChartBuilderContext } from '../types';
import type { FieldResolver } from '../field-resolver';
import { aggregateByDimension } from '../data-transform';
import { createBaseOption, VIZPILOT_PALETTE } from '../options/base';
import { MAX_RENDER_POINTS } from '../limits';
import { VisualizationError } from '../errors';

export function buildAreaChart(
  table: VizPilotTable,
  context: ChartBuilderContext,
  resolver: FieldResolver
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
      'Area chart requires a dimension field (x).',
      400
    );
  }

  const yColNames = context.fields.y;
  if (!yColNames || yColNames.length === 0) {
    throw new VisualizationError(
      'VISUALIZATION_FIELD_NOT_FOUND',
      'Area chart requires at least one measure field (y).',
      400
    );
  }

  const dimField = resolver.resolveRequired(xColName, 'Dimension (x)');
  const measureFields = resolver.resolveMeasures(yColNames);

  const isTemporal = dimField.column.inferredType === 'date' || dimField.column.inferredType === 'datetime';
  const aggFn = context.aggregation?.function || 'sum';

  const firstMeasureData = aggregateByDimension(
    table.rows,
    dimField.index,
    measureFields[0].index,
    aggFn,
    isTemporal
  );

  let categories = firstMeasureData.map((d) => d.category);
  if (categories.length > MAX_RENDER_POINTS) {
    context.warnings.push(
      `Area chart data points (${categories.length}) exceeded limit of ${MAX_RENDER_POINTS}. Truncating.`
    );
    categories = categories.slice(0, MAX_RENDER_POINTS);
  }

  const series: SeriesOption[] = measureFields.map((mField, idx) => {
    let vals: number[];
    if (idx === 0) {
      vals = firstMeasureData.slice(0, categories.length).map((d) => d.value);
    } else {
      const mData = aggregateByDimension(
        table.rows,
        dimField.index,
        mField.index,
        aggFn,
        isTemporal
      );
      const valMap = new Map(mData.map((d) => [d.category, d.value]));
      vals = categories.map((cat) => valMap.get(cat) ?? 0);
    }

    const color = VIZPILOT_PALETTE[idx % VIZPILOT_PALETTE.length];

    return {
      name: mField.column.name,
      type: 'line',
      data: vals,
      smooth: true,
      symbol: 'circle',
      symbolSize: categories.length > 50 ? 0 : 6,
      lineStyle: { width: 2.5, color },
      itemStyle: { color },
      areaStyle: {
        opacity: 0.35,
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color },
            { offset: 1, color: 'transparent' },
          ],
        },
      },
    };
  });

  const title =
    measureFields.length === 1
      ? `${measureFields[0].column.name} Area over ${dimField.column.name}`
      : `Area Trends by ${dimField.column.name}`;

  const base = createBaseOption(title);

  const option: EChartsOption = {
    ...base,
    tooltip: {
      ...base.tooltip,
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: categories,
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 11,
        rotate: categories.length > 10 ? 30 : 0,
      },
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.15)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 11,
        formatter: (val: number) => {
          if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
          if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
          return String(val);
        },
      },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.08)', type: 'dashed' } },
    },
    series,
  };

  return {
    option,
    renderedRowCount: categories.length,
    aggregated: true,
    fieldsUsed: [dimField.column.name, ...measureFields.map((m) => m.column.name)],
  };
}
