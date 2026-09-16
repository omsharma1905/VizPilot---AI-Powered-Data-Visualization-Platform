/**
 * Semantic Role Classifier — Phase 2B
 *
 * Deterministic, rule-based semantic role classification.
 * NO AI. NO hardcoded column names as sole signal.
 *
 * Decision tree (in priority order):
 *
 * 1. boolean type                          → 'boolean-flag'
 * 2. date / datetime type                  → 'timestamp'
 * 3. currency type                         → 'currency-amount'
 * 4. percentage type                       → 'percentage'
 * 5. numeric type + uniquenessRate > 0.95 + id-name pattern  → 'identifier'
 * 6. numeric type + uniquenessRate > 0.95                    → 'measure' (dense numeric)
 * 7. numeric type                          → 'measure'
 * 8. string + email pattern                → 'email'
 * 9. string + url pattern                  → 'url'
 * 10. string + geo-name pattern + low cardinality → 'geolocation'
 * 11. string + isConstant                  → 'category' (single-value string)
 * 12. string + cardinalityRatio < 0.05     → 'category'
 * 13. string + cardinalityRatio > 0.80     → 'label' (high-cardinality text)
 * 14. string                               → 'category' (safe fallback)
 * 15. unknown / unrecognized               → 'unknown'
 *
 * Signals used (multi-signal, not name-only):
 *   - inferredType (primary)
 *   - uniquenessRate (from quality)
 *   - cardinalityRatio (from string stats)
 *   - column name patterns (secondary signal — never sole decider)
 *   - isConstant flag
 *   - value samples (email/URL regex checks)
 */

import type { SemanticRole, VizPilotColumnStatistics, VizPilotColumnQuality } from '@/src/types/profiling';
import type { DataValue, InferredType } from '@/src/types/dataset';
import { isNumericType, isTemporalType, isBooleanType } from './utils';

// ---------------------------------------------------------------------------
// Name-pattern helpers (secondary signals only)
// ---------------------------------------------------------------------------

/** Patterns that suggest an identifier column when the type is also numeric or string */
const ID_NAME_RE = /(^|[_\b])(id|ids|code|codes|uuid|guid|key|num|number|no|ref)($|[_\b])|id$/i;


/** Patterns that suggest geographic data */
const GEO_NAME_RE = /\b(country|countries|city|cities|state|states|region|regions|province|lat|lon|latitude|longitude|zip|postal|territory|continent)\b/i;

/** Simple email pattern applied to sample values */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Simple URL pattern applied to sample values */
const URL_RE = /^https?:\/\//i;

/** Threshold: uniquenessRate above this for a numeric column → likely identifier */
const IDENTIFIER_UNIQUENESS_THRESHOLD = 0.95;

/** Threshold: cardinalityRatio below this for a string column → category */
const CATEGORY_RATIO_THRESHOLD = 0.05;

/** Threshold: cardinalityRatio above this for a string column → label */
const LABEL_RATIO_THRESHOLD = 0.80;

// ---------------------------------------------------------------------------
// Email / URL detection on sample values
// ---------------------------------------------------------------------------

function detectEmailFromSamples(samples: DataValue[]): boolean {
  if (samples.length === 0) return false;
  const nonNull = samples.filter((s) => s !== null && typeof s === 'string') as string[];
  if (nonNull.length === 0) return false;
  return nonNull.every((s) => EMAIL_RE.test(s.trim()));
}

function detectUrlFromSamples(samples: DataValue[]): boolean {
  if (samples.length === 0) return false;
  const nonNull = samples.filter((s) => s !== null && typeof s === 'string') as string[];
  if (nonNull.length === 0) return false;
  return nonNull.every((s) => URL_RE.test(s.trim()));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classifies the semantic role of a column.
 *
 * @param inferredType    — type from the ingestion layer
 * @param columnName      — raw column name (secondary signal only)
 * @param quality         — column quality metrics
 * @param statistics      — column statistics (discriminated union)
 * @param sampleValues    — sample non-null values (for pattern checks)
 */
export function classifySemanticRole(
  inferredType: InferredType,
  columnName: string,
  quality: VizPilotColumnQuality,
  statistics: VizPilotColumnStatistics,
  sampleValues: DataValue[]
): SemanticRole {
  // ── 1. Boolean ─────────────────────────────────────────────────────────────
  if (isBooleanType(inferredType)) return 'boolean-flag';

  // ── 2. Temporal ────────────────────────────────────────────────────────────
  if (isTemporalType(inferredType)) return 'timestamp';

  // ── 3–4. Currency / Percentage ─────────────────────────────────────────────
  if (inferredType === 'currency') return 'currency-amount';
  if (inferredType === 'percentage') return 'percentage';

  // ── 5–7. Numeric ───────────────────────────────────────────────────────────
  if (isNumericType(inferredType)) {
    const uniqueness = quality.uniquenessRate;

    // High uniqueness → identifier (if name also matches id-pattern)
    if (uniqueness >= IDENTIFIER_UNIQUENESS_THRESHOLD && ID_NAME_RE.test(columnName)) {
      return 'identifier';
    }

    // Always → measure (numeric columns are aggregatable)
    return 'measure';
  }

  // ── 8–14. String ───────────────────────────────────────────────────────────
  if (inferredType === 'string') {
    // Constant single-value column
    if (quality.isConstant) return 'category';

    // Email detection via sample values
    if (detectEmailFromSamples(sampleValues)) return 'email';

    // URL detection via sample values
    if (detectUrlFromSamples(sampleValues)) return 'url';

    // Geographic hint: name pattern + low-to-medium cardinality
    const cardRatio = statistics.kind === 'string' ? statistics.stats.cardinalityRatio : 1;
    if (GEO_NAME_RE.test(columnName) && cardRatio < 0.3) return 'geolocation';

    // Cardinality-based classification
    if (cardRatio < CATEGORY_RATIO_THRESHOLD) return 'category';
    if (cardRatio > LABEL_RATIO_THRESHOLD) return 'label';

    // Default string fallback → category (most strings in analytics are dimensions)
    return 'category';
  }

  // ── 15. Unknown ────────────────────────────────────────────────────────────
  return 'unknown';
}
