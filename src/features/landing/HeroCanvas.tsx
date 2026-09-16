'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/src/lib/motion/variants';

// ─── SVG chart paths (Revenue vs Expenses, light-mode dark lines) ─────────────
// ViewBox 0 0 400 180, y-inverted (lower y = higher value)
const REV_LINE = 'M 20,140 C 60,134 90,116 130,106 C 165,96 178,80 210,72 C 240,64 265,52 295,44 C 320,38 350,32 385,28';
const REV_AREA = `${REV_LINE} L 385,168 L 20,168 Z`;
const EXP_LINE = 'M 20,154 C 60,152 90,140 130,132 C 165,126 178,116 210,111 C 240,106 265,98 295,93 C 320,90 350,86 385,82';
const EXP_AREA = `${EXP_LINE} L 385,168 L 20,168 Z`;
const REV_DOTS = [
  { cx: 20, cy: 140 }, { cx: 130, cy: 106 }, { cx: 210, cy: 72 },
  { cx: 295, cy: 44 }, { cx: 385, cy: 28 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChartCard({ reduced }: { reduced: boolean | null }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-black/6">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground-muted/70">Revenue vs Expenses · Q3</span>
        </div>
        <div className="flex gap-3">
          {[{ c: '#6366f1', l: 'Revenue' }, { c: '#8b5cf6', l: 'Expenses' }].map((item) => (
            <span key={item.l} className="flex items-center gap-1.5 text-[9px] text-foreground-muted/60">
              <span className="inline-block h-0.5 w-4 rounded" style={{ backgroundColor: item.c }} />{item.l}
            </span>
          ))}
        </div>
      </div>
      <div className="flex-1 p-3">
        <svg viewBox="0 0 400 180" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="hc-rev-light" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="hc-exp-light" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[40, 80, 120].map((y) => (
            <line key={y} x1="10" y1={y} x2="390" y2={y} stroke="rgba(12,10,18,0.05)" strokeWidth="1" />
          ))}
          {[{ y: 38, t: '$1.3M' }, { y: 78, t: '$1.1M' }, { y: 118, t: '$0.9M' }].map((l) => (
            <text key={l.y} x="10" y={l.y} fontSize="8" fill="rgba(107,100,120,0.5)" fontFamily="Inter,sans-serif">{l.t}</text>
          ))}
          <motion.path d={REV_AREA} fill="url(#hc-rev-light)"
            initial={reduced ? undefined : { opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.9 }} />
          <motion.path d={EXP_AREA} fill="url(#hc-exp-light)"
            initial={reduced ? undefined : { opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.9 }} />
          <motion.path d={EXP_LINE} fill="none" stroke="#8b5cf6" strokeWidth="1.5"
            strokeLinecap="round" strokeDasharray="5 4" strokeOpacity="0.55"
            initial={reduced ? undefined : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.55, duration: 1.4, ease: 'easeOut' }} />
          <motion.path d={REV_LINE} fill="none" stroke="#6366f1" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            initial={reduced ? undefined : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.35, duration: 1.4, ease: 'easeOut' }} />
          {REV_DOTS.map((pt, i) => (
            <motion.circle key={i} cx={pt.cx} cy={pt.cy} r="3.5"
              fill="#6366f1" stroke="#ffffff" strokeWidth="2"
              initial={reduced ? undefined : { opacity: 0, r: 0 }}
              animate={{ opacity: 1, r: 3.5 }}
              transition={{ delay: 1.1 + i * 0.07, duration: 0.25, ease: 'backOut' }} />
          ))}
          {[{ x: 20, t: 'Jul' }, { x: 210, t: 'Aug' }, { x: 385, t: 'Sep' }].map((l) => (
            <text key={l.t} x={l.x} y="178" fontSize="9" fill="rgba(107,100,120,0.5)"
              fontFamily="Inter,sans-serif" textAnchor="middle">{l.t}</text>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ─── HeroCanvas — floating composition on gradient atmosphere ─────────────────

export function HeroCanvas() {
  const reduced = useReducedMotion();

  return (
    <div className="relative w-full min-h-[calc(100vh-56px)] flex flex-col lg:flex-row items-center gap-8 lg:gap-0 pt-12 pb-16 md:pt-16 md:pb-20">

      {/* ── Left: headline + copy + CTA ──────────────────────────── */}
      <div className="flex-1 lg:pr-8 xl:pr-16 z-20">
        <motion.div
          className="flex flex-col gap-5 max-w-[520px] mx-auto lg:mx-0"
          variants={reduced ? undefined : staggerContainer}
          initial={reduced ? undefined : 'hidden'}
          animate="visible"
        >
          {/* Eyebrow */}
          <motion.div variants={reduced ? undefined : staggerItem} className="w-fit">
            <div className="flex items-center gap-2 rounded-full border border-accent/25 bg-accent/8 px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-semibold text-accent tracking-wide">AI-Powered Visualization</span>
            </div>
          </motion.div>

          {/* Headline — large, architectural */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <h1 style={{ fontSize: 'clamp(2.8rem,5.5vw,6rem)', fontWeight: 800, lineHeight: 1.04, letterSpacing: '-0.04em' }}
              className="text-foreground">
              Your data<br />has{' '}
              <span className="text-accent">a story.</span>
            </h1>
          </motion.div>

          {/* Body */}
          <motion.div variants={reduced ? undefined : staggerItem}>
            <p className="text-base md:text-lg text-foreground-muted leading-relaxed max-w-[380px]">
              Turn raw business data into meaningful visualizations — without the guesswork.
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div variants={reduced ? undefined : staggerItem} className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                style={{ boxShadow: '0 4px 24px rgba(99,102,241,0.3)' }}
              >
                Upload your data
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center rounded-xl border border-black/12 bg-white/60 px-6 py-3 text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-white hover:border-black/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                See how it works
              </a>
            </div>
            <p className="text-xs text-foreground-muted/50 tracking-wider font-medium">CSV · XLSX · PDF · DOCX</p>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Right: floating visualization composition ─────────────── */}
      <div className="relative flex-1 h-[420px] lg:h-[520px] xl:h-[580px] w-full lg:w-auto">

        {/* Main chart card */}
        <motion.div
          className="absolute inset-0 lg:inset-y-4 rounded-2xl bg-white overflow-hidden"
          style={{ boxShadow: '0 20px 80px rgba(99,102,241,0.12), 0 0 0 1px rgba(0,0,0,0.06)' }}
          initial={reduced ? undefined : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0, 0, 0.2, 1] }}
        >
          <ChartCard reduced={reduced} />
        </motion.div>

        {/* Floating KPI chip — mid-left, overlaps into left column on desktop */}
        <motion.div
          className="absolute z-20"
          style={{ left: '-5%', top: '28%' }}
          animate={reduced ? undefined : { y: [0, -6, 0] }}
          transition={{ delay: 3, repeat: Infinity, duration: 4.5, ease: 'easeInOut', repeatType: 'reverse' }}
        >
          <motion.div
            className="rounded-2xl bg-white px-4 py-3.5 min-w-[148px]"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05)' }}
            initial={reduced ? undefined : { opacity: 0, x: -16, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5, ease: [0, 0, 0.2, 1] }}
          >
            <p className="text-[9px] font-bold uppercase tracking-wider text-foreground-muted/50 mb-2.5">Q3 Metrics</p>
            {[
              { l: 'Revenue', v: '$1.218M', d: '+9.2%', pos: true },
              { l: 'Expenses', v: '$792K', d: '+3.1%', pos: false },
              { l: 'Customers', v: '3,670', d: '+10.8%', pos: true },
            ].map((row, i) => (
              <motion.div key={row.l} className="flex items-center justify-between gap-4 py-0.5"
                initial={reduced ? undefined : { opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 + i * 0.08, duration: 0.3 }}>
                <span className="text-[10px] text-foreground-muted">{row.l}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-foreground">{row.v}</span>
                  <span className={`text-[9px] font-semibold ${row.pos ? 'text-emerald-500' : 'text-red-500'}`}>{row.d}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating recommendation badge — bottom right */}
        <motion.div
          className="absolute z-20 bottom-8 right-4"
          animate={reduced ? undefined : { y: [0, -5, 0] }}
          transition={{ delay: 3.5, repeat: Infinity, duration: 5, ease: 'easeInOut', repeatType: 'reverse' }}
        >
          <motion.div
            className="rounded-2xl bg-white px-4 py-3.5 min-w-[160px]"
            style={{ boxShadow: '0 8px 32px rgba(99,102,241,0.12), 0 0 0 1px rgba(0,0,0,0.05)' }}
            initial={reduced ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.5, ease: [0, 0, 0.2, 1] }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-accent">Recommended</span>
            </div>
            <p className="text-sm font-bold text-foreground mb-2">Bar Chart</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-black/6 overflow-hidden">
                <motion.div className="h-full rounded-full bg-accent"
                  initial={reduced ? undefined : { width: '0%' }}
                  animate={{ width: '92%' }}
                  transition={{ delay: 1.3, duration: 0.6, ease: [0, 0, 0.2, 1] }} />
              </div>
              <span className="text-[10px] font-bold text-accent">92%</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Analysis complete chip — top right */}
        <motion.div
          className="absolute z-20 top-6 right-6"
          initial={reduced ? undefined : { opacity: 0, scale: 0.85, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.35, ease: [0, 0, 0.2, 1] }}
        >
          <div className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)' }}>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-foreground-muted">Analysis complete</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
