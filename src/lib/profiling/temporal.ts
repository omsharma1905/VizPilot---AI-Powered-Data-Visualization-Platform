/**
 * Temporal Statistics — Phase 2B
 *
 * Computes TemporalColumnStatistics for date and datetime columns.
 *
 * Granularity Detection:
 * Sorts all valid dates, computes consecutive differences in ms,
 * then uses the MODE of those differences to determine the typical interval.
 *
 * This is purely deterministic and works on the observed data — no column-name hints.
 *
 * Example:
 *   Differences: [31d, 28d, 31d, 30d] → mode ≈ 30d → 'month'
 *   Differences: [1d, 1d, 1d]          → mode = 1d  → 'day'
 */

import type { TemporalColumnStatistics, TemporalGranularity } from '@/src/types/profiling';
import type { DataValue } from '@/src/types/dataset';
import { parseDate } from './utils';

// ---------------------------------------------------------------------------
// Granularity thresholds (in milliseconds)
// ---------------------------------------------------------------------------

const MS = {
  minute:  60_000,
  hour:    3_600_000,
  day:     86_400_000,
  week:    7 * 86_400_000,
  month:   28 * 86_400_000,  // approximate lower bound
  quarter: 89 * 86_400_000,  // approximate lower bound
  year:    365 * 86_400_000, // approximate lower bound
};

function classifyGranularity(medianDiffMs: number): TemporalGranularity {
  if (medianDiffMs <= 0) return 'unknown';
  if (medianDiffMs < MS.hour)    return 'minute';
  if (medianDiffMs < MS.day)     return 'hour';
  if (medianDiffMs < MS.week)    return 'day';
  if (medianDiffMs < MS.month)   return 'week';
  if (medianDiffMs < MS.quarter) return 'month';
  if (medianDiffMs < MS.year)    return 'quarter';
  return 'year';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Computes temporal statistics for a date/datetime column.
 * Returns a safe zero-state when no parseable dates are found.
 */
export function computeTemporalStats(values: DataValue[]): TemporalColumnStatistics {
  const dates: Date[] = [];
  for (const v of values) {
    const d = parseDate(v);
    if (d !== null) dates.push(d);
  }

  if (dates.length === 0) {
    return {
      minDate: '',
      maxDate: '',
      rangeMs: 0,
      granularity: 'unknown',
      distinctDateCount: 0,
    };
  }

  // Sort ascending by timestamp
  dates.sort((a, b) => a.getTime() - b.getTime());

  const minDate = dates[0].toISOString();
  const maxDate = dates[dates.length - 1].toISOString();
  const rangeMs = dates[dates.length - 1].getTime() - dates[0].getTime();

  // Distinct date count (by ISO string to handle time-zone normalization)
  const distinctSet = new Set(dates.map((d) => d.toISOString()));
  const distinctDateCount = distinctSet.size;

  // Granularity: compute median of consecutive differences
  let granularity: TemporalGranularity = 'unknown';
  if (dates.length >= 2) {
    const diffs: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      const diff = dates[i].getTime() - dates[i - 1].getTime();
      if (diff > 0) diffs.push(diff);
    }
    if (diffs.length > 0) {
      diffs.sort((a, b) => a - b);
      const medianDiff = diffs[Math.floor(diffs.length / 2)];
      granularity = classifyGranularity(medianDiff);
    }
  } else {
    // Only one date — try to classify by range
    granularity = 'unknown';
  }

  return { minDate, maxDate, rangeMs, granularity, distinctDateCount };
}
