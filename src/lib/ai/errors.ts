/**
 * AI & Visualization Intelligence Errors — Phase 2C
 */

export type AIErrorCode =
  | 'AI_PROVIDER_UNAVAILABLE'
  | 'AI_RATE_LIMITED'
  | 'AI_TIMEOUT'
  | 'AI_INVALID_RESPONSE'
  | 'AI_SCHEMA_INVALID'
  | 'RECOMMENDATION_INVALID'
  | 'NO_VALID_CANDIDATES';

export class AIError extends Error {
  public readonly code: AIErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: AIErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}
