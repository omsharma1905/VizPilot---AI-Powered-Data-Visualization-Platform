'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart, AreaChart, ScatterChart, ArrowRight, CheckCircle2, Sparkles, ShieldCheck, Folder } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/src/lib/utils/cn';
import { staggerContainer, staggerItem } from '@/src/lib/motion/variants';
import { ParallaxText } from '@/src/components/cinematic/ParallaxText';
import type { ChartType, ChartRecommendation, PrivacyMode } from '@/src/types';
import type { VizPilotVisualizationRecommendation } from '@/src/lib/ai/types';
import { CHART_TAXONOMY } from '@/src/lib/ai/candidates/taxonomy';
import { profileDataset } from '@/src/lib/profiling';
import { clientMemoryStore } from '@/src/lib/client/in-memory-store';
import { useProtectedRoute } from '@/src/lib/auth/useProtectedRoute';

const CHART_ICONS: Partial<Record<ChartType, React.ComponentType<{ className?: string; strokeWidth?: number }>>> = {
  bar: BarChart3,
  horizontal_bar: BarChart3,
  grouped_bar: BarChart3,
  stacked_bar: BarChart3,
  line: TrendingUp,
  area: AreaChart,
  pie: PieChart,
  donut: PieChart,
  scatter: ScatterChart,
  histogram: BarChart3,
  kpi_card: Sparkles,
};

function RecommendationContent() {
  useProtectedRoute('/recommendation');
  const searchParams = useSearchParams();
  const fileName = searchParams.get('file') ?? 'DATASET';
  const mode = (searchParams.get('mode') ?? 'workspace') as PrivacyMode;
  const isZeroTrace = mode === 'zerotrace';

  const [recommendations, setRecommendations] = useState<ChartRecommendation[]>([]);
  const [selectedId, setSelectedId] = useState<string>('bar');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let profile = clientMemoryStore.getProfile();
      if (!profile) {
        const rawProfile = sessionStorage.getItem('vizpilot:active-profile');
        if (rawProfile) {
          try {
            profile = JSON.parse(rawProfile);
          } catch {}
        }
      }

      // If no profile in memory/storage, attempt to compute from active dataset
      if (!profile) {
        let dataset = clientMemoryStore.getDataset();
        if (!dataset) {
          const rawDataset = sessionStorage.getItem('vizpilot:active-dataset');
          if (rawDataset) {
            try {
              dataset = JSON.parse(rawDataset);
            } catch {}
          }
        }
        if (dataset) {
          try {
            profile = profileDataset(dataset);
            clientMemoryStore.setProfile(profile);
          } catch {}
        }
      }

      if (!profile) {
        setLoading(false);
        setError('No active dataset profile found in memory. Please ingest a dataset first.');
        return;
      }

      setLoading(true);
      setError(null);

      // Request live recommendation from API endpoint
      fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vizpilot-mode': mode,
        },
        body: JSON.stringify({ profile, mode }),
      })
        .then((res) => res.json())
        .then((data) => {
          setLoading(false);
          if (data.success && data.recommendation) {
            const rec: VizPilotVisualizationRecommendation = data.recommendation;
            const converted: ChartRecommendation[] = [];

            // Primary recommendation with stable unique ID
            const primaryDef = CHART_TAXONOMY[rec.primary.chartType];
            converted.push({
              id: rec.primary.candidateId || `rec-primary-${rec.primary.chartType}`,
              chartType: rec.primary.chartType,
              confidence: rec.primary.confidence,
              rationale: rec.primary.reasoning,
              label: primaryDef?.label || rec.primary.chartType.toUpperCase(),
            });

            // Alternatives with stable unique IDs
            for (const [idx, alt] of rec.alternatives.entries()) {
              const altDef = CHART_TAXONOMY[alt.chartType];
              converted.push({
                id: alt.candidateId || `rec-alt-${idx}-${alt.chartType}`,
                chartType: alt.chartType,
                confidence: alt.confidence,
                rationale: alt.reasoning,
                label: altDef?.label || alt.chartType.toUpperCase(),
              });
            }

            if (converted.length > 0) {
              setRecommendations(converted);
              setSelectedId(converted[0].id || converted[0].chartType);
              try {
                sessionStorage.setItem('vizpilot:active-recommendation', JSON.stringify(rec));
              } catch {}
            }
          } else {
            setError(data.error?.message || 'Failed to generate recommendations.');
          }
        })
        .catch((err) => {
          setLoading(false);
          setError(err instanceof Error ? err.message : 'Network error requesting recommendation.');
        });
    }
  }, [mode]);

  const selectedRec = recommendations.find((r) => (r.id ? r.id === selectedId : r.chartType === selectedId)) ?? recommendations[0];


  return (
    <div className="relative min-h-screen pt-28 pb-20 bg-[#08080b] text-white overflow-hidden">
      
      {/* Background Continuous Depth Typography */}
      <div className="absolute top-[12%] left-0 right-0 z-0">
        <ParallaxText direction="ltr" duration={50} outline={true}>
          INTELLIGENCE · RECOMMENDATIONS
        </ParallaxText>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 md:px-8">

        {/* Header */}
        <motion.div className="mb-8 sm:mb-12 text-center" variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div
            variants={staggerItem}
            className={cn(
              'mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full border px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-mono tracking-widest uppercase backdrop-blur-md',
              isZeroTrace ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-400' : 'border-indigo-400/30 bg-indigo-500/10 text-indigo-300'
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isZeroTrace ? 'ZERO-TRACE · ' : ''}STEP 03 OF 04 · MODEL FIT</span>
          </motion.div>

          <motion.h1 variants={staggerItem} className="font-display text-[clamp(1.85rem,4.8vw,3.75rem)] font-extrabold uppercase tracking-tight text-white mb-2 sm:mb-3 leading-[1.05]">
            AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400">RECOMMENDATIONS.</span>
          </motion.h1>

          <motion.div variants={staggerItem} className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 sm:px-4 py-1.5 font-mono text-[11px] sm:text-xs text-white/50 backdrop-blur-md">
            <span className="font-bold text-white/80">{fileName}</span>
            <span>·</span>
            <span className={cn('flex items-center gap-1 font-bold', isZeroTrace ? 'text-emerald-400' : 'text-indigo-400')}>
              {isZeroTrace ? <><ShieldCheck className="h-3 w-3" /> ZERO-TRACE</> : <><Folder className="h-3 w-3" /> WORKSPACE</>}
            </span>
          </motion.div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-3xl border border-white/10 bg-[#0f0f16]/90 backdrop-blur-xl p-12 text-center shadow-2xl"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-400/30 mb-4 animate-pulse">
              <Sparkles className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="font-display text-lg font-bold uppercase text-white mb-2">
              Evaluating Visualization Models...
            </h3>
            <p className="font-mono text-xs text-white/50 max-w-md mx-auto">
              Analyzing data profile, statistical properties, cardinality, and analytical fit.
            </p>
          </motion.div>
        )}

        {/* Empty / Error State */}
        {!loading && recommendations.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-3xl border border-white/10 bg-[#0f0f16]/90 backdrop-blur-xl p-12 text-center shadow-2xl"
          >
            <p className="font-display text-lg font-bold uppercase text-white mb-2">
              No Recommendations Available
            </p>
            <p className="font-mono text-xs text-white/50 max-w-md mx-auto mb-6">
              {error || 'No active dataset profile was found in session memory. Please ingest a dataset to generate recommendations.'}
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 rounded-full bg-white text-[#08080b] hover:bg-white/90 px-6 py-3 font-mono text-xs font-bold tracking-widest uppercase transition-all shadow-xl"
            >
              <span>Ingest New Dataset</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}

        {/* Interactive Recommendation Cards */}
        {!loading && recommendations.length > 0 && (
          <motion.div
            className="mb-6 sm:mb-8 grid grid-cols-1 gap-3.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.15 }}
          >
            {recommendations.map((rec, i) => {
              const Icon = CHART_ICONS[rec.chartType] ?? BarChart3;

              const isSelected = selectedRec ? (selectedRec.id ? selectedRec.id === rec.id : selectedRec.chartType === rec.chartType) : false;

              return (
                <motion.button
                  key={rec.id || `rec-${rec.chartType}-${i}`}
                  variants={staggerItem}
                  onClick={() => setSelectedId(rec.id || rec.chartType)}
                  className={cn(
                    'group relative text-left rounded-2xl border p-5 transition-all duration-200 cursor-pointer backdrop-blur-xl',
                    isSelected
                      ? 'border-indigo-400/90 bg-indigo-500/15 shadow-[0_0_35px_rgba(99,102,241,0.22)] -translate-y-1 opacity-100'
                      : 'border-white/10 bg-[#0f0f16]/90 opacity-75 hover:opacity-100 hover:border-white/30 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)]'
                  )}
                >
                  {i === 0 && (
                    <div className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-400 uppercase">
                      TOP PICK
                    </div>
                  )}

                  <div className={cn(
                    'mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200',
                    isSelected
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                      : 'bg-white/5 text-white/70 group-hover:text-white group-hover:bg-white/10 group-hover:scale-105'
                  )}>
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>

                  <p className="font-display text-base font-bold uppercase text-white mb-1 tracking-tight">{rec.label}</p>
                  <p className={cn(
                    'text-xs leading-relaxed line-clamp-2 transition-colors',
                    isSelected ? 'text-white/75' : 'text-white/50 group-hover:text-white/70'
                  )}>
                    {rec.rationale}
                  </p>

                  <div className="mt-4 font-mono flex items-center justify-between gap-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1.5 text-[10px]">
                        <span className="text-white/40 uppercase tracking-wider">FIT SCORE</span>
                        <span className={cn('font-bold', isSelected ? 'text-indigo-300' : 'text-white/60')}>
                          {Math.round(rec.confidence * 100)}%
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            isSelected
                              ? 'bg-indigo-400 shadow-[0_0_10px_#818cf8]'
                              : 'bg-white/30 group-hover:bg-white/50'
                          )}
                          style={{ width: `${rec.confidence * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-center w-4 h-4 shrink-0">
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-indigo-400" />}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* Selected Rationale Card & Action */}
        {!loading && selectedRec && (
          <motion.div
            className="mb-8 rounded-3xl border border-white/10 bg-[#0f0f16]/90 backdrop-blur-xl p-6 md:p-8 shadow-2xl"
            key={selectedRec.id || selectedRec.chartType}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest">
                    ACTIVE SELECTION REASONING
                  </span>
                  <span className="rounded bg-indigo-500/15 border border-indigo-400/25 px-1.5 py-0.2 font-mono text-[9px] text-indigo-300">
                    {Math.round(selectedRec.confidence * 100)}% CONFIDENCE
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-white uppercase mb-2">
                  Why {selectedRec.label}?
                </h3>
                <p className="text-xs md:text-sm text-white/60 leading-relaxed max-w-xl">
                  {selectedRec.rationale}
                </p>
              </div>

              <Link
                href={`/visualize?chart=${selectedRec.chartType}&mode=${mode}&file=${encodeURIComponent(fileName)}`}
                className="inline-flex items-center gap-2.5 rounded-full bg-white text-[#08080b] hover:bg-white/90 px-8 py-3.5 font-mono text-xs font-bold tracking-widest uppercase transition-all shadow-xl shadow-indigo-500/20 whitespace-nowrap active:scale-[0.98]"
              >
                <span>OPEN DASHBOARD</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}

export default function RecommendationPage() {
  return (
    <Suspense>
      <RecommendationContent />
    </Suspense>
  );
}
