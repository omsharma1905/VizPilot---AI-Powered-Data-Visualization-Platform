import type { FileAdapter } from './types';
import type { SupportedFileType } from '@/src/types/dataset';
import { CSVAdapter } from './csv';
import { XLSXAdapter } from './xlsx';
import { PDFAdapter } from './pdf';
import { DOCXAdapter } from './docx';
import { IngestionError } from '../errors';

class AdapterRegistry {
  private adapters: FileAdapter[] = [];

  constructor() {
    this.register(new CSVAdapter());
    this.register(new XLSXAdapter());
    this.register(new PDFAdapter());
    this.register(new DOCXAdapter());
  }

  register(adapter: FileAdapter): void {
    this.adapters.push(adapter);
  }

  getAdapter(fileType: SupportedFileType, mimeType: string): FileAdapter {
    const matched = this.adapters.find((a) => a.supports(fileType, mimeType));
    if (!matched) {
      throw new IngestionError(
        'UNSUPPORTED_FILE_TYPE',
        `No ingestion adapter available for file type "${fileType}".`,
        415,
        true
      );
    }
    return matched;
  }
}

export const adapterRegistry = new AdapterRegistry();
