/**
 * Profiling Utilities — Phase 2B
 *
 * Shared helpers used across the profiling engine.
 * No side-effects. All functions are pure.
 */

import type { DataValue, InferredType } from '@/src/types/dataset';

// ---------------------------------------------------------------------------
// Numeric parsing
// ---------------------------------------------------------------------------

const STRIP_CURRENCY_RE = /[$€£¥₹]|[A-Z]{3}/g;  // currency symbols and ISO codes
const STRIP_COMMAS_RE = /,/g;

/**
 * Parses a DataValue into a clean floating-point number.
 * Strips currency symbols, thousands commas, and percentage signs.
 * Returns null on failure, NaN, or Infinity.
 */
export function parseNumericValue(v: DataValue): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'boolean') return null; // booleans are not numeric for stats purposes
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return null;
    return v;
  }
  const str = String(v)
    .trim()
    .replace(STRIP_CURRENCY_RE, '')
    .replace(STRIP_COMMAS_RE, '')
    .replace('%', '')
    .trim();
  if (str === '' || str === '-' || str === '+') return null;
  const n = Number(str);
  if (!Number.isFinite(n)) return null;
  return n;
}

/**
 * Safely divides a by b. Returns 0 when b is 0 or undefined.
 */
export function safeDivide(a: number, b: number): number {
  if (!b || !Number.isFinite(b) || b === 0) return 0;
  return a / b;
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

const NUMERIC_TYPES: ReadonlySet<InferredType> = new Set([
  'number', 'integer', 'currency', 'percentage',
]);

const TEMPORAL_TYPES: ReadonlySet<InferredType> = new Set(['date', 'datetime']);

export function isNumericType(t: InferredType): boolean {
  return NUMERIC_TYPES.has(t);
}

export function isTemporalType(t: InferredType): boolean {
  return TEMPORAL_TYPES.has(t);
}

export function isBooleanType(t: InferredType): boolean {
  return t === 'boolean';
}

export function isStringType(t: InferredType): boolean {
  return t === 'string';
}

// ---------------------------------------------------------------------------
// Date parsing
// ---------------------------------------------------------------------------

/**
 * Parses a DataValue into a Date object.
 * Returns null when the value cannot be interpreted as a date.
 * Does NOT use AI or external libs — relies on Date constructor + validation.
 */
export function parseDate(v: DataValue): Date | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'object' && v !== null && 'getTime' in v) {
    return isNaN((v as Date).getTime()) ? null : (v as Date);
  }
  const str = String(v).trim();
  if (!str) return null;

  // Check YYYY-MM or YYYY/MM (e.g. 2026-01)
  const ym = str.match(/^(\d{4})[\-\/](0[1-9]|1[0-2])$/);
  if (ym) {
    const d = new Date(Number(ym[1]), Number(ym[2]) - 1, 1);
    return isNaN(d.getTime()) ? null : d;
  }

  // Check MM/YYYY or MM-YYYY (e.g. 01/2026)
  const my = str.match(/^(0[1-9]|1[0-2])[\-\/](\d{4})$/);
  if (my) {
    const d = new Date(Number(my[2]), Number(my[1]) - 1, 1);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return d;
}


// ---------------------------------------------------------------------------
// Column value extraction
// ---------------------------------------------------------------------------

/**
 * Extracts the column values for a given column index from a rows array.
 * Returns an array of DataValue aligned to row positions.
 */
export function extractColumnValues(rows: DataValue[][], colIndex: number): DataValue[] {
  return rows.map((row) => (row[colIndex] !== undefined ? row[colIndex] : null));
}

// ---------------------------------------------------------------------------
// Rounding helpers
// ---------------------------------------------------------------------------

/**
 * Rounds a number to at most `digits` decimal places.
 * Eliminates floating-point noise in profile output.
 */
export function round(n: number, digits: number = 4): number {
  const factor = Math.pow(10, digits);
  return Math.round(n * factor) / factor;
}

/**
 * Clamps a value to [0, 1].
 */
export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
