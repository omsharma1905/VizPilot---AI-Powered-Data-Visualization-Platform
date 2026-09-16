/**
 * Deterministic Aggregation Engine — Phase 2D
 *
 * Implements sum, avg, count, min, max, median.
 * Protects against null, NaN, and zero-division errors.
 */

import type { AggregationFunction } from '@/src/lib/ai/types';

export function aggregateNumbers(
  values: number[],
  fn: AggregationFunction = 'sum'
): number {
  const valid = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  const count = valid.length;

  if (count === 0) {
    return fn === 'count' ? 0 : 0;
  }

  switch (fn) {
    case 'count':
      return count;

    case 'sum': {
      let sum = 0;
      for (let i = 0; i < count; i++) sum += valid[i];
      return Math.round(sum * 10000) / 10000;
    }

    case 'avg': {
      let sum = 0;
      for (let i = 0; i < count; i++) sum += valid[i];
      return Math.round((sum / count) * 10000) / 10000;
    }

    case 'min': {
      let min = valid[0];
      for (let i = 1; i < count; i++) if (valid[i] < min) min = valid[i];
      return min;
    }

    case 'max': {
      let max = valid[0];
      for (let i = 1; i < count; i++) if (valid[i] > max) max = valid[i];
      return max;
    }

    case 'median': {
      const sorted = [...valid].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      if (sorted.length % 2 === 0) {
        return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10000) / 10000;
      }
      return sorted[mid];
    }

    default: {
      // Default to sum
      let sum = 0;
      for (let i = 0; i < count; i++) sum += valid[i];
      return Math.round(sum * 10000) / 10000;
    }
  }
}
