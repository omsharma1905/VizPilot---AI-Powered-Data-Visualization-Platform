/**
 * LLM Response Validation — Phase 2C
 *
 * Deterministically verifies the LLM response against candidate pool,
 * valid schemas, confidence bounds, and profile fields.
 *
 * An invalid response is NEVER trusted and triggers fallback.
 */

import type { VizPilotVisualizationCandidate } from '../types';
import type { LLMRankingResult } from '../provider';

export interface ValidationResult {
  isValid: boolean;
  validatedRanking?: {
    topCandidate: VizPilotVisualizationCandidate;
    confidence: number;
    reasoning: string;
    alternatives: Array<{
      candidate: VizPilotVisualizationCandidate;
      confidence: number;
      reasoning: string;
    }>;
  };
  errors: string[];
}

export function validateLLMResponse(
  response: unknown,
  candidates: VizPilotVisualizationCandidate[]
): ValidationResult {
  const errors: string[] = [];

  if (!response || typeof response !== 'object') {
    return { isValid: false, errors: ['Response is not an object.'] };
  }

  const raw = response as Partial<LLMRankingResult>;

  // 1. Validate topCandidateId
  if (!raw.topCandidateId || typeof raw.topCandidateId !== 'string') {
    errors.push('Missing or non-string "topCandidateId".');
  }

  const candidateMap = new Map<string, VizPilotVisualizationCandidate>();
  for (const c of candidates) {
    candidateMap.set(c.id, c);
  }

  const topCandidate = raw.topCandidateId ? candidateMap.get(raw.topCandidateId) : undefined;
  if (!topCandidate) {
    errors.push(`topCandidateId "${raw.topCandidateId}" is not in the candidate pool.`);
  }

  // 2. Validate confidence
  let confidence = typeof raw.confidence === 'number' ? raw.confidence : NaN;
  if (isNaN(confidence) || confidence < 0 || confidence > 1) {
    errors.push(`Invalid confidence value: ${raw.confidence}. Must be between 0.0 and 1.0.`);
    confidence = 0.8; // default fallback confidence
  }

  // 3. Validate reasoning
  const reasoning = typeof raw.reasoning === 'string' && raw.reasoning.trim().length > 0
    ? raw.reasoning.trim()
    : 'Selected as the optimal visualization based on dataset structure.';

  // 4. Validate alternatives
  const alternatives: Array<{
    candidate: VizPilotVisualizationCandidate;
    confidence: number;
    reasoning: string;
  }> = [];

  if (Array.isArray(raw.alternativeRankings)) {
    for (const alt of raw.alternativeRankings) {
      if (!alt || typeof alt !== 'object') continue;
      const altCandidate = candidateMap.get(alt.candidateId);
      if (!altCandidate || alt.candidateId === raw.topCandidateId) continue;

      let altConfidence = typeof alt.confidence === 'number' ? alt.confidence : NaN;
      if (isNaN(altConfidence) || altConfidence < 0 || altConfidence > 1) {
        altConfidence = Math.max(0.5, confidence - 0.1);
      }

      const altReasoning = typeof alt.reasoning === 'string' && alt.reasoning.trim().length > 0
        ? alt.reasoning.trim()
        : `Viable alternative ${altCandidate.chartType} view for comparison.`;

      alternatives.push({
        candidate: altCandidate,
        confidence: altConfidence,
        reasoning: altReasoning,
      });
    }
  }

  if (errors.length > 0 || !topCandidate) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    validatedRanking: {
      topCandidate,
      confidence,
      reasoning,
      alternatives,
    },
    errors: [],
  };
}
