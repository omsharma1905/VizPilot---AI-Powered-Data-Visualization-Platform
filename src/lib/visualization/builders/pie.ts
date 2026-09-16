/**
 * Pie Chart Builder — Phase 2D
 */

import type { EChartsOption } from 'echarts';
import type { VizPilotTable } from '@/src/types/dataset';
import type { ChartBuilderContext } from '../types';
import type { FieldResolver } from '../field-resolver';
import { aggregateByDimension } from '../data-transform';
import { createBaseOption, VIZPILOT_PALETTE } from '../options/base';
import { VisualizationError } from '../errors';

const MAX_PIE_SLICES = 10;

export function buildPieChart(
  table: VizPilotTable,
  context: ChartBuilderContext,
  resolver: FieldResolver,
  isDonut: boolean = false
): {
  option: EChartsOption;
  renderedRowCount: number;
  aggregated: boolean;
  fieldsUsed: string[];
} {
  const catColName = context.fields.category || context.fields.x;
  if (!catColName) {
    throw new VisualizationError(
      'VISUALIZATION_FIELD_NOT_FOUND',
      'Pie chart requires a category dimension field (category or x).',
      400
    );
  }

  const valColName = context.fields.y?.[0];
  if (!valColName) {
    throw new VisualizationError(
      'VISUALIZATION_FIELD_NOT_FOUND',
      'Pie chart requires at least one measure field (y[0]).',
      400
    );
  }

  const catField = resolver.resolveRequired(catColName, 'Category');
  const valField = resolver.resolveRequired(valColName, 'Measure');

  const aggFn = context.aggregation?.function || 'sum';

  // Aggregate by category (descending value order)
  const allSlices = aggregateByDimension(
    table.rows,
    catField.index,
    valField.index,
    aggFn,
    false
  );

  let slices: Array<{ name: string; value: number }>;
  if (allSlices.length > MAX_PIE_SLICES) {
    context.warnings.push(
      `Pie chart categories (${allSlices.length}) exceeded max slices (${MAX_PIE_SLICES}). Top ${MAX_PIE_SLICES - 1} shown; remainder aggregated into "Other".`
    );
    const topSlices = allSlices.slice(0, MAX_PIE_SLICES - 1).map((s) => ({
      name: s.category,
      value: s.value,
    }));
    const otherVal = allSlices
      .slice(MAX_PIE_SLICES - 1)
      .reduce((acc, s) => acc + s.value, 0);

    topSlices.push({ name: 'Other', value: Math.round(otherVal * 100) / 100 });
    slices = topSlices;
  } else {
    slices = allSlices.map((s) => ({ name: s.category, value: s.value }));
  }

  const title = `${valField.column.name} Share by ${catField.column.name}`;
  const base = createBaseOption(title);

  const option: EChartsOption = {
    ...base,
    tooltip: {
      trigger: 'item',
      backgroundColor: '#0f0f16',
      borderColor: 'rgba(255, 255, 255, 0.15)',
      textStyle: { color: '#ffffff', fontSize: 12 },
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 11 },
      icon: 'circle',
    },
    series: [
      {
        name: valField.column.name,
        type: 'pie',
        radius: isDonut ? ['45%', '70%'] : '65%',
        center: ['40%', '55%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#0b0b10',
          borderWidth: 2,
        },
        label: {
          show: !isDonut,
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: 11,
          formatter: '{b}: {d}%',
        },
        labelLine: {
          lineStyle: { color: 'rgba(255, 255, 255, 0.2)' },
        },
        data: slices.map((s, idx) => ({
          ...s,
          itemStyle: { color: VIZPILOT_PALETTE[idx % VIZPILOT_PALETTE.length] },
        })),
      },
    ],
  };

  return {
    option,
    renderedRowCount: slices.length,
    aggregated: true,
    fieldsUsed: [catField.column.name, valField.column.name],
  };
}
