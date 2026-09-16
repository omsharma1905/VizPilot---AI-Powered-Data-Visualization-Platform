/**
 * Data Transformation & Normalization — Phase 2D
 *
 * Prepares chart-ready coordinates and grouped series from raw dataset rows.
 */

import type { DataValue } from '@/src/types/dataset';
import { parseNumericValue } from '@/src/lib/profiling/utils';
import { aggregateNumbers } from './aggregation';
import type { AggregationFunction } from '@/src/lib/ai/types';

export interface GroupedSeriesData {
  categories: string[];
  series: Array<{
    name: string;
    data: number[];
  }>;
}

/**
 * Normalizes a dimension cell into a clean label string.
 */
export function normalizeCategoryLabel(v: DataValue): string {
  if (v === null || v === undefined) return 'Unknown';
  const str = String(v).trim();
  return str === '' ? 'Unknown' : str;
}

/**
 * Checks if a string looks like a date/timestamp and returns a sortable timestamp number.
 */
export function parseSortableDate(v: DataValue): number | null {
  if (v === null || v === undefined) return null;
  const str = String(v).trim();
  if (!str) return null;

  // 1. Check YYYY-MM or YYYY/MM (e.g. 2026-01)
  const ym = str.match(/^(\d{4})[\-\/](0[1-9]|1[0-2])$/);
  if (ym) {
    const d = new Date(Number(ym[1]), Number(ym[2]) - 1, 1);
    return isNaN(d.getTime()) ? null : d.getTime();
  }

  // 2. Check MM/YYYY or MM-YYYY (e.g. 01/2026)
  const my = str.match(/^(0[1-9]|1[0-2])[\-\/](\d{4})$/);
  if (my) {
    const d = new Date(Number(my[2]), Number(my[1]) - 1, 1);
    return isNaN(d.getTime()) ? null : d.getTime();
  }

  // 3. Standard Date constructor check
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d.getTime();
}

/**
 * Aggregates rows by a single primary dimension into sorted category-value pairs.
 */
export function aggregateByDimension(
  rows: DataValue[][],
  dimColIndex: number,
  valColIndex: number,
  fn: AggregationFunction = 'sum',
  isTemporal: boolean = false
): Array<{ category: string; value: number }> {
  const map = new Map<string, { numbers: number[]; sortKey: number | string }>();

  for (const row of rows) {
    const rawCategory = row[dimColIndex];
    const category = normalizeCategoryLabel(rawCategory);
    const rawVal = row[valColIndex];
    const num = parseNumericValue(rawVal);

    let entry = map.get(category);
    if (!entry) {
      const parsedTime = parseSortableDate(rawCategory);
      const sortKey: number | string = parsedTime !== null ? parsedTime : category;
      entry = { numbers: [], sortKey };
      map.set(category, entry);
    }

    if (num !== null) {
      entry.numbers.push(num);
    }
  }

  const result: Array<{ category: string; value: number; sortKey: number | string }> = [];
  for (const [category, { numbers, sortKey }] of map.entries()) {
    result.push({
      category,
      value: aggregateNumbers(numbers, fn),
      sortKey,
    });
  }

  // Determine if dimension is temporal:
  // Either explicitly marked as temporal, or ≥80% of categories parse as valid timestamps
  let isChronological = isTemporal;
  if (!isChronological && result.length > 0) {
    const validTimeCount = result.filter((r) => typeof r.sortKey === 'number').length;
    if (validTimeCount / result.length >= 0.8) {
      isChronological = true;
    }
  }

  // Sorting
  if (isChronological) {
    // Ascending chronological order (earliest to latest)
    result.sort((a, b) => {
      if (typeof a.sortKey === 'number' && typeof b.sortKey === 'number') {
        return a.sortKey - b.sortKey;
      }
      return String(a.category).localeCompare(String(b.category));
    });
  } else {
    // Categorical ranking: default to descending value ranking for clear visual hierarchy
    result.sort((a, b) => b.value - a.value);
  }

  return result.map(({ category, value }) => ({ category, value }));
}

/**
 * Aggregates rows by primary dimension AND secondary dimension (for grouped / stacked charts).
 */
export function aggregateByTwoDimensions(
  rows: DataValue[][],
  primaryDimIndex: number,
  secondaryDimIndex: number,
  valColIndex: number,
  fn: AggregationFunction = 'sum'
): GroupedSeriesData {
  const primarySet = new Set<string>();
  const secondarySet = new Set<string>();
  const matrix = new Map<string, Map<string, number[]>>();

  for (const row of rows) {
    const pCat = normalizeCategoryLabel(row[primaryDimIndex]);
    const sCat = normalizeCategoryLabel(row[secondaryDimIndex]);
    const num = parseNumericValue(row[valColIndex]);

    primarySet.add(pCat);
    secondarySet.add(sCat);

    let pMap = matrix.get(pCat);
    if (!pMap) {
      pMap = new Map();
      matrix.set(pCat, pMap);
    }

    let list = pMap.get(sCat);
    if (!list) {
      list = [];
      pMap.set(sCat, list);
    }

    if (num !== null) {
      list.push(num);
    }
  }

  const categories = Array.from(primarySet);
  const secondaries = Array.from(secondarySet);

  const series = secondaries.map((secName) => {
    const data = categories.map((primName) => {
      const nums = matrix.get(primName)?.get(secName) || [];
      return aggregateNumbers(nums, fn);
    });
    return { name: secName, data };
  });

  return { categories, series };
}
