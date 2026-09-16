/**
 * Numeric Statistics — Phase 2B
 *
 * Computes NumericColumnStatistics for numeric/integer/currency/percentage columns.
 *
 * Two-phase approach:
 *   Pass 1: streaming Welford algorithm for mean + variance (no full array needed)
 *   Pass 2: sort-based for median, Q1, Q3, histogram (requires sorted copy)
 *
 * Both passes operate on the same extracted numeric values array.
 * Memory: O(n) for the sorted copy — acceptable within MAX_INTERACTIVE_ROWS.
 */

import type { NumericColumnStatistics } from '@/src/types/profiling';
import { round } from './utils';

// ---------------------------------------------------------------------------
// Histogram config
// ---------------------------------------------------------------------------

const MIN_BINS = 5;
const MAX_BINS = 20;

/**
 * Sturges' rule: ceil(log2(n) + 1), clamped to [MIN_BINS, MAX_BINS].
 */
function sturgesBinCount(n: number): number {
  if (n <= 1) return MIN_BINS;
  return Math.min(MAX_BINS, Math.max(MIN_BINS, Math.ceil(Math.log2(n) + 1)));
}

// ---------------------------------------------------------------------------
// Percentile helper (on already-sorted array)
// ---------------------------------------------------------------------------

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = p * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  // Linear interpolation
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Computes full numeric statistics for an array of (possibly null) numeric values.
 * @param values — raw numeric values (nulls skipped)
 */
export function computeNumericStats(values: (number | null)[]): NumericColumnStatistics {
  const valid = values.filter((v): v is number => v !== null && Number.isFinite(v));

  if (valid.length === 0) {
    // Return safe zero-state when no valid values exist
    return {
      min: 0, max: 0, mean: 0, median: 0, q1: 0, q3: 0,
      stdDev: 0, sum: 0, zeroCount: 0, negativeCount: 0, distinctCount: 0,
      histogram: { bins: [0, 0], counts: [0], binWidth: 0 },
    };
  }

  // ── Pass 1: streaming (Welford's online algorithm) ──────────────────────
  let mean = 0;
  let m2 = 0;    // sum of squared deviations
  let sum = 0;
  let zeroCount = 0;
  let negativeCount = 0;
  const distinctSet = new Set<number>();

  for (let i = 0; i < valid.length; i++) {
    const x = valid[i];
    sum += x;
    if (x === 0) zeroCount++;
    if (x < 0) negativeCount++;
    distinctSet.add(x);

    // Welford update
    const n = i + 1;
    const delta = x - mean;
    mean += delta / n;
    const delta2 = x - mean;
    m2 += delta * delta2;
  }

  const n = valid.length;
  const variance = n > 1 ? m2 / (n - 1) : 0; // sample variance
  const stdDev = Math.sqrt(variance);

  // ── Pass 2: sort-based (median, Q1, Q3, histogram) ──────────────────────
  const sorted = [...valid].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = percentile(sorted, 0.5);
  const q1 = percentile(sorted, 0.25);
  const q3 = percentile(sorted, 0.75);

  // ── Histogram ─────────────────────────────────────────────────────────────
  const binCount = sturgesBinCount(n);
  const range = max - min;
  const binWidth = range === 0 ? 1 : range / binCount;

  // Build bin edges: [min, min+bw, min+2bw, ..., max]
  const bins: number[] = [];
  for (let i = 0; i <= binCount; i++) {
    bins.push(round(min + i * binWidth, 6));
  }
  // Force last edge to exactly max to avoid floating-point edge issues
  bins[binCount] = max;

  const counts = new Array<number>(binCount).fill(0);
  for (const v of valid) {
    if (range === 0) {
      counts[0]++;
      continue;
    }
    let idx = Math.floor((v - min) / binWidth);
    // Clamp last value into last bin
    if (idx >= binCount) idx = binCount - 1;
    if (idx < 0) idx = 0;
    counts[idx]++;
  }

  return {
    min: round(min),
    max: round(max),
    mean: round(mean),
    median: round(median),
    q1: round(q1),
    q3: round(q3),
    stdDev: round(stdDev),
    sum: round(sum),
    zeroCount,
    negativeCount,
    distinctCount: distinctSet.size,
    histogram: {
      bins: bins.map((b) => round(b)),
      counts,
      binWidth: round(binWidth),
    },
  };
}
