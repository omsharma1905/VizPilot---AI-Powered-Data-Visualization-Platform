/**
 * VizPilot Data Profiling Contracts — Phase 2B
 *
 * Phase 2A.2 defined the initial contract skeleton.
 * Phase 2B extends it with all fields required by the deterministic profiling engine.
 *
 * All additions are backward-compatible (additive only — nothing removed).
 */

// ---------------------------------------------------------------------------
// Semantic Role
// ---------------------------------------------------------------------------

/**
 * High-level semantic classification assigned to a column.
 * Determined by Phase 2B profiling logic (heuristic + pattern matching).
 * No AI involved — purely deterministic rule-based classification.
 */
export type SemanticRole =
  | 'identifier'      // Primary key / row ID (very high uniqueness)
  | 'category'        // Low-cardinality categorical dimension
  | 'measure'         // Numeric quantity suitable for aggregation
  | 'timestamp'       // Date or datetime dimension
  | 'label'           // Human-readable name/description (high-cardinality string)
  | 'boolean-flag'    // Binary yes/no column
  | 'currency-amount' // Monetary value with currency semantics
  | 'percentage'      // Fractional / percentage value
  | 'geolocation'     // Geographic identifier (country, city, region, lat/lon)
  | 'email'           // Email address column
  | 'url'             // URL or URI column
  | 'unknown';        // Could not be classified with sufficient confidence

// ---------------------------------------------------------------------------
// Temporal Granularity
// ---------------------------------------------------------------------------

/**
 * Detected temporal granularity of a date/datetime column.
 * Determined by the smallest meaningful unit of difference across observed dates.
 */
export type TemporalGranularity =
  | 'year'
  | 'quarter'
  | 'month'
  | 'week'
  | 'day'
  | 'hour'
  | 'minute'
  | 'unknown';

// ---------------------------------------------------------------------------
// Column-Level Statistics
// ---------------------------------------------------------------------------

/**
 * Numeric statistics computed for a numeric/integer/currency/percentage column.
 * Computed in one sort-pass (median, Q1, Q3) plus one streaming pass (mean, variance).
 */
export interface NumericColumnStatistics {
  min: number;
  max: number;
  mean: number;
  median: number;
  /** First quartile (25th percentile) */
  q1: number;
  /** Third quartile (75th percentile) */
  q3: number;
  stdDev: number;
  /** Sum of all non-null values */
  sum: number;
  /** Count of values equal to zero */
  zeroCount: number;
  /** Count of values that are negative */
  negativeCount: number;
  /** Number of distinct numeric values */
  distinctCount: number;
  /**
   * Histogram of value distribution.
   * bins[i] is the left edge of bucket i; bins[i+1] is the right edge.
   * counts[i] is the number of values in bucket i.
   * Bin count determined by Sturges' rule: ceil(log2(n) + 1), clamped [5, 20].
   */
  histogram: {
    bins: number[];    // length = binCount + 1 (edges)
    counts: number[];  // length = binCount
    binWidth: number;
  };
}

/**
 * Statistics for boolean columns.
 */
export interface BooleanColumnStatistics {
  trueCount: number;
  falseCount: number;
  nullCount: number;
  /** Fraction of non-null values that are true (0.0–1.0) */
  trueRate: number;
}

/**
 * Statistics for date or datetime columns.
 */
export interface TemporalColumnStatistics {
  /** ISO 8601 string of the earliest date */
  minDate: string;
  /** ISO 8601 string of the latest date */
  maxDate: string;
  /** Range in milliseconds */
  rangeMs: number;
  /** Detected temporal granularity */
  granularity: TemporalGranularity;
  /** Number of distinct date values */
  distinctDateCount: number;
}

/**
 * String statistics computed for a string/label/identifier column.
 */
export interface StringColumnStatistics {
  /** Minimum string length (excluding null) */
  minLength: number;
  /** Maximum string length */
  maxLength: number;
  /** Average string length */
  avgLength: number;
  /** Number of distinct string values (exact when ≤ MAX_CARDINALITY_TRACKING, approximated otherwise) */
  distinctCount: number;
  /**
   * Cardinality ratio: distinctCount / totalNonNullCount.
   * Near 0 = highly categorical, near 1 = nearly unique per row.
   */
  cardinalityRatio: number;
  /** Up to TOP_VALUES_LIMIT (10) most frequent values with their occurrence counts */
  topValues: Array<{ value: string; count: number; percentage: number }>;
}

/**
 * Discriminated union of column statistics by inferred type class.
 */
export type VizPilotColumnStatistics =
  | { kind: 'numeric';   stats: NumericColumnStatistics }
  | { kind: 'string';    stats: StringColumnStatistics }
  | { kind: 'boolean';   stats: BooleanColumnStatistics }
  | { kind: 'temporal';  stats: TemporalColumnStatistics }
  | { kind: 'none' };

// ---------------------------------------------------------------------------
// Column Quality
// ---------------------------------------------------------------------------

/**
 * Data quality metrics for a single column.
 */
export interface VizPilotColumnQuality {
  /** Raw count of null values */
  nullCount: number;
  /** Fraction of values that are null (0.0–1.0) */
  nullRate: number;
  /** Raw count of distinct non-null values */
  uniqueCount: number;
  /**
   * Fraction of non-null values that are distinct (0.0–1.0).
   * High rate suggests an identifier; low rate suggests a category.
   */
  uniquenessRate: number;
  /**
   * Fraction of values that match the inferred type consistently (0.0–1.0).
   * Computed from the ingestion-layer inference confidence signals.
   */
  typeConsistencyRate: number;
  /** True if every non-null value in this column is identical */
  isConstant: boolean;
  /** True if every value in this column is null */
  isAllNull: boolean;
}

// ---------------------------------------------------------------------------
// Column Summary Counts (per table)
// ---------------------------------------------------------------------------

/**
 * Breakdown of column counts by broad type class.
 * Used for quick dataset characterization.
 */
export interface ColumnTypeSummary {
  numeric: number;     // integer / number / currency / percentage
  categorical: number; // string columns
  temporal: number;    // date / datetime columns
  boolean: number;     // boolean columns
  unknown: number;     // unknown / could not be inferred
}

// ---------------------------------------------------------------------------
// Column Profile
// ---------------------------------------------------------------------------

/**
 * Complete profile for a single column within a table.
 */
export interface VizPilotColumnProfile {
  /** Matches VizPilotColumn.id */
  columnId: string;
  /** Human-readable column name */
  name: string;
  /** Zero-indexed position in the table */
  index: number;
  /** Inferred data type from ingestion layer */
  inferredType: import('./dataset').InferredType;
  /**
   * Semantic role assigned by the profiling layer.
   * `null` when profiling has not yet been run.
   */
  semanticRole: SemanticRole | null;
  /** Statistical summary appropriate for this column's type */
  statistics: VizPilotColumnStatistics;
  /** Data quality metrics */
  quality: VizPilotColumnQuality;
  /** Representative sample values (up to 5 non-null distinct values) */
  sampleValues: import('./dataset').DataValue[];
}

// ---------------------------------------------------------------------------
// Table Profile
// ---------------------------------------------------------------------------

/**
 * Complete profile for a single table within a dataset.
 */
export interface VizPilotTableProfile {
  /** Matches VizPilotTable.id */
  tableId: string;
  /** Human-readable table name */
  name: string;
  /** Total row count (after normalization) */
  rowCount: number;
  /** Total column count */
  columnCount: number;
  /** Per-column profiles in column index order */
  columns: VizPilotColumnProfile[];
  /**
   * Fraction of rows that are complete (no null in any column).
   * 0.0 = all rows have at least one null, 1.0 = no nulls anywhere.
   */
  completenessRate: number;
  /** Raw count of duplicate rows detected */
  duplicateRowCount: number;
  /**
   * Fraction of rows that appear to be exact duplicates.
   * Computed as (duplicateRowCount / rowCount).
   * -1 when duplicate detection was skipped (too many rows).
   */
  duplicateRowRate: number;
  /** Breakdown of column count by broad type class */
  columnTypeSummary: ColumnTypeSummary;
  /**
   * True when this table had no rows (e.g. document-text with no tabular data).
   * An empty table profile is still valid — it signals no data is available.
   */
  isEmpty: boolean;
}

// ---------------------------------------------------------------------------
// Dataset-Level Summary
// ---------------------------------------------------------------------------

/**
 * Top-level aggregate summary of the entire dataset across all tables.
 */
export interface DatasetSummary {
  /** Total number of tables profiled */
  tableCount: number;
  /** Total rows across all tables */
  totalRows: number;
  /** Total columns across all tables */
  totalColumns: number;
  /** Total numeric columns across all tables */
  numericColumns: number;
  /** Total categorical (string) columns across all tables */
  categoricalColumns: number;
  /** Total temporal (date/datetime) columns across all tables */
  temporalColumns: number;
  /** Total boolean columns across all tables */
  booleanColumns: number;
  /** Total unknown-type columns across all tables */
  unknownColumns: number;
  /** Total completely empty (all-null) columns across all tables */
  emptyColumns: number;
  /** Total constant columns (all same value) across all tables */
  constantColumns: number;
}

// ---------------------------------------------------------------------------
// Dataset-Level Quality
// ---------------------------------------------------------------------------

/**
 * Aggregate data quality signals across the entire dataset.
 *
 * Quality Score Formula (transparent, documented):
 *   overallScore = 0.4 × avgCompletenessRate
 *                + 0.3 × avgTypeConsistencyRate
 *                + 0.2 × (1 - emptyColumnRate)
 *                + 0.1 × (1 - duplicateRowRate_clamped)
 *
 * Each component is clamped to [0, 1]. Score is in [0, 1].
 */
export interface VizPilotDataQuality {
  /**
   * Overall dataset quality score (0.0–1.0).
   * See formula above — fully deterministic, no AI.
   */
  overallScore: number;
  /** Average completeness rate across all tables (weighted by row count) */
  avgCompletenessRate: number;
  /** Average type consistency rate across all columns in all tables */
  avgTypeConsistencyRate: number;
  /**
   * True if any column has a null rate above 50%.
   */
  hasHighNullColumns: boolean;
  /**
   * True if any table has a duplicate row rate above 5%.
   */
  hasHighDuplicateRows: boolean;
}

// ---------------------------------------------------------------------------
// Relationship
// ---------------------------------------------------------------------------

/**
 * A detected structural relationship between two columns (potentially across tables).
 * Relationships are inferred by the Phase 2B profiling layer — deterministic, no AI.
 */
export interface VizPilotRelationship {
  /** Type of relationship detected */
  kind:
    | 'primary-key'    // Column is likely a primary key (very high uniqueness, identifier role)
    | 'foreign-key'    // Column references another table's identifier (reserved — cross-table)
    | 'correlated'     // Statistical correlation between two numeric columns (Pearson |r| > threshold)
    | 'date-hierarchy' // A date column paired with a measure (temporal → measure)
    | 'categorical-measure'; // A category column paired with a measure (dimension → measure)
  /** Source table ID */
  fromTableId: string;
  /** Source column ID */
  fromColumnId: string;
  /** Target table ID (same table for intra-table relationships) */
  toTableId: string;
  /** Target column ID */
  toColumnId: string;
  /**
   * Confidence score for this relationship (0.0–1.0).
   * For correlated: based on |Pearson r| and sample size.
   * For date-hierarchy / categorical-measure: based on column count and role confidence.
   */
  confidence: number;
  /**
   * Pearson correlation coefficient (only present for kind = 'correlated').
   * Range: -1.0 to +1.0. Negative = inverse correlation.
   */
  correlationCoefficient?: number;
}

// ---------------------------------------------------------------------------
// Profile Warnings
// ---------------------------------------------------------------------------

/**
 * A human-readable warning surfaced during profiling.
 * Warnings do not block analysis but indicate data quality concerns.
 */
export interface ProfileWarning {
  /** Severity level */
  level: 'info' | 'warning' | 'critical';
  /** Short stable machine-readable code */
  code: string;
  /** Human-readable message */
  message: string;
  /** Optional reference to the affected table/column */
  tableId?: string;
  columnId?: string;
}

// ---------------------------------------------------------------------------
// Root Profile Contract
// ---------------------------------------------------------------------------

/**
 * The canonical VizPilot data profile produced by the Phase 2B profiling engine.
 *
 * This is the primary output contract for all downstream systems:
 * - Chart recommendation engine (Phase 2C)
 * - Narrative generation (Phase 2D)
 * - Frontend analysis page
 *
 * A profile is always associated with a VizPilotDataset by its dataset ID.
 * The profile never contains raw row data — it is a statistical summary only.
 */
export interface VizPilotDataProfile {
  /** Matches VizPilotDataset.id */
  datasetId: string;
  /** ISO 8601 timestamp when this profile was computed */
  profiledAt: string;
  /**
   * Profiling engine version.
   * Used to detect stale profiles when engine logic changes between releases.
   */
  engineVersion: string;
  /** Top-level dataset summary across all tables */
  summary: DatasetSummary;
  /** Per-table profiles in the order they appear in the dataset */
  tables: VizPilotTableProfile[];
  /** Dataset-level aggregate quality summary */
  quality: VizPilotDataQuality;
  /**
   * Detected relationships between columns.
   * May be cross-table (reserved for future cross-table FK detection).
   */
  relationships: VizPilotRelationship[];
  /** Profiling warnings and observations */
  warnings: ProfileWarning[];
  /** Total profiling duration in milliseconds */
  durationMs: number;
}
