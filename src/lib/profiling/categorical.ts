/**
 * Categorical Statistics — Phase 2B
 *
 * Computes StringColumnStatistics for string / label / identifier / unknown columns.
 *
 * Memory-safety: tracks at most MAX_CARDINALITY_TRACKING distinct values.
 * When exceeded, frequency tracking stops but total counts continue.
 * The topValues result is still valid for the tracked subset.
 */

import type { StringColumnStatistics } from '@/src/types/profiling';
import type { DataValue } from '@/src/types/dataset';
import { round, safeDivide } from './utils';

// ---------------------------------------------------------------------------
// Constants (documented for downstream consumers)
// ---------------------------------------------------------------------------

/** Maximum distinct values tracked in the frequency map */
export const MAX_CARDINALITY_TRACKING = 10_000;

/** Maximum number of top values returned in the profile */
export const TOP_VALUES_LIMIT = 10;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Computes string statistics for a categorical/label/string column.
 * Single-pass over the values array.
 *
 * @param values — raw column values (may contain nulls)
 * @param totalCount — total row count (for null rate denominator)
 */
export function computeStringStats(
  values: DataValue[],
  totalCount: number
): StringColumnStatistics {
  let minLength = Infinity;
  let maxLength = 0;
  let totalLength = 0;
  let nonNullCount = 0;
  const freqMap = new Map<string, number>();
  let trackingActive = true; // stops tracking new keys after MAX_CARDINALITY_TRACKING

  for (const v of values) {
    if (v === null || v === undefined) continue;
    const str = String(v);
    nonNullCount++;

    const len = str.length;
    if (len < minLength) minLength = len;
    if (len > maxLength) maxLength = len;
    totalLength += len;

    // Frequency tracking
    const existing = freqMap.get(str);
    if (existing !== undefined) {
      freqMap.set(str, existing + 1);
    } else if (trackingActive) {
      if (freqMap.size >= MAX_CARDINALITY_TRACKING) {
        trackingActive = false;
        // Don't track this new key — but we've still counted it in nonNullCount
      } else {
        freqMap.set(str, 1);
      }
    }
  }

  if (nonNullCount === 0) {
    return {
      minLength: 0,
      maxLength: 0,
      avgLength: 0,
      distinctCount: 0,
      cardinalityRatio: 0,
      topValues: [],
    };
  }

  const distinctCount = freqMap.size; // approximate when tracking exceeded
  const cardinalityRatio = round(safeDivide(distinctCount, nonNullCount));
  const avgLength = round(safeDivide(totalLength, nonNullCount));

  // Build top values: sort by count descending, take top N
  const sortedEntries = Array.from(freqMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_VALUES_LIMIT);

  const topValues = sortedEntries.map(([value, count]) => ({
    value,
    count,
    percentage: round(safeDivide(count, totalCount) * 100, 2),
  }));

  return {
    minLength: minLength === Infinity ? 0 : minLength,
    maxLength,
    avgLength,
    distinctCount,
    cardinalityRatio,
    topValues,
  };
}
