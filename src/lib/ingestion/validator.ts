import { IngestionError } from './errors';
import type { SupportedFileType } from '@/src/types/dataset';

export const INGESTION_CONFIG = {
  // ── Upload limits ────────────────────────────────────────────────────────
  /** Maximum raw file size accepted by the /api/ingest endpoint */
  MAX_UPLOAD_BYTES: 50 * 1024 * 1024, // 50MB

  // ── Interactive processing limits ────────────────────────────────────────
  /**
   * Maximum number of rows that will be processed into the canonical dataset.
   * Files exceeding this will be truncated with a warning — never rejected.
   */
  MAX_INTERACTIVE_ROWS: 100_000,

  /**
   * Soft cap on the JSON-serialised dataset size returned to the client.
   * If the serialised dataset exceeds this, the rows array is progressively
   * trimmed (by half) until it fits or MIN_ROWS is reached.
   */
  MAX_CLIENT_RESPONSE_SIZE: 4 * 1024 * 1024, // 4MB

  /**
   * Maximum number of rows included in the preview slice shown on the
   * analysis page before the user requests more.
   */
  MAX_PREVIEW_ROWS: 500,

  SUPPORTED_EXTENSIONS: ['csv', 'xlsx', 'xls', 'pdf', 'docx'] as const,
  MIME_TYPES: {
    csv: [
      'text/csv',
      'text/plain',
      'application/csv',
      'application/vnd.ms-excel',
      'text/x-csv',
      '',
    ],
    xlsx: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/zip',
      'application/octet-stream',
      '',
    ],
    xls: ['application/vnd.ms-excel', 'application/octet-stream', ''],
    pdf: ['application/pdf', 'application/x-pdf', ''],
    docx: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/octet-stream',
      '',
    ],
  },
};


export interface ValidatedFileInfo {
  fileName: string;
  fileSize: number;
  extension: string;
  fileType: SupportedFileType;
  mimeType: string;
}

export function validateUploadMetadata(
  fileName: string | undefined,
  fileSize: number,
  mimeType: string = ''
): ValidatedFileInfo {
  if (!fileName || typeof fileName !== 'string' || fileName.trim() === '') {
    throw new IngestionError('INVALID_FILE', 'No file was provided for ingestion.', 400, false);
  }

  const cleanName = fileName.trim();

  // Empty file check
  if (fileSize <= 0) {
    throw new IngestionError('EMPTY_FILE', `File "${cleanName}" is empty (0 bytes).`, 400, true);
  }

  // Size limit check
  if (fileSize > INGESTION_CONFIG.MAX_UPLOAD_BYTES) {
    const maxMb = Math.round(INGESTION_CONFIG.MAX_UPLOAD_BYTES / (1024 * 1024));
    const currentMb = (fileSize / (1024 * 1024)).toFixed(1);
    throw new IngestionError(
      'FILE_TOO_LARGE',
      `File "${cleanName}" (${currentMb}MB) exceeds the maximum allowed upload size of ${maxMb}MB.`,
      413,
      true,
      { currentMb, maxMb }
    );
  }

  // Extension check
  const parts = cleanName.split('.');
  if (parts.length < 2) {
    throw new IngestionError(
      'UNSUPPORTED_FILE_TYPE',
      `File "${cleanName}" does not have a recognizable file extension. Supported formats: CSV, XLSX, PDF, DOCX.`,
      415,
      true
    );
  }

  const ext = parts[parts.length - 1].toLowerCase();
  const validExts: readonly string[] = INGESTION_CONFIG.SUPPORTED_EXTENSIONS;
  if (!validExts.includes(ext)) {
    throw new IngestionError(
      'UNSUPPORTED_FILE_TYPE',
      `Extension ".${ext}" is not supported. Supported formats: CSV, XLSX, PDF, DOCX.`,
      415,
      true,
      { detectedExtension: ext, supported: INGESTION_CONFIG.SUPPORTED_EXTENSIONS }
    );
  }

  // Map xls -> xlsx
  const fileType: SupportedFileType = ext === 'xls' ? 'xlsx' : (ext as SupportedFileType);

  return {
    fileName: cleanName,
    fileSize,
    extension: ext,
    fileType,
    mimeType: mimeType || 'application/octet-stream',
  };
}

/**
 * Validates the binary header / magic bytes of a file buffer to avoid extension spoofing.
 */
export function validateBufferContent(
  buffer: Buffer | Uint8Array,
  info: ValidatedFileInfo
): void {
  if (!buffer || buffer.length === 0) {
    throw new IngestionError('EMPTY_FILE', `File "${info.fileName}" contains no byte stream.`, 400, true);
  }

  // Check magic bytes for ZIP containers (XLSX, DOCX)
  if (info.fileType === 'xlsx' || info.fileType === 'docx') {
    // ZIP signature: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04) or legacy compound file for .xls (0xD0, 0xCF, 0x11, 0xE0)
    const isZip =
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07);
    const isLegacyOle =
      buffer[0] === 0xd0 &&
      buffer[1] === 0xcf &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xe0;

    if (!isZip && !isLegacyOle) {
      throw new IngestionError(
        'INVALID_FILE',
        `File "${info.fileName}" does not appear to be a valid ${info.extension.toUpperCase()} document.`,
        422,
        true
      );
    }
  } else if (info.fileType === 'pdf') {
    // PDF signature: %PDF-
    const isPdf =
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46;
    if (!isPdf) {
      throw new IngestionError(
        'INVALID_FILE',
        `File "${info.fileName}" does not contain a valid PDF signature.`,
        422,
        true
      );
    }
  } else if (info.fileType === 'csv') {
    // Inspect the first 512 bytes for null bytes (which indicate binary data)
    const sampleSize = Math.min(buffer.length, 512);
    let nullByteCount = 0;
    for (let i = 0; i < sampleSize; i++) {
      if (buffer[i] === 0) nullByteCount++;
    }
    // In valid UTF-8/ASCII CSV, null bytes should not be present
    if (nullByteCount > 0) {
      throw new IngestionError(
        'INVALID_FILE',
        `File "${info.fileName}" contains binary data and cannot be parsed as a text CSV.`,
        422,
        true
      );
    }
  }
}
