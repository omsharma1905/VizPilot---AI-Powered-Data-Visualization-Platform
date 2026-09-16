/**
 * Visualization Errors — Phase 2D
 */

export type VisualizationErrorCode =
  | 'VISUALIZATION_FIELD_NOT_FOUND'
  | 'VISUALIZATION_FIELD_INCOMPATIBLE'
  | 'VISUALIZATION_UNSUPPORTED_CHART'
  | 'VISUALIZATION_CARDINALITY_EXCEEDED'
  | 'NO_RENDERABLE_DATA'
  | 'INVALID_DATASET'
  | 'VISUALIZATION_INVALID_DATASET'
  | 'VISUALIZATION_EMPTY_TABLE'
  | 'VISUALIZATION_UNSUPPORTED_TYPE';

export class VisualizationError extends Error {
  public readonly code: VisualizationErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: VisualizationErrorCode,
    message: string,
    statusCode: number = 400,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'VisualizationError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}
