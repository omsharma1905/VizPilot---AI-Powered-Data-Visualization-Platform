/**
 * Groq LLM Provider — Phase 2C
 *
 * Implements VizPilotLLMProvider using Groq's OpenAI-compatible API
 * with the openai/gpt-oss-120b model.
 *
 * ZERO-TRACE:
 * - Executes strictly server-side using GROQ_API_KEY.
 * - Never exposes API key to client or logs.
 * - Does not send raw rows or full profiles.
 */

import type { VizPilotDataProfile } from '@/src/types/profiling';
import type { VizPilotVisualizationCandidate } from '../types';
import type { LLMRankingResult, VizPilotLLMProvider } from '../provider';
import { AIError } from '../errors';
import { buildCompactPayload, VISUALIZATION_SYSTEM_PROMPT, VISUALIZATION_JSON_SCHEMA } from '../prompts/visualization';

export class GroqProvider implements VizPilotLLMProvider {
  public readonly name = 'Groq';
  public readonly model = 'openai/gpt-oss-120b';

  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY;
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async rankCandidates(
    profile: VizPilotDataProfile,
    candidates: VizPilotVisualizationCandidate[]
  ): Promise<LLMRankingResult> {
    if (!this.apiKey) {
      throw new AIError(
        'AI_PROVIDER_UNAVAILABLE',
        'GROQ_API_KEY is not configured on the server.',
        503
      );
    }

    if (candidates.length === 0) {
      throw new AIError(
        'NO_VALID_CANDIDATES',
        'No valid candidates to evaluate.',
        400
      );
    }

    const compactPayload = buildCompactPayload(profile, candidates);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s hard timeout

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: VISUALIZATION_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Analyze this data profile and rank the candidates:\n${JSON.stringify(compactPayload)}`,
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: VISUALIZATION_JSON_SCHEMA,
          },
          temperature: 0.1,
          max_tokens: 800,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);


      if (!response.ok) {
        if (response.status === 429) {
          throw new AIError('AI_RATE_LIMITED', 'Groq API rate limit reached.', 429);
        }
        throw new AIError(
          'AI_PROVIDER_UNAVAILABLE',
          `Groq API responded with status ${response.status}`,
          response.status
        );
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (!content || typeof content !== 'string') {
        throw new AIError(
          'AI_INVALID_RESPONSE',
          'Groq returned empty response content.',
          502
        );
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new AIError(
          'AI_INVALID_RESPONSE',
          'Groq response was not valid JSON.',
          502
        );
      }

      return parsed as LLMRankingResult;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof AIError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AIError('AI_TIMEOUT', 'Groq API call timed out after 8000ms', 504);
      }
      throw new AIError(
        'AI_PROVIDER_UNAVAILABLE',
        `Failed to communicate with Groq: ${err instanceof Error ? err.message : String(err)}`,
        500
      );
    }
  }
}
