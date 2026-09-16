import type { EChartsOption } from 'echarts';

// ─── VizPilot ECharts Theme — Light Mode ─────────────────────────────────────
// Tuned for white/cream card surfaces with dark text.

export const chartColors = {
  // Primary palette — indigo/violet family
  primary:   '#6366f1',
  secondary: '#8b5cf6',
  tertiary:  '#a78bfa',

  // Supporting data palette
  palette: [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
  ],

  // Semantic
  success: '#10b981',
  warning: '#f59e0b',
  danger:  '#ef4444',

  // Light-mode surface colors
  gridLine:  'rgba(12, 10, 18, 0.06)',
  axisLine:  'rgba(12, 10, 18, 0.12)',
  axisLabel: 'rgba(107, 100, 120, 0.8)',
  tooltip: {
    bg:     '#ffffff',
    border: 'rgba(12, 10, 18, 0.08)',
    text:   '#0c0a12',
  },
};

// ─── Base ECharts config ──────────────────────────────────────────────────────

export const baseChartConfig: Partial<EChartsOption> = {
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'Inter, sans-serif',
    color: chartColors.axisLabel,
  },
  grid: {
    left:         '4%',
    right:        '4%',
    top:          '12%',
    bottom:       '8%',
    containLabel: true,
  },
  tooltip: {
    trigger:         'axis',
    backgroundColor: chartColors.tooltip.bg,
    borderColor:     chartColors.tooltip.border,
    borderWidth:     1,
    textStyle: {
      color:      chartColors.tooltip.text,
      fontFamily: 'Inter, sans-serif',
      fontSize:   12,
    },
    extraCssText: 'border-radius: 10px; box-shadow: 0 8px 32px rgba(0,0,0,0.10);',
  },
  legend: {
    textStyle: {
      color:      chartColors.axisLabel,
      fontFamily: 'Inter, sans-serif',
      fontSize:   12,
    },
    icon:       'circle',
    itemWidth:  8,
    itemHeight: 8,
  },
};

// ─── Format helpers ───────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `\$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `\$${(value / 1_000).toFixed(0)}K`;
  return `\$${value}`;
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}
