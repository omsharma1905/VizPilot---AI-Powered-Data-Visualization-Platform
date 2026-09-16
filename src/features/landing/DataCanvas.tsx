'use client';

import { motion, useReducedMotion } from 'framer-motion';

// ─── Abstract data rows for visual composition ────────────────────────────────

const DATA_ROWS = [
  { label: 'Revenue', value: '$512,000', delta: '+8.5%', positive: true },
  { label: 'Expenses', value: '$340,000', delta: '-2.1%', positive: false },
  { label: 'Customers', value: '1,520', delta: '+10.1%', positive: true },
  { label: 'Region', value: 'North America', delta: '—', positive: true },
  { label: 'Product', value: 'Analytics Pro', delta: '—', positive: true },
];

const CHART_BARS = [0.45, 0.72, 0.58, 0.88, 0.63, 0.79, 0.54, 0.91, 0.67, 0.82];

const FLOATING_LABELS = [
  { text: '+8.5% MoM', x: '68%', y: '18%', delay: 0.6 },
  { text: '91% confidence', x: '72%', y: '55%', delay: 0.9 },
  { text: 'Bar chart recommended', x: '62%', y: '78%', delay: 1.2 },
];

// ─── DataCanvas ───────────────────────────────────────────────────────────────

export function DataCanvas() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative w-full h-full min-h-[400px] md:min-h-[480px] overflow-hidden rounded-2xl border border-border bg-surface/60">

      {/* Subtle grid background */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.03]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Left panel — raw data table */}
      <div className="absolute left-4 top-4 bottom-4 w-[42%] flex flex-col gap-1.5">
        {/* Table header */}
        <div className="flex items-center gap-2 pb-2 border-b border-border/60">
          <div className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted">
            Q3 Business Performance
          </span>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-3 gap-1 px-1">
          {['Field', 'Value', 'Δ'].map((h) => (
            <span key={h} className="text-[9px] font-semibold uppercase tracking-wider text-foreground-muted/50">
              {h}
            </span>
          ))}
        </div>

        {/* Data rows */}
        {DATA_ROWS.map((row, i) => (
          <motion.div
            key={row.label}
            className="grid grid-cols-3 gap-1 rounded-md px-1 py-1.5 hover:bg-surface-elevated transition-colors"
            initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.35, ease: [0, 0, 0.2, 1] }}
          >
            <span className="text-[10px] text-foreground-muted truncate">{row.label}</span>
            <span className="text-[10px] font-medium text-foreground truncate">{row.value}</span>
            <span className={`text-[10px] font-medium ${row.positive ? 'text-emerald-400' : 'text-red-400'}`}>
              {row.delta}
            </span>
          </motion.div>
        ))}

        {/* More rows hint */}
        <div className="mt-auto flex items-center gap-1.5 pt-2 border-t border-border/40">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1.5 rounded-full bg-border/80" style={{ width: `${[60, 80, 45][i]}%` }} />
          ))}
        </div>
        <div className="text-[9px] text-foreground-muted/40">18 rows · 6 columns</div>
      </div>

      {/* Right panel — mini bar chart */}
      <div className="absolute right-4 top-4 bottom-4 left-[46%] flex flex-col">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <span className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted">
            Revenue vs Expenses
          </span>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-[9px] text-foreground-muted">
              <span className="inline-block h-1.5 w-3 rounded-sm bg-accent" /> Rev
            </span>
            <span className="flex items-center gap-1 text-[9px] text-foreground-muted">
              <span className="inline-block h-1.5 w-3 rounded-sm bg-violet-400" /> Exp
            </span>
          </div>
        </div>

        {/* Bar chart fragment */}
        <div className="flex-1 flex items-end gap-[3px] pt-4 pb-2">
          {CHART_BARS.map((h, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-t-sm"
              style={{
                backgroundColor: i % 2 === 0 ? '#6366f1' : '#8b5cf6',
                opacity: 0.8 + (h - 0.5) * 0.4,
              }}
              initial={shouldReduceMotion ? false : { scaleY: 0, originY: 1 }}
              animate={{ scaleY: h }}
              transition={{ delay: 0.4 + i * 0.05, duration: 0.5, ease: [0, 0, 0.2, 1] }}
            />
          ))}
        </div>

        {/* Axis labels */}
        <div className="flex justify-between">
          {['Jul', '', 'Aug', '', 'Sep', '', '', '', '', ''].map((label, i) => (
            <span key={i} className="flex-1 text-center text-[8px] text-foreground-muted/50">
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Floating analytical labels */}
      {!shouldReduceMotion && FLOATING_LABELS.map((label) => (
        <motion.div
          key={label.text}
          className="absolute"
          style={{ left: label.x, top: label.y }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: label.delay, duration: 0.4, ease: [0, 0, 0.2, 1] }}
        >
          <div className="rounded-md border border-accent/20 bg-accent/8 px-2 py-1 text-[9px] font-medium text-accent backdrop-blur-sm whitespace-nowrap">
            {label.text}
          </div>
        </motion.div>
      ))}

      {/* Corner accent glow */}
      <div className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-accent/8 blur-3xl" />
    </div>
  );
}
