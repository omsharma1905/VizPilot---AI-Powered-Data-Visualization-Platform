'use client';

import React, { createContext, useContext } from 'react';
import type { ThemeMode } from '@/src/types';

// ─── Context (kept for forward compatibility) ─────────────────────────────────
// VizPilot now uses a single warm-light visual identity.
// No theme toggling. This provider is preserved to avoid breaking any
// downstream code that imports useTheme.

interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {}, setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
