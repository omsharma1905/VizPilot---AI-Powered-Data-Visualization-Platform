'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// Module-level guard: persists across client-side SPA navigation, resets on browser refresh / new page load
let hasPlayedInClientSession = false;

export const INTRO_COMPLETE_EVENT = 'vizpilot:intro-complete';

export function isIntroComplete(): boolean {
  return hasPlayedInClientSession;
}

export function IntroAnimation() {
  const [visible, setVisible] = useState(false);
  const [hasStartedTransitionOut, setHasStartedTransitionOut] = useState(false);
  const reduced = useReducedMotion();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDismiss = useCallback(() => {
    if (hasStartedTransitionOut) return;
    setHasStartedTransitionOut(true);

    // Notify listeners (e.g. HeroSection) that the intro is dissolving so homepage elements cascade in
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(INTRO_COMPLETE_EVENT));
    }

    // Allow exit animation to complete before unmounting
    setVisible(false);
    hasPlayedInClientSession = true;
  }, [hasStartedTransitionOut]);

  useEffect(() => {
    // If already played in this page session, do not replay (e.g., internal route transitions)
    if (hasPlayedInClientSession) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(INTRO_COMPLETE_EVENT));
      }
      return;
    }

    if (reduced) {
      hasPlayedInClientSession = true;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(INTRO_COMPLETE_EVENT));
      }
      return;
    }

    // Begin signature intro sequence
    setVisible(true);

    // Lock page scroll during intro
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Sequence duration: ~1.45s before transitioning out
    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, 1450);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.body.style.overflow = originalOverflow;
    };
  }, [handleDismiss, reduced]);

  // Clean up scroll lock when visible toggles off
  useEffect(() => {
    if (!visible) {
      document.body.style.overflow = '';
    }
  }, [visible]);

  // Keyboard shortcut to skip (Escape, Space, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleDismiss();
      }
    };

    if (visible) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, handleDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="vizpilot-signature-intro"
          role="region"
          aria-label="VizPilot Engine Initialization"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#070709] select-none cursor-pointer overflow-hidden"
          onClick={handleDismiss}
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.025,
            filter: 'blur(10px)',
            transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
          }}
        >
          {/* ── Atmospheric Ambient Radial Glow ── */}
          <div
            className="pointer-events-none absolute h-[380px] w-[380px] sm:h-[480px] sm:w-[480px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.14)_0%,rgba(244,63,94,0.06)_45%,transparent_75%)] blur-[90px]"
            aria-hidden="true"
          />

          {/* ── Top-Left HUD Telemetry ── */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="pointer-events-none absolute top-4 sm:top-6 md:top-8 left-4 sm:left-6 md:left-10 flex flex-col gap-1 font-mono text-[9px] sm:text-[10px] tracking-[0.22em] text-white/30 uppercase"
            aria-hidden="true"
          >
            <span className="flex items-center gap-1.5 text-white/50">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              VIZPILOT KERNEL // 01
            </span>
            <span>DATAFLOW: INITIALIZED</span>
          </motion.div>

          {/* ── Top-Right HUD Telemetry ── */}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="pointer-events-none absolute top-4 sm:top-6 md:top-8 right-4 sm:right-6 md:right-10 flex flex-col items-end gap-1 font-mono text-[9px] sm:text-[10px] tracking-[0.22em] text-white/30 uppercase"
            aria-hidden="true"
          >
            <span className="text-white/50">ZERO-TRACE ARCHITECTURE</span>
            <span className="text-emerald-400/70">LATENCY: 12ms</span>
          </motion.div>

          {/* ── Centered Branding Reveal ── */}
          <div className="relative z-10 flex flex-col items-center px-4">

            {/* Stage 2: Center Glowing Squircle Emblem */}
            <motion.div
              className="relative mb-5 sm:mb-6 flex h-18 w-18 sm:h-22 sm:w-22 items-center justify-center rounded-2xl sm:rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-xl shadow-[0_0_50px_rgba(99,102,241,0.25)]"
              initial={{ scale: 0.9, opacity: 0, filter: 'blur(8px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Dynamic 3-Bar Analytics Glyph */}
              <div className="flex items-end gap-1.5 h-8">
                <motion.span
                  className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-indigo-300"
                  initial={{ height: 4 }}
                  animate={{ height: 16 }}
                  transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                />
                <motion.span
                  className="w-1.5 rounded-full bg-gradient-to-t from-rose-500 via-indigo-400 to-white"
                  initial={{ height: 4 }}
                  animate={{ height: 28 }}
                  transition={{ delay: 0.25, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                />
                <motion.span
                  className="w-1.5 rounded-full bg-gradient-to-t from-amber-400 to-rose-400"
                  initial={{ height: 4 }}
                  animate={{ height: 20 }}
                  transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              {/* Resonant Radar Wave Pulse */}
              <motion.div
                className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-indigo-400/40"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: [0, 0.8, 0], scale: [0.95, 1.25, 1.4] }}
                transition={{ duration: 1.4, ease: 'easeOut', repeat: Infinity }}
              />
            </motion.div>

            {/* Stage 2 & 4: VIZPILOT Wordmark + Signature Horizontal Beam Sweep */}
            <div className="relative overflow-hidden px-4 py-1">
              <motion.h1
                className="font-display text-[clamp(1.75rem,6vw,3.25rem)] font-black tracking-[0.2em] sm:tracking-[0.22em] text-white uppercase text-center"
                initial={{ opacity: 0, y: 14, filter: 'blur(8px)', scale: 0.95 }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                VIZ
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-rose-400 to-amber-300">
                  PILOT
                </span>
              </motion.h1>

              {/* Stage 4: Horizontal Analytical Beam Sweep */}
              <motion.div
                className="pointer-events-none absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-white/85 to-transparent skew-x-[-25deg] mix-blend-overlay"
                initial={{ left: '-60%', opacity: 0 }}
                animate={{ left: '160%', opacity: [0, 1, 1, 0] }}
                transition={{ delay: 0.6, duration: 0.75, ease: [0.25, 0.1, 0.25, 1] }}
                aria-hidden="true"
              />
            </div>

            {/* Stage 3: Editorial Data Intelligence Status */}
            <motion.div
              className="mt-3.5 sm:mt-4 flex items-center gap-2 sm:gap-2.5 rounded-full border border-white/10 bg-white/5 px-3 sm:px-3.5 py-1 backdrop-blur-md"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="font-mono text-[9px] sm:text-[11px] font-medium tracking-[0.2em] sm:tracking-[0.24em] text-white/70 uppercase">
                RAW DATA → CINEMATIC INSIGHT
              </span>
            </motion.div>
          </div>

          {/* ── Bottom Skip Prompt ── */}
          <motion.div
            className="absolute bottom-6 sm:bottom-8 md:bottom-10 flex items-center justify-center p-2 font-mono text-[10px] tracking-[0.22em] text-white/25 uppercase hover:text-white/60 transition-colors cursor-pointer min-h-[44px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.4 }}
          >
            <span>Click or press ESC to skip</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
