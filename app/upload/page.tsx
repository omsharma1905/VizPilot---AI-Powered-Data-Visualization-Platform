'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Upload, FileSpreadsheet, FileText, File as FileIcon, X, ArrowRight, ShieldCheck, Folder, AlertCircle } from 'lucide-react';
import { ParallaxText } from '@/src/components/cinematic/ParallaxText';
import { cn } from '@/src/lib/utils/cn';
import type { PrivacyMode } from '@/src/types';
import { clientMemoryStore } from '@/src/lib/client/in-memory-store';
import { useProtectedRoute } from '@/src/lib/auth/useProtectedRoute';

const PRIVACY_OPTIONS: {
  id: PrivacyMode;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  description: string;
  new?: boolean;
}[] = [
  { id: 'workspace', icon: Folder, label: 'Workspace Mode', description: 'Store analysis in persistent cloud session for team access.' },
  { id: 'zerotrace', icon: ShieldCheck, label: 'Zero-Trace Mode', description: 'Ephemeral in-memory processing. Purges completely upon exit.', new: true },
];

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'csv' || ext === 'xls') return FileSpreadsheet;
  if (ext === 'pdf') return FileText;
  return FileIcon;
}

export default function UploadPage() {
  useProtectedRoute('/upload');
  const router = useRouter();
  const reduced = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectFile = useCallback((name: string) => {
    setSelectedFile(name);
    setPrivacyMode(null);
    setErrorMessage(null);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileObj(file);
      selectFile(file.name);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileObj(file);
      selectFile(file.name);
    }
  };

  const handleSelectSample = (e: React.MouseEvent) => {
    e.stopPropagation();
    const sampleCsv = `month,revenue,expenses,customers,region,product
Jul,420000,310000,1240,North America,Analytics Pro
Jul,185000,140000,580,Europe,Analytics Pro
Jul,95000,78000,310,Asia Pacific,Analytics Lite
Aug,468000,325000,1380,North America,Analytics Pro
Aug,210000,155000,640,Europe,Analytics Pro
Aug,112000,85000,360,Asia Pacific,Analytics Lite
Sep,512000,340000,1520,North America,Analytics Pro
Sep,248000,172000,710,Europe,Analytics Pro
Sep,134000,92000,420,Asia Pacific,Analytics Lite
Jul,68000,52000,210,North America,Analytics Lite
Jul,34000,28000,95,Europe,Analytics Lite
Aug,74000,57000,235,North America,Analytics Lite
Aug,38000,30000,108,Europe,Analytics Lite
Sep,82000,61000,268,North America,Analytics Lite
Sep,44000,34000,124,Europe,Analytics Lite
Jul,156000,118000,445,North America,Enterprise
Aug,178000,128000,490,North America,Enterprise
Sep,198000,138000,540,North America,Enterprise`;
    const sampleBlob = new Blob([sampleCsv], { type: 'text/csv' });
    const sampleFile = new File([sampleBlob], 'Q3_Business_Performance.csv', { type: 'text/csv' });
    setFileObj(sampleFile);
    selectFile('Q3_Business_Performance.csv');
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !privacyMode) return;
    setNavigating(true);
    setErrorMessage(null);

    try {
      let datasetId: string | null = null;

      if (fileObj) {
        const formData = new FormData();
        formData.append('file', fileObj);
        formData.append('mode', privacyMode);

        const res = await fetch('/api/ingest', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!data.success) {
          setErrorMessage(data.error?.message || 'Ingestion failed. Please check your file.');
          setNavigating(false);
          return;
        }

        datasetId = data.dataset.id;
        if (typeof window !== 'undefined') {
          // Strict isolation: purge previous session and memory before setting new dataset
          clientMemoryStore.clear();
          sessionStorage.removeItem('vizpilot:active-dataset');
          sessionStorage.removeItem('vizpilot:active-profile');
          sessionStorage.removeItem('vizpilot:active-recommendation');

          // Always keep full dataset in volatile RAM for seamless SPA workflow
          clientMemoryStore.setDataset(data.dataset);

          if (privacyMode === 'zerotrace') {
            // ZERO-TRACE STORAGE DEFENSE:
            // Never write raw business rows to disk-backed browser sessionStorage.
            // Store only structural metadata (rows: []) so page navigation retains table/column schema.
            const metadataOnly = {
              ...data.dataset,
              tables: data.dataset.tables.map((t: { rows: unknown[]; [k: string]: unknown }) => ({
                ...t,
                rows: [],
                rowCount: t.rows ? t.rows.length : (t.rowCount || 0),
              })),
              _zeroTraceStorage: true,
            };
            try {
              const metaSerialised = JSON.stringify(metadataOnly);
              sessionStorage.setItem(`vizpilot:dataset:${datasetId}`, metaSerialised);
              sessionStorage.setItem('vizpilot:active-dataset', metaSerialised);
            } catch {
              // Ignore sessionStorage errors
            }
          } else {
            // Workspace Mode: Normal session persistence across reload
            const serialised = JSON.stringify(data.dataset);
            try {
              sessionStorage.setItem(`vizpilot:dataset:${datasetId}`, serialised);
              sessionStorage.setItem('vizpilot:active-dataset', serialised);
            } catch (quotaErr) {
              // QuotaExceededError — dataset too large for sessionStorage (typical ~5MB limit).
              // Store a lightweight metadata-only version (no row data) so navigation still works.
              const lightDataset = {
                ...data.dataset,
                tables: data.dataset.tables.map((t: { rows: unknown[]; [k: string]: unknown }) => ({
                  ...t,
                  rows: [],
                  rowCount: t.rows.length,
                })),
                _rowsTruncatedForStorage: true,
              };
              try {
                const lightSerialised = JSON.stringify(lightDataset);
                sessionStorage.setItem(`vizpilot:dataset:${datasetId}`, lightSerialised);
                sessionStorage.setItem('vizpilot:active-dataset', lightSerialised);
                setErrorMessage(
                  'Dataset stored in preview mode — row data is too large for browser storage. Analysis will show column schema only.'
                );
              } catch {
                console.warn('[VizPilot] sessionStorage unavailable even for lightweight dataset.');
              }
              void quotaErr;
            }
          }
        }

      }

      const targetUrl = datasetId
        ? `/analysis?mode=${privacyMode}&file=${encodeURIComponent(selectedFile)}&id=${datasetId}`
        : `/analysis?mode=${privacyMode}&file=${encodeURIComponent(selectedFile)}`;

      router.push(targetUrl);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Network error during ingestion.');
      setNavigating(false);
    }
  };

  const CurrentFileIcon = selectedFile ? fileIcon(selectedFile) : FileSpreadsheet;
  const canAnalyze = !!selectedFile && !!privacyMode;

  return (
    <div className="relative min-h-screen pt-28 pb-20 bg-[#08080b] text-white overflow-hidden">
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.pdf,.docx"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Background Parallax Typography */}
      <div className="absolute top-[12%] left-0 right-0 z-0">
        <ParallaxText direction="ltr" velocity={100} outline={true}>
          INGEST · UPLOAD · PIPELINE
        </ParallaxText>
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6 md:px-8">

        {/* Header */}
        <motion.div
          className="mb-8 sm:mb-10 text-center"
          initial={reduced ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-mono tracking-widest text-indigo-300 uppercase backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            STEP 01 OF 04 · INGESTION
          </div>
          <h1 className="font-display text-[clamp(2rem,5vw,3.75rem)] font-extrabold uppercase tracking-tight text-white mb-2 sm:mb-3 leading-[1.05]">
            BRING YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400">DATA.</span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-white/60 max-w-md mx-auto leading-relaxed">
            Drop raw business records into the engine. VizPilot immediately computes cardinality and field relationships.
          </p>
        </motion.div>

        {/* Main Glass Console Card */}
        <motion.div
          className="rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0f0f16]/90 backdrop-blur-xl p-4 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden"
          initial={reduced ? undefined : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="space-y-5 sm:space-y-6">

            {/* Error Message Alert Banner */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs font-mono text-rose-300 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-white p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}

            {/* Drop Zone / Selected File Card */}
            <AnimatePresence mode="wait">
              {!selectedFile ? (
                <motion.div
                  key="drop"
                  initial={reduced ? undefined : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Upload file — click or drop"
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                    className={cn(
                      'relative flex flex-col items-center justify-center gap-3 sm:gap-4 min-h-[220px] sm:min-h-[260px] rounded-xl sm:rounded-2xl border-2 border-dashed transition-all duration-300 p-4 text-center',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
                      isDragOver
                        ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                        : 'border-white/15 bg-white/[0.02] hover:border-indigo-400/50 hover:bg-white/[0.04] cursor-pointer group'
                    )}
                  >
                    <div className={cn(
                      'flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl transition-all duration-300',
                      isDragOver ? 'bg-indigo-500/20 scale-110' : 'bg-white/5 border border-white/10 group-hover:scale-105 group-hover:border-indigo-400/30'
                    )}>
                      <Upload className={cn('h-6 w-6 sm:h-7 sm:w-7 transition-colors', isDragOver ? 'text-indigo-400' : 'text-white/60 group-hover:text-white')} strokeWidth={1.5} />
                    </div>

                    <div className="text-center">
                      <p className="text-sm md:text-base font-display font-bold text-white mb-1 tracking-wide">
                        {isDragOver ? 'RELEASE TO COMMENCE STREAM' : 'DROP DATA FILE HERE'}
                      </p>
                      <p className="text-xs font-mono text-white/40">
                        or click to browse · <span onClick={handleSelectSample} className="text-indigo-400 underline underline-offset-4 cursor-pointer hover:text-indigo-300">load sample Q3 dataset</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-white/30 uppercase tracking-widest">
                      <span>CSV</span> · <span>XLSX</span> · <span>PDF</span> · <span>DOCX</span> · <span>MAX 50MB</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="filecard"
                  initial={reduced ? undefined : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduced ? undefined : { opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/[0.04] p-4">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-400/30">
                        <CurrentFileIcon className="h-6 w-6 text-indigo-400" strokeWidth={1.75} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white tracking-wide">{selectedFile}</p>
                        <p className="text-[11px] font-mono text-white/50 mt-0.5">
                          {fileObj
                            ? `READY TO PROCESS · ${(fileObj.size / 1024).toFixed(1)} KB`
                            : 'READY TO PROCESS · SAMPLE DATASET · 18 ROWS'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedFile(null); setFileObj(null); setPrivacyMode(null); setErrorMessage(null); }}
                      className="rounded-lg p-2 text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      aria-label="Remove selected file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Privacy Mode Selector */}
            <AnimatePresence>
              {selectedFile && (
                <motion.div
                  initial={reduced ? undefined : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: 8 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 pt-2"
                >
                  <p className="font-mono text-xs font-bold text-white/50 uppercase tracking-widest">
                    Select Data Handling Mode:
                  </p>

                  <div className="space-y-3">
                    {PRIVACY_OPTIONS.map(({ id, icon: Icon, label, description, new: isNew }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPrivacyMode(id)}
                        className={cn(
                          'w-full flex items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer',
                          privacyMode === id
                            ? id === 'zerotrace'
                              ? 'border-emerald-400/60 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                              : 'border-indigo-400/60 bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.15)]'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                        )}
                        aria-pressed={privacyMode === id}
                      >
                        <div className={cn(
                          'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                          privacyMode === id
                            ? id === 'zerotrace' ? 'border-emerald-400 bg-emerald-400' : 'border-indigo-400 bg-indigo-400'
                            : 'border-white/30'
                        )}>
                          {privacyMode === id && <div className="h-2 w-2 rounded-full bg-[#08080b]" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={cn('h-4 w-4', privacyMode === id ? id === 'zerotrace' ? 'text-emerald-400' : 'text-indigo-400' : 'text-white/60')} />
                            <span className="font-display text-sm font-bold text-white tracking-wide">{label}</span>
                            {isNew && (
                              <span className="font-mono text-[9px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-400/30 px-1.5 py-0.2 rounded-full uppercase">
                                RECOMMENDED
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/50 leading-relaxed">{description}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Proceed to Analysis Button */}
                  <motion.button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={!canAnalyze || navigating}
                    animate={{ opacity: canAnalyze ? 1 : 0.4 }}
                    className={cn(
                      'w-full flex items-center justify-center gap-3 rounded-full py-4 text-xs md:text-sm font-mono font-bold tracking-widest uppercase transition-all duration-300 mt-6',
                      canAnalyze && !navigating
                        ? 'bg-white text-[#08080b] hover:bg-white/90 shadow-xl shadow-indigo-500/20 cursor-pointer'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    )}
                  >
                    {navigating ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-[#08080b]/30 border-t-[#08080b] animate-spin" />
                        INGESTING DATASTREAM…
                      </span>
                    ) : (
                      <>
                        <span>ANALYZE DATASET</span>
                        <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
