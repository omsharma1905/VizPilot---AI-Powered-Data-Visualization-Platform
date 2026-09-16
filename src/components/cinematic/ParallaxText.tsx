'use client';

import { cn } from '@/src/lib/utils/cn';

interface ParallaxTextProps {
  children: string;
  direction?: 'ltr' | 'rtl';
  velocity?: number; // Kept for backwards compatibility
  duration?: number; // Optional speed override in seconds (default: 48s)
  className?: string;
  outline?: boolean;
}

export function ParallaxText({
  children,
  direction = 'ltr',
  duration = 48,
  className,
  outline = true,
}: ParallaxTextProps) {
  const isLtr = direction === 'ltr';

  return (
    <div
      className={cn(
        'overflow-hidden pointer-events-none select-none relative w-full flex items-center',
        className
      )}
      aria-hidden="true"
    >
      {/* Seamless looping dual-track independent continuous motion */}
      <div
        className={cn(
          'flex w-max will-change-transform',
          isLtr ? 'animate-depth-ltr' : 'animate-depth-rtl'
        )}
        style={{ animationDuration: `${duration}s` }}
      >
        <span
          className={cn(
            'watermark-text text-[clamp(2.75rem,11vw,9.5rem)] tracking-tighter opacity-70 px-4 sm:px-8 block',
            outline ? 'text-stroke-subtle' : 'text-white/[0.05]'
          )}
        >
          {children} ·
        </span>
        <span
          className={cn(
            'watermark-text text-[clamp(2.75rem,11vw,9.5rem)] tracking-tighter opacity-70 px-4 sm:px-8 block',
            outline ? 'text-stroke-subtle' : 'text-white/[0.05]'
          )}
        >
          {children} ·
        </span>
      </div>
    </div>
  );
}
