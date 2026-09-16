'use client';

import { motion, useReducedMotion } from 'framer-motion';

// ─── Animated data rows ───────────────────────────────────────────────────────

const AUTH_DATA_ROWS = [
  { label: 'Revenue Q3', value: '$1.2M', delta: '+9.2%', pos: true },
  { label: 'Customers', value: '3,670', delta: '+10.8%', pos: true },
  { label: 'Margin', value: '34.1%', delta: '+1.4pp', pos: true },
  { label: 'Top Region', value: 'N. America', delta: '—', pos: true },
];

const AUTH_BARS = [0.52, 0.78, 0.61, 0.93, 0.69, 0.84, 0.57, 0.96];

const AUTH_LABELS = [
  { text: 'Line chart · 94%', x: '52%', y: '22%', delay: 0.8 },
  { text: 'Trend detected', x: '46%', y: '60%', delay: 1.1 },
];

// ─── AuthDataVisual ───────────────────────────────────────────────────────────

export function AuthDataVisual() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative h-full w-full overflow-hidden bg-surface/40 flex flex-col p-8">
      {/* Grid */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="auth-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid)" />
      </svg>

      {/* Ambient glow */}
      <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 left-1/4 h-40 w-40 rounded-full bg-violet-500/8 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full gap-6">

        {/* Data table fragment */}
        <motion.div
          className="rounded-xl border border-border/60 bg-surface/80 overflow-hidden backdrop-blur-sm"
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40">
            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted/70">
              Q3 Business Performance
            </span>
          </div>
          {AUTH_DATA_ROWS.map((row, i) => (
            <motion.div
              key={row.label}
              className="grid grid-cols-3 gap-2 px-4 py-2 border-b border-border/20 last:border-0"
              initial={shouldReduceMotion ? undefined : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.07, duration: 0.35 }}
            >
              <span className="text-[10px] text-foreground-muted">{row.label}</span>
              <span className="text-[10px] font-semibold text-foreground">{row.value}</span>
              <span className={`text-[10px] font-medium ${row.pos ? 'text-emerald-400' : 'text-red-400'}`}>{row.delta}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Mini bar chart */}
        <motion.div
          className="rounded-xl border border-border/60 bg-surface/80 p-4 flex-1 backdrop-blur-sm"
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted/60">Revenue trend</span>
            <span className="text-[10px] text-accent font-medium">+9.2% Q3</span>
          </div>
          <div className="flex items-end gap-[3px] h-20">
            {AUTH_BARS.map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t-sm"
                style={{ transformOrigin: 'bottom', backgroundColor: i % 2 === 0 ? '#6366f1' : '#8b5cf6' }}
                initial={shouldReduceMotion ? undefined : { scaleY: 0 }}
                animate={{ scaleY: h }}
                transition={{ delay: 0.65 + i * 0.05, duration: 0.5, ease: [0, 0, 0.2, 1] }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {['Jul', '', 'Aug', '', 'Sep', '', '', ''].map((l, i) => (
              <span key={i} className="flex-1 text-center text-[8px] text-foreground-muted/40">{l}</span>
            ))}
          </div>
        </motion.div>

        {/* Floating labels */}
        {!shouldReduceMotion && AUTH_LABELS.map((lbl) => (
          <motion.div
            key={lbl.text}
            className="absolute"
            style={{ left: lbl.x, top: lbl.y }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: lbl.delay, duration: 0.4 }}
          >
            <div className="rounded-md border border-accent/20 bg-accent/10 px-2 py-1 text-[9px] font-medium text-accent backdrop-blur-sm whitespace-nowrap">
              {lbl.text}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
