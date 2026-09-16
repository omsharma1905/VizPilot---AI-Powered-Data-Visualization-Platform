/**
 * Base ECharts Options & Theme — Phase 2D
 *
 * Provides styling aligned with VizPilot's dark cinematic visual identity:
 * - transparent background
 * - violet/indigo/pink/emerald accents
 * - clean monospace & sans typography
 * - high-contrast axis styling
 */

import type { EChartsOption } from 'echarts';

export const VIZPILOT_PALETTE = [
  '#6366f1', // Indigo primary
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#84cc16', // Lime
];

export function createBaseOption(title?: string): Partial<EChartsOption> {
  return {
    backgroundColor: 'transparent',
    color: VIZPILOT_PALETTE,
    animation: true,
    animationDuration: 600,
    textStyle: {
      fontFamily: 'Inter, system-ui, sans-serif',
      color: 'rgba(255, 255, 255, 0.7)',
    },
    title: title
      ? {
          text: title,
          textStyle: {
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 'bold',
            fontFamily: 'Inter, sans-serif',
          },
          left: '2%',
          top: '2%',
        }
      : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0f0f16',
      borderColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1,
      textStyle: {
        color: '#ffffff',
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
      },
      extraCssText: 'border-radius: 12px; box-shadow: 0 12px 36px rgba(0,0,0,0.6); backdrop-filter: blur(8px);',
    },
    grid: {
      left: '3%',
      right: '4%',
      top: title ? '15%' : '10%',
      bottom: '8%',
      containLabel: true,
    },
    legend: {
      textStyle: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 11,
      },
      icon: 'circle',
      top: '2%',
      right: '4%',
    },
  };
}
