/**
 * Rendering Limits & Sampling Configuration — Phase 2D
 */

import type { DataValue } from '@/src/types/dataset';

export const VISUALIZATION_LIMITS = {
  /** Maximum raw individual data points to render (e.g. in scatter plots) */
  MAX_RENDER_POINTS: 5000,

  /** Maximum unique categorical slices in pie / donut */
  MAX_PIE_CATEGORIES: 10,

  /** Maximum distinct bars displayed before downsampling/grouping */
  MAX_BAR_CATEGORIES: 50,

  /** Maximum secondary dimension categories in grouped/stacked bar charts */
  MAX_SECONDARY_CATEGORIES: 8,
};

export const MAX_RENDER_POINTS = VISUALIZATION_LIMITS.MAX_RENDER_POINTS;

/**
 * Deterministic seeded sampling for coordinates when raw row count exceeds MAX_RENDER_POINTS.
 * Preserves reproducible output across identical runs without using Math.random().
 */
export function sampleRowsDeterministically(
  rows: DataValue[][],
  maxPoints: number,
  seed: string = 'vizpilot_scatter_seed'
): { sampledRows: DataValue[][]; wasSampled: boolean } {
  if (rows.length <= maxPoints) {
    return { sampledRows: rows, wasSampled: false };
  }

  // Simple deterministic step sampling
  const step = rows.length / maxPoints;
  const sampled: DataValue[][] = [];

  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.min(rows.length - 1, Math.floor(i * step));
    sampled.push(rows[idx]);
  }

  return { sampledRows: sampled, wasSampled: true };
}
