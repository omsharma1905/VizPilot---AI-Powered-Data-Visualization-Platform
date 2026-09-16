'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart3, ArrowRight, X } from 'lucide-react';
import { cn } from '@/src/lib/utils/cn';
import { CinematicMenu } from '@/src/components/navigation/CinematicMenu';
import { useAuth } from '@/src/lib/auth/context';
import { UserProfileMenu } from '@/src/components/navigation/UserProfileMenu';

export function Navbar() {
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <motion.header
        className={cn(
          'fixed top-0 left-0 right-0 z-[95] transition-all duration-300 pt-[env(safe-area-inset-top,0px)]',
          menuOpen
            ? 'border-b border-white/5 bg-[#08080b]/90 backdrop-blur-md py-3 sm:py-3.5'
            : scrolled
              ? 'border-b border-white/10 bg-[#08080b]/85 backdrop-blur-xl py-3 sm:py-3.5'
              : 'border-b border-transparent bg-transparent py-4 sm:py-5'
        )}
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-16 w-full">
          {/* DESKTOP HEADER (md: 768px and above) */}
          <div className="hidden md:flex items-center justify-between w-full">
            {/* LEFT ZONE */}
            <div className="flex-1 flex items-center justify-start">
              {menuOpen ? (
                <motion.div
                  key="desktop-status"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2.5 select-none"
                >
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] lg:text-xs font-mono tracking-[0.2em] text-white/60 uppercase">
                    SYSTEM ONLINE · VIZPILOT 2.0
                  </span>
                </motion.div>
              ) : (
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className="group flex items-center gap-2 sm:gap-2.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 backdrop-blur-md hover:bg-white/10 hover:border-white/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 cursor-pointer min-h-[38px]"
                  aria-label="Open menu"
                  aria-expanded={false}
                >
                  <div className="relative h-4 w-4 flex flex-col justify-center items-center gap-[3px]" aria-hidden="true">
                    <span className="h-[1.5px] w-3.5 bg-white rounded-full transition-transform" />
                    <span className="h-[1.5px] w-3.5 bg-white rounded-full transition-opacity" />
                    <span className="h-[1.5px] w-3.5 bg-white rounded-full transition-transform" />
                  </div>
                  <span className="font-mono text-[11px] font-semibold tracking-widest text-white/80 group-hover:text-white uppercase transition-colors">
                    Menu
                  </span>
                </button>
              )}
            </div>

            {/* CENTER ZONE */}
            <div className="shrink-0 flex items-center justify-center">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 sm:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-md py-1"
                aria-label="VizPilot Home"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-400/30 ring-1 ring-indigo-500/20">
                  <BarChart3 className="h-4 w-4 text-indigo-400" strokeWidth={1.75} />
                </div>
                <span className="font-display text-sm sm:text-base font-bold tracking-[0.08em] text-white">
                  VIZ<span className="text-indigo-400">PILOT</span>
                </span>
              </Link>
            </div>

            {/* RIGHT ZONE */}
            <div className="flex-1 flex items-center justify-end gap-2.5 lg:gap-3">
              {loading ? (
                <div
                  className="h-8 w-16 sm:w-20 rounded-full bg-white/5 animate-pulse border border-white/10"
                  aria-hidden="true"
                />
              ) : user ? (
                <UserProfileMenu />
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex text-xs font-mono tracking-wider text-white/60 hover:text-white transition-colors uppercase px-2 py-1"
                >
                  Sign In
                </Link>
              )}

              <Link
                href={user ? '/upload' : '/login?next=/upload'}
                onClick={() => setMenuOpen(false)}
                className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-white text-[#08080b] hover:bg-white/90 px-3.5 sm:px-4 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 shadow-md hover:shadow-indigo-500/20 min-h-[38px]"
              >
                <span>Upload</span>
                <span>Data</span>
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
              </Link>

              {menuOpen && (
                <motion.button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="group flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all text-white/80 hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 min-h-[38px] min-w-[38px] shrink-0"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4 lg:h-5 lg:w-5 transition-transform group-hover:rotate-90 duration-300" strokeWidth={1.5} />
                </motion.button>
              )}
            </div>
          </div>

          {/* MOBILE HEADER (< md: 768px) */}
          <div className="flex md:hidden items-center justify-between w-full">
            {menuOpen ? (
              <>
                {/* When open: LEFT is Logo (NO left Close button!) */}
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-md py-1"
                  aria-label="VizPilot Home"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-400/30 ring-1 ring-indigo-500/20 shrink-0">
                    <BarChart3 className="h-4 w-4 text-indigo-400" strokeWidth={1.75} />
                  </div>
                  <span className="font-display text-sm font-bold tracking-[0.08em] text-white whitespace-nowrap">
                    VIZ<span className="text-indigo-400">PILOT</span>
                  </span>
                </Link>

                {/* When open: RIGHT is Upload + Circular X */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={user ? '/upload' : '/login?next=/upload'}
                    onClick={() => setMenuOpen(false)}
                    className="group inline-flex items-center gap-1.5 rounded-full bg-white text-[#08080b] hover:bg-white/90 px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 shadow-md hover:shadow-indigo-500/20 min-h-[38px]"
                  >
                    <span>Upload</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all text-white/80 hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 min-h-[38px] min-w-[38px] shrink-0"
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4 transition-transform group-hover:rotate-90 duration-300" strokeWidth={1.5} />
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* When closed: LEFT is Hamburger */}
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className="group flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 backdrop-blur-md hover:bg-white/10 hover:border-white/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 cursor-pointer min-h-[38px]"
                  aria-label="Open menu"
                  aria-expanded={false}
                >
                  <div className="relative h-4 w-4 flex flex-col justify-center items-center gap-[3px]" aria-hidden="true">
                    <span className="h-[1.5px] w-3.5 bg-white rounded-full transition-transform" />
                    <span className="h-[1.5px] w-3.5 bg-white rounded-full transition-opacity" />
                    <span className="h-[1.5px] w-3.5 bg-white rounded-full transition-transform" />
                  </div>
                </button>

                {/* When closed: CENTER is Logo */}
                <Link
                  href="/"
                  className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-md py-1"
                  aria-label="VizPilot Home"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-400/30 ring-1 ring-indigo-500/20 shrink-0">
                    <BarChart3 className="h-4 w-4 text-indigo-400" strokeWidth={1.75} />
                  </div>
                  <span className="font-display text-sm font-bold tracking-[0.08em] text-white whitespace-nowrap">
                    VIZ<span className="text-indigo-400">PILOT</span>
                  </span>
                </Link>

                {/* When closed: RIGHT is User Profile (if auth) + Upload */}
                <div className="flex items-center gap-2 shrink-0">
                  {loading ? (
                    <div className="h-7 w-7 rounded-full bg-white/5 animate-pulse border border-white/10" aria-hidden="true" />
                  ) : user ? (
                    <UserProfileMenu />
                  ) : null}
                  <Link
                    href={user ? '/upload' : '/login?next=/upload'}
                    className="group inline-flex items-center gap-1.5 rounded-full bg-white text-[#08080b] hover:bg-white/90 px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 shadow-md hover:shadow-indigo-500/20 min-h-[38px]"
                  >
                    <span>Upload</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Fullscreen Overlay Menu with Proper Animation Lifecycle */}
      <CinematicMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
