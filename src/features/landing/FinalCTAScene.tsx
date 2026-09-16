'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUp, BarChart3, Mail } from 'lucide-react';
import { ParallaxText } from '@/src/components/cinematic/ParallaxText';
import { useAuth } from '@/src/lib/auth/context';

export function FinalCTAScene() {
  const reduced = useReducedMotion();
  const { user } = useAuth();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#07070a] text-white pt-16 sm:pt-20 md:pt-24 pb-10 sm:pb-12 overflow-hidden border-t border-white/10" aria-label="Footer and CTA">
      
      {/* ── Top CTA Unit ── */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-16 mb-16 sm:mb-20 md:mb-24 text-center">
        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <span className="font-mono text-xs font-bold tracking-[0.25em] text-indigo-400 uppercase mb-2 sm:mb-3 block">
            GET STARTED TODAY
          </span>
          <h2 className="font-display text-[clamp(2.15rem,5.5vw,4.8rem)] font-extrabold uppercase tracking-tight text-white mb-4 sm:mb-6 leading-[1.05]">
            SEE YOUR DATA<br />
            <span className="text-white/40">DIFFERENTLY.</span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-white/60 max-w-lg mx-auto mb-6 sm:mb-8 leading-relaxed">
            Turn dense spreadsheets and raw metrics into high-impact interactive stories in seconds.
          </p>

          <Link
            href={user ? '/upload' : '/login?next=/upload'}
            className="group inline-flex items-center gap-2.5 sm:gap-3 rounded-full bg-white text-[#08080b] hover:bg-white/90 px-7 sm:px-9 py-3.5 sm:py-4 text-xs md:text-sm font-bold tracking-widest uppercase transition-all duration-300 shadow-2xl hover:shadow-indigo-500/25 active:scale-[0.98] cursor-pointer min-h-[44px]"
          >
            <span>Launch Workspace</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.2} />
          </Link>
        </motion.div>
      </div>

      {/* ── Footer Navigation Columns ── */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-16 pt-12 sm:pt-16 border-t border-white/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 sm:gap-10">

          {/* Left Brand Summary */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-400/30">
                <BarChart3 className="h-4 w-4 text-indigo-400" strokeWidth={1.75} />
              </div>
              <span className="font-display text-base font-bold tracking-wider text-white">
                VIZ<span className="text-indigo-400">PILOT</span>
              </span>
            </div>
            <p className="text-xs text-white/50 max-w-sm leading-relaxed font-mono">
              Not just charts — an autonomous pipeline for discovering the visual story inside raw business intelligence data.
            </p>
            <div className="pt-2 flex items-center gap-3 text-white/40 text-xs font-mono">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>PRODUCTION RELEASE · V2.4</span>
            </div>
          </div>

          {/* Quick Links with Hover Motion */}
          <div>
            <p className="font-mono text-xs font-bold tracking-widest text-rose-400 uppercase mb-4">
              QUICK LINKS
            </p>
            <ul className="space-y-2.5 text-xs font-mono text-white/60">
              <li><a href="/#how-it-works" className="inline-block hover:text-white hover:translate-x-1 transition-all duration-200">WORKFLOW</a></li>
              <li><a href="/#recommendation" className="inline-block hover:text-white hover:translate-x-1 transition-all duration-200">INTELLIGENCE</a></li>
              <li><a href="/#privacy" className="inline-block hover:text-white hover:translate-x-1 transition-all duration-200">ZERO-TRACE</a></li>
              <li><Link href="/dashboard" className="inline-block hover:text-white hover:translate-x-1 transition-all duration-200">DASHBOARD</Link></li>
            </ul>
          </div>

          {/* Capabilities */}
          <div>
            <p className="font-mono text-xs font-bold tracking-widest text-rose-400 uppercase mb-4">
              CAPABILITIES
            </p>
            <ul className="space-y-2.5 text-xs font-mono text-white/60">
              <li><span className="text-white/40">ECHART ENGINE</span></li>
              <li><span className="text-white/40">CARDINALITY FIT</span></li>
              <li><span className="text-white/40">EPHEMERAL RUN</span></li>
              <li><span className="text-white/40">MULTI-MODAL INGEST</span></li>
            </ul>
          </div>

          {/* Work With Us */}
          <div className="space-y-6">
            <div>
              <p className="font-mono text-xs font-bold tracking-widest text-rose-400 uppercase mb-2">
                WORK WITH US
              </p>
              <a
                href="mailto:hello@vizpilot.ai"
                className="font-mono text-sm font-bold text-white hover:text-indigo-400 transition-colors block underline underline-offset-4"
              >
                hello@vizpilot.ai
              </a>
            </div>

            <div>
              <p className="font-mono text-xs font-bold tracking-widest text-rose-400 uppercase mb-1">
                ENGINE STATUS
              </p>
              <p className="text-xs font-mono text-white/50">
                Global Distributed Edge<br />Latency &lt; 40ms
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Massive Edge-to-Edge Moving Typography in Footer (Reference 3) ── */}
      <div className="relative w-full overflow-hidden select-none mt-16 mb-4">
        <div className="pointer-events-none opacity-40">
          <ParallaxText direction="ltr" duration={56} outline={true}>
            VIZPILOT · INTELLIGENCE · NARRATIVE
          </ParallaxText>
        </div>

        {/* Circular "BACK TO TOP" Button Centered Over Watermark (Reference 3) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
          <button
            onClick={scrollToTop}
            className="group flex flex-col items-center justify-center h-20 w-20 md:h-24 md:w-24 rounded-full border border-white/20 bg-[#07070a]/90 backdrop-blur-md hover:border-indigo-400/60 hover:bg-white/[0.04] hover:shadow-[0_0_30px_rgba(99,102,241,0.25)] transition-all duration-300 text-white shadow-xl cursor-pointer active:scale-[0.97]"
            aria-label="Back to top of page"
          >
            <ArrowUp className="h-4 w-4 text-white/60 group-hover:text-indigo-300 group-hover:-translate-y-1.5 transition-all duration-300 mb-1" />
            <span className="font-mono text-[9px] font-bold tracking-widest uppercase text-white/70 group-hover:text-white transition-colors">
              BACK TO TOP
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Copyright & Legal Strip */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8 lg:px-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/40">
        <p>© {new Date().getFullYear()} VIZPILOT INTELLIGENCE. ALL RIGHTS RESERVED.</p>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="hover:text-white transition-colors">PRIVACY POLICY</Link>
          <Link href="/terms" className="hover:text-white transition-colors">TERMS OF SERVICE</Link>
        </div>
      </div>
    </footer>
  );
}
