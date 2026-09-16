/**
 * PDFAdapter — Phase 2A.2
 *
 * Extracts structured tabular data and/or text blocks from text-based PDF files.
 *
 * ZERO-TRACE COMPLIANCE:
 * - Never logs paragraph text, cell content, or extracted text
 * - Safe logs: file type, page count, tables detected, text blocks detected,
 *   row counts, duration, result code
 *
 * SCANNED PDF DETECTION:
 * - After extracting text, compute chars-per-page ratio
 * - If below OCR_TEXT_DENSITY_THRESHOLD on the majority of pages, throw OCR_REQUIRED
 *
 * TABLE DETECTION HEURISTIC:
 * - A line is "tabular" when it contains ≥2 tokens separated by a tab OR ≥3 spaces
 * - Consecutive tabular lines with consistent column counts (±1 tolerance) form a table
 * - Minimum TABLE_MIN_ROWS rows required to be recognised as a table
 * - Column count is the mode of all candidate line widths in the block
 *
 * FALLBACK:
 * - If no tables detected but readable text exists, returns document text blocks
 * - If both empty: throws NO_USABLE_TABULAR_DATA
 */

import type { FileAdapter, RawExtractionResult, RawTable } from './types';
import type {
  SupportedFileType,
  VizPilotDocumentContent,
  VizPilotSource,
  VizPilotTextBlock,
} from '@/src/types/dataset';
import { IngestionError } from '../errors';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** chars per page — below this on average suggests a scanned/image PDF */
const OCR_TEXT_DENSITY_THRESHOLD = 80;

/** Minimum proportion of pages that must be text-rich to avoid OCR_REQUIRED */
const MIN_TEXT_RICH_PAGE_RATIO = 0.5;

/** Minimum number of consecutive aligned rows to constitute a detected table */
const TABLE_MIN_ROWS = 3;

/** Minimum number of columns a line must have to be considered tabular */
const TABLE_MIN_COLS = 2;

/** Pattern matching tab or 3+ consecutive spaces as column separators */
const CELL_SEPARATOR_RE = /\t| {3,}/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function splitIntoTokens(line: string): string[] {
  return line
    .split(CELL_SEPARATOR_RE)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function isTabularLine(line: string): boolean {
  const tokens = splitIntoTokens(line);
  return tokens.length >= TABLE_MIN_COLS;
}

/** Return the statistical mode of an array of numbers */
function mode(arr: number[]): number {
  const freq = new Map<number, number>();
  for (const n of arr) freq.set(n, (freq.get(n) ?? 0) + 1);
  let best = arr[0];
  let bestFreq = 0;
  for (const [n, f] of freq) {
    if (f > bestFreq) { bestFreq = f; best = n; }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Text block extraction (non-tabular)
// ---------------------------------------------------------------------------

function extractTextBlocks(
  lines: string[],
  pageNumber: number
): VizPilotTextBlock[] {
  const blocks: VizPilotTextBlock[] = [];
  let blockIdx = 0;

  for (const rawLine of lines) {
    const text = rawLine.trim();
    if (!text) continue;
    if (isTabularLine(text)) continue; // skip lines already captured as tables

    const role: VizPilotTextBlock['role'] =
      text.length < 80 && text === text.toUpperCase()
        ? 'heading'        // short all-caps line → heading heuristic
        : text.startsWith('•') || text.startsWith('-') || text.startsWith('*')
        ? 'list-item'
        : 'paragraph';

    blocks.push({
      id: `page${pageNumber}_blk${blockIdx++}`,
      role,
      text,
      pageNumber,
    });
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Table detection from a block of consecutive tabular lines
// ---------------------------------------------------------------------------

interface RawTableBlock {
  lines: string[][];  // tokenised rows
  pageNumber: number;
  blockIndex: number;
}

function detectTableBlocks(
  lines: string[],
  pageNumber: number,
  pageBlockOffset: number
): RawTableBlock[] {
  const blocks: RawTableBlock[] = [];
  let currentBlock: string[][] = [];

  function flushBlock() {
    if (currentBlock.length >= TABLE_MIN_ROWS) {
      blocks.push({ lines: currentBlock, pageNumber, blockIndex: pageBlockOffset + blocks.length });
    }
    currentBlock = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushBlock();
      continue;
    }
    if (isTabularLine(trimmed)) {
      currentBlock.push(splitIntoTokens(trimmed));
    } else {
      flushBlock();
    }
  }
  flushBlock();

  return blocks;
}

function rawTableBlockToRawTable(block: RawTableBlock, tableIndex: number): RawTable {
  // Determine the dominant column count (mode of row widths)
  const colCounts = block.lines.map((r) => r.length);
  const dominantCols = mode(colCounts);

  // Filter rows to those within ±1 of dominant column count
  const eligibleRows = block.lines.filter(
    (r) => Math.abs(r.length - dominantCols) <= 1
  );

  if (eligibleRows.length < TABLE_MIN_ROWS) {
    // Not enough consistent rows after filtering
    return { name: `Table ${tableIndex + 1}`, headers: [], rawRows: [] };
  }

  // Treat the first row as headers; rest as data
  const [headerRow, ...dataRows] = eligibleRows;
  const headers = headerRow.map((h, i) => (h.trim() || `Column_${i + 1}`));

  // Pad or trim data rows to match header count
  const rawRows: unknown[][] = dataRows.map((row) => {
    const padded = [...row];
    while (padded.length < headers.length) padded.push('');
    return padded.slice(0, headers.length);
  });

  return {
    name: `Table ${tableIndex + 1} (Page ${block.pageNumber})`,
    headers,
    rawRows,
  };
}

// ---------------------------------------------------------------------------
// PDFAdapter
// ---------------------------------------------------------------------------

export class PDFAdapter implements FileAdapter {
  supports(fileType: SupportedFileType): boolean {
    return fileType === 'pdf';
  }

  async extract(
    buffer: Buffer,
    source: VizPilotSource
  ): Promise<RawExtractionResult> {
    const startTime = performance.now();
    const warnings: string[] = [];
    // ── PDF Signature Validation ──────────────────────────────────────────
    // Standard PDF format begins with %PDF- header within the first 1024 bytes
    const headerBytes = buffer.subarray(0, Math.min(buffer.length, 1024)).toString('latin1');
    if (!headerBytes.includes('%PDF-')) {
      throw new IngestionError(
        'INVALID_FILE',
        `"${source.fileName}" is not a valid PDF file. Missing PDF signature header (%PDF-).`,
        422,
        false
      );
    }

    // ── Parse PDF ──────────────────────────────────────────────────────────
    let fullText = '';
    let pageCount = 1;

    try {
      const pathMod = await import('path');
      const urlMod = await import('url');
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

      const workerPath = pathMod.default.resolve(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = urlMod.pathToFileURL(workerPath).href;

      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(buffer),
        disableFontFace: true,
        useSystemFonts: true,
      });

      const doc = await loadingTask.promise;
      pageCount = doc.numPages || 1;

      const pageTexts: string[] = [];
      for (let i = 1; i <= pageCount; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        let pageStr = '';
        let lastY: number | undefined = undefined;

        for (const rawItem of content.items) {
          const item = rawItem as any;
          const str = item.str ?? '';
          const y = item.transform ? item.transform[5] : undefined;

          if (lastY !== undefined && y !== undefined && Math.abs(y - lastY) > 3) {
            pageStr += '\n';
          } else if (item.hasEOL) {
            pageStr += str + '\n';
            lastY = y;
            continue;
          } else if (pageStr.length > 0 && !pageStr.endsWith('\n') && !pageStr.endsWith(' ') && str.length > 0) {
            pageStr += '   ';
          }
          pageStr += str;
          lastY = y;
        }
        pageTexts.push(pageStr);
      }
      fullText = pageTexts.join('\f');
    } catch (err: any) {
      const errName = err?.name || '';
      const errMsg = err?.message || String(err);
      const lowerMsg = errMsg.toLowerCase();

      // Password / encrypted PDF detection
      if (
        errName === 'PasswordException' ||
        lowerMsg.includes('password') ||
        lowerMsg.includes('encrypted') ||
        lowerMsg.includes('encrypt')
      ) {
        throw new IngestionError(
          'INVALID_FILE',
          `"${source.fileName}" is encrypted or password-protected. Please provide an unencrypted PDF.`,
          422,
          false,
          { detail: 'PASSWORD_PROTECTED' }
        );
      }

      // Invalid / corrupted PDF structure
      if (
        errName === 'InvalidPDFException' ||
        errName === 'FormatError' ||
        lowerMsg.includes('invalid pdf') ||
        lowerMsg.includes('corrupted')
      ) {
        throw new IngestionError(
          'INVALID_FILE',
          `"${source.fileName}" has an invalid or corrupted PDF structure.`,
          422,
          false,
          { detail: errMsg }
        );
      }

      // Other document parse errors
      throw new IngestionError(
        'DOCUMENT_PARSE_FAILED',
        `"${source.fileName}" could not be parsed as a PDF. Error: ${errMsg}`,
        422,
        true,
        { detail: errMsg }
      );
    }

    // ── Scanned PDF detection ──────────────────────────────────────────────
    // pdf-parse extracts per-page text via a render callback; without it we
    // use aggregate text / pageCount as a proxy for density.
    const totalChars = fullText.replace(/\s+/g, ' ').trim().length;
    const avgCharsPerPage = totalChars / pageCount;

    if (avgCharsPerPage < OCR_TEXT_DENSITY_THRESHOLD) {
      // Very low text density — strongly suggests a scanned image PDF
      throw new IngestionError(
        'OCR_REQUIRED',
        `"${source.fileName}" appears to be a scanned image PDF (avg ${Math.round(avgCharsPerPage)} chars/page). ` +
        `VizPilot requires text-based PDFs. Please convert to a searchable PDF or export your data as CSV/XLSX.`,
        422,
        false,  // not recoverable without user action
        { avgCharsPerPage: Math.round(avgCharsPerPage), pageCount }
      );
    }

    // ── Split into lines and process per "page" ────────────────────────────
    // pdf-parse returns all text concatenated; we approximate page boundaries
    // by splitting on form-feed characters if present, otherwise treat as one block.
    const pageTexts = fullText.includes('\f')
      ? fullText.split('\f')
      : [fullText];

    const allTableBlocks: RawTableBlock[] = [];
    const allTextBlocks: VizPilotTextBlock[] = [];
    let globalBlockOffset = 0;

    for (let pageIdx = 0; pageIdx < pageTexts.length; pageIdx++) {
      const pageText = pageTexts[pageIdx];
      const pageNum = pageIdx + 1;
      const lines = pageText.split('\n');

      // Detect table blocks on this page
      const tableBlocks = detectTableBlocks(lines, pageNum, globalBlockOffset);
      allTableBlocks.push(...tableBlocks);
      globalBlockOffset += tableBlocks.length;

      // Extract non-tabular text blocks
      const textBlocks = extractTextBlocks(lines, pageNum);
      allTextBlocks.push(...textBlocks);
    }

    // ── Build RawTable list ────────────────────────────────────────────────
    const rawTables: RawTable[] = allTableBlocks
      .map((block, idx) => rawTableBlockToRawTable(block, idx))
      .filter((t) => t.headers.length > 0 && t.rawRows.length > 0);

    // Warn if some blocks were discarded
    const discarded = allTableBlocks.length - rawTables.length;
    if (discarded > 0) {
      warnings.push(
        `${discarded} potential table block(s) were discarded due to inconsistent column counts.`
      );
    }

    // If no tables and no text blocks were formed (e.g. lines were marked tabular but discarded),
    // rescue non-empty text lines so readable document content is not falsely rejected
    if (rawTables.length === 0 && allTextBlocks.length === 0) {
      for (let pageIdx = 0; pageIdx < pageTexts.length; pageIdx++) {
        const pageText = pageTexts[pageIdx];
        const pageNum = pageIdx + 1;
        const lines = pageText.split('\n');
        for (const rawLine of lines) {
          const text = rawLine.trim();
          if (!text) continue;
          allTextBlocks.push({
            id: `page${pageNum}_blk${allTextBlocks.length}`,
            role: 'paragraph',
            text,
            pageNumber: pageNum,
          });
        }
      }
    }

    const tablesDetected = allTableBlocks.length;
    const textBlocksDetected = allTextBlocks.length;

    // ── Determine extraction result ────────────────────────────────────────
    const hasTables = rawTables.length > 0;
    const hasText = allTextBlocks.length > 0;

    if (!hasTables && !hasText) {
      throw new IngestionError(
        'NO_USABLE_TABULAR_DATA',
        `"${source.fileName}" was successfully parsed but contained no extractable tables or readable text.`,
        422,
        true
      );
    }

    // Determine extraction method
    let method: string;
    if (hasTables && hasText) {
      method = 'mixed';
    } else if (hasTables) {
      method = 'document-table';
    } else {
      method = 'document-text';
    }

    if (!hasTables) {
      warnings.push(
        'No structured tables were detected. Text blocks have been extracted for document-level access.'
      );
    }

    // ── Build document content ─────────────────────────────────────────────
    const documentContent: VizPilotDocumentContent = {
      textBlocks: allTextBlocks,
      pageCount,
      hasDetectedTables: tablesDetected > 0,
      ocrLikely: false,
    };

    const durationMs = performance.now() - startTime;

    return {
      tables: rawTables,
      method,
      warnings,
      confidence: hasTables ? 0.75 : 0.5,
      durationMs,
      documentContent,
      tablesDetected,
      textBlocksDetected,
      pagesProcessed: pageCount,
    };
  }
}
