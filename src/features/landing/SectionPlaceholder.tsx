'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/src/lib/utils/cn';
import { fadeUp } from '@/src/lib/motion/variants';

// ─── Section metadata ─────────────────────────────────────────────────────────

export interface SectionPlaceholderProps {
  id?: string;
  label: string;
  headline: string;
  description: string;
  accentColor?: 'accent' | 'emerald' | 'amber' | 'rose';
  tag?: string;
  className?: string;
  children?: React.ReactNode;
}

// ─── SectionPlaceholder ───────────────────────────────────────────────────────

export function SectionPlaceholder({
  id,
  label,
  headline,
  description,
  accentColor = 'accent',
  tag,
  className,
  children,
}: SectionPlaceholderProps) {
  const shouldReduceMotion = useReducedMotion();

  const colorMap = {
    accent: 'text-accent border-accent/20 bg-accent/6',
    emerald: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/6',
    amber: 'text-amber-400 border-amber-400/20 bg-amber-400/6',
    rose: 'text-rose-400 border-rose-400/20 bg-rose-400/6',
  };

  const dotColorMap = {
    accent: 'bg-accent',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
  };

  return (
    <section
      id={id}
      className={cn('py-24 md:py-32 border-t border-border/40', className)}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <motion.div
          className="max-w-2xl"
          variants={shouldReduceMotion ? undefined : fadeUp}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          {/* Section tag */}
          <div className="mb-6 inline-flex items-center gap-2">
            <div
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
                colorMap[accentColor]
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', dotColorMap[accentColor])} />
              {tag ?? label}
            </div>
          </div>

          <h2 className="mb-4 text-3xl md:text-4xl font-semibold tracking-[-0.025em] text-foreground leading-tight">
            {headline}
          </h2>
          <p className="text-base md:text-lg text-foreground-muted leading-relaxed">
            {description}
          </p>
        </motion.div>

        {/* Placeholder content area */}
        {children ? (
          <div className="mt-16">{children}</div>
        ) : (
          <motion.div
            className="mt-16 h-64 md:h-80 rounded-2xl border border-dashed border-border/60 bg-surface/40 flex items-center justify-center"
            variants={shouldReduceMotion ? undefined : fadeUp}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            whileInView="visible"
            viewport={{ once: true, margin: '-10%' }}
            transition={{ delay: 0.15 }}
          >
            <div className="text-center">
              <p className="text-sm font-medium text-foreground-muted">
                {label}
              </p>
              <p className="mt-1 text-xs text-foreground-muted/50">
                Content coming in Phase 1B
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
