/**
 * OpenAI Adapter
 * 
 * Uses OpenAI's Chat Completions API.
 * Set SCHEMOCKER_API_KEY env var, or pass apiKey in config.
 */

import axios from 'axios';
import type { AIProvider, AIConfig, AIResponse } from './provider.js';

export class OpenAIAdapter implements AIProvider {
  private baseUrl = 'https://api.openai.com/v1';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SCHEMOCKER_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OpenAI API key not set. Set SCHEMOCKER_API_KEY env var or pass apiKey to constructor.');
    }
  }

  async complete(prompt: string, config?: Partial<AIConfig>): Promise<AIResponse> {
    const model = config?.model || 'gpt-4o-mini';
    const maxTokens = config?.maxTokens ?? 1024;
    const temperature = config?.temperature ?? 0.7;

    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const choice = response.data.choices?.[0];
    const content = choice?.message?.content || '';

    return {
      content,
      usage: response.data.usage ? {
        promptTokens: response.data.usage.prompt_tokens,
        completionTokens: response.data.usage.completion_tokens,
      } : undefined,
    };
  }
}
