import type { PrivacyMode } from '@/src/types';
import type { VizPilotDataset, VizPilotSource } from '@/src/types/dataset';
import { IngestionError } from './errors';
import { validateUploadMetadata, validateBufferContent } from './validator';
import { adapterRegistry } from './adapters/registry';
import { normalizeDataset } from './normalizer';
import { safeIngestionLogger } from './logger';

export * from './errors';
export * from './validator';
export * from './inference';
export * from './normalizer';
export * from './logger';

export interface IngestionOptions {
  fileName: string;
  fileSize: number;
  mimeType?: string;
  mode?: PrivacyMode;
  buffer: Buffer;
}

export async function ingestFile(options: IngestionOptions): Promise<VizPilotDataset> {
  const startTime = performance.now();
  const mode: PrivacyMode = options.mode === 'zerotrace' ? 'zerotrace' : 'workspace';

  // 1. Validate file metadata (name, size, extension)
  const fileInfo = validateUploadMetadata(options.fileName, options.fileSize, options.mimeType);

  // 2. Validate byte content / magic signatures
  validateBufferContent(options.buffer, fileInfo);

  const source: VizPilotSource = {
    fileName: fileInfo.fileName,
    fileSize: fileInfo.fileSize,
    fileType: fileInfo.fileType,
    mimeType: fileInfo.mimeType,
    uploadedAt: new Date().toISOString(),
    mode,
  };

  try {
    // 3. Resolve adapter
    const adapter = adapterRegistry.getAdapter(fileInfo.fileType, fileInfo.mimeType);

    // 4. Extract raw table data
    const rawResult = await adapter.extract(options.buffer, source);

    const durationMs = performance.now() - startTime;
    rawResult.durationMs = durationMs;

    // 5. Normalize structure and infer column types
    const dataset = normalizeDataset(rawResult, source);

    // 6. Safe telemetry logging
    safeIngestionLogger.log({
      fileType: source.fileType,
      fileSize: source.fileSize,
      mode: source.mode,
      tablesCount: dataset.tables.length,
      rowCounts: dataset.tables.map((t) => t.rowCount),
      columnCounts: dataset.tables.map((t) => t.columnCount),
      durationMs,
      success: true,
      // Document-specific metadata (undefined for CSV/XLSX)
      ...(dataset.extraction.pagesProcessed !== undefined && { pagesProcessed: dataset.extraction.pagesProcessed }),
      ...(dataset.extraction.textBlocksDetected !== undefined && { textBlocksDetected: dataset.extraction.textBlocksDetected }),
      ...(dataset.extraction.tablesDetected !== undefined && { tablesDetected: dataset.extraction.tablesDetected }),
    });


    return dataset;
  } catch (err) {
    const durationMs = performance.now() - startTime;
    const isIngestionErr = err instanceof IngestionError;
    const errorCode = isIngestionErr ? err.code : 'PARSE_FAILED';

    safeIngestionLogger.log({
      fileType: source.fileType,
      fileSize: source.fileSize,
      mode: source.mode,
      durationMs,
      success: false,
      errorCode,
    });

    if (isIngestionErr) {
      throw err;
    }

    throw new IngestionError(
      'PARSE_FAILED',
      `Failed to process file "${source.fileName}": ${err instanceof Error ? err.message : 'Unknown parsing error'}`,
      422,
      true
    );
  }
}
