'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LayoutDashboard, Plus, TrendingUp, BarChart3, Database } from 'lucide-react';
import Link from 'next/link';
import { ChartContainer } from '@/src/components/charts/ChartContainer';
import { staggerContainer, staggerItem } from '@/src/lib/motion/variants';
import { ParallaxText } from '@/src/components/cinematic/ParallaxText';
import type { VisualizationConfig } from '@/src/types';
import type { VizPilotDataset } from '@/src/types/dataset';
import type { VizPilotDataProfile } from '@/src/types/profiling';
import type { VizPilotVisualizationRecommendation } from '@/src/lib/ai/types';
import { generateVisualization } from '@/src/lib/visualization';
import { profileDataset } from '@/src/lib/profiling';
import { clientMemoryStore } from '@/src/lib/client/in-memory-store';
import { useProtectedRoute } from '@/src/lib/auth/useProtectedRoute';

function KpiCard({ label, value, delta, positive }: { label: string; value: string; delta: string; positive: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0f16]/90 backdrop-blur-xl p-6 shadow-xl transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5">
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">{label}</p>
      <p className="font-display text-3xl font-extrabold tracking-tight text-white mb-3">{value}</p>
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className={`flex items-center gap-1 font-bold ${positive ? 'text-emerald-400' : 'text-indigo-400'}`}>
          <TrendingUp className="h-3.5 w-3.5" />
          <span>{delta}</span>
        </span>
        <span className="text-white/40">calculated metric</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  useProtectedRoute('/dashboard');
  const reduced = useReducedMotion();
  const [dataset, setDataset] = useState<VizPilotDataset | null>(null);
  const [profile, setProfile] = useState<VizPilotDataProfile | null>(null);

  const [chart1, setChart1] = useState<{ option: any; config: VisualizationConfig } | null>(null);
  const [chart2, setChart2] = useState<{ option: any; config: VisualizationConfig } | null>(null);
  const [chart3, setChart3] = useState<{ option: any; config: VisualizationConfig } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let ds = clientMemoryStore.getDataset();
      if (!ds) {
        const rawDs = sessionStorage.getItem('vizpilot:active-dataset');
        if (rawDs) {
          try {
            ds = JSON.parse(rawDs);
          } catch {}
        }
      }

      let prof = clientMemoryStore.getProfile();
      if (!prof) {
        const rawProf = sessionStorage.getItem('vizpilot:active-profile');
        if (rawProf) {
          try {
            prof = JSON.parse(rawProf);
          } catch {}
        }
      }

      if (ds && !prof) {
        try {
          prof = profileDataset(ds);
          clientMemoryStore.setProfile(prof);
        } catch {}
      }

      setDataset(ds || null);
      setProfile(prof || null);

      if (ds && ds.tables.length > 0) {
        const table = ds.tables[0];
        const rawRec = sessionStorage.getItem('vizpilot:active-recommendation');
        let activeRec: VizPilotVisualizationRecommendation | null = null;
        if (rawRec) {
          try {
            activeRec = JSON.parse(rawRec);
          } catch {}
        }

        const dateOrCatCol = table.columns.find((c) => c.inferredType === 'date' || c.inferredType === 'string')?.name || table.columns[0]?.name;
        const numCols = table.columns.filter((c) => c.inferredType === 'number' || c.inferredType === 'integer').map((c) => c.name);

        const baseRec: VizPilotVisualizationRecommendation = activeRec || {
          version: '1.0',
          primary: {
            candidateId: 'dash-cand-1',
            chartType: table.columns.some((c) => c.inferredType === 'date') ? 'line' : 'bar',
            analyticalIntent: 'trend',
            confidence: 1,
            score: 95,
            reasoning: 'Primary performance breakdown',
            fields: {
              x: dateOrCatCol,
              y: numCols.slice(0, 2),
            },
          },
          alternatives: [
            {
              candidateId: 'dash-cand-2',
              chartType: 'pie',
              analyticalIntent: 'composition',
              confidence: 0.85,
              score: 85,
              reasoning: 'Categorical distribution',
              fields: {
                x: dateOrCatCol,
                y: numCols.slice(0, 1),
              },
            },
            {
              candidateId: 'dash-cand-3',
              chartType: 'area',
              analyticalIntent: 'trend',
              confidence: 0.8,
              score: 80,
              reasoning: 'Cumulative trend trajectory',
              fields: {
                x: dateOrCatCol,
                y: numCols.slice(0, 1),
              },
            },
          ],
          warnings: [],
          fallbackUsed: true,
          latencyMs: 0,
        };

        // Chart 1: Primary
        try {
          const res1 = generateVisualization(ds, baseRec, {
            overrideChartType: baseRec.primary.chartType,
            profile: prof || undefined,
          });
          setChart1({
            option: res1.option,
            config: {
              id: 'dash-1',
              title: `${res1.chartType.toUpperCase()} · ${table.name.toUpperCase()}`,
              chartType: res1.chartType as any,
              description: `${res1.metadata.renderedRowCount} rows rendered · ${res1.metadata.fieldsUsed.join(', ')}`,
            },
          });
        } catch (e) {
          console.warn('[VizPilot] Dashboard Chart 1 error:', e);
        }

        // Chart 2: Secondary
        try {
          const altType = baseRec.alternatives[0]?.chartType || 'pie';
          const res2 = generateVisualization(ds, baseRec, {
            overrideChartType: altType,
            profile: prof || undefined,
          });
          setChart2({
            option: res2.option,
            config: {
              id: 'dash-2',
              title: `${res2.chartType.toUpperCase()} · DISTRIBUTION`,
              chartType: res2.chartType as any,
              description: `${res2.metadata.renderedRowCount} points rendered · ${res2.metadata.fieldsUsed.join(', ')}`,
            },
          });
        } catch (e) {
          console.warn('[VizPilot] Dashboard Chart 2 error:', e);
        }

        // Chart 3: Tertiary
        try {
          const altType2 = baseRec.alternatives[1]?.chartType || 'area';
          const res3 = generateVisualization(ds, baseRec, {
            overrideChartType: altType2,
            profile: prof || undefined,
          });
          setChart3({
            option: res3.option,
            config: {
              id: 'dash-3',
              title: `${res3.chartType.toUpperCase()} · TREND TRAJECTORY`,
              chartType: res3.chartType as any,
              description: `${res3.metadata.renderedRowCount} points evaluated · ${res3.metadata.fieldsUsed.join(', ')}`,
            },
          });
        } catch (e) {
          console.warn('[VizPilot] Dashboard Chart 3 error:', e);
        }
      }
    }
  }, []);

  const primaryTable = dataset?.tables[0];
  const rowCount = primaryTable?.rowCount || primaryTable?.rows.length || 0;
  const colCount = primaryTable?.columns.length || 0;

  // Derive primary numeric measure
  const numericColumns = primaryTable?.columns.filter((c) => c.inferredType === 'number' || c.inferredType === 'integer') || [];
  const primaryMetricCol = numericColumns.find((c) => {
    const l = c.name.toLowerCase();
    return l.includes('revenue') || l.includes('profit') || l.includes('sales') || l.includes('amount') || l.includes('cost');
  }) || numericColumns[0];

  const primaryColIdx = primaryMetricCol ? primaryMetricCol.index : -1;
  const primaryMetricSum = primaryTable && primaryColIdx >= 0
    ? primaryTable.rows.reduce((acc, r) => {
        const val = r[primaryColIdx];
        return acc + (typeof val === 'number' ? val : Number(val) || 0);
      }, 0)
    : 0;

  const isCurrency = primaryMetricCol
    ? /revenue|sales|profit|cost|expense|price|amount/i.test(primaryMetricCol.name)
    : false;

  const formatMetric = (val: number, currency: boolean) => {
    const prefix = currency ? '$' : '';
    if (Math.abs(val) >= 1_000_000) return `${prefix}${(val / 1_000_000).toFixed(2)}M`;
    if (Math.abs(val) >= 1_000) return `${prefix}${(val / 1_000).toFixed(1)}K`;
    return `${prefix}${val.toLocaleString()}`;
  };

  const formattedPrimaryMetric = formatMetric(primaryMetricSum, isCurrency);

  // Derive secondary metric
  const secondaryMetricCol = numericColumns.find((c) => c.name !== primaryMetricCol?.name);
  const secondaryColIdx = secondaryMetricCol ? secondaryMetricCol.index : -1;
  const secondaryMetricSum = primaryTable && secondaryColIdx >= 0
    ? primaryTable.rows.reduce((acc, r) => {
        const val = r[secondaryColIdx];
        return acc + (typeof val === 'number' ? val : Number(val) || 0);
      }, 0)
    : 0;
  const formattedSecondaryMetric = secondaryMetricCol
    ? formatMetric(secondaryMetricSum, /revenue|sales|profit|cost|expense|price|amount/i.test(secondaryMetricCol.name))
    : null;

  // Data Completeness
  const completenessRate = profile?.tables[0]?.completenessRate ?? 1;
  const completenessFormatted = `${Math.round(completenessRate * 100)}%`;

  return (
    <div className="relative min-h-screen pt-28 pb-20 bg-[#08080b] text-white overflow-hidden">
      
      {/* Background Continuous Depth Typography */}
      <div className="absolute top-[10%] left-0 right-0 z-0">
        <ParallaxText direction="ltr" duration={50} outline={true}>
          DASHBOARD · TELEMETRY · METRICS
        </ParallaxText>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-16">

        {/* 1. Choreographed Header */}
        <motion.div
          className="mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 border-b border-white/10 pb-6 sm:pb-8"
          initial={reduced ? undefined : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-indigo-400">
                LIVE TELEMETRY
              </span>
            </div>
            <h1 className="font-display text-[clamp(1.75rem,4.5vw,3.5rem)] font-extrabold uppercase tracking-tight text-white leading-tight">
              {primaryTable ? primaryTable.name.toUpperCase() : 'EXECUTIVE'}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400">
                {primaryTable ? 'ANALYTICS' : 'DASHBOARD'}
              </span>
            </h1>
            <p className="mt-2 font-mono text-[11px] sm:text-xs text-white/50">
              {primaryTable
                ? `Ingested records: ${rowCount} rows · ${colCount} evaluated columns`
                : 'No active dataset in memory · Ingest a file to see live telemetry'}
            </p>
          </div>

          <div>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 sm:gap-2.5 rounded-full bg-white text-[#08080b] hover:bg-white/90 px-5 sm:px-6 py-2.5 sm:py-3 font-mono text-xs font-bold tracking-widest uppercase transition-all shadow-xl shadow-indigo-500/15 active:scale-[0.98] min-h-[40px]"
            >
              <Plus className="h-4 w-4" />
              <span>Ingest New Dataset</span>
            </Link>
          </div>
        </motion.div>

        {/* Empty State when no dataset is loaded */}
        {!primaryTable && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-[#0f0f16]/90 backdrop-blur-xl p-12 text-center max-w-2xl mx-auto shadow-2xl mb-12"
          >
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-400/30 mb-4">
              <Database className="h-7 w-7 text-indigo-400" />
            </div>
            <h2 className="font-display text-2xl font-bold uppercase text-white mb-2">
              No Active Dataset
            </h2>
            <p className="font-mono text-xs text-white/50 mb-6 leading-relaxed">
              The executive telemetry dashboard requires an active dataset in session memory. Ingest a CSV, XLSX, PDF, or DOCX file to generate multi-model visualizations and real KPI analytics.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2.5 rounded-full bg-white text-[#08080b] hover:bg-white/90 px-7 py-3 font-mono text-xs font-bold tracking-widest uppercase transition-all shadow-xl"
            >
              <Plus className="h-4 w-4" />
              <span>Ingest Dataset</span>
            </Link>
          </motion.div>
        )}

        {/* 2. Choreographed KPI Grid (when dataset is loaded) */}
        {primaryTable && (
          <motion.div
            className="mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={staggerItem}>
              <KpiCard
                label="TOTAL ROWS"
                value={rowCount.toLocaleString()}
                delta={`${profile?.summary.totalRows ?? rowCount} Verified`}
                positive={true}
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <KpiCard
                label={primaryMetricCol ? `TOTAL ${primaryMetricCol.name.toUpperCase()}` : 'PRIMARY METRIC'}
                value={formattedPrimaryMetric}
                delta={primaryMetricCol ? primaryMetricCol.inferredType.toUpperCase() : 'NUMERIC'}
                positive={true}
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <KpiCard
                label={secondaryMetricCol ? `TOTAL ${secondaryMetricCol.name.toUpperCase()}` : 'DIMENSIONS'}
                value={formattedSecondaryMetric || `${colCount} Fields`}
                delta={`${numericColumns.length} Measures`}
                positive={true}
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <KpiCard
                label="DATA COMPLETENESS"
                value={completenessFormatted}
                delta={profile?.tables[0] && profile.tables[0].completenessRate < 1 ? 'Contains nulls' : 'Zero Missing'}
                positive={completenessRate >= 0.9}
              />
            </motion.div>
          </motion.div>
        )}

        {/* 3, 4, 5. Sequenced Chart Grid (when charts are generated) */}
        {primaryTable && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 3. Primary Chart */}
            <motion.div
              className="lg:col-span-8 rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0f0f16]/90 backdrop-blur-xl p-4 sm:p-6 md:p-8 shadow-2xl"
              initial={reduced ? undefined : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {chart1 ? (
                <ChartContainer
                  config={chart1.config}
                  option={chart1.option}
                  title={chart1.config.title}
                  description={chart1.config.description}
                  height={380}
                  className="bg-transparent border-none p-0"
                />
              ) : (
                <div className="flex h-[380px] items-center justify-center font-mono text-xs text-white/40">
                  Rendering primary visualization...
                </div>
              )}
            </motion.div>

            {/* 4. Secondary Chart */}
            <motion.div
              className="lg:col-span-4 rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0f0f16]/90 backdrop-blur-xl p-4 sm:p-6 md:p-8 shadow-2xl"
              initial={reduced ? undefined : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {chart2 ? (
                <ChartContainer
                  config={chart2.config}
                  option={chart2.option}
                  title={chart2.config.title}
                  description={chart2.config.description}
                  height={380}
                  className="bg-transparent border-none p-0"
                />
              ) : (
                <div className="flex h-[380px] items-center justify-center font-mono text-xs text-white/40">
                  Rendering secondary distribution...
                </div>
              )}
            </motion.div>

            {/* 5. Tertiary Chart */}
            <motion.div
              className="lg:col-span-12 rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0f0f16]/90 backdrop-blur-xl p-4 sm:p-6 md:p-8 shadow-2xl"
              initial={reduced ? undefined : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {chart3 ? (
                <ChartContainer
                  config={chart3.config}
                  option={chart3.option}
                  title={chart3.config.title}
                  description={chart3.config.description}
                  height={320}
                  className="bg-transparent border-none p-0"
                />
              ) : (
                <div className="flex h-[320px] items-center justify-center font-mono text-xs text-white/40">
                  Rendering trend trajectory...
                </div>
              )}
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}
