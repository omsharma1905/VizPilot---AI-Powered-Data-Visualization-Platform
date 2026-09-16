/**
 * Scatter Plot Builder — Phase 2D
 */

import type { EChartsOption, SeriesOption } from 'echarts';
import type { VizPilotTable } from '@/src/types/dataset';
import type { ChartBuilderContext } from '../types';
import type { FieldResolver } from '../field-resolver';
import { createBaseOption, VIZPILOT_PALETTE } from '../options/base';
import { MAX_RENDER_POINTS, sampleRowsDeterministically } from '../limits';
import { parseNumericValue } from '@/src/lib/profiling/utils';
import { VisualizationError } from '../errors';

export function buildScatterChart(
  table: VizPilotTable,
  context: ChartBuilderContext,
  resolver: FieldResolver
): {
  option: EChartsOption;
  renderedRowCount: number;
  aggregated: boolean;
  fieldsUsed: string[];
} {
  const xColName = context.fields.x;
  if (!xColName) {
    throw new VisualizationError(
      'VISUALIZATION_FIELD_NOT_FOUND',
      'Scatter plot requires an x-axis measure field (x).',
      400
    );
  }

  const yColName = context.fields.y?.[0];
  if (!yColName) {
    throw new VisualizationError(
      'VISUALIZATION_FIELD_NOT_FOUND',
      'Scatter plot requires a y-axis measure field (y[0]).',
      400
    );
  }

  const xField = resolver.resolveRequired(xColName, 'X Measure');
  const yField = resolver.resolveRequired(yColName, 'Y Measure');
  const colorField = resolver.resolveOptional(context.fields.color);

  // Deterministic downsampling if rows exceed limit
  let rows = table.rows;
  if (rows.length > MAX_RENDER_POINTS) {
    context.warnings.push(
      `Dataset contains ${rows.length} rows; deterministically sampled to ${MAX_RENDER_POINTS} points for scatter visualization.`
    );
    const sampled = sampleRowsDeterministically(rows, MAX_RENDER_POINTS);
    rows = sampled.sampledRows;
  }

  let series: SeriesOption[];
  const fieldsUsed = [xField.column.name, yField.column.name];

  if (colorField) {
    fieldsUsed.push(colorField.column.name);
    // Group points by color category
    const groupMap = new Map<string, number[][]>();
    for (const row of rows) {
      const x = parseNumericValue(row[xField.index]);
      const y = parseNumericValue(row[yField.index]);
      if (x === null || y === null) continue;

      const groupVal = String(row[colorField.index] ?? 'Unknown');
      let pts = groupMap.get(groupVal);
      if (!pts) {
        pts = [];
        groupMap.set(groupVal, pts);
      }
      pts.push([x, y]);
    }

    series = Array.from(groupMap.entries()).map(([groupName, pts], idx) => ({
      name: groupName,
      type: 'scatter',
      data: pts,
      symbolSize: 8,
      itemStyle: {
        color: VIZPILOT_PALETTE[idx % VIZPILOT_PALETTE.length],
        opacity: 0.75,
      },
    }));
  } else {
    const pts: number[][] = [];
    for (const row of rows) {
      const x = parseNumericValue(row[xField.index]);
      const y = parseNumericValue(row[yField.index]);
      if (x !== null && y !== null) {
        pts.push([x, y]);
      }
    }

    series = [
      {
        name: `${xField.column.name} vs ${yField.column.name}`,
        type: 'scatter',
        data: pts,
        symbolSize: 8,
        itemStyle: {
          color: VIZPILOT_PALETTE[0],
          opacity: 0.75,
        },
      },
    ];
  }

  const base = createBaseOption(`${yField.column.name} vs ${xField.column.name}`);

  const option: EChartsOption = {
    ...base,
    tooltip: {
      trigger: 'item',
      backgroundColor: '#0f0f16',
      borderColor: 'rgba(255, 255, 255, 0.15)',
      textStyle: { color: '#ffffff', fontSize: 12 },
      formatter: (params: any) => {
        const val = params.value as number[];
        return `<div style="font-weight:600;margin-bottom:4px;">${params.seriesName}</div>${xField.column.name}: ${val[0]}<br/>${yField.column.name}: ${val[1]}`;
      },
    },
    xAxis: {
      type: 'value',
      name: xField.column.name,
      nameTextStyle: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 11 },
      scale: true,
      axisLabel: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.08)', type: 'dashed' } },
    },
    yAxis: {
      type: 'value',
      name: yField.column.name,
      nameTextStyle: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 11 },
      scale: true,
      axisLabel: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.08)', type: 'dashed' } },
    },
    series,
  };

  const totalPoints = series.reduce((acc, s) => acc + ((s.data as any[])?.length || 0), 0);

  return {
    option,
    renderedRowCount: totalPoints,
    aggregated: false,
    fieldsUsed,
  };
}
