/**
 * Data Classifications & Retention Policy — Phase 2E
 *
 * Defines explicit data classification categories, lifetimes, allowed storage
 * boundaries, and Zero-Trace retention rules across VizPilot.
 */

export type DataClassificationCategory =
  | 'RAW_FILE'
  | 'CANONICAL_DATASET'
  | 'DATA_PROFILE'
  | 'AI_PROMPT'
  | 'AI_RESPONSE'
  | 'VISUALIZATION_DATA'
  | 'TELEMETRY';

export interface DataClassificationPolicy {
  category: DataClassificationCategory;
  description: string;
  allowedLifetime: string;
  allowedStorageLocation: string[];
  mayLeaveVizPilot: boolean;
  mayBeLogged: boolean;
  zeroTraceBehavior: string;
}

export const DATA_CLASSIFICATION_POLICIES: Record<DataClassificationCategory, DataClassificationPolicy> = {
  RAW_FILE: {
    category: 'RAW_FILE',
    description: 'Original uploaded file buffer (CSV, XLSX, PDF, DOCX).',
    allowedLifetime: 'Duration of HTTP request parsing (~5-50ms).',
    allowedStorageLocation: ['Server Node.js memory buffer'],
    mayLeaveVizPilot: false,
    mayBeLogged: false,
    zeroTraceBehavior: 'Released immediately upon extraction into canonical dataset. Never written to disk.',
  },
  CANONICAL_DATASET: {
    category: 'CANONICAL_DATASET',
    description: 'Structured VizPilotDataset with normalized tables, columns, and data rows.',
    allowedLifetime: 'Active user workflow session.',
    allowedStorageLocation: [
      'Server memory (request lifetime)',
      'Browser memory (active SPA React state / RAM store)',
      'sessionStorage (Workspace mode only; stripped in Zero-Trace)',
    ],
    mayLeaveVizPilot: false,
    mayBeLogged: false,
    zeroTraceBehavior: 'Kept in volatile browser RAM only. Wiped upon navigation away, reset, or workflow completion. Never stored on disk.',
  },
  DATA_PROFILE: {
    category: 'DATA_PROFILE',
    description: 'Statistical metadata, column types, cardinality, and relationships (Phase 2B).',
    allowedLifetime: 'Active user workflow session.',
    allowedStorageLocation: ['Browser memory', 'sessionStorage (Workspace mode only)', 'Server memory (recommendation request)'],
    mayLeaveVizPilot: false,
    mayBeLogged: false,
    zeroTraceBehavior: 'Only non-sensitive structural metrics (e.g. column count, type distribution) held in RAM. Cleared upon session end.',
  },
  AI_PROMPT: {
    category: 'AI_PROMPT',
    description: 'Sanitized compact JSON schema and candidate list sent to LLM (Phase 2C).',
    allowedLifetime: 'Single API request lifetime to AI provider.',
    allowedStorageLocation: ['Server memory during fetch call to Groq'],
    mayLeaveVizPilot: true, // Sent to Groq OpenAI-compatible endpoint
    mayBeLogged: false, // Never logged
    zeroTraceBehavior: 'Transmitted securely over TLS to Groq API. Never cached, persisted to disk, or logged. Contains zero raw rows or cell values.',
  },
  AI_RESPONSE: {
    category: 'AI_RESPONSE',
    description: 'Structured JSON response from LLM containing selected candidateId, confidence, and reasoning.',
    allowedLifetime: 'Active user workflow session.',
    allowedStorageLocation: ['Server memory', 'Browser memory', 'sessionStorage'],
    mayLeaveVizPilot: false,
    mayBeLogged: false,
    zeroTraceBehavior: 'Cached in volatile memory for active rendering; cleared on reset or workflow exit. Response contains zero business cell values.',
  },
  VISUALIZATION_DATA: {
    category: 'VISUALIZATION_DATA',
    description: 'Aggregated EChartsOption series points, category axes, and coordinate mappings.',
    allowedLifetime: 'Active visualization display.',
    allowedStorageLocation: ['Browser memory (DOM / ECharts instance)'],
    mayLeaveVizPilot: false,
    mayBeLogged: false,
    zeroTraceBehavior: 'Exists in client DOM canvas during active render. Cleared when chart is unmounted or user navigates away.',
  },
  TELEMETRY: {
    category: 'TELEMETRY',
    description: 'Operational metrics: latency, status codes, provider, model, candidate counts, chart type, error codes.',
    allowedLifetime: 'Application log lifecycle.',
    allowedStorageLocation: ['Standard server console logs'],
    mayLeaveVizPilot: false,
    mayBeLogged: true, // Safe operational metrics only
    zeroTraceBehavior: 'Strictly scrubbed. Logs include prefix [ZERO-TRACE] and contains zero PII, raw cell values, or document text.',
  },
};
