'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, ArrowRight, ShieldCheck, Folder, Database, Plus } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/src/lib/utils/cn';
import { staggerContainer, staggerItem } from '@/src/lib/motion/variants';
import { ParallaxText } from '@/src/components/cinematic/ParallaxText';
import type { PrivacyMode } from '@/src/types';
import type { VizPilotDataset } from '@/src/types/dataset';
import type { VizPilotDataProfile } from '@/src/types/profiling';
import { profileDataset } from '@/src/lib/profiling';
import { clientMemoryStore } from '@/src/lib/client/in-memory-store';
import { useProtectedRoute } from '@/src/lib/auth/useProtectedRoute';

const ANALYSIS_STEPS = [
  { id: 1, label: 'Parsing data byte stream & encoding', duration: 650 },
  { id: 2, label: 'Detecting field types & cardinalities', duration: 900 },
  { id: 3, label: 'Computing statistical variance & skew', duration: 800 },
  { id: 4, label: 'Identifying temporal trends & dimensions', duration: 1000 },
  { id: 5, label: 'Building semantic correlation graph', duration: 750 },
  { id: 6, label: 'Scoring optimal visualization candidates', duration: 850 },
] as const;

function AnalysisContent() {
  useProtectedRoute('/analysis');
  const searchParams = useSearchParams();
  const fileName = searchParams.get('file') ?? 'Q3_Business_Performance.xlsx';
  const datasetId = searchParams.get('id');
  const mode = (searchParams.get('mode') ?? 'workspace') as PrivacyMode;
  const isZeroTrace = mode === 'zerotrace';

  const [dataset, setDataset] = useState<VizPilotDataset | null>(null);
  const [profile, setProfile] = useState<VizPilotDataProfile | null>(null);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Try volatile RAM store first
      let activeDs = clientMemoryStore.getDataset(datasetId);

      // 2. Fall back to sessionStorage if RAM store is empty
      if (!activeDs) {
        const raw = datasetId
          ? sessionStorage.getItem(`vizpilot:dataset:${datasetId}`)
          : sessionStorage.getItem('vizpilot:active-dataset');
        if (raw) {
          try {
            activeDs = JSON.parse(raw);
          } catch {}
        }
      }

      if (activeDs) {
        setDataset(activeDs);

        // Deterministic profiling pass
        const computedProfile = profileDataset(activeDs);
        setProfile(computedProfile);

        // Always keep profile in volatile RAM
        clientMemoryStore.setProfile(computedProfile);

        // In Workspace mode only, persist profile to sessionStorage for reload survival
        if (mode !== 'zerotrace') {
          try {
            sessionStorage.setItem(
              `vizpilot:profile:${activeDs.id}`,
              JSON.stringify(computedProfile)
            );
            sessionStorage.setItem(
              'vizpilot:active-profile',
              JSON.stringify(computedProfile)
            );
          } catch {
            console.warn('[VizPilot] Profile caching in sessionStorage exceeded quota or failed.');
          }
        }
      }
      setCheckedStorage(true);
    }
  }, [datasetId, mode]);

  useEffect(() => {
    if (!checkedStorage || !dataset) return;

    let delay = 200;
    const timers: ReturnType<typeof setTimeout>[] = [];

    ANALYSIS_STEPS.forEach((step, i) => {
      // Set as active
      const tActive = setTimeout(() => {
        setActiveStepIndex(i);
      }, delay);
      timers.push(tActive);

      delay += step.duration;

      // Set as complete
      const tDone = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, step.id]);
        if (i === ANALYSIS_STEPS.length - 1) {
          setActiveStepIndex(-1);
          setTimeout(() => setDone(true), 400);
        }
      }, delay);
      timers.push(tDone);
    });

    return () => timers.forEach(clearTimeout);
  }, [checkedStorage, dataset]);

  // Compute synchronized deterministic progress (0% -> 100%)
  const completedCount = completedSteps.length;
  const total = ANALYSIS_STEPS.length;
  const progress = done
    ? 100
    : Math.min(
        100,
        Math.round((completedCount / total) * 85 + (activeStepIndex >= 0 ? 10 : 0))
      );

  return (
    <div className="relative min-h-screen pt-28 pb-20 bg-[#08080b] text-white overflow-hidden">
      
      {/* Background Continuous Depth Typography */}
      <div className="absolute top-[12%] left-0 right-0 z-0">
        <ParallaxText direction="rtl" duration={50} outline={true}>
          ANALYSIS · REASONING · PIPELINE
        </ParallaxText>
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6 md:px-8">

        {/* Header */}
        <motion.div className="mb-8 sm:mb-10 text-center" variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div
            variants={staggerItem}
            className={cn(
              'mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full border px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-mono tracking-widest uppercase backdrop-blur-md',
              isZeroTrace ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-400' : 'border-indigo-400/30 bg-indigo-500/10 text-indigo-300'
            )}
          >
            {isZeroTrace ? (
              <><ShieldCheck className="h-3.5 w-3.5" /> ZERO-TRACE RUN · STEP 02 OF 04</>
            ) : (
              <><span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" /> WORKSPACE RUN · STEP 02 OF 04</>
            )}
          </motion.div>

          <motion.h1 variants={staggerItem} className="font-display text-[clamp(2rem,5vw,3.75rem)] font-extrabold uppercase tracking-tight text-white mb-2 sm:mb-3 leading-[1.05]">
            COMPUTING <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400">DATASET.</span>
          </motion.h1>

          <motion.div variants={staggerItem} className="flex items-center justify-center gap-2 flex-wrap font-mono text-xs text-white/50">
            <span className="text-white/80 font-bold">{fileName}</span>
            <span>·</span>
            <span className={cn('flex items-center gap-1 font-bold', isZeroTrace ? 'text-emerald-400' : 'text-indigo-400')}>
              {isZeroTrace ? <><ShieldCheck className="h-3 w-3" /> ZERO-TRACE</> : <><Folder className="h-3 w-3" /> WORKSPACE</>}
            </span>
          </motion.div>
        </motion.div>

        {/* Empty State when no dataset is present */}
        {checkedStorage && !dataset ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-[#0f0f16]/90 backdrop-blur-xl p-10 text-center max-w-lg mx-auto shadow-2xl mb-8"
          >
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-400/30 mb-4">
              <Database className="h-7 w-7 text-indigo-400" />
            </div>
            <h2 className="font-display text-2xl font-bold uppercase text-white mb-2">
              No Active Dataset
            </h2>
            <p className="font-mono text-xs text-white/50 mb-6 leading-relaxed">
              No active dataset was found in session memory. Please ingest a CSV, XLSX, PDF, or DOCX file to perform semantic profiling and visualization analysis.
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
          <>
            {/* Synchronized Progress Bar */}
            <div className="mb-6 sm:mb-8 font-mono">
              <div className="flex justify-between mb-2 text-xs">
                <span className="text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  Pipeline Execution State
                </span>
                <span className="font-bold text-white">{progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full transition-all duration-300', isZeroTrace ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]' : 'bg-indigo-500 shadow-[0_0_12px_#6366f1]')}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Steps Card with PENDING / ACTIVE / COMPLETE States */}
            <motion.div
              className="rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0f0f16]/90 backdrop-blur-xl overflow-hidden shadow-2xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {ANALYSIS_STEPS.map((step, i) => {
                const isComplete = completedSteps.includes(step.id);
                const isActive = activeStepIndex === i && !isComplete;
                const isPending = !isComplete && !isActive;

                return (
                  <div
                    key={step.id}
                    className={cn(
                      'flex items-center justify-between gap-3.5 px-6 py-4 border-b border-white/5 last:border-0 transition-all duration-300 font-mono text-xs',
                      isActive
                        ? 'bg-indigo-500/[0.08] border-l-2 border-l-indigo-400 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]'
                        : isComplete
                        ? 'bg-white/[0.015]'
                        : 'opacity-40'
                    )}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex-shrink-0">
                        {isComplete ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : isActive ? (
                          <Loader2 className={cn('h-4 w-4 animate-spin', isZeroTrace ? 'text-emerald-400' : 'text-indigo-400')} />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-white/20" />
                        )}
                      </div>
                      <span className={cn('transition-colors tracking-wide truncate', isActive ? 'text-white font-semibold' : isComplete ? 'text-white/80' : 'text-white/30')}>
                        {step.label}
                      </span>
                    </div>

                    {/* Clear Pipeline Stage Status Badge */}
                    <div className="flex-shrink-0 ml-3">
                      {isComplete ? (
                        <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                          COMPLETE
                        </span>
                      ) : isActive ? (
                        <span className="rounded-md border border-indigo-400/30 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 uppercase tracking-widest animate-pulse">
                          PROCESSING
                        </span>
                      ) : (
                        <span className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-0.5 text-[10px] font-bold text-white/25 uppercase tracking-widest">
                          PENDING
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Done Card */}
            {done && (
              <motion.div
                className="mt-8 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-7 text-center backdrop-blur-xl"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-400" />
                <p className="font-display text-lg font-bold text-white uppercase tracking-wide mb-1">
                  Analysis Successfully Concluded
                </p>
                {(() => {
                  const totalRows = profile
                    ? profile.summary.totalRows
                    : dataset
                    ? dataset.tables.reduce((sum, t) => sum + t.rowCount, 0)
                    : 0;
                  const totalFields = profile
                    ? profile.summary.totalColumns
                    : dataset
                    ? dataset.tables.reduce((sum, t) => sum + t.columnCount, 0)
                    : 0;
                  const sheetsCount = profile
                    ? profile.summary.tableCount
                    : dataset
                    ? dataset.tables.length
                    : 1;
                  return (
                    <p className="text-xs font-mono text-white/60 mb-6">
                      {totalRows} rows · {totalFields} fields evaluated{sheetsCount > 1 ? ` across ${sheetsCount} sheets` : ''} · 5 ranked visualization models
                    </p>
                  );
                })()}

                <Link
                  href={`/recommendation?mode=${mode}&file=${encodeURIComponent(fileName)}`}
                  className={cn(
                    'inline-flex items-center gap-2.5 rounded-full px-8 py-3 text-xs font-mono font-bold tracking-widest uppercase text-[#08080b] transition-all shadow-xl active:scale-[0.98]',
                    isZeroTrace ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-white hover:bg-white/90'
                  )}
                >
                  <span>View Recommendations</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense>
      <AnalysisContent />
    </Suspense>
  );
}
