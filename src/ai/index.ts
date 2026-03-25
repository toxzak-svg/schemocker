/**
 * AI Module — Schemocker AI-native layer
 */

export { resolveAIConfig } from './provider.js';
export type { AIProvider, AIConfig, AIResponse, AIProviderType } from './provider.js';
export { OpenAIAdapter } from './openai.js';
export { OllamaAdapter } from './ollama.js';
export { NIMAdapter } from './nim.js';
export { inferSchema, mutateSchema } from './schema-inferrer.js';

import { resolveAIConfig } from './provider.js';
import { OpenAIAdapter } from './openai.js';
import { OllamaAdapter } from './ollama.js';
import { NIMAdapter } from './nim.js';
import type { AIProvider } from './provider.js';

/**
 * Factory: get an AI provider instance from config or env.
 */
export function createAIProvider(config?: { provider?: string; baseUrl?: string; apiKey?: string }): AIProvider {
  const resolved = resolveAIConfig(config as any);

  switch (resolved.provider) {
    case 'ollama':
      return new OllamaAdapter(resolved.baseUrl);
    case 'nim':
      return new NIMAdapter(resolved.apiKey, resolved.baseUrl);
    case 'openai':
    default:
      return new OpenAIAdapter(resolved.apiKey);
  }
}
