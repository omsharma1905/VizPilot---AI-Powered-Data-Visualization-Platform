'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Lock, Trash2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { ParallaxText } from '@/src/components/cinematic/ParallaxText';
import { cn } from '@/src/lib/utils/cn';
import type { PrivacyMode } from '@/src/types';

const PIPELINE = [
  { step: '01', name: 'SECURE INGEST', desc: 'Encrypted client streaming' },
  { step: '02', name: 'IN-MEMORY PARSING', desc: 'No persistent database write' },
  { step: '03', name: 'ANALYTICS GENERATED', desc: 'Instant local visualization' },
  { step: '04', name: 'SESSION PURGED', desc: 'Memory released on tab close' },
];

const MOCK_ROWS = [
  { field: 'Confidential Gross Margin', val: '42.8%', secret: true },
  { field: 'Client Entity ID', val: 'ENT-89241', secret: true },
  { field: 'Quarterly Operating Profit', val: '$1,480,200', secret: true },
  { field: 'Strategic Region', val: 'EMEA Enterprise', secret: false },
];

export function ZeroTraceScene() {
  const [mode, setMode] = useState<PrivacyMode>('zerotrace');
  const reduced = useReducedMotion();
  const isZT = mode === 'zerotrace';

  return (
    <section
      id="privacy"
      className="relative py-20 sm:py-28 md:py-36 bg-[#060608] text-white overflow-hidden"
      aria-label="Zero-Trace Privacy"
    >
      {/* Background Parallax Watermark */}
      <div className="absolute top-[8%] left-0 right-0 z-0 pointer-events-none">
        <ParallaxText direction="rtl" velocity={130} outline={true}>
          ZERO-TRACE · EPHEMERAL · SECURITY
        </ParallaxText>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-16">

        {/* Header */}
        <div className="max-w-3xl mb-10 sm:mb-14">
          <div className={cn(
            'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 backdrop-blur-md mb-3 transition-colors duration-500',
            isZT ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
          )}>
            <ShieldCheck className="h-4 w-4" />
            <span className="font-mono text-[11px] sm:text-xs font-bold tracking-widest uppercase">
              {isZT ? 'ZERO-TRACE MODE ACTIVE' : 'WORKSPACE MODE ACTIVE'}
            </span>
          </div>

          <h2 className="font-display text-[clamp(1.85rem,4.5vw,3.6rem)] font-extrabold uppercase tracking-tight text-white leading-[1.05]">
            EPHEMERAL BY DESIGN.<br />
            <span className={cn('transition-colors duration-500', isZT ? 'text-emerald-400' : 'text-white/40')}>
              ZERO DIGITAL FOOTPRINT.
            </span>
          </h2>
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-white/60 max-w-xl leading-relaxed">
            Analyze highly sensitive financial spreadsheets, payroll, or proprietary models without storing your raw records on external servers.
          </p>
        </div>

        {/* Main Privacy Console */}
        <div className={cn(
          'rounded-2xl sm:rounded-3xl border p-4 sm:p-7 md:p-10 transition-all duration-700 relative overflow-hidden backdrop-blur-xl',
          isZT
            ? 'border-emerald-500/25 bg-[#091410]/80 shadow-[0_20px_80px_rgba(16,185,129,0.08)]'
            : 'border-white/10 bg-[#0f0f16]/80 shadow-2xl'
        )}>
          {/* Subtle Ambient Radial Shift */}
          <div
            className={cn(
              'pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full blur-[120px] transition-colors duration-700',
              isZT ? 'bg-emerald-500/15' : 'bg-indigo-500/10'
            )}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">

            {/* Left Col: Mode Controls & Lifecycle (7 Cols) */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">

              {/* Mode Toggle Bar */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs text-white/40 uppercase tracking-widest">Select Mode:</span>
                <div className="inline-flex rounded-full border border-white/15 bg-black/40 p-1">
                  <button
                    onClick={() => setMode('workspace')}
                    className={cn(
                      'rounded-full px-4 sm:px-5 py-2 text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer min-h-[38px]',
                      !isZT ? 'bg-white text-[#08080b]' : 'text-white/60 hover:text-white'
                    )}
                  >
                    Workspace Mode
                  </button>
                  <button
                    onClick={() => setMode('zerotrace')}
                    className={cn(
                      'rounded-full px-4 sm:px-5 py-2 text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 flex items-center gap-1.5 cursor-pointer min-h-[38px]',
                      isZT ? 'bg-emerald-500 text-[#08080b]' : 'text-white/60 hover:text-white'
                    )}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Zero-Trace</span>
                  </button>
                </div>
              </div>

              {/* Lifecycle Visual Pipeline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {PIPELINE.map((p) => (
                  <div
                    key={p.step}
                    className={cn(
                      'rounded-xl border p-4 transition-all duration-300',
                      isZT && p.step === '04'
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-white/10 bg-black/30'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-white/90">{p.name}</span>
                      <span className="font-mono text-[10px] text-white/40">{p.step}</span>
                    </div>
                    <p className="text-xs text-white/50">{p.desc}</p>
                  </div>
                ))}
              </div>

              <p className="text-[11px] font-mono text-white/40 leading-relaxed pt-2">
                * Note: Zero-Trace is a frontend design concept. Final privacy guarantees depend on backend implementation.
              </p>
            </div>

            {/* Right Col: Interactive Obfuscation Display (5 Cols) */}
            <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/60 p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-2">
                <span className="font-mono text-xs text-white/50 uppercase tracking-wider">Simulated Ingest Stream</span>
                <span className={cn('font-mono text-[11px] font-bold px-2 py-0.5 rounded', isZT ? 'text-emerald-400 bg-emerald-500/10' : 'text-white/60')}>
                  {isZT ? 'EPHEMERAL RUN' : 'CACHED'}
                </span>
              </div>

              {MOCK_ROWS.map((row) => (
                <div
                  key={row.field}
                  className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/5 px-3.5 py-2.5"
                >
                  <span className="text-xs text-white/60 truncate mr-2">{row.field}</span>
                  <span
                    className={cn(
                      'font-mono text-xs font-bold transition-all duration-300',
                      isZT && row.secret
                        ? 'text-emerald-400 blur-[3px] select-none tracking-widest'
                        : 'text-white'
                    )}
                  >
                    {isZT && row.secret ? '••••••••' : row.val}
                  </span>
                </div>
              ))}

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                <Trash2 className="h-3.5 w-3.5" />
                <span>Zero persistence: Dataset discards upon tab exit</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
