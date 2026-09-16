/**
 * Server-Side Processing Context — Phase 2E
 *
 * Enforces explicit execution context, request IDs, and validated privacy modes
 * across all backend and ingestion boundaries.
 */

import type { PrivacyMode } from '@/src/types';

export interface VizPilotProcessingContext {
  /** Validated privacy mode: 'workspace' or 'zerotrace' */
  mode: PrivacyMode;
  /** Unique tracing identifier for this request lifecycle */
  requestId: string;
  /** ISO timestamp when processing began */
  startedAt: string;
  /** High-resolution start time for latency tracking */
  startTimeMs: number;
  /** Authenticated user ID (if authenticated session exists) */
  userId?: string;
  /** Authenticated workspace ID (if authenticated session exists) */
  workspaceId?: string;
}

/**
 * Validates and normalizes client-provided privacy mode.
 * Rejects or normalizes arbitrary, spoofed, or unexpected string values.
 */
export function validateProcessingMode(rawMode: unknown): PrivacyMode {
  if (typeof rawMode !== 'string') {
    return 'workspace';
  }

  const normalized = rawMode.trim().toLowerCase();
  if (
    normalized === 'zerotrace' ||
    normalized === 'zero-trace' ||
    normalized === 'zero_trace' ||
    normalized === 'zt'
  ) {
    return 'zerotrace';
  }

  return 'workspace';
}

/**
 * Creates a validated processing context for incoming server requests.
 */
export function createProcessingContext(
  req?: Request,
  rawMode?: unknown
): VizPilotProcessingContext {
  const mode = validateProcessingMode(rawMode);
  
  // Prefer existing x-request-id if provided by proxy/client, otherwise generate UUID
  let requestId = req?.headers.get('x-request-id') || '';
  if (!requestId || requestId.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(requestId)) {
    requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  return {
    mode,
    requestId,
    startedAt: new Date().toISOString(),
    startTimeMs: performance.now(),
  };
}

/**
 * Calculates elapsed processing time in milliseconds.
 */
export function getElapsedMs(ctx: VizPilotProcessingContext): number {
  return Math.round(performance.now() - ctx.startTimeMs);
}
