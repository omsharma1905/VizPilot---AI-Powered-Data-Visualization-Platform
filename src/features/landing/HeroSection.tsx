'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronDown, Database } from 'lucide-react';
import { CinematicHeroBackground } from '@/src/features/landing/CinematicHeroBackground';
import { ParallaxText } from '@/src/components/cinematic/ParallaxText';
import { HeroLiveIntelligence } from '@/src/features/landing/HeroLiveIntelligence';
import { isIntroComplete, INTRO_COMPLETE_EVENT } from '@/src/components/cinematic/IntroAnimation';
import { useAuth } from '@/src/lib/auth/context';

export function HeroSection() {
  const reduced = useReducedMotion();
  const { user } = useAuth();
  const [introReady, setIntroReady] = useState(false);

  useEffect(() => {
    if (isIntroComplete() || reduced) {
      setIntroReady(true);
      return;
    }

    const onIntroComplete = () => setIntroReady(true);
    window.addEventListener(INTRO_COMPLETE_EVENT, onIntroComplete);

    // Fallback timer: ensure hero reveals within 1.8s even if event is missed
    const fallbackTimer = setTimeout(() => setIntroReady(true), 1800);

    return () => {
      window.removeEventListener(INTRO_COMPLETE_EVENT, onIntroComplete);
      clearTimeout(fallbackTimer);
    };
  }, [reduced]);

  return (
    <section className="relative min-h-[calc(100dvh-5rem)] lg:min-h-[92vh] flex flex-col justify-between pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-12 overflow-hidden" aria-label="Hero">
      {/* Background Visual (Flow Stream Canvas) */}
      <CinematicHeroBackground />

      {/* Oversized background parallax watermark */}
      <div className="absolute top-[18%] left-0 right-0 z-0 pointer-events-none">
        <ParallaxText direction="ltr" duration={48} outline={true}>
          DATA INTELLIGENCE
        </ParallaxText>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-16 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* ── Left Column: Headline, Narrative & CTAs ── */}
          <div className="lg:col-span-7 xl:col-span-7 max-w-2xl">

            {/* 1. Tagline Eyebrow Badge */}
            <motion.div
              initial={reduced ? undefined : { opacity: 0, y: 14, filter: 'blur(4px)' }}
              animate={introReady ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 14, filter: 'blur(4px)' }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-500/10 px-3.5 py-1.5 backdrop-blur-md"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="font-mono text-xs font-semibold tracking-[0.2em] text-indigo-300 uppercase">
                The VizPilot Engine
              </span>
            </motion.div>

            {/* 2. Headline: "YOUR DATA. HAS A STORY." with fluid clamp */}
            <motion.div
              initial={reduced ? undefined : { opacity: 0, y: 22, filter: 'blur(6px)' }}
              animate={introReady ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 22, filter: 'blur(6px)' }}
              transition={{ delay: 0.22, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="font-display font-extrabold uppercase text-[clamp(2.35rem,6.6vw,5.25rem)] leading-[0.93] tracking-[-0.04em] text-white">
                YOUR DATA.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-rose-400 to-amber-300">
                  HAS A STORY.
                </span>
              </h1>
            </motion.div>

            {/* 3. Subtitle & Story Narrative */}
            <motion.div
              initial={reduced ? undefined : { opacity: 0, y: 14, filter: 'blur(4px)' }}
              animate={introReady ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 14, filter: 'blur(4px)' }}
              transition={{ delay: 0.35, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 sm:mt-6 max-w-xl"
            >
              <p className="font-mono text-xs md:text-sm font-semibold tracking-[0.16em] text-white/90 uppercase mb-1.5 sm:mb-2">
                Your Numbers. Your Story. Cinematic Clarity.
              </p>
              <p className="text-xs sm:text-sm md:text-base text-white/65 leading-relaxed">
                Upload raw business files — CSV, XLSX, PDF, or DOCX. VizPilot understands dataset semantics, recommends the optimal visualization, and generates an interactive dashboard.
              </p>
            </motion.div>

            {/* 4. Action CTAs */}
            <motion.div
              initial={reduced ? undefined : { opacity: 0, y: 18 }}
              animate={introReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
              transition={{ delay: 0.48, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4"
            >
              <Link
                href={user ? '/upload' : '/login?next=/upload'}
                className="group inline-flex items-center gap-2.5 sm:gap-3 rounded-full bg-white text-[#08080b] hover:bg-white/95 px-6 sm:px-8 py-3 sm:py-3.5 text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-300 shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/25 active:scale-[0.98] cursor-pointer"
              >
                <span>Upload Your Data</span>
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.2} />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold tracking-wider text-white uppercase transition-all backdrop-blur-md active:scale-[0.98]"
              >
                <span>Explore Process</span>
              </a>
            </motion.div>

            {/* 5. Desktop Supported Format Metadata Row (Hidden on mobile/tablet, shown on lg) */}
            <motion.div
              initial={reduced ? undefined : { opacity: 0 }}
              animate={introReady ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="mt-8 sm:mt-10 hidden lg:flex items-center gap-3 flex-wrap text-xs text-white/40 font-mono tracking-widest uppercase"
            >
              <span className="flex items-center gap-1.5 text-white/60">
                <Database className="h-3.5 w-3.5 text-indigo-400" /> Formats:
              </span>
              {['CSV', 'XLSX', 'PDF', 'DOCX'].map((fmt) => (
                <span key={fmt} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                  {fmt}
                </span>
              ))}
              <span className="text-white/30">·</span>
              <span className="text-white/50 text-[11px]">Up to 50MB</span>
            </motion.div>
          </div>

          {/* ── Right Column: 6. Live Intelligence Visual (4th in mobile hierarchy) ── */}
          <motion.div
            initial={reduced ? undefined : { opacity: 0, scale: 0.96 }}
            animate={introReady ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 xl:col-span-5 w-full mt-4 sm:mt-6 lg:mt-0"
          >
            <HeroLiveIntelligence />
          </motion.div>

          {/* ── Mobile/Tablet Supported Formats (5th in mobile hierarchy, below live intelligence) ── */}
          <motion.div
            initial={reduced ? undefined : { opacity: 0 }}
            animate={introReady ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="flex lg:hidden items-center justify-center gap-2.5 flex-wrap text-[11px] text-white/40 font-mono tracking-wider uppercase pt-2"
          >
            <span className="flex items-center gap-1 text-white/60">
              <Database className="h-3 w-3 text-indigo-400" /> Formats:
            </span>
            {['CSV', 'XLSX', 'PDF', 'DOCX'].map((fmt) => (
              <span key={fmt} className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/70">
                {fmt}
              </span>
            ))}
            <span className="text-white/30">·</span>
            <span className="text-white/50 text-[10px]">Up to 50MB</span>
          </motion.div>

        </div>
      </div>

      {/* Bottom Explore Anchor */}
      <motion.div
        initial={reduced ? undefined : { opacity: 0 }}
        animate={introReady ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.75, duration: 0.5 }}
        className="relative z-10 mx-auto pt-6 sm:pt-8 flex flex-col items-center"
      >
        <a
          href="#how-it-works"
          className="group flex flex-col items-center gap-1 text-[10px] font-mono tracking-[0.25em] text-white/40 hover:text-white transition-colors uppercase py-2"
          aria-label="Scroll down to explore process"
        >
          <span>Explore</span>
          <ChevronDown className="h-4 w-4 animate-bounce text-white/50 group-hover:text-white transition-colors" />
        </a>
      </motion.div>
    </section>
  );
}
