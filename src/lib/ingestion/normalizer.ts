import type {
  DataValue,
  ExtractionMethod,
  VizPilotColumn,
  VizPilotDataset,
  VizPilotSource,
  VizPilotTable,
} from '@/src/types/dataset';
import type { RawExtractionResult, RawTable } from './adapters/types';
import { inferColumnType } from './inference';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'field';
}

function normalizeCellValue(cell: unknown): DataValue {
  if (cell === null || cell === undefined) return null;
  if (typeof cell === 'boolean') return cell;
  if (typeof cell === 'number') {
    if (isNaN(cell) || !isFinite(cell)) return null;
    return cell;
  }
  const str = String(cell).trim();
  if (str === '') return null;
  return str;
}

export function normalizeTable(raw: RawTable, tableIndex: number): VizPilotTable {
  const tableSlug = slugify(raw.name);
  const tableId = `tbl_${tableIndex}_${tableSlug}`;

  // 1. Process column headers and generate unique IDs for duplicate headers
  const headerSeenCount = new Map<string, number>();
  const columns: VizPilotColumn[] = raw.headers.map((origName, colIdx) => {
    const displayName = origName.trim() || `Column_${colIdx + 1}`;
    const baseSlug = slugify(displayName);

    const seen = headerSeenCount.get(baseSlug) ?? 0;
    headerSeenCount.set(baseSlug, seen + 1);

    const colId = seen === 0 ? `col_${colIdx}_${baseSlug}` : `col_${colIdx}_${baseSlug}_${seen + 1}`;

    return {
      id: colId,
      name: displayName,
      index: colIdx,
      inferredType: 'unknown',
      sampleValues: [],
      nullable: false,
      nullCount: 0,
      totalCount: 0,
    };
  });

  const columnCount = columns.length;

  // 2. Normalize rows: ensure uniform rectangular dimensions and coalesce empty cells to null
  const normalizedRows: DataValue[][] = [];

  for (const rawRow of raw.rawRows) {
    if (!Array.isArray(rawRow)) continue;

    // Check if entire row is empty
    const rowValues = columns.map((_, colIdx) => normalizeCellValue(rawRow[colIdx]));
    const isAllNull = rowValues.every((v) => v === null);
    if (isAllNull) continue;

    normalizedRows.push(rowValues);
  }

  const rowCount = normalizedRows.length;

  // 3. Compute column statistics and run deterministic type inference
  for (let c = 0; c < columnCount; c++) {
    const col = columns[c];
    const colValues = normalizedRows.map((r) => r[c]);
    const nulls = colValues.filter((v) => v === null).length;

    col.totalCount = rowCount;
    col.nullCount = nulls;
    col.nullable = nulls > 0;

    // Sample first 5 distinct non-null values
    const distinctSamples = Array.from(
      new Set(colValues.filter((v): v is NonNullable<DataValue> => v !== null))
    ).slice(0, 5);
    col.sampleValues = distinctSamples;

    // Infer column type
    col.inferredType = inferColumnType(colValues);
  }

  return {
    id: tableId,
    name: raw.name.trim() || `Table ${tableIndex + 1}`,
    columns,
    rows: normalizedRows,
    rowCount,
    columnCount,
  };
}

export function normalizeDataset(
  extraction: RawExtractionResult,
  source: VizPilotSource
): VizPilotDataset {
  const datasetId = `ds_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const datasetName = source.fileName.replace(/\.[^/.]+$/, '') || 'VizPilot Dataset';

  const tables: VizPilotTable[] = extraction.tables.map((rawTable, idx) =>
    normalizeTable(rawTable, idx)
  );

  // Resolve extraction method — default 'structured' for CSV/XLSX
  const resolvedMethod: ExtractionMethod =
    extraction.method === 'document-table' ? 'document-table'
    : extraction.method === 'document-text' ? 'document-text'
    : extraction.method === 'mixed' ? 'mixed'
    : 'structured';

  return {
    id: datasetId,
    name: datasetName,
    source,
    tables,
    extraction: {
      method: resolvedMethod,
      durationMs: extraction.durationMs ?? 0,
      confidence: extraction.confidence,
      warnings: extraction.warnings,
      // Document-specific metadata — only included for PDF/DOCX (undefined for CSV/XLSX)
      ...(extraction.tablesDetected !== undefined && { tablesDetected: extraction.tablesDetected }),
      ...(extraction.textBlocksDetected !== undefined && { textBlocksDetected: extraction.textBlocksDetected }),
      ...(extraction.pagesProcessed !== undefined && { pagesProcessed: extraction.pagesProcessed }),
    },
    createdAt: new Date().toISOString(),
    processingMode: source.mode,
    // Document content — only included for PDF/DOCX (undefined for CSV/XLSX)
    ...(extraction.documentContent !== undefined && { document: extraction.documentContent }),
  };
}
