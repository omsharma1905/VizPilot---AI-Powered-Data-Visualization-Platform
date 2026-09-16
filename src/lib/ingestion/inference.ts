import type { DataValue, InferredType } from '@/src/types/dataset';

const BOOLEAN_REGEX = /^(true|false|yes|no)$/i;
const INTEGER_REGEX = /^[+-]?\d+$/;
const NUMBER_REGEX = /^[+-]?(?:\d+\.\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
const PERCENTAGE_REGEX = /^[+-]?\d+(?:\.\d+)?\s*%$/;
const CURRENCY_REGEX =
  /^(?:(?:\$|€|£|¥|₹|CHF|CAD|AUD)\s*[+-]?[\d,]+(?:\.\d{1,2})?|[+-]?[\d,]+(?:\.\d{1,2})?\s*(?:\$|€|£|¥|₹|USD|EUR|GBP|INR|CAD|AUD))$/i;
const DATE_ONLY_REGEX =
  /^(?:\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])|\d{4}-(?:0[1-9]|1[0-2])|\d{4}\/(?:0[1-9]|1[0-2])|(?:0?[1-9]|1[0-2])\/(?:0?[1-9]|[12]\d|3[01])\/\d{4}|(?:0?[1-9]|1[0-2])\/\d{4}|(?:0?[1-9]|[12]\d|3[01])\.(?:0?[1-9]|1[0-2])\.\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-,]+\d{4})$/i;
const DATETIME_REGEX =
  /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])[T\s](?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/i;

/**
 * Classifies a single non-null primitive value into its most specific candidate type.
 */
export function classifyValue(val: DataValue): InferredType {
  if (val === null || val === undefined) return 'unknown';

  if (typeof val === 'boolean') return 'boolean';

  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return 'unknown';
    return Number.isInteger(val) ? 'integer' : 'number';
  }

  const str = String(val).trim();
  if (str === '') return 'unknown';

  // 1. Boolean check
  if (BOOLEAN_REGEX.test(str)) return 'boolean';

  // 2. Percentage check
  if (PERCENTAGE_REGEX.test(str)) return 'percentage';

  // 3. Currency check
  if (CURRENCY_REGEX.test(str)) return 'currency';

  // 4. Integer check
  if (INTEGER_REGEX.test(str)) return 'integer';

  // 5. General number check (decimals, scientific notation)
  if (NUMBER_REGEX.test(str)) return 'number';

  // 6. Datetime check
  if (DATETIME_REGEX.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return 'datetime';
  }

  // 7. Date check (including YYYY-MM and common temporal patterns)
  if (DATE_ONLY_REGEX.test(str)) {
    let norm = str;
    if (/^\d{4}[\-\/](?:0[1-9]|1[0-2])$/.test(str)) {
      norm = str.replace('/', '-') + '-01';
    } else if (/^(?:0?[1-9]|1[0-2])[\-\/]\d{4}$/.test(str)) {
      const parts = str.split(/[\-\/]/);
      norm = `${parts[1]}-${parts[0].padStart(2, '0')}-01`;
    }
    const d = new Date(norm);
    if (!isNaN(d.getTime())) return 'date';
  }

  return 'string';
}

/**
 * Analyzes an array of column values and infers a single deterministic InferredType.
 * Uses a conservative 85% threshold of non-null values.
 */
export function inferColumnType(values: DataValue[]): InferredType {
  const nonNulls = values.filter((v): v is NonNullable<DataValue> => v !== null && v !== undefined && String(v).trim() !== '');

  if (nonNulls.length === 0) {
    return 'unknown';
  }

  // Count candidate types
  const typeCounts: Record<InferredType, number> = {
    boolean: 0,
    integer: 0,
    number: 0,
    currency: 0,
    percentage: 0,
    date: 0,
    datetime: 0,
    string: 0,
    unknown: 0,
  };

  for (const val of nonNulls) {
    const t = classifyValue(val);
    typeCounts[t]++;
  }

  const total = nonNulls.length;
  const threshold = 0.85;

  // If boolean matches threshold
  if (typeCounts.boolean / total >= threshold) return 'boolean';

  // If currency matches threshold
  if (typeCounts.currency / total >= threshold) return 'currency';

  // If percentage matches threshold
  if (typeCounts.percentage / total >= threshold) return 'percentage';

  // If datetime matches threshold
  if (typeCounts.datetime / total >= threshold) return 'datetime';

  // If date matches threshold
  if ((typeCounts.date + typeCounts.datetime) / total >= threshold) {
    return typeCounts.datetime > typeCounts.date ? 'datetime' : 'date';
  }

  // If integer matches threshold
  if (typeCounts.integer / total >= threshold) return 'integer';

  // If combined numeric (integer + number) matches threshold
  if ((typeCounts.integer + typeCounts.number) / total >= threshold) {
    return 'number';
  }

  // Fallback to string
  return 'string';
}
