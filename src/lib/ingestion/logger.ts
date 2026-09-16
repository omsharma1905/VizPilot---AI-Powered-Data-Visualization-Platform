import type { SupportedFileType } from '@/src/types/dataset';

export interface IngestionLogPayload {
  fileType: SupportedFileType;
  fileSize: number;
  mode: 'workspace' | 'zerotrace';
  tablesCount?: number;
  rowCounts?: number[];
  columnCounts?: number[];
  durationMs: number;
  success: boolean;
  errorCode?: string;
  // Document-specific fields (PDF/DOCX only) — never include text content
  pagesProcessed?: number;
  textBlocksDetected?: number;
  tablesDetected?: number;
}

export const safeIngestionLogger = {
  log(payload: IngestionLogPayload): void {
    // Strictly operational metrics — never log row content, buffer bytes, cell values,
    // extracted text, paragraph content, or document text of any kind.
    const timestamp = new Date().toISOString();
    const prefix = payload.mode === 'zerotrace' ? '[ZERO-TRACE INGEST]' : '[INGEST]';

    if (payload.success) {
      // Build optional document metadata segment
      const docMeta = [
        payload.pagesProcessed !== undefined ? `pages=${payload.pagesProcessed}` : '',
        payload.tablesDetected !== undefined ? `tables_detected=${payload.tablesDetected}` : '',
        payload.textBlocksDetected !== undefined ? `text_blocks=${payload.textBlocksDetected}` : '',
      ]
        .filter(Boolean)
        .join(' ');

      console.log(
        `${prefix} ${timestamp} · type=${payload.fileType} size=${payload.fileSize}B ` +
          `tables=${payload.tablesCount ?? 1} rows=[${(payload.rowCounts ?? []).join(',')}] ` +
          (docMeta ? `${docMeta} ` : '') +
          `duration=${payload.durationMs.toFixed(1)}ms status=SUCCESS`
      );
    } else {
      console.warn(
        `${prefix} ${timestamp} · type=${payload.fileType} size=${payload.fileSize}B ` +
          `error=${payload.errorCode} duration=${payload.durationMs.toFixed(1)}ms status=FAILED`
      );
    }
  },
};
