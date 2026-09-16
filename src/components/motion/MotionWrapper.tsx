'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { fadeUp } from '@/src/lib/motion/variants';

interface MotionWrapperProps {
  children: React.ReactNode;
  variants?: Variants;
  delay?: number;
  className?: string;
  once?: boolean;
}

/**
 * Reusable animated section wrapper.
 * Respects prefers-reduced-motion: renders children without animation if requested.
 */
export function MotionWrapper({
  children,
  variants = fadeUp,
  delay = 0,
  className,
  once = true,
}: MotionWrapperProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-10%' }}
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

interface MotionSectionProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

/**
 * Animated section that stagger-reveals its direct children.
 */
export function MotionSection({ children, className }: MotionSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.05 },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0, 0, 0.2, 1] },
    },
  };

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-8%' }}
      variants={container}
    >
      {React.Children.map(children, (child, i) => (
        <motion.div key={i} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
