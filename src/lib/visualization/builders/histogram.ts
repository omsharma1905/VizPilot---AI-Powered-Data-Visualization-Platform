/**
 * Histogram Chart Builder — Phase 2D
 */

import type { EChartsOption } from 'echarts';
import type { VizPilotTable } from '@/src/types/dataset';
import type { VizPilotDataProfile } from '@/src/types/profiling';
import type { ChartBuilderContext } from '../types';
import type { FieldResolver } from '../field-resolver';
import { createBaseOption, VIZPILOT_PALETTE } from '../options/base';
import { parseNumericValue } from '@/src/lib/profiling/utils';
import { VisualizationError } from '../errors';

export function buildHistogramChart(
  table: VizPilotTable,
  context: ChartBuilderContext,
  resolver: FieldResolver,
  profile?: VizPilotDataProfile
): {
  option: EChartsOption;
  renderedRowCount: number;
  aggregated: boolean;
  fieldsUsed: string[];
} {
  const colName = context.fields.x || context.fields.y?.[0];
  if (!colName) {
    throw new VisualizationError(
      'VISUALIZATION_FIELD_NOT_FOUND',
      'Histogram requires a numeric measure field (x or y[0]).',
      400
    );
  }

  const measureField = resolver.resolveRequired(colName, 'Numeric measure');

  let binLabels: string[] = [];
  let counts: number[] = [];

  // 1. Try to use pre-computed histogram from Phase 2B profiling
  const tableProfile = profile?.tables.find((t) => t.tableId === table.id || t.name === table.name);
  const colProfile = tableProfile?.columns.find(
    (c) => c.name.toLowerCase() === measureField.column.name.toLowerCase()
  );

  const precomputed =
    colProfile?.statistics.kind === 'numeric'
      ? colProfile.statistics.stats.histogram
      : undefined;

  if (precomputed && precomputed.bins.length > 1 && precomputed.counts.length > 0) {
    counts = precomputed.counts;
    binLabels = precomputed.counts.map((_: number, i: number) => {
      const start = Math.round(precomputed.bins[i] * 100) / 100;
      const end = Math.round(precomputed.bins[i + 1] * 100) / 100;
      return `${start} - ${end}`;
    });
  } else {
    // 2. Deterministic binning calculation
    const numbers: number[] = [];
    for (const row of table.rows) {
      const n = parseNumericValue(row[measureField.index]);
      if (n !== null) numbers.push(n);
    }

    if (numbers.length === 0) {
      binLabels = ['0 - 0'];
      counts = [0];
    } else {
      let min = numbers[0];
      let max = numbers[0];
      for (const n of numbers) {
        if (n < min) min = n;
        if (n > max) max = n;
      }

      if (min === max) {
        binLabels = [`${min}`];
        counts = [numbers.length];
      } else {
        const numBins = Math.min(15, Math.max(5, Math.ceil(Math.sqrt(numbers.length))));
        const binWidth = (max - min) / numBins;
        counts = new Array(numBins).fill(0);
        binLabels = [];

        for (let i = 0; i < numBins; i++) {
          const bStart = min + i * binWidth;
          const bEnd = i === numBins - 1 ? max : min + (i + 1) * binWidth;
          binLabels.push(`${Math.round(bStart * 100) / 100} - ${Math.round(bEnd * 100) / 100}`);
        }

        for (const n of numbers) {
          let bIdx = Math.floor((n - min) / binWidth);
          if (bIdx >= numBins) bIdx = numBins - 1;
          counts[bIdx]++;
        }
      }
    }
  }

  const base = createBaseOption(`Distribution of ${measureField.column.name}`);

  const option: EChartsOption = {
    ...base,
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0f0f16',
      borderColor: 'rgba(255, 255, 255, 0.15)',
      textStyle: { color: '#ffffff', fontSize: 12 },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params;
        return `<div style="font-weight:600;margin-bottom:4px;">Range: ${p.name}</div>Frequency: <b>${p.value}</b>`;
      },
    },
    xAxis: {
      type: 'category',
      data: binLabels,
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 10,
        rotate: binLabels.length > 6 ? 30 : 0,
      },
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.15)' } },
    },
    yAxis: {
      type: 'value',
      name: 'Count',
      nameTextStyle: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 11 },
      axisLabel: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.08)', type: 'dashed' } },
    },
    series: [
      {
        name: 'Frequency',
        type: 'bar',
        barWidth: '95%',
        data: counts,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: VIZPILOT_PALETTE[4] }, // Cyan
              { offset: 1, color: VIZPILOT_PALETTE[0] }, // Indigo
            ],
          },
          borderRadius: [2, 2, 0, 0],
        },
      },
    ],
  };

  return {
    option,
    renderedRowCount: binLabels.length,
    aggregated: true,
    fieldsUsed: [measureField.column.name],
  };
}
