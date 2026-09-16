import type { PrivacyMode } from '@/src/types';

export type InferredType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'currency'
  | 'percentage'
  | 'unknown';

export type DataValue = string | number | boolean | null;

export type SupportedFileType = 'csv' | 'xlsx' | 'pdf' | 'docx';

/**
 * Semantic role of a text block extracted from a document (PDF/DOCX).
 */
export type TextBlockRole =
  | 'heading'
  | 'paragraph'
  | 'list-item'
  | 'caption'
  | 'unknown';

/**
 * A discrete block of text extracted from a document source.
 * Text content is present only client-side; never persisted server-side.
 */
export interface VizPilotTextBlock {
  /** Stable unique identifier within the document extraction */
  id: string;
  /** Semantic classification of this block */
  role: TextBlockRole;
  /** The extracted text string */
  text: string;
  /** 1-indexed page number where this block was found (if known) */
  pageNumber?: number;
  /** Extraction confidence for this individual block (0.0–1.0) */
  confidence?: number;
}

/**
 * Document-level content extracted from PDF or DOCX files.
 * Carried alongside tabular data when the file contains both.
 */
export interface VizPilotDocumentContent {
  /** Non-tabular text blocks in document order */
  textBlocks: VizPilotTextBlock[];
  /** Total number of pages processed (PDF only) */
  pageCount: number;
  /** Whether structural tables were detected in the source document */
  hasDetectedTables: boolean;
  /**
   * True when text density is low enough that the file is likely a
   * scanned image PDF. Signals that OCR would be needed for richer extraction.
   */
  ocrLikely: boolean;
}

export interface VizPilotColumn {
  id: string;
  name: string;
  index: number;
  inferredType: InferredType;
  sampleValues: DataValue[];
  nullable: boolean;
  nullCount: number;
  totalCount: number;
}

export interface VizPilotTable {
  id: string;
  name: string;
  columns: VizPilotColumn[];
  rows: DataValue[][];
  rowCount: number;
  columnCount: number;
}

export interface VizPilotSource {
  fileName: string;
  fileSize: number;
  fileType: SupportedFileType;
  mimeType: string;
  uploadedAt: string;
  mode: PrivacyMode;
}

/**
 * Extraction method indicates how the data was extracted from the source file.
 * - `structured`      — direct parse of a structured format (CSV, XLSX)
 * - `document-table`  — tables detected and extracted from a document (PDF, DOCX)
 * - `document-text`   — only unstructured text blocks extracted (no tables)
 * - `mixed`           — both tables and unstructured text blocks extracted
 */
export type ExtractionMethod =
  | 'structured'
  | 'document-table'
  | 'document-text'
  | 'mixed';

export interface VizPilotExtraction {
  method: ExtractionMethod;
  durationMs: number;
  confidence: number; // 0.0 to 1.0
  warnings: string[];
  /** Number of structural tables detected in the source document (PDF/DOCX only) */
  tablesDetected?: number;
  /** Number of text blocks extracted from the document (PDF/DOCX only) */
  textBlocksDetected?: number;
  /** Number of pages processed (PDF only) */
  pagesProcessed?: number;
}

export interface VizPilotDataset {
  id: string;
  name: string;
  source: VizPilotSource;
  tables: VizPilotTable[];
  extraction: VizPilotExtraction;
  createdAt: string;
  processingMode: PrivacyMode;
  /**
   * Document-level content for PDF/DOCX files.
   * Present when the source is a document and text blocks were extracted.
   */
  document?: VizPilotDocumentContent;
}
