'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sparkles, CheckCircle2, TrendingUp, BarChart3, PieChart, AreaChart, ScatterChart, AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { cn } from '@/src/lib/utils/cn';
import { baseChartConfig, chartColors } from '@/src/lib/charts/config';
import { monthlyRevenue, revenueByRegion } from '@/src/data/mock/dataset';
import { ParallaxText } from '@/src/components/cinematic/ParallaxText';
import type { ChartType } from '@/src/types';
import type { EChartsOption } from 'echarts';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

const CHART_OPTS: { type: ChartType; label: string; conf: number; icon: any }[] = [
  { type: 'bar', label: 'BAR CHART', conf: 92, icon: BarChart3 },
  { type: 'line', label: 'LINE TREND', conf: 87, icon: TrendingUp },
  { type: 'area', label: 'AREA STREAM', conf: 74, icon: AreaChart },
  { type: 'pie', label: 'REGION PIE', conf: 58, icon: PieChart },
  { type: 'scatter', label: 'SCATTER', conf: 65, icon: ScatterChart },
];

function buildCinematicOption(type: ChartType): EChartsOption {
  const months = monthlyRevenue.map((d) => d.month);
  const revenues = monthlyRevenue.map((d) => d.revenue);
  const expenses = monthlyRevenue.map((d) => d.expenses);

  const axisBase = {
    xAxis: {
      type: 'category' as const,
      data: months,
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.15)' } },
      axisTick: { show: false },
      axisLabel: { color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'Inter,sans-serif', fontSize: 11 },
    },
    yAxis: {
      type: 'value' as const,
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.06)' } },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'Inter,sans-serif',
        fontSize: 11,
        formatter: (v: number) => `$${(v / 1000).toFixed(0)}K`,
      },
    },
  };

  switch (type) {
    case 'bar':
      return {
        ...baseChartConfig,
        ...axisBase,
        color: ['#6366f1', '#f43f5e'],
        series: [
          {
            name: 'Revenue',
            type: 'bar',
            data: revenues,
            barMaxWidth: 38,
            itemStyle: { color: '#6366f1', borderRadius: [6, 6, 0, 0] },
          },
          {
            name: 'Expenses',
            type: 'bar',
            data: expenses,
            barMaxWidth: 38,
            itemStyle: { color: 'rgba(255, 255, 255, 0.25)', borderRadius: [6, 6, 0, 0] },
          },
        ],
      };
    case 'line':
      return {
        ...baseChartConfig,
        ...axisBase,
        series: [
          {
            name: 'Revenue',
            type: 'line',
            smooth: true,
            data: revenues,
            lineStyle: { color: '#6366f1', width: 3 },
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: { color: '#ffffff', borderColor: '#6366f1', borderWidth: 2 },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(99, 102, 241, 0.35)' },
                  { offset: 1, color: 'rgba(99, 102, 241, 0)' },
                ],
              },
            },
          },
        ],
      };
    case 'area':
      return {
        ...baseChartConfig,
        ...axisBase,
        series: [
          {
            name: 'Revenue',
            type: 'line',
            smooth: true,
            data: revenues,
            lineStyle: { color: '#f43f5e', width: 2.5 },
            symbol: 'none',
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(244, 63, 94, 0.45)' },
                  { offset: 1, color: 'rgba(244, 63, 94, 0.02)' },
                ],
              },
            },
          },
        ],
      };
    case 'scatter':
      return {
        ...baseChartConfig,
        xAxis: {
          type: 'value' as const,
          name: 'Revenue',
          splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.06)' } },
          axisLabel: { color: 'rgba(255, 255, 255, 0.6)', formatter: (v: number) => `$${(v / 1000).toFixed(0)}K` },
        },
        yAxis: {
          type: 'value' as const,
          name: 'Customers',
          splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.06)' } },
          axisLabel: { color: 'rgba(255, 255, 255, 0.6)' },
        },
        series: [
          {
            name: 'Cluster',
            type: 'scatter',
            symbolSize: 12,
            data: monthlyRevenue.map((d) => [d.revenue, d.customers]),
            itemStyle: { color: '#6366f1' },
          },
        ],
      };
    case 'pie':
    default:
      return {
        ...baseChartConfig,
        color: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#3b82f6'],
        series: [
          {
            type: 'pie',
            radius: ['45%', '72%'],
            center: ['50%', '50%'],
            data: revenueByRegion.map((d) => ({ name: d.region, value: d.revenue })),
            label: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 11 },
            itemStyle: { borderColor: '#0f0f14', borderWidth: 3 },
          },
        ],
      };
  }
}

export function RecommendationScene() {
  const [activeChart, setActiveChart] = useState<ChartType>('bar');
  const reduced = useReducedMotion();
  const activeOpt = CHART_OPTS.find((o) => o.type === activeChart) ?? CHART_OPTS[0];
  const isWinner = activeChart === 'bar';

  return (
    <section
      id="recommendation"
      className="relative py-20 sm:py-28 md:py-36 bg-[#08080b] text-white overflow-hidden"
      aria-label="Intelligence Engine"
    >
      {/* Oversized Ghost Background Typography (Reference 4: "EXPERIENCE") */}
      <div className="absolute top-[10%] left-0 right-0 z-0 pointer-events-none">
        <ParallaxText direction="ltr" velocity={140} outline={true}>
          INTELLIGENCE · REASONING · MODEL
        </ParallaxText>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-16">

        {/* Section Headline */}
        <div className="max-w-3xl mb-10 sm:mb-12 md:mb-16">
          <p className="font-mono text-xs font-bold tracking-[0.25em] text-indigo-400 uppercase mb-2 sm:mb-3">
            THE REASONING ENGINE
          </p>
          <h2 className="font-display text-[clamp(1.85rem,4.5vw,3.6rem)] font-extrabold uppercase tracking-tight text-white leading-[1.05]">
            NOT JUST A CHART.<br />
            <span className="text-white/40">AN INTELLIGENT CHOICE.</span>
          </h2>
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-white/60 max-w-xl leading-relaxed">
            VizPilot inspects statistical variance, cardinality, and dimensions. It doesn&rsquo;t guess — it mathematically selects the optimal narrative structure.
          </p>
        </div>

        {/* ── Big Cinematic Interaction Console ── */}
        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0f0f16]/90 backdrop-blur-xl p-4 sm:p-7 md:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Top Bar: Selector Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5 sm:pb-6 mb-6 sm:mb-8">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span className="font-mono text-xs font-bold tracking-widest text-white uppercase">
                Interactive Model Preview
              </span>
            </div>

            {/* Pill controls for chart switching */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {CHART_OPTS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = activeChart === opt.type;

                return (
                  <button
                    key={opt.type}
                    onClick={() => setActiveChart(opt.type)}
                    className={cn(
                      'group flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer min-h-[36px] sm:min-h-[40px]',
                      isSelected
                        ? 'bg-white text-[#08080b] shadow-md'
                        : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon className={cn('h-3.5 w-3.5', isSelected ? 'text-indigo-600' : 'text-white/50')} />
                    <span>{opt.label}</span>
                    {opt.type === 'bar' && (
                      <span className={cn('rounded-full px-1.5 py-0.2 text-[9px] font-bold', isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-500/20 text-indigo-400')}>
                        TOP
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center: Split View - Left Intelligence Card & Right Interactive Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 sm:gap-8 items-stretch">
            
            {/* Left Intelligence Metrics */}
            <div className="flex flex-col justify-between gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs text-white/40 tracking-widest uppercase">EVALUATION</span>
                  <span className={cn('font-mono text-xs font-bold px-2 py-0.5 rounded', isWinner ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/70')}>
                    {activeOpt.conf}% MATCH
                  </span>
                </div>

                <h3 className="font-display text-2xl font-bold tracking-tight text-white mb-2">
                  {activeOpt.label}
                </h3>

                <p className="text-xs text-white/60 leading-relaxed mb-6">
                  {isWinner
                    ? 'Recommended: Grouped bar distribution clearly highlights monthly revenue against expenditure with minimal cognitive load.'
                    : 'Alternative model active. VizPilot permits overriding the recommendation while maintaining full dynamic binding.'}
                </p>

                {/* Structure chips */}
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest block mb-2">DETECTED SCHEMA</span>
                  <div className="flex items-center justify-between text-xs font-mono py-1">
                    <span className="text-white/50">Month</span>
                    <span className="text-sky-400 bg-sky-500/10 border border-sky-400/20 px-2 py-0.5 rounded text-[10px]">TIME</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono py-1">
                    <span className="text-white/50">Revenue</span>
                    <span className="text-indigo-400 bg-indigo-500/10 border border-indigo-400/20 px-2 py-0.5 rounded text-[10px]">MEASURE</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono py-1">
                    <span className="text-white/50">Region</span>
                    <span className="text-rose-400 bg-rose-500/10 border border-rose-400/20 px-2 py-0.5 rounded text-[10px]">DIMENSION</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/40 p-3 flex items-center gap-2.5 text-[11px] font-mono text-white/50">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>Deterministic AI selection · 0 tokens wasted</span>
              </div>
            </div>

            {/* Right Live Interactive ECharts View */}
            <div className="min-h-[300px] sm:min-h-[360px] md:min-h-[420px] rounded-2xl border border-white/10 bg-black/50 p-3.5 sm:p-5 md:p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                <span className="font-mono text-xs text-white/50 tracking-wider uppercase">Q3 Business Performance (Live)</span>
                <span className="font-mono text-[11px] text-indigo-400">18 ROWS · COMPUTED</span>
              </div>

              <div className="flex-1 w-full h-[260px] sm:h-[320px] md:h-[360px] relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeChart}
                    className="h-full w-full"
                    initial={reduced ? undefined : { opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduced ? undefined : { opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ReactECharts
                      option={buildCinematicOption(activeChart)}
                      style={{ height: '100%', width: '100%' }}
                      opts={{ renderer: 'svg' }}
                      notMerge
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
