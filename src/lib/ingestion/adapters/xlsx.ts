import * as XLSX from 'xlsx';
import type { FileAdapter, RawExtractionResult, RawTable } from './types';
import type { SupportedFileType, VizPilotSource } from '@/src/types/dataset';
import { IngestionError } from '../errors';

export class XLSXAdapter implements FileAdapter {
  supports(fileType: SupportedFileType): boolean {
    return fileType === 'xlsx';
  }

  async extract(buffer: Buffer, source: VizPilotSource): Promise<RawExtractionResult> {
    const warnings: string[] = [];
    let workbook: XLSX.WorkBook;

    try {
      workbook = XLSX.read(buffer, {
        type: 'buffer',
        cellDates: true, // Convert Excel date serials to JavaScript Date objects
        cellNF: false,
        cellText: false,
      });
    } catch (err) {
      throw new IngestionError(
        'PARSE_FAILED',
        `Failed to parse Excel workbook "${source.fileName}". The file may be corrupt or encrypted.`,
        422,
        true,
        { originalError: err instanceof Error ? err.message : String(err) }
      );
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new IngestionError(
        'NO_USABLE_DATA',
        `Excel workbook "${source.fileName}" contains no worksheets.`,
        422,
        true
      );
    }

    const tables: RawTable[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet || !sheet['!ref']) {
        warnings.push(`Sheet "${sheetName}" is empty and was skipped.`);
        continue;
      }

      // Convert sheet to 2D array
      const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1, // Array of arrays
        raw: true, // Keep raw primitives (Date, number, boolean)
        defval: null, // Fill empty cells with null
        blankrows: false,
      });

      if (!rawRows || rawRows.length === 0) {
        warnings.push(`Sheet "${sheetName}" contains no data rows and was skipped.`);
        continue;
      }

      // First non-empty row is considered headers
      let headerRowIndex = 0;
      while (
        headerRowIndex < rawRows.length &&
        (!rawRows[headerRowIndex] ||
          (rawRows[headerRowIndex] as unknown[]).every((cell) => cell === null || cell === undefined || String(cell).trim() === ''))
      ) {
        headerRowIndex++;
      }

      if (headerRowIndex >= rawRows.length) {
        warnings.push(`Sheet "${sheetName}" has no valid header row and was skipped.`);
        continue;
      }

      const headerRow = rawRows[headerRowIndex] as unknown[];
      const bodyRows = rawRows.slice(headerRowIndex + 1);

      // Clean headers
      const headers = headerRow.map((cell, idx) => {
        if (cell === null || cell === undefined || String(cell).trim() === '') {
          return `Column_${idx + 1}`;
        }
        return String(cell).trim();
      });

      // Filter out completely empty body rows
      const validBodyRows = bodyRows.filter((row) =>
        Array.isArray(row) && row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')
      );

      if (validBodyRows.length === 0) {
        warnings.push(`Sheet "${sheetName}" has headers but zero data rows and was skipped.`);
        continue;
      }

      // Normalize cells in rows (convert Date objects to ISO strings, etc.)
      const cleanedRows: unknown[][] = validBodyRows.map((row) => {
        const rowArr = Array.isArray(row) ? row : [];
        return headers.map((_, colIdx) => {
          const val = rowArr[colIdx];
          if (val === undefined || val === null) return null;
          if (val instanceof Date) {
            // Check if date has a time component
            const hours = val.getHours();
            const minutes = val.getMinutes();
            const seconds = val.getSeconds();
            if (hours === 0 && minutes === 0 && seconds === 0) {
              return val.toISOString().split('T')[0]; // YYYY-MM-DD
            }
            return val.toISOString(); // Full datetime
          }
          return val;
        });
      });

      tables.push({
        name: sheetName.trim() || `Sheet ${tables.length + 1}`,
        headers,
        rawRows: cleanedRows,
      });
    }

    if (tables.length === 0) {
      throw new IngestionError(
        'NO_USABLE_DATA',
        `Excel workbook "${source.fileName}" contains no usable data across ${workbook.SheetNames.length} sheet(s).`,
        422,
        true,
        { skippedSheets: workbook.SheetNames }
      );
    }

    return {
      tables,
      method: 'xlsx-adapter:sheetjs',
      warnings,
      confidence: 1.0,
    };
  }
}
