/**
 * Table and Dataset Profiler Orchestrator — Phase 2B
 *
 * Coordinates table-level and dataset-level profiling.
 * Implements deterministic profiling with zero external/AI dependencies.
 */

import type {
  ColumnTypeSummary,
  DatasetSummary,
  ProfileWarning,
  VizPilotColumnProfile,
  VizPilotDataProfile,
  VizPilotTableProfile,
} from '@/src/types/profiling';
import type { VizPilotDataset, VizPilotTable } from '@/src/types/dataset';
import { extractColumnValues, isBooleanType, isNumericType, isTemporalType, round } from './utils';
import { deterministicSample } from './sampling';
import { profileColumn } from './column-profiler';
import {
  computeCompletenessRate,
  computeDataQuality,
  detectDuplicateRows,
} from './quality';
import { detectTableRelationships } from './relationships';

export const PROFILER_VERSION = '2B.0';

/** Tables with more rows than this threshold will be deterministically sampled for deep profiling */
export const MAX_SAMPLE_ROWS = 50_000;

// ---------------------------------------------------------------------------
// Table Profiling
// ---------------------------------------------------------------------------

export function profileTable(
  table: VizPilotTable,
  datasetId: string,
  warnings: ProfileWarning[]
): VizPilotTableProfile {
  const rowCount = table.rowCount;
  const columnCount = table.columnCount;
  const tableId = table.id;

  if (rowCount === 0 || columnCount === 0) {
    const emptySummary: ColumnTypeSummary = {
      numeric: 0,
      categorical: 0,
      temporal: 0,
      boolean: 0,
      unknown: 0,
    };

    warnings.push({
      level: 'warning',
      code: 'EMPTY_TABLE',
      message: `Table "${table.name}" contains no tabular rows or columns.`,
      tableId,
    });

    return {
      tableId,
      name: table.name,
      rowCount: 0,
      columnCount: 0,
      columns: [],
      completenessRate: 1,
      duplicateRowCount: 0,
      duplicateRowRate: 0,
      columnTypeSummary: emptySummary,
      isEmpty: true,
    };
  }

  // Check if deterministic sampling should be applied
  const sampleResult = deterministicSample(table.rows, MAX_SAMPLE_ROWS, `${datasetId}_${tableId}`);
  if (sampleResult.wasSampled) {
    warnings.push({
      level: 'info',
      code: 'SAMPLED_PROFILING',
      message: `Table "${table.name}" with ${rowCount} rows was deterministically sampled to ${MAX_SAMPLE_ROWS} rows for performance.`,
      tableId,
    });
  }

  const activeRows = sampleResult.rows;

  // 1. Profile columns
  const columnProfiles: VizPilotColumnProfile[] = [];
  const colSummary: ColumnTypeSummary = {
    numeric: 0,
    categorical: 0,
    temporal: 0,
    boolean: 0,
    unknown: 0,
  };

  for (let c = 0; c < table.columns.length; c++) {
    const col = table.columns[c];
    const colValues = extractColumnValues(activeRows, col.index);
    const colProfile = profileColumn(col, colValues, rowCount);
    columnProfiles.push(colProfile);

    // Track column type breakdown
    const t = col.inferredType;
    if (isNumericType(t)) colSummary.numeric++;
    else if (isTemporalType(t)) colSummary.temporal++;
    else if (isBooleanType(t)) colSummary.boolean++;
    else if (t === 'string') colSummary.categorical++;
    else colSummary.unknown++;

    // Check quality warnings per column
    if (colProfile.quality.isAllNull) {
      warnings.push({
        level: 'warning',
        code: 'ALL_NULL_COLUMN',
        message: `Column "${col.name}" in table "${table.name}" is completely empty.`,
        tableId,
        columnId: col.id,
      });
    }

    if (!colProfile.quality.isAllNull && colProfile.quality.isConstant) {
      warnings.push({
        level: 'info',
        code: 'CONSTANT_COLUMN',
        message: `Column "${col.name}" in table "${table.name}" contains a single constant value.`,
        tableId,
        columnId: col.id,
      });
    }

    if (colProfile.quality.nullRate > 0.5) {
      warnings.push({
        level: 'warning',
        code: 'HIGH_NULL_RATE',
        message: `Column "${col.name}" in table "${table.name}" has ${Math.round(colProfile.quality.nullRate * 100)}% missing values.`,
        tableId,
        columnId: col.id,
      });
    }
  }


  // 2. Table-level completeness
  const completenessRate = computeCompletenessRate(activeRows, columnCount);

  // 3. Table-level duplicate rows
  const dupResult = detectDuplicateRows(activeRows);
  if (dupResult.skipped) {
    warnings.push({
      level: 'info',
      code: 'DUPLICATE_DETECTION_SKIPPED',
      message: `Duplicate row detection skipped for table "${table.name}" due to scale (> 100,000 rows).`,
      tableId,
    });
  }

  return {
    tableId,
    name: table.name,
    rowCount,
    columnCount,
    columns: columnProfiles,
    completenessRate,
    duplicateRowCount: dupResult.duplicateRowCount,
    duplicateRowRate: dupResult.duplicateRowRate,
    columnTypeSummary: colSummary,
    isEmpty: false,
  };
}

// ---------------------------------------------------------------------------
// Dataset Profiling Orchestrator
// ---------------------------------------------------------------------------

export function profileDatasetCore(dataset: VizPilotDataset): VizPilotDataProfile {
  const startTime = performance.now();
  const warnings: ProfileWarning[] = [];
  const datasetId = dataset.id;

  // Profile all tables
  const tableProfiles: VizPilotTableProfile[] = [];
  for (const table of dataset.tables) {
    const tp = profileTable(table, datasetId, warnings);
    tableProfiles.push(tp);
  }

  // Detect relationships across tables
  const allRelationships = tableProfiles.flatMap((tp) => {
    const table = dataset.tables.find((t) => t.id === tp.tableId);
    if (!table || tp.isEmpty) return [];
    return detectTableRelationships(table, tp);
  });

  // Aggregate dataset quality
  const quality = computeDataQuality(tableProfiles);

  // Dataset-level summary
  let totalRows = 0;
  let totalColumns = 0;
  let numericColumns = 0;
  let categoricalColumns = 0;
  let temporalColumns = 0;
  let booleanColumns = 0;
  let unknownColumns = 0;
  let emptyColumns = 0;
  let constantColumns = 0;

  for (const tp of tableProfiles) {
    totalRows += tp.rowCount;
    totalColumns += tp.columnCount;
    numericColumns += tp.columnTypeSummary.numeric;
    categoricalColumns += tp.columnTypeSummary.categorical;
    temporalColumns += tp.columnTypeSummary.temporal;
    booleanColumns += tp.columnTypeSummary.boolean;
    unknownColumns += tp.columnTypeSummary.unknown;

    for (const col of tp.columns) {
      if (col.quality.isAllNull) emptyColumns++;
      if (col.quality.isConstant) constantColumns++;
    }
  }

  const summary: DatasetSummary = {
    tableCount: dataset.tables.length,
    totalRows,
    totalColumns,
    numericColumns,
    categoricalColumns,
    temporalColumns,
    booleanColumns,
    unknownColumns,
    emptyColumns,
    constantColumns,
  };

  const durationMs = round(performance.now() - startTime, 2);

  return {
    datasetId,
    profiledAt: new Date().toISOString(),
    engineVersion: PROFILER_VERSION,
    summary,
    tables: tableProfiles,
    quality,
    relationships: allRelationships,
    warnings,
    durationMs,
  };
}
