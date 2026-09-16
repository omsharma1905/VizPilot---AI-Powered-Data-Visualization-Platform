/**
 * Deterministic Fallback Recommender — Phase 2C
 *
 * Provides safe, immediate recommendations using purely deterministic
 * dataset analysis when the LLM provider is unavailable, times out, or errors.
 */

import type { VizPilotDataProfile } from '@/src/types/profiling';
import type { VizPilotVisualizationCandidate, VizPilotVisualizationRecommendation } from './types';
import { calculateCandidateScore, calibrateConfidence } from './scoring/visualization';

export function createDeterministicFallback(
  profile: VizPilotDataProfile,
  candidates: VizPilotVisualizationCandidate[],
  reason: string,
  startTime: number
): VizPilotVisualizationRecommendation {
  const latencyMs = Math.round(performance.now() - startTime);

  if (candidates.length === 0) {
    return {
      version: '2C.0',
      primary: {
        candidateId: 'none',
        chartType: 'kpi_card',
        analyticalIntent: 'kpi',
        fields: {},
        confidence: 0.5,
        reasoning: 'No compatible chart candidates found for the current dataset structure.',
        score: 50,
      },
      alternatives: [],
      warnings: ['No structurally valid chart candidates could be generated for this dataset.'],
      fallbackUsed: true,
      latencyMs,
    };
  }

  // Score all candidates deterministically
  const scored = candidates.map((c) => ({
    candidate: c,
    score: calculateCandidateScore(c, profile),
  })).sort((a, b) => b.score - a.score);

  const top = scored[0];
  const runnerUpScore = scored.length > 1 ? scored[1].score : top.score * 0.8;
  const primaryConfidence = calibrateConfidence(top.score, runnerUpScore);

  let prevConf = primaryConfidence;
  const alternatives = scored.slice(1, 5).map((item, idx) => {
    const normScore = Math.max(0, Math.min(100, item.score)) / 100;
    const targetConf = Math.min(primaryConfidence - 0.01 * (idx + 1), normScore * 0.95);
    const altConfidence = Math.round(Math.min(prevConf, Math.max(0.35, targetConf)) * 100) / 100;
    prevConf = altConfidence;
    return {
      candidateId: item.candidate.id,
      chartType: item.candidate.chartType,
      analyticalIntent: item.candidate.analyticalIntent,
      fields: item.candidate.fields,
      confidence: altConfidence,
      reasoning: item.candidate.reasons[0] || `Alternative ${item.candidate.chartType} visualization.`,
      score: item.score,
    };
  });

  return {
    version: '2C.0',
    primary: {
      candidateId: top.candidate.id,
      chartType: top.candidate.chartType,
      analyticalIntent: top.candidate.analyticalIntent,
      fields: top.candidate.fields,
      aggregation: top.candidate.aggregation,
      confidence: primaryConfidence,
      reasoning: top.candidate.reasons.join(' ') || 'Selected as the optimal visualization based on deterministic structural fit.',
      score: top.score,
    },
    alternatives,
    warnings: [reason],
    fallbackUsed: true,
    latencyMs,
  };
}
