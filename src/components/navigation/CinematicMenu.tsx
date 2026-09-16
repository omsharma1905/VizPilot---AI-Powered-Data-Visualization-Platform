'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ArrowUpRight, Mail, Activity, LogOut } from 'lucide-react';
import { useAuth } from '@/src/lib/auth/context';

interface CinematicMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { label: 'HOME', href: '/', subtitle: 'Overview & Narrative' },
  { label: 'PROCESS', href: '/#how-it-works', subtitle: '4-Stage Transformation' },
  { label: 'INTELLIGENCE', href: '/#recommendation', subtitle: 'Morphing Chart Engine' },
  { label: 'ZERO-TRACE', href: '/#privacy', subtitle: 'Ephemeral Privacy Theatre' },
  { label: 'WORKSPACE', href: '/upload', subtitle: 'Upload Dataset & Analyze' },
  { label: 'DASHBOARD', href: '/dashboard', subtitle: 'Live Multi-Chart View' },
];

// Fullscreen Curtain Variants: enters before children, exits after children
const curtainVariants: Variants = {
  hidden: {
    opacity: 0,
    clipPath: 'inset(0% 0% 100% 0%)',
    transition: {
      duration: 0.45,
      ease: [0.32, 0, 0.67, 0],
      when: 'afterChildren',
    },
  },
  visible: {
    opacity: 1,
    clipPath: 'inset(0% 0% 0% 0%)',
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1],
      when: 'beforeChildren',
    },
  },
};

// Sequential Nav Item Variants
const navContainerVariants: Variants = {
  hidden: {
    transition: {
      staggerChildren: 0.035,
      staggerDirection: -1,
    },
  },
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const navItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -24,
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 1, 1],
    },
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function CinematicMenu({ isOpen, onClose }: CinematicMenuProps) {
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      // Prevent background scrolling without causing layout jump
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.paddingRight = '';
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="cinematic-menu-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Site Navigation Menu"
          variants={curtainVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-[90] flex flex-col justify-between bg-[#08080b] text-white px-5 sm:px-10 md:px-16 lg:px-24 py-6 sm:py-8 md:py-12 overflow-y-auto overflow-x-hidden select-none pt-[calc(env(safe-area-inset-top,0px)+4.75rem)] sm:pt-[calc(env(safe-area-inset-top,0px)+5.5rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]"
        >
          {/* Giant background watermark on right side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-none absolute right-[-5%] top-[10%] select-none font-display font-black text-white/[0.035] leading-none text-[clamp(6rem,22vw,18rem)]"
            aria-hidden="true"
          >
            VIZ
          </motion.div>

          {/* Mobile-only System Status Row (placed right below header clearance) */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="md:hidden flex items-center gap-2.5 pb-5 pt-1 select-none z-10"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-[0.2em] text-white/50 uppercase">
              SYSTEM ONLINE · VIZPILOT 2.0
            </span>
          </motion.div>

          {/* Main Sequential Navigation Items */}
          <motion.nav
            variants={navContainerVariants}
            className="my-auto z-10 flex flex-col gap-1 sm:gap-2 md:gap-3 max-w-2xl py-3 sm:py-6"
            aria-label="Main menu links"
          >
            {MENU_ITEMS.map((item, index) => {
              const targetHref = item.href === '/upload' && !user ? '/login?next=/upload' : item.href;
              return (
                <motion.div key={item.label} variants={navItemVariants}>
                  <Link
                    href={targetHref}
                    onClick={onClose}
                    className="group flex items-baseline gap-3 sm:gap-4 py-1 sm:py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg"
                  >
                  <span className="text-[11px] sm:text-xs font-mono text-white/30 tracking-widest group-hover:text-indigo-400 transition-colors">
                    0{index + 1}
                  </span>
                  <span className="font-display text-[clamp(1.85rem,5.2vw,4.5rem)] font-bold tracking-tight text-white/90 group-hover:text-white group-hover:translate-x-2 sm:group-hover:translate-x-3 transition-all duration-300 leading-tight">
                    {item.label}
                  </span>
                  <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6 text-white/20 group-hover:text-indigo-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all opacity-0 group-hover:opacity-100 hidden sm:inline" />
                </Link>
              </motion.div>
              );
            })}
          </motion.nav>

          {/* Bottom Metadata & Contact Bar */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 border-t border-white/10 pt-6 text-xs text-white/40 font-mono mt-8"
          >
            {/* Bottom-Left Links */}
            <div className="flex flex-col gap-2">
              {loading ? (
                <div className="h-6 w-36 rounded bg-white/5 animate-pulse" aria-hidden="true" />
              ) : user ? (
                <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
                  <Link
                    href="/profile"
                    onClick={onClose}
                    className="text-white/80 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-white font-bold">{user.name}</span>
                    <span className="text-white/40 font-mono text-[11px]">({user.email})</span>
                  </Link>
                  <Link
                    href="/profile"
                    onClick={onClose}
                    className="text-indigo-400 hover:text-indigo-300 uppercase tracking-wider text-xs font-bold transition-colors"
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      onClose();
                      await logout();
                    }}
                    className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 uppercase tracking-widest text-xs font-bold transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3 w-3" />
                    <span>Log Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-6 tracking-widest uppercase">
                  <a href="/#how-it-works" onClick={onClose} className="hover:text-white transition-colors">Architecture</a>
                  <a href="/#privacy" onClick={onClose} className="hover:text-white transition-colors">Zero-Trace</a>
                  <Link href="/login" onClick={onClose} className="hover:text-white transition-colors">Sign In</Link>
                  <Link href="/signup" onClick={onClose} className="hover:text-indigo-400 transition-colors">Register</Link>
                </div>
              )}
              <p className="text-[11px] text-white/25">
                © {new Date().getFullYear()} VIZPILOT INTELLIGENCE. ALL RIGHTS RESERVED.
              </p>
            </div>

            {/* Bottom-Right Contact & Telemetry */}
            <div className="flex flex-col sm:items-end gap-1.5">
              <a
                href="mailto:hello@vizpilot.ai"
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
              >
                <Mail className="h-3.5 w-3.5 text-indigo-400" />
                <span>hello@vizpilot.ai</span>
              </a>
              <div className="flex items-center gap-2 text-[11px] text-white/30">
                <Activity className="h-3 w-3 text-emerald-400" />
                <span>EPHEMERAL RUNTIME READY</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
