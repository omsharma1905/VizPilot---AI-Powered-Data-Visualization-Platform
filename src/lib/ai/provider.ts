/**
 * LLM Provider Abstraction — Phase 2C
 *
 * Defines the contract that any LLM provider (Groq, OpenAI, Gemini, Anthropic)
 * must implement. Decouples the recommendation pipeline from vendor-specific APIs.
 */

import type { VizPilotDataProfile } from '@/src/types/profiling';
import type { VizPilotVisualizationCandidate } from './types';

export interface LLMRankingResult {
  topCandidateId: string;
  confidence: number; // 0 to 1
  reasoning: string;
  alternativeRankings: Array<{
    candidateId: string;
    confidence: number;
    reasoning: string;
  }>;
}

export interface VizPilotLLMProvider {
  name: string;
  model: string;
  isAvailable(): Promise<boolean>;
  rankCandidates(
    profile: VizPilotDataProfile,
    candidates: VizPilotVisualizationCandidate[]
  ): Promise<LLMRankingResult>;
}
