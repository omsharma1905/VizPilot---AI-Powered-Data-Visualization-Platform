'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Activity, ShieldCheck, ArrowRight } from 'lucide-react';

export function HeroLiveIntelligence() {
  const reduced = useReducedMotion();

  // Primary smooth polynomial curve coordinates: viewBox 0 0 320 90
  const linePath = 'M 10,72 C 45,70 70,35 105,42 C 140,49 165,18 200,28 C 235,38 265,12 310,18';
  const areaPath = `${linePath} L 310,85 L 10,85 Z`;

  // Secondary benchmark comparison trace
  const secondaryPath = 'M 10,65 C 50,60 90,52 130,48 C 170,44 210,38 250,32 C 280,27 300,24 310,22';

  const dataPoints = [
    { cx: 10, cy: 72, label: 'T-0' },
    { cx: 105, cy: 42, label: 'T+30' },
    { cx: 200, cy: 28, label: 'T+60' },
    { cx: 310, cy: 18, label: 'Peak' },
  ];

  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, y: 24, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: 0.8, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-lg lg:max-w-none mx-auto"
    >
      {/* Ambient floating container */}
      <motion.div
        animate={reduced ? undefined : { y: [0, -5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="relative rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0b0b12]/85 backdrop-blur-2xl p-4 sm:p-6 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.7)] sm:shadow-[0_30px_90px_rgba(0,0,0,0.75)] overflow-hidden"
      >
        {/* Subtle radial ambient gradient */}
        <div
          className="pointer-events-none absolute -top-28 -right-28 h-64 w-64 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)' }}
        />

        {/* ── Top Bar: Engine Status & Telemetry ── */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 sm:pb-4 mb-4 sm:mb-5">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-500" />
            </span>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] sm:text-[11px] font-bold tracking-widest text-white uppercase">
                INTELLIGENCE ENGINE
              </span>
              <span className="font-mono text-[8px] sm:text-[9px] text-emerald-400/80 tracking-wider">
                AUTONOMOUS · EVALUATING STREAM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[9px] sm:text-[10px]">
            <span className="rounded-full border border-white/10 bg-white/5 px-2 sm:px-2.5 py-0.5 sm:py-1 text-white/50 flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-indigo-400" />
              <span>0.04ms</span>
            </span>
          </div>
        </div>

        {/* ── Metric Telemetry Strip ── */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-white/5 bg-white/[0.02] p-2.5 sm:p-3 mb-4 sm:mb-5 font-mono">
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-wider block truncate">REVENUE</span>
            <span className="font-display text-base sm:text-lg md:text-xl font-bold text-white tracking-tight truncate block">$1.24M</span>
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-wider block truncate">VARIANCE</span>
            <span className="font-display text-base sm:text-lg md:text-xl font-bold text-emerald-400 tracking-tight truncate block">+8.4%</span>
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-wider block truncate">CONFIDENCE</span>
            <span className="font-display text-base sm:text-lg md:text-xl font-bold text-indigo-300 tracking-tight truncate block">92%</span>
          </div>
        </div>

        {/* ── Autonomous Graph & Node Constellation ── */}
        <div className="relative rounded-xl sm:rounded-2xl border border-white/5 bg-black/50 p-3 sm:p-3.5 pt-3.5 sm:pt-4 mb-4 sm:mb-5 overflow-hidden">
          {/* Subtle horizontal dashed grid */}
          <div className="absolute inset-0 flex flex-col justify-between p-3.5 pointer-events-none opacity-20">
            <div className="border-b border-dashed border-white/25 w-full" />
            <div className="border-b border-dashed border-white/25 w-full" />
            <div className="border-b border-dashed border-white/25 w-full" />
          </div>

          <div className="flex items-center justify-between font-mono text-[10px] text-white/40 mb-1 px-1">
            <span>DISTRIBUTION TRAJECTORY</span>
            <span className="text-indigo-400 flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-indigo-400 animate-pulse" />
              SMOOTH POLYNOMIAL
            </span>
          </div>

          <svg viewBox="0 0 320 90" className="w-full h-24 overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="hero-curve-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gradient Area Wash */}
            <motion.path
              d={areaPath}
              fill="url(#hero-curve-grad)"
              initial={reduced ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 1.2 }}
            />

            {/* Secondary Faint Comparison Path */}
            <path
              d={secondaryPath}
              fill="none"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* Primary Spline Path */}
            <motion.path
              d={linePath}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduced ? undefined : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.85, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Traveling Signal Pulse along the spline */}
            {!reduced && (
              <circle r="3" fill="#ffffff" filter="drop-shadow(0 0 6px #818cf8)">
                <animateMotion
                  path={linePath}
                  dur="6s"
                  repeatCount="indefinite"
                  keyPoints="0;1"
                  keyTimes="0;1"
                  calcMode="linear"
                />
              </circle>
            )}

            {/* Anchored Sensor Nodes */}
            {dataPoints.map((pt, i) => (
              <g key={pt.label}>
                <motion.circle
                  cx={pt.cx}
                  cy={pt.cy}
                  r="3.5"
                  fill="#ffffff"
                  stroke="#6366f1"
                  strokeWidth="2"
                  initial={reduced ? undefined : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.1 + i * 0.1, duration: 0.3 }}
                />
                <circle
                  cx={pt.cx}
                  cy={pt.cy}
                  r="7"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="1"
                  opacity="0.35"
                  className="animate-pulse"
                />
              </g>
            ))}
          </svg>

          <div className="flex justify-between font-mono text-[9px] text-white/30 px-1 pt-1.5">
            <span>T-0</span>
            <span>T+30D</span>
            <span>T+60D</span>
            <span>T+90D</span>
          </div>
        </div>

        {/* ── Semantic Relationship Pipeline ── */}
        <div className="space-y-2 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="text-white/40 tracking-wider uppercase">SEMANTIC SCHEMA</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> VERIFIED FIT
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap font-mono text-xs">
            <span className="rounded-lg border border-indigo-500/30 bg-indigo-500/15 px-2.5 py-1 text-indigo-300 font-bold text-[11px]">
              REVENUE
            </span>
            <ArrowRight className="h-3 w-3 text-white/30" />
            <span className="rounded-lg border border-sky-500/30 bg-sky-500/15 px-2.5 py-1 text-sky-300 font-bold text-[11px]">
              TIME
            </span>
            <ArrowRight className="h-3 w-3 text-white/30" />
            <span className="rounded-lg border border-rose-500/30 bg-rose-500/15 px-2.5 py-1 text-rose-300 font-bold text-[11px]">
              REGION
            </span>
          </div>

          <p className="font-mono text-[10px] text-white/35 pt-1">
            18 RECORDS PARSED · CARDINALITY EVALUATED · AUTONOMOUS
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
