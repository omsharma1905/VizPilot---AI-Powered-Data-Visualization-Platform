/**
 * Deterministic Row Sampling — Phase 2B
 *
 * Provides reproducible row samples for large datasets.
 * Does NOT use Math.random(). Uses a seeded Linear Congruential Generator (LCG).
 *
 * Same dataset ID + same threshold always produces the same sample.
 */

import type { DataValue } from '@/src/types/dataset';

// ---------------------------------------------------------------------------
// LCG seeded PRNG
// ---------------------------------------------------------------------------

/**
 * Linear Congruential Generator.
 * Parameters from Numerical Recipes (knuth).
 * Returns floats in [0, 1).
 */
function createLCG(seed: number): () => number {
  // Ensure seed is a positive 32-bit integer
  let s = (Math.abs(Math.floor(seed)) % 2147483647) || 1;
  return function next(): number {
    // LCG parameters: a=1664525, c=1013904223, m=2^32
    s = ((s * 1664525) + 1013904223) >>> 0; // unsigned right shift keeps it 32-bit
    return s / 4294967296; // normalize to [0, 1)
  };
}

/**
 * Converts a string seed (dataset ID) to a numeric seed for the LCG.
 * Uses a simple DJB2-like hash.
 */
function hashStringSeed(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  }
  return h;
}

// ---------------------------------------------------------------------------
// Sampling result
// ---------------------------------------------------------------------------

export interface SampleResult {
  rows: DataValue[][];
  /** True when sampling was applied (original > maxRows) */
  wasSampled: boolean;
  /** Number of rows in the sample */
  sampleSize: number;
  /** Original row count before sampling */
  originalRowCount: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns a deterministic sample of rows.
 *
 * - When `rows.length <= maxRows`, returns the original array unchanged (no copy).
 * - When `rows.length > maxRows`, uses reservoir sampling seeded from `seed`.
 * - Reservoir sampling is O(n) in time, O(maxRows) in space.
 *
 * @param rows     — normalized row array from VizPilotTable
 * @param maxRows  — maximum rows to return in the sample
 * @param seed     — deterministic seed (use dataset ID or table ID)
 */
export function deterministicSample(
  rows: DataValue[][],
  maxRows: number,
  seed: string
): SampleResult {
  const originalRowCount = rows.length;

  if (originalRowCount <= maxRows) {
    return {
      rows,
      wasSampled: false,
      sampleSize: originalRowCount,
      originalRowCount,
    };
  }

  // Reservoir sampling (Algorithm R — Vitter 1985)
  const rng = createLCG(hashStringSeed(seed));
  const reservoir: DataValue[][] = rows.slice(0, maxRows);

  for (let i = maxRows; i < originalRowCount; i++) {
    const j = Math.floor(rng() * (i + 1));
    if (j < maxRows) {
      reservoir[j] = rows[i];
    }
  }

  return {
    rows: reservoir,
    wasSampled: true,
    sampleSize: maxRows,
    originalRowCount,
  };
}
