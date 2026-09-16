'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { UploadCloud, Cpu, Sparkles, LayoutDashboard, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ParallaxText } from '@/src/components/cinematic/ParallaxText';
import { cn } from '@/src/lib/utils/cn';

const STEPS = [
  {
    step: '01',
    title: 'UPLOAD DATA',
    tagline: 'Raw records ingested',
    description: 'Drop your CSV, XLSX, PDF, or DOCX. Fast in-memory parsing with zero workspace retention in Zero-Trace mode.',
    icon: UploadCloud,
    preview: {
      type: 'Raw Fields',
      items: ['Date [YYYY-MM-DD]', 'Revenue [$ USD]', 'Region [Category]', 'Expenses [$ USD]'],
    },
  },
  {
    step: '02',
    title: 'UNDERSTAND',
    tagline: 'Semantic classification',
    description: 'VizPilot detects field types, temporal rhythms, continuous measures, and categorical dimensions automatically.',
    icon: Cpu,
    preview: {
      type: 'Detected Types',
      items: ['Date → TIME', 'Revenue → MEASURE', 'Region → DIMENSION', 'Expenses → MEASURE'],
    },
  },
  {
    step: '03',
    title: 'RECOMMEND',
    tagline: 'Confidence scoring',
    description: 'Evaluates distribution shapes, variance, and cardinality to surface the single best visualization with mathematical confidence.',
    icon: Sparkles,
    preview: {
      type: 'Evaluated Models',
      items: ['Bar Chart (92% Match)', 'Line Trend (87% Match)', 'Area Chart (74% Match)'],
    },
  },
  {
    step: '04',
    title: 'VISUALIZE',
    tagline: 'Interactive dashboard',
    description: 'Instant reactive ECharts dashboard ready to explore, toggle alternative charts, or export.',
    icon: LayoutDashboard,
    preview: {
      type: 'Generated Output',
      items: ['Interactive Axis Zoom', 'Hover Data Tooltip', 'Zero-Trace Protection'],
    },
  },
];

export function HowItWorksScene() {
  const [activeTab, setActiveTab] = useState(0);
  const reduced = useReducedMotion();

  // Passive viewport scroll-activation
  useEffect(() => {
    const section = document.getElementById('how-it-works');
    if (!section || reduced) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const rect = section.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const totalDistance = rect.height;
          // Normalized progress as section passes through viewport focal area
          const progress = (windowHeight * 0.65 - rect.top) / totalDistance;

          if (progress >= 0 && progress <= 1.1) {
            if (progress < 0.28) {
              setActiveTab(0);
            } else if (progress < 0.52) {
              setActiveTab(1);
            } else if (progress < 0.78) {
              setActiveTab(2);
            } else {
              setActiveTab(3);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [reduced]);

  return (
    <section
      id="how-it-works"
      className="relative py-20 sm:py-28 md:py-36 bg-[#f7f6f4] text-[#0a0a0d] overflow-hidden"
      aria-label="How VizPilot Works"
    >
      {/* Huge Oversized Continuous Depth Background Typography */}
      <div className="absolute top-[8%] left-0 right-0 z-0 opacity-60 pointer-events-none">
        <ParallaxText direction="rtl" duration={50} outline={false} className="text-black/[0.04]">
          PROCESS · 01 · 02 · 03 · 04 · WORKFLOW
        </ParallaxText>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-16">

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 md:mb-24">
          <motion.p
            initial={reduced ? undefined : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-mono text-xs font-bold tracking-[0.25em] text-rose-500 uppercase mb-2"
          >
            THE ARCHITECTURE
          </motion.p>
          <motion.h2
            initial={reduced ? undefined : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-[clamp(2.1rem,5vw,3.75rem)] font-extrabold tracking-tight uppercase text-[#0a0a0d] leading-[1.05]"
          >
            HOW IT <span className="text-[#0a0a0d]/40">WORKS</span>
          </motion.h2>
          <motion.p
            initial={reduced ? undefined : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-[#0a0a0d]/60 leading-relaxed"
          >
            From unformatted business records to a decision-grade interactive dashboard in four autonomous steps.
          </motion.p>
        </div>

        {/* ── 4 Floating Process Cards with Progressive Scroll Activation ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative">
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === index;
            const isPassed = activeTab > index;

            return (
              <motion.div
                key={item.step}
                initial={reduced ? undefined : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => setActiveTab(index)}
                className={cn(
                  'relative flex flex-col justify-between rounded-2xl bg-white p-5 sm:p-7 md:p-8 cursor-pointer transition-all duration-300',
                  'border shadow-[0_10px_30px_rgba(0,0,0,0.04)]',
                  isActive
                    ? 'border-indigo-500/80 ring-2 ring-indigo-500/60 shadow-[0_20px_50px_rgba(99,102,241,0.18)] -translate-y-1 sm:-translate-y-2'
                    : isPassed
                    ? 'border-emerald-500/40 shadow-[0_12px_35px_rgba(0,0,0,0.06)]'
                    : 'border-black/[0.06] hover:border-black/20 hover:-translate-y-1'
                )}
              >
                {/* Connecting arrow for desktop between cards */}
                {index < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <div className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition-all duration-300',
                      isPassed || isActive
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-500/20'
                        : 'bg-white border-black/10 text-black/40'
                    )}>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                )}

                <div>
                  {/* Icon badge */}
                  <div className={cn(
                    'mb-6 flex h-13 w-13 items-center justify-center rounded-2xl transition-all duration-300 shadow-md',
                    isActive ? 'bg-indigo-600 text-white scale-105' : 'bg-[#0a0a0d] text-white'
                  )}>
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>

                  {/* Step Numeral + Title */}
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className={cn(
                      'font-display text-lg font-bold tracking-tight transition-colors',
                      isActive ? 'text-indigo-950' : 'text-[#0a0a0d]'
                    )}>
                      {item.title}
                    </h3>
                    <span className={cn(
                      'font-mono text-xs font-bold tracking-wider transition-colors',
                      isActive ? 'text-indigo-600' : 'text-rose-500'
                    )}>
                      {item.step}
                    </span>
                  </div>

                  <p className="text-xs font-mono uppercase tracking-wider text-[#0a0a0d]/50 mb-3">
                    {item.tagline}
                  </p>

                  <p className="text-xs md:text-sm text-[#0a0a0d]/65 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Micro-preview drawer inside each card */}
                <div className="mt-6 pt-5 border-t border-black/[0.06]">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#0a0a0d]/40 mb-2">
                    <span>{item.preview.type}</span>
                    <CheckCircle2 className={cn(
                      'h-3.5 w-3.5 transition-colors',
                      isActive || isPassed ? 'text-emerald-500' : 'text-black/20'
                    )} />
                  </div>
                  <div className="space-y-1">
                    {item.preview.items.slice(0, 2).map((previewItem) => (
                      <div
                        key={previewItem}
                        className={cn(
                          'rounded px-2 py-1 text-[11px] font-mono truncate transition-colors',
                          isActive ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'bg-[#0a0a0d]/[0.03] text-[#0a0a0d]/75'
                        )}
                      >
                        {previewItem}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
