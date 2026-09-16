import Papa from 'papaparse';
import type { FileAdapter, RawExtractionResult, RawTable } from './types';
import type { SupportedFileType, VizPilotSource } from '@/src/types/dataset';
import { IngestionError } from '../errors';

export class CSVAdapter implements FileAdapter {
  supports(fileType: SupportedFileType): boolean {
    return fileType === 'csv';
  }

  async extract(buffer: Buffer, source: VizPilotSource): Promise<RawExtractionResult> {
    const warnings: string[] = [];

    // Decode buffer to string, cleanly stripping UTF-8 BOM if present
    let text = buffer.toString('utf-8');
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
      warnings.push('UTF-8 BOM detected and stripped.');
    }

    // Parse as 2D array to preserve column ordering and handle duplicate headers without object-key collision
    const parseResult = Papa.parse<string[]>(text, {
      skipEmptyLines: 'greedy',
      dynamicTyping: false, // Normalizer and type inference will handle typing deterministically
    });

    if (parseResult.errors && parseResult.errors.length > 0) {
      const fatalErrors = parseResult.errors.filter(
        (e) => e.type === 'Delimiter' || e.code === 'UndetectableDelimiter'
      );
      if (fatalErrors.length > 0) {
        throw new IngestionError(
          'PARSE_FAILED',
          `CSV parsing failed: ${fatalErrors[0].message}`,
          422,
          true,
          { errors: parseResult.errors.map((e) => e.message) }
        );
      }
      for (const err of parseResult.errors.slice(0, 5)) {
        warnings.push(`Row ${err.row ?? 'unknown'}: ${err.message}`);
      }
    }

    const data = parseResult.data;
    if (!data || data.length === 0) {
      throw new IngestionError(
        'NO_USABLE_DATA',
        `CSV file "${source.fileName}" contains no readable data rows.`,
        422,
        true
      );
    }

    // First row is headers
    const rawHeaders = data[0];
    if (!rawHeaders || rawHeaders.length === 0 || rawHeaders.every((h) => !h || h.trim() === '')) {
      throw new IngestionError(
        'NO_USABLE_DATA',
        `CSV file "${source.fileName}" has no column headers in the first row.`,
        422,
        true
      );
    }

    // Subsequent rows are body records
    const rawRows = data.slice(1);
    if (rawRows.length === 0) {
      throw new IngestionError(
        'NO_USABLE_DATA',
        `CSV file "${source.fileName}" contains column headers but zero data rows.`,
        422,
        true
      );
    }

    const baseName = source.fileName.replace(/\.[^/.]+$/, '') || 'Data';
    const table: RawTable = {
      name: baseName,
      headers: rawHeaders.map((h) => (h !== undefined && h !== null ? String(h).trim() : '')),
      rawRows,
    };

    return {
      tables: [table],
      method: 'csv-adapter:papaparse',
      warnings,
      confidence: 1.0,
    };
  }
}
