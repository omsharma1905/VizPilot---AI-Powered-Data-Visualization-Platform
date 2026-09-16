/**
 * Zero-Trace Client Lifecycle & Cleanup Engine — Phase 2E
 *
 * Implements multi-path cleanup ensuring no residual business data remains
 * in browser memory or sessionStorage once Zero-Trace processing concludes.
 */

import { clientMemoryStore } from './in-memory-store';

/**
 * Completely purges all client-side Zero-Trace state across RAM and browser storage.
 */
export function clearZeroTraceClientState(): void {
  // 1. Clear volatile memory store
  clientMemoryStore.clear();

  // 2. Clear sessionStorage keys
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('vizpilot:')) {
          keysToRemove.push(key);
        }
      }
      for (const k of keysToRemove) {
        sessionStorage.removeItem(k);
      }
    } catch {
      // Storage access blocked or unavailable
    }
  }
}

/**
 * Registers browser lifecycle listeners (beforeunload, pagehide) to ensure best-effort
 * cleanup when navigating away or closing the tab.
 */
export function registerZeroTraceLifecycleListeners(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCleanup = () => {
    clearZeroTraceClientState();
  };

  window.addEventListener('beforeunload', handleCleanup);
  window.addEventListener('pagehide', handleCleanup);

  return () => {
    window.removeEventListener('beforeunload', handleCleanup);
    window.removeEventListener('pagehide', handleCleanup);
  };
}
