import type { SupportedFileType, VizPilotDocumentContent, VizPilotSource } from '@/src/types/dataset';

export interface RawTable {
  name: string;
  headers: string[];
  rawRows: unknown[][];
}

export interface RawExtractionResult {
  tables: RawTable[];
  method: string;
  warnings: string[];
  confidence: number;
  durationMs?: number;
  /**
   * Optional document-level content for PDF/DOCX sources.
   * Passed through by document adapters alongside (or instead of) tables.
   * Never persisted server-side — forwarded to client as part of VizPilotDataset.
   */
  documentContent?: VizPilotDocumentContent;
  /** Total structural tables detected in source document (before extraction) */
  tablesDetected?: number;
  /** Total text blocks extracted from source document */
  textBlocksDetected?: number;
  /** Number of pages processed (PDF only) */
  pagesProcessed?: number;
}

export interface FileAdapter {
  supports(fileType: SupportedFileType, mimeType: string): boolean;
  extract(buffer: Buffer, source: VizPilotSource): Promise<RawExtractionResult>;
}

