/**
 * AI Provider Client Factory — Phase 2C
 */

import type { VizPilotLLMProvider } from './provider';
import { GroqProvider } from './providers/groq';

/**
 * Returns the active VizPilotLLMProvider instance.
 * Default for Phase 2C is Groq with openai/gpt-oss-120b.
 */
export function getLLMProvider(): VizPilotLLMProvider {
  return new GroqProvider();
}
