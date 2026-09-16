'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

type CursorVariant = 'default' | 'hover' | 'text' | 'click';

const VARIANT_CONFIG = {
  default: {
    ringSize: 20,
    ringBorder: '1.5px solid rgba(129, 140, 248, 0.7)',
    ringBg: 'rgba(99, 102, 241, 0.04)',
    ringShadow: '0 0 8px rgba(99, 102, 241, 0.2)',
    dotSize: 5,
    dotOpacity: 1,
  },
  hover: {
    ringSize: 34,
    ringBorder: '1.5px solid rgba(165, 180, 252, 0.9)',
    ringBg: 'rgba(99, 102, 241, 0.12)',
    ringShadow: '0 0 16px rgba(99, 102, 241, 0.45)',
    dotSize: 4,
    dotOpacity: 1,
  },
  click: {
    ringSize: 16,
    ringBorder: '1.5px solid rgba(129, 140, 248, 0.7)',
    ringBg: 'rgba(99, 102, 241, 0.04)',
    ringShadow: '0 0 6px rgba(99, 102, 241, 0.25)',
    dotSize: 8,
    dotOpacity: 1,
  },
  text: {
    ringSize: 12,
    ringBorder: '1.5px solid rgba(129, 140, 248, 0.5)',
    ringBg: 'rgba(99, 102, 241, 0.02)',
    ringShadow: '0 0 4px rgba(99, 102, 241, 0.15)',
    dotSize: 2,
    dotOpacity: 0.3,
  },
};

export function CustomCursor() {
  const pathname = usePathname();
  const [variant, setVariant] = useState<CursorVariant>('default');
  const [isVisible, setIsVisible] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // Direct DOM references for zero-render 60/120fps transform updates
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  // Position state stored in refs to avoid React re-renders on mousemove
  const posRef = useRef({
    currentX: -100,
    currentY: -100,
    targetX: -100,
    targetY: -100,
    initialized: false,
  });

  const isVisibleRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  // Reset variant whenever route changes
  useEffect(() => {
    setVariant('default');
  }, [pathname]);

  // Keep isVisibleRef in sync with state
  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  // Check hardware pointer capability
  useEffect(() => {
    const hasPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (hasPointer && !reducedMotion) {
      setIsSupported(true);
    }
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const renderLoop = () => {
      const pos = posRef.current;

      // Center dot: zero delay, pinned directly to the latest target pointer position
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.targetX}px, ${pos.targetY}px, 0) translate(-50%, -50%)`;
      }

      // Outer ring: tight, luxurious lerp smoothing
      const dx = pos.targetX - pos.currentX;
      const dy = pos.targetY - pos.currentY;

      pos.currentX += dx * 0.28;
      pos.currentY += dy * 0.28;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${pos.currentX}px, ${pos.currentY}px, 0) translate(-50%, -50%)`;
      }

      rafIdRef.current = requestAnimationFrame(renderLoop);
    };

    const startLoop = () => {
      if (!isRunningRef.current) {
        isRunningRef.current = true;
        rafIdRef.current = requestAnimationFrame(renderLoop);
      }
    };

    const stopLoop = () => {
      if (isRunningRef.current) {
        isRunningRef.current = false;
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;

      const { clientX, clientY } = e;
      const pos = posRef.current;

      if (!pos.initialized || !isVisibleRef.current) {
        // Initial / Resume sync: snap immediately to current pointer position
        pos.currentX = clientX;
        pos.currentY = clientY;
        pos.targetX = clientX;
        pos.targetY = clientY;
        pos.initialized = true;

        if (dotRef.current) {
          dotRef.current.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) translate(-50%, -50%)`;
        }
        if (ringRef.current) {
          ringRef.current.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) translate(-50%, -50%)`;
        }

        setIsVisible(true);
      } else {
        pos.targetX = clientX;
        pos.targetY = clientY;
      }

      startLoop();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      setVariant('click');
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"]')) {
        setVariant('text');
      } else if (target?.closest('a, button, [role="button"], select, label, .cursor-pointer, [data-cursor="pointer"]')) {
        setVariant('hover');
      } else {
        setVariant('default');
      }
    };

    const onPointerOver = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.closest('input, textarea, [contenteditable="true"]')) {
        setVariant('text');
      } else if (
        target.closest('a, button, [role="button"], select, label, .cursor-pointer, [data-cursor="pointer"]')
      ) {
        setVariant('hover');
      } else {
        setVariant('default');
      }
    };

    const onPointerOut = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const related = e.relatedTarget as HTMLElement | null;
      if (!related || !related.closest('a, button, [role="button"], select, label, .cursor-pointer, [data-cursor="pointer"], input, textarea, [contenteditable="true"]')) {
        setVariant('default');
      }
    };

    const onWindowLeave = () => {
      setIsVisible(false);
      setVariant('default');
    };

    const onWindowBlur = () => {
      setIsVisible(false);
      setVariant('default');
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        setIsVisible(false);
        setVariant('default');
      }
    };

    // Attach single set of passive listeners
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointerleave', onWindowLeave);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);
    document.addEventListener('pointerover', onPointerOver, { passive: true });
    document.addEventListener('pointerout', onPointerOut, { passive: true });

    return () => {
      stopLoop();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointerleave', onWindowLeave);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerout', onPointerOut);
    };
  }, [isSupported]);

  if (!isSupported) return null;

  const config = VARIANT_CONFIG[variant];

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s ease-out',
      }}
      aria-hidden="true"
    >
      {/* ── Outer Ring (Smooth Follower) ── */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 rounded-full will-change-transform"
        style={{
          width: `${config.ringSize}px`,
          height: `${config.ringSize}px`,
          border: config.ringBorder,
          backgroundColor: config.ringBg,
          boxShadow: config.ringShadow,
          transition:
            'width 0.22s cubic-bezier(0.16, 1, 0.3, 1), height 0.22s cubic-bezier(0.16, 1, 0.3, 1), border 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease',
        }}
      />

      {/* ── Center Point (Precise Immediate Target ◉) ── */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 rounded-full bg-white will-change-transform"
        style={{
          width: `${config.dotSize}px`,
          height: `${config.dotSize}px`,
          opacity: config.dotOpacity,
          boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)',
          transition:
            'width 0.18s cubic-bezier(0.16, 1, 0.3, 1), height 0.18s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.18s ease',
        }}
      />
    </div>
  );
}
