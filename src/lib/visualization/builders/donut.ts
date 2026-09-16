/**
 * Donut Chart Builder — Phase 2D
 */

import type { EChartsOption } from 'echarts';
import type { VizPilotTable } from '@/src/types/dataset';
import type { ChartBuilderContext } from '../types';
import type { FieldResolver } from '../field-resolver';
import { buildPieChart } from './pie';

export function buildDonutChart(
  table: VizPilotTable,
  context: ChartBuilderContext,
  resolver: FieldResolver
): {
  option: EChartsOption;
  renderedRowCount: number;
  aggregated: boolean;
  fieldsUsed: string[];
} {
  return buildPieChart(table, context, resolver, true);
}
