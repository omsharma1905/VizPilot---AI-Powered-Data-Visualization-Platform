import type { Variants } from 'framer-motion';

// ─── Easing Curves ────────────────────────────────────────────────────────────

export const easings = {
  smooth: [0.25, 0.1, 0.25, 1.0] as [number, number, number, number],
  out: [0.0, 0.0, 0.2, 1.0] as [number, number, number, number],
  in: [0.4, 0.0, 1.0, 1.0] as [number, number, number, number],
  inOut: [0.4, 0.0, 0.2, 1.0] as [number, number, number, number],
  spring: [0.34, 1.56, 0.64, 1.0] as [number, number, number, number],
};

// ─── Duration Presets ─────────────────────────────────────────────────────────

export const durations = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  slower: 0.6,
  reveal: 0.8,
};

// ─── Transition Presets ───────────────────────────────────────────────────────

export const transitions = {
  fast: { duration: durations.fast, ease: easings.out },
  normal: { duration: durations.normal, ease: easings.out },
  slow: { duration: durations.slow, ease: easings.out },
  reveal: { duration: durations.reveal, ease: easings.out },
  spring: { type: 'spring' as const, stiffness: 300, damping: 30 },
};

// ─── Core Variants ────────────────────────────────────────────────────────────

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.slow, ease: easings.out },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.slow, ease: easings.out },
  },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.slow, ease: easings.out },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: durations.slow, ease: easings.out },
  },
};

export const blurReveal: Variants = {
  hidden: { opacity: 0, filter: 'blur(8px)', y: 12 },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: { duration: durations.reveal, ease: easings.out },
  },
};

export const slideReveal: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: durations.slow, ease: easings.out },
  },
};

// ─── Stagger Containers ───────────────────────────────────────────────────────

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.2,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.slow, ease: easings.out },
  },
};

// ─── Navbar Variants ──────────────────────────────────────────────────────────

export const navbarVariants: Variants = {
  top: {
    backgroundColor: 'rgba(10, 10, 14, 0)',
    borderBottomColor: 'rgba(255, 255, 255, 0)',
    backdropFilter: 'blur(0px)',
  },
  scrolled: {
    backgroundColor: 'rgba(10, 10, 14, 0.8)',
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backdropFilter: 'blur(20px)',
  },
};
