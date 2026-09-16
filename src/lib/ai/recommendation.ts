/**
 * Visualization Intelligence Engine Orchestrator — Phase 2C
 *
 * Coordinates:
 * Profile -> Deterministic Candidate Generation -> LLM Provider -> Validation -> Scoring -> Fallback
 */

import type { VizPilotDataProfile } from '@/src/types/profiling';
import type { VizPilotVisualizationRecommendation } from './types';
import { generateCandidates } from './candidates/generator';
import { getLLMProvider } from './client';
import { validateLLMResponse } from './validation/recommendation';
import { calculateCandidateScore, calibrateConfidence } from './scoring/visualization';
import { createDeterministicFallback } from './fallback';

export async function getVisualizationRecommendation(
  profile: VizPilotDataProfile
): Promise<VizPilotVisualizationRecommendation> {
  const startTime = performance.now();

  // 1. Deterministic Candidate Generation
  const candidates = generateCandidates(profile);

  if (candidates.length === 0) {
    return createDeterministicFallback(
      profile,
      candidates,
      'No compatible visualization candidates could be generated from the data profile.',
      startTime
    );
  }

  // 2. LLM Provider Access
  const provider = getLLMProvider();
  const isAvailable = await provider.isAvailable();

  if (!isAvailable) {
    return createDeterministicFallback(
      profile,
      candidates,
      `AI provider ${provider.name} is not configured or unavailable. Used deterministic structural ranking.`,
      startTime
    );
  }

  // 3. LLM Reasoning
  let rawRanking;
  try {
    rawRanking = await provider.rankCandidates(profile, candidates);
  } catch (err) {
    return createDeterministicFallback(
      profile,
      candidates,
      `AI provider error: ${err instanceof Error ? err.message : 'Ranking failure'}. Fallback to deterministic model.`,
      startTime
    );
  }

  // 4. Response Validation
  const validation = validateLLMResponse(rawRanking, candidates);
  if (!validation.isValid || !validation.validatedRanking) {
    return createDeterministicFallback(
      profile,
      candidates,
      `AI response failed strict validation checks (${validation.errors.join(', ')}). Fallback applied.`,
      startTime
    );
  }

  // 5. Deterministic Scoring combining profile metrics and validated LLM confidence
  const { topCandidate, confidence: rawLLMConfidence, reasoning, alternatives } = validation.validatedRanking;
  const primaryScore = calculateCandidateScore(topCandidate, profile, rawLLMConfidence);

  const scoredAlternatives = alternatives.map((alt) => ({
    candidateId: alt.candidate.id,
    chartType: alt.candidate.chartType,
    analyticalIntent: alt.candidate.analyticalIntent,
    fields: alt.candidate.fields,
    score: calculateCandidateScore(alt.candidate, profile, alt.confidence),
    reasoning: alt.reasoning,
    rawConfidence: alt.confidence,
  })).sort((a, b) => b.score - a.score);

  const runnerUpScore = scoredAlternatives.length > 0 ? scoredAlternatives[0].score : primaryScore * 0.8;
  const primaryConfidence = calibrateConfidence(primaryScore, runnerUpScore, rawLLMConfidence);

  let prevConf = primaryConfidence;
  const calibratedAlternatives = scoredAlternatives.map((alt, idx) => {
    const normScore = Math.max(0, Math.min(100, alt.score)) / 100;
    const targetConf = Math.min(primaryConfidence - 0.01 * (idx + 1), normScore * 0.95);
    const altConfidence = Math.round(Math.min(prevConf, Math.max(0.35, targetConf)) * 100) / 100;
    prevConf = altConfidence;
    return {
      candidateId: alt.candidateId,
      chartType: alt.chartType,
      analyticalIntent: alt.analyticalIntent,
      fields: alt.fields,
      confidence: altConfidence,
      reasoning: alt.reasoning,
      score: alt.score,
    };
  });

  const latencyMs = Math.round(performance.now() - startTime);

  return {
    version: '2C.0',
    primary: {
      candidateId: topCandidate.id,
      chartType: topCandidate.chartType,
      analyticalIntent: topCandidate.analyticalIntent,
      fields: topCandidate.fields,
      aggregation: topCandidate.aggregation,
      confidence: primaryConfidence,
      reasoning,
      score: primaryScore,
    },
    alternatives: calibratedAlternatives,
    warnings: [],
    fallbackUsed: false,
    providerUsed: provider.name,
    modelUsed: provider.model,
    latencyMs,
  };
}
