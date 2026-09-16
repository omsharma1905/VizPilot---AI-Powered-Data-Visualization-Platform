'use client';

import dynamic from 'next/dynamic';
import type { EChartsOption } from 'echarts';
import type { VisualizationConfig } from '@/src/types';
import { baseChartConfig } from '@/src/lib/charts/config';

// Lazy-load ECharts to reduce initial bundle
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

function buildFallbackOption(): EChartsOption {
  return {
    ...baseChartConfig,
    series: [],
  };
}

// ─── ChartRenderer ────────────────────────────────────────────────────────────

interface ChartRendererProps {
  config?: VisualizationConfig;
  option?: EChartsOption;
  height?: number | string;
  className?: string;
}

export function ChartRenderer({ config, option: directOption, height = 320, className }: ChartRendererProps) {
  const option = directOption ?? (config ? buildFallbackOption() : baseChartConfig);

  return (
    <div className={className}>
      <ReactECharts
        option={option}
        style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%' }}
        opts={{ renderer: 'svg' }}
        notMerge
        lazyUpdate
      />
    </div>
  );
}
