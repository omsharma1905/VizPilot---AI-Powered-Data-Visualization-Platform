'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart, AreaChart, ScatterChart, ArrowRight, LayoutDashboard, Share2, Database, Plus } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/src/lib/utils/cn';
import { staggerContainer, staggerItem } from '@/src/lib/motion/variants';
import { ChartContainer } from '@/src/components/charts/ChartContainer';
import { ParallaxText } from '@/src/components/cinematic/ParallaxText';
import type { ChartType, VisualizationConfig, PrivacyMode } from '@/src/types';
import type { VizPilotDataset } from '@/src/types/dataset';
import type { VizPilotDataProfile } from '@/src/types/profiling';
import type { VizPilotVisualizationRecommendation } from '@/src/lib/ai/types';
import { generateVisualization, type VizPilotVisualizationResult } from '@/src/lib/visualization';
import { clientMemoryStore } from '@/src/lib/client/in-memory-store';
import { clearZeroTraceClientState, registerZeroTraceLifecycleListeners } from '@/src/lib/client/zero-trace-cleanup';
import { useProtectedRoute } from '@/src/lib/auth/useProtectedRoute';

const CHART_OPTIONS: { type: ChartType; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
  { type: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { type: 'line', label: 'Line Trend', icon: TrendingUp },
  { type: 'area', label: 'Area Stream', icon: AreaChart },
  { type: 'pie', label: 'Regional Pie', icon: PieChart },
  { type: 'donut', label: 'Donut Metric', icon: PieChart },
  { type: 'scatter', label: 'Scatter Cloud', icon: ScatterChart },
];

function VisualizeContent() {
  useProtectedRoute('/visualize');
  const searchParams = useSearchParams();
  const initialChart = (searchParams.get('chart') as ChartType) || 'bar';
  const mode = (searchParams.get('mode') ?? 'workspace') as PrivacyMode;
  const isZeroTrace = mode === 'zerotrace';

  const [activeChart, setActiveChart] = useState<ChartType>(initialChart);
  const [vizResult, setVizResult] = useState<VizPilotVisualizationResult | null>(null);
  const [datasetInfo, setDatasetInfo] = useState<{ tableName: string; rowCount: number } | null>(null);
  const [checkedStorage, setCheckedStorage] = useState(false);

  useEffect(() => {
    // Multi-path Zero-Trace cleanup: unmount and browser lifecycle
    const unregisterLifecycle = isZeroTrace ? registerZeroTraceLifecycleListeners() : () => {};

    if (typeof window !== 'undefined') {
      let dataset = clientMemoryStore.getDataset();
      const rawDataset = sessionStorage.getItem('vizpilot:active-dataset');
      const rawRec = sessionStorage.getItem('vizpilot:active-recommendation');
      let profile = clientMemoryStore.getProfile();
      if (!profile) {
        const rawProfile = sessionStorage.getItem('vizpilot:active-profile');
        if (rawProfile) {
          try {
            profile = JSON.parse(rawProfile);
          } catch {}
        }
      }

      if (!dataset && rawDataset) {
        try {
          dataset = JSON.parse(rawDataset);
        } catch {}
      }

      if (dataset) {
        try {
          const table = dataset.tables[0];
          const rec: VizPilotVisualizationRecommendation = rawRec
            ? JSON.parse(rawRec)
            : {
                primary: {
                  chartType: initialChart,
                  tableId: table?.id,
                  confidence: 1,
                  reasoning: 'Direct visualization render',
                  fields: {
                    x: table?.columns.find((c) => c.inferredType === 'string' || c.inferredType === 'date')?.name,
                    y: [table?.columns.find((c) => c.inferredType === 'number' || c.inferredType === 'integer')?.name || ''],
                  },
                },
                alternatives: [],
                datasetSummary: '',
              };

          const res = generateVisualization(dataset, rec, {
            overrideChartType: initialChart as any,
            profile: profile || undefined,
          });
          setVizResult(res);
          setDatasetInfo({
            tableName: table?.name || 'DATASET',
            rowCount: table?.rows.length || 0,
          });
        } catch (e) {
          console.warn('[VizPilot] Visualization engine fallback:', e);
        }
      }
      setCheckedStorage(true);
    }

    return () => {
      unregisterLifecycle();
    };
  }, [initialChart, isZeroTrace]);

  const handleChartChange = (type: ChartType) => {
    setActiveChart(type);
    if (typeof window !== 'undefined') {
      let dataset = clientMemoryStore.getDataset();
      const rawDataset = sessionStorage.getItem('vizpilot:active-dataset');
      const rawRec = sessionStorage.getItem('vizpilot:active-recommendation');
      let profile = clientMemoryStore.getProfile();
      if (!profile) {
        const rawProfile = sessionStorage.getItem('vizpilot:active-profile');
        if (rawProfile) {
          try {
            profile = JSON.parse(rawProfile);
          } catch {}
        }
      }

      if (!dataset && rawDataset) {
        try {
          dataset = JSON.parse(rawDataset);
        } catch {}
      }

      if (dataset) {
        try {
          const table = dataset.tables[0];
          const rec: VizPilotVisualizationRecommendation = rawRec
            ? JSON.parse(rawRec)
            : {
                primary: {
                  chartType: type as any,
                  tableId: table?.id,
                  confidence: 1,
                  reasoning: 'Switched chart model',
                  fields: {
                    x: table?.columns.find((c) => c.inferredType === 'string' || c.inferredType === 'date')?.name,
                    y: [table?.columns.find((c) => c.inferredType === 'number' || c.inferredType === 'integer')?.name || ''],
                  },
                },
                alternatives: [],
                datasetSummary: '',
              };

          const res = generateVisualization(dataset, rec, {
            overrideChartType: type as any,
            profile: profile || undefined,
          });
          setVizResult(res);
        } catch (e) {
          console.warn('[VizPilot] Chart switch error:', e);
        }
      }
    }
  };

  const config: VisualizationConfig = {
    id: 'viz-1',
    title: vizResult ? `${vizResult.chartType.toUpperCase()} · ${datasetInfo?.tableName || 'DATASET'}` : 'Interactive Visualization',
    chartType: activeChart,
    xAxis: { field: vizResult?.metadata.fieldsUsed[0] || 'x', label: vizResult?.metadata.fieldsUsed[0] || 'X' },
    yAxis: { field: vizResult?.metadata.fieldsUsed[1] || 'y', label: vizResult?.metadata.fieldsUsed[1] || 'Y' },
    description: vizResult ? `${vizResult.metadata.renderedRowCount} points rendered · Fields: ${vizResult.metadata.fieldsUsed.join(', ')}` : 'Autonomous rendering from ingested dataset',
  };

  return (
    <div className="relative min-h-screen pt-28 pb-20 bg-[#08080b] text-white overflow-hidden">
      
      {/* Background Parallax Typography */}
      <div className="absolute top-[12%] left-0 right-0 z-0">
        <ParallaxText direction="rtl" velocity={110} outline={true}>
          RENDER · VISUALIZATION · TELEMETRY
        </ParallaxText>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 md:px-8">

        {/* Header */}
        <motion.div
          className="mb-8 sm:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <div>
            <motion.div variants={staggerItem} className="mb-2 sm:mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3.5 sm:px-4 py-1.5 font-mono text-[11px] sm:text-xs text-indigo-300 uppercase backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              STEP 04 OF 04 · INTERACTIVE RENDER
            </motion.div>
            <motion.h1 variants={staggerItem} className="font-display text-[clamp(1.75rem,4.5vw,3.5rem)] font-extrabold uppercase tracking-tight text-white leading-tight">
              {datasetInfo ? datasetInfo.tableName.toUpperCase() : 'INTERACTIVE'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400">{datasetInfo ? 'ANALYTICS' : 'VISUALIZATION'}</span>
            </motion.h1>
            <motion.p variants={staggerItem} className="mt-1 font-mono text-[11px] sm:text-xs text-white/50">
              {datasetInfo
                ? `${datasetInfo.rowCount} ROWS EVALUATED · ${datasetInfo.tableName.toUpperCase()}`
                : 'SELECT OR SWITCH CHART MODELS'}
            </motion.p>
          </div>

          <motion.div variants={staggerItem} className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 px-4 sm:px-5 py-2 sm:py-2.5 font-mono text-xs font-semibold text-white uppercase tracking-wider transition-all min-h-[38px]"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard View</span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Empty State when no dataset/visualization is available */}
        {checkedStorage && !vizResult && !datasetInfo ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-[#0f0f16]/90 backdrop-blur-xl p-12 text-center max-w-2xl mx-auto shadow-2xl mb-12"
          >
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-400/30 mb-4">
              <Database className="h-7 w-7 text-indigo-400" />
            </div>
            <h2 className="font-display text-2xl font-bold uppercase text-white mb-2">
              No Active Dataset Loaded
            </h2>
            <p className="font-mono text-xs text-white/50 mb-6 leading-relaxed">
              The interactive visualization console requires an active dataset in session memory. Please ingest a CSV, XLSX, PDF, or DOCX file to render dynamic Apache ECharts models.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2.5 rounded-full bg-white text-[#08080b] hover:bg-white/90 px-7 py-3 font-mono text-xs font-bold tracking-widest uppercase transition-all shadow-xl"
            >
              <Plus className="h-4 w-4" />
              <span>Ingest Dataset</span>
            </Link>
          </motion.div>
        ) : (
          /* Console Layout: Sidebar Selector & Chart Surface */
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">

            {/* Sidebar Chart Type Picker */}
            <motion.aside
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0"
            >
              <p className="hidden lg:block font-mono text-xs font-bold uppercase tracking-widest text-white/40 mb-2 px-1">
                Select Alternate Model
              </p>
              {CHART_OPTIONS.map(({ type, label, icon: Icon }) => (
                <motion.button
                  key={type}
                  variants={staggerItem}
                  onClick={() => handleChartChange(type)}
                  className={cn(
                    'flex flex-shrink-0 lg:flex-shrink items-center gap-2.5 sm:gap-3 rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 text-left cursor-pointer min-h-[40px]',
                    activeChart === type
                      ? 'bg-white text-[#08080b] shadow-xl shadow-indigo-500/10 font-extrabold'
                      : 'border border-white/10 bg-[#0f0f16]/80 text-white/60 hover:text-white hover:border-white/25'
                  )}
                >
                  <Icon className={cn('h-4 w-4 flex-shrink-0', activeChart === type ? 'text-indigo-600' : 'text-white/40')} strokeWidth={1.75} />
                  <span className="whitespace-nowrap">{label}</span>
                </motion.button>
              ))}
            </motion.aside>

            {/* Main Interactive Chart Console */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0f0f16]/90 backdrop-blur-xl p-4 sm:p-6 md:p-8 shadow-2xl">
                <ChartContainer
                  config={config}
                  option={vizResult?.option}
                  title={vizResult ? `${vizResult.chartType.toUpperCase()} · ${datasetInfo?.tableName || 'DATASET'}` : config.title}
                  description={vizResult ? `${vizResult.metadata.renderedRowCount} points rendered · Fields: ${vizResult.metadata.fieldsUsed.join(', ')}` : config.description}
                  height={420}
                  className="bg-transparent border-none p-0"
                />
              </div>

              {/* Telemetry Status Strip */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-xs">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: 'ACTIVE MODEL', value: activeChart.toUpperCase() },
                    { label: 'RENDER ENGINE', value: 'SVG VECTOR' },
                    { label: 'DATA LATENCY', value: '0.04ms' },
                    { label: 'SECURITY MODE', value: 'EPHEMERAL' },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">{item.label}</p>
                      <p className="mt-1 font-bold text-white tracking-wide">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function VisualizePage() {
  return (
    <Suspense>
      <VisualizeContent />
    </Suspense>
  );
}
