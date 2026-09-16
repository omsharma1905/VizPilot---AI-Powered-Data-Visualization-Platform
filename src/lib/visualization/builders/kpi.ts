/**
 * KPI Metric Card Builder — Phase 2D
 */

import type { EChartsOption } from 'echarts';
import type { VizPilotTable } from '@/src/types/dataset';
import type { ChartBuilderContext } from '../types';
import type { FieldResolver } from '../field-resolver';
import { aggregateNumbers } from '../aggregation';
import { createBaseOption, VIZPILOT_PALETTE } from '../options/base';
import { parseNumericValue } from '@/src/lib/profiling/utils';
import { VisualizationError } from '../errors';

export function buildKpiCard(
  table: VizPilotTable,
  context: ChartBuilderContext,
  resolver: FieldResolver
): {
  option: EChartsOption;
  renderedRowCount: number;
  aggregated: boolean;
  fieldsUsed: string[];
} {
  const colName = context.fields.y?.[0] || context.fields.x;
  if (!colName) {
    throw new VisualizationError(
      'VISUALIZATION_FIELD_NOT_FOUND',
      'KPI metric requires a measure field (y[0] or x).',
      400
    );
  }

  const measureField = resolver.resolveRequired(colName, 'KPI Measure');
  const aggFn = context.aggregation?.function || 'sum';

  const numbers: number[] = [];
  for (const row of table.rows) {
    const n = parseNumericValue(row[measureField.index]);
    if (n !== null) numbers.push(n);
  }

  const val = aggregateNumbers(numbers, aggFn);
  const formattedVal =
    Math.abs(val) >= 1_000_000
      ? `${(val / 1_000_000).toFixed(2)}M`
      : Math.abs(val) >= 1_000
      ? `${(val / 1_000).toFixed(1)}k`
      : val.toLocaleString(undefined, { maximumFractionDigits: 2 });

  const label = `${aggFn.toUpperCase()} of ${measureField.column.name}`;
  const base = createBaseOption();

  const option: EChartsOption = {
    ...base,
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: Math.max(val * 1.5, 100),
        splitNumber: 4,
        radius: '85%',
        center: ['50%', '65%'],
        itemStyle: {
          color: VIZPILOT_PALETTE[0],
        },
        progress: {
          show: true,
          roundCap: true,
          width: 14,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: VIZPILOT_PALETTE[0] },
                { offset: 1, color: VIZPILOT_PALETTE[2] },
              ],
            },
          },
        },
        pointer: { show: false },
        axisLine: {
          roundCap: true,
          lineStyle: {
            width: 14,
            color: [[1, 'rgba(255, 255, 255, 0.08)']],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: {
          show: true,
          offsetCenter: [0, '25%'],
          fontSize: 13,
          color: 'rgba(255, 255, 255, 0.6)',
          fontFamily: 'Inter, sans-serif',
        },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '-10%'],
          fontSize: 32,
          fontWeight: 'bold',
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          formatter: () => formattedVal,
        },
        data: [
          {
            value: val,
            name: label,
          },
        ],
      },
    ],
  };

  return {
    option,
    renderedRowCount: 1,
    aggregated: true,
    fieldsUsed: [measureField.column.name],
  };
}
