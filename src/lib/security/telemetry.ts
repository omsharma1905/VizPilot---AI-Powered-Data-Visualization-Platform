/**
 * Safe Operational Telemetry & Logging Policy — Phase 2E
 *
 * Strictly enforces that only safe operational metrics are emitted.
 * Guarantees that raw data rows, cell values, prompts, and completion bodies
 * never enter server logs.
 */

import type { PrivacyMode } from '@/src/types';

export interface SafeTelemetryEvent {
  requestId: string;
  mode: PrivacyMode;
  stage: 'ingest' | 'profile' | 'recommend' | 'visualize' | 'cleanup';
  durationMs: number;
  success: boolean;
  fileType?: string;
  fileSize?: number;
  rowCount?: number;
  columnCount?: number;
  provider?: string;
  model?: string;
  fallbackUsed?: boolean;
  candidateCount?: number;
  chartType?: string;
  errorCode?: string;
}

export const safeTelemetryLogger = {
  log(event: SafeTelemetryEvent): void {
    const prefix = event.mode === 'zerotrace' ? '[ZERO-TRACE]' : '[VIZPILOT]';
    const parts = [
      prefix,
      `req=${event.requestId}`,
      `stage=${event.stage}`,
      `mode=${event.mode}`,
      `duration=${event.durationMs}ms`,
      `status=${event.success ? 'SUCCESS' : 'FAILED'}`,
    ];

    if (event.fileType) parts.push(`type=${event.fileType}`);
    if (event.fileSize !== undefined) parts.push(`size=${event.fileSize}B`);
    if (event.rowCount !== undefined) parts.push(`rows=${event.rowCount}`);
    if (event.columnCount !== undefined) parts.push(`cols=${event.columnCount}`);
    if (event.provider) parts.push(`provider=${event.provider}`);
    if (event.model) parts.push(`model=${event.model}`);
    if (event.fallbackUsed !== undefined) parts.push(`fallback=${event.fallbackUsed}`);
    if (event.candidateCount !== undefined) parts.push(`cands=${event.candidateCount}`);
    if (event.chartType) parts.push(`chart=${event.chartType}`);
    if (event.errorCode) parts.push(`error=${event.errorCode}`);

    const logLine = parts.join(' · ');

    if (event.success) {
      console.log(logLine);
    } else {
      console.warn(logLine);
    }
  },
};
