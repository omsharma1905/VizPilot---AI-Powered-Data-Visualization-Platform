'use client';

import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/src/components/ui/ThemeProvider';
import { cn } from '@/src/lib/utils/cn';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={cn(
        'relative flex h-8 w-8 items-center justify-center rounded-lg',
        'text-foreground-muted hover:text-foreground',
        'hover:bg-surface transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
    >
      <motion.div
        key={isDark ? 'moon' : 'sun'}
        initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {isDark ? (
          <Moon className="h-[18px] w-[18px]" strokeWidth={1.5} />
        ) : (
          <Sun className="h-[18px] w-[18px]" strokeWidth={1.5} />
        )}
      </motion.div>
    </button>
  );
}
