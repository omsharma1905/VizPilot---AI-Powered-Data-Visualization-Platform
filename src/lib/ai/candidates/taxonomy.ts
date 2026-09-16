/**
 * Chart Taxonomy Metadata & Requirements — Phase 2C
 */

import type { ChartType, AnalyticalIntent } from '../types';

export interface ChartDefinition {
  type: ChartType;
  label: string;
  description: string;
  supportedIntents: AnalyticalIntent[];
  requiresTemporal: boolean;
  requiresNumeric: boolean;
  minMeasures: number;
  maxMeasures: number;
  minDimensions: number;
  maxDimensions: number;
  maxCategoryCardinality?: number;
}

export const CHART_TAXONOMY: Record<ChartType, ChartDefinition> = {
  bar: {
    type: 'bar',
    label: 'Vertical Bar Chart',
    description: 'Compare discrete categories or rankings across numeric metrics.',
    supportedIntents: ['comparison', 'ranking', 'part_to_whole'],
    requiresTemporal: false,
    requiresNumeric: true,
    minMeasures: 1,
    maxMeasures: 2,
    minDimensions: 1,
    maxDimensions: 1,
    maxCategoryCardinality: 50,
  },
  horizontal_bar: {
    type: 'horizontal_bar',
    label: 'Horizontal Bar Chart',
    description: 'Compare categories with longer labels or clear ranked hierarchy.',
    supportedIntents: ['ranking', 'comparison'],
    requiresTemporal: false,
    requiresNumeric: true,
    minMeasures: 1,
    maxMeasures: 1,
    minDimensions: 1,
    maxDimensions: 1,
    maxCategoryCardinality: 50,
  },
  grouped_bar: {
    type: 'grouped_bar',
    label: 'Grouped Bar Chart',
    description: 'Compare metric values segmented across two categorical dimensions.',
    supportedIntents: ['comparison', 'composition'],
    requiresTemporal: false,
    requiresNumeric: true,
    minMeasures: 1,
    maxMeasures: 1,
    minDimensions: 2,
    maxDimensions: 2,
    maxCategoryCardinality: 25,
  },
  stacked_bar: {
    type: 'stacked_bar',
    label: 'Stacked Bar Chart',
    description: 'Show total volume and sub-category composition breakdown over dimensions.',
    supportedIntents: ['composition', 'part_to_whole', 'change_over_time'],
    requiresTemporal: false,
    requiresNumeric: true,
    minMeasures: 1,
    maxMeasures: 1,
    minDimensions: 2,
    maxDimensions: 2,
    maxCategoryCardinality: 25,
  },
  line: {
    type: 'line',
    label: 'Line Chart',
    description: 'Track quantitative continuous progression and historical trends over time.',
    supportedIntents: ['trend', 'change_over_time'],
    requiresTemporal: true,
    requiresNumeric: true,
    minMeasures: 1,
    maxMeasures: 3,
    minDimensions: 1,
    maxDimensions: 2,
  },
  area: {
    type: 'area',
    label: 'Area Chart',
    description: 'Emphasize magnitude of change and volume accumulation over continuous time.',
    supportedIntents: ['trend', 'change_over_time', 'composition'],
    requiresTemporal: true,
    requiresNumeric: true,
    minMeasures: 1,
    maxMeasures: 2,
    minDimensions: 1,
    maxDimensions: 2,
  },
  scatter: {
    type: 'scatter',
    label: 'Scatter Plot',
    description: 'Analyze distribution, clusters, and statistical correlation between two numeric variables.',
    supportedIntents: ['relationship', 'distribution'],
    requiresTemporal: false,
    requiresNumeric: true,
    minMeasures: 2,
    maxMeasures: 2,
    minDimensions: 0,
    maxDimensions: 1,
  },
  pie: {
    type: 'pie',
    label: 'Pie Chart',
    description: 'Display relative proportions and part-to-whole relationships across low-cardinality slices.',
    supportedIntents: ['part_to_whole', 'composition'],
    requiresTemporal: false,
    requiresNumeric: true,
    minMeasures: 1,
    maxMeasures: 1,
    minDimensions: 1,
    maxDimensions: 1,
    maxCategoryCardinality: 10,
  },
  donut: {
    type: 'donut',
    label: 'Donut Chart',
    description: 'Modern part-to-whole slice breakdown for high-level proportion comparison.',
    supportedIntents: ['part_to_whole', 'composition'],
    requiresTemporal: false,
    requiresNumeric: true,
    minMeasures: 1,
    maxMeasures: 1,
    minDimensions: 1,
    maxDimensions: 1,
    maxCategoryCardinality: 10,
  },
  histogram: {
    type: 'histogram',
    label: 'Histogram',
    description: 'Visualize frequency distribution and statistical spread of a continuous numeric field.',
    supportedIntents: ['distribution'],
    requiresTemporal: false,
    requiresNumeric: true,
    minMeasures: 1,
    maxMeasures: 1,
    minDimensions: 0,
    maxDimensions: 0,
  },
  kpi_card: {
    type: 'kpi_card',
    label: 'KPI Summary Card',
    description: 'Highlight high-level executive aggregates and key performance metrics.',
    supportedIntents: ['kpi'],
    requiresTemporal: false,
    requiresNumeric: true,
    minMeasures: 1,
    maxMeasures: 1,
    minDimensions: 0,
    maxDimensions: 0,
  },
};
