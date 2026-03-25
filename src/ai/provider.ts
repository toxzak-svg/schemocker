/**
 * AI Provider Interface
 * 
 * All AI adapters (OpenAI, Ollama, vLLM) implement this interface.
 * The provider is the single point of contact for LLM completions.
 */

export type AIProviderType = 'openai' | 'ollama' | 'vllm' | 'nim';

export interface AIConfig {
  provider: AIProviderType;
  model: string;
  baseUrl?: string;
  apiKey?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface AIProvider {
  complete(prompt: string, config?: Partial<AIConfig>): Promise<AIResponse>;
}

/**
 * Resolve effective config from schemock.json + env vars
 */
export function resolveAIConfig(config?: Partial<AIConfig>): AIConfig {
  const provider = config?.provider || (process.env.SCHEMOCKER_AI_PROVIDER as AIProviderType) || 'openai';
  const model = config?.model || process.env.SCHEMOCKER_AI_MODEL || process.env.SCHEMOCKER_NIM_MODEL || defaultModelForProvider(provider);
  const baseUrl = config?.baseUrl || process.env.SCHEMOCKER_AI_BASE_URL || (provider === 'nim' ? 'https://integrate.api.nvidia.com/v1' : undefined);
  const apiKey = config?.apiKey || process.env.SCHEMOCKER_API_KEY || process.env.NIM_API_KEY || process.env.SCHEMOCKER_NIM_API_KEY;
  const maxTokens = config?.maxTokens ?? 1024;
  const temperature = config?.temperature ?? 0.7;

  return { provider, model, baseUrl, apiKey, maxTokens, temperature };
}

function defaultModelForProvider(provider: AIProviderType): string {
  switch (provider) {
    case 'openai': return 'gpt-4o-mini';
    case 'ollama': return 'qwen2.5:3b';
    case 'vllm': return 'qwen3.5-35b-a3b';
    case 'nim': return 'meta/llama-3.1-8b-instruct';
  }
}
