export type IngestionErrorCode =
  | 'EMPTY_FILE'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'INVALID_FILE'
  | 'PARSE_FAILED'
  | 'NO_USABLE_DATA'
  // Document-specific errors (Phase 2A.2)
  | 'OCR_REQUIRED'           // File is likely a scanned image PDF; OCR not supported
  | 'NO_USABLE_TABULAR_DATA' // Document parsed but contained no extractable tabular data
  | 'DOCUMENT_PARSE_FAILED'; // PDF or DOCX could not be opened / structurally parsed


export interface IngestionErrorResponse {
  code: IngestionErrorCode;
  message: string;
  recoverable: boolean;
  details?: Record<string, unknown>;
}

export class IngestionError extends Error {
  public readonly code: IngestionErrorCode;
  public readonly userMessage: string;
  public readonly statusCode: number;
  public readonly recoverable: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: IngestionErrorCode,
    userMessage: string,
    statusCode: number = 400,
    recoverable: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(userMessage);
    this.name = 'IngestionError';
    this.code = code;
    this.userMessage = userMessage;
    this.statusCode = statusCode;
    this.recoverable = recoverable;
    this.details = details;
  }

  public toResponse(): IngestionErrorResponse {
    return {
      code: this.code,
      message: this.userMessage,
      recoverable: this.recoverable,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}
