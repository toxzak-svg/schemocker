/**
 * Ollama Adapter
 * 
 * Uses Ollama's Generate API (or Chat API).
 * Set SCHEMOCKER_AI_BASE_URL to your Ollama endpoint.
 * Defaults to http://localhost:11434
 */

import axios from 'axios';
import type { AIProvider, AIConfig, AIResponse } from './provider.js';

export class OllamaAdapter implements AIProvider {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.SCHEMOCKER_AI_BASE_URL || 'http://localhost:11434';
  }

  async complete(prompt: string, config?: Partial<AIConfig>): Promise<AIResponse> {
    const model = config?.model || 'qwen2.5:3b';
    const maxTokens = config?.maxTokens ?? 1024;
    const temperature = config?.temperature ?? 0.7;

    // Try chat endpoint first (more capable models)
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/chat`,
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          options: {
            num_predict: maxTokens,
            temperature,
          },
          stream: false,
        },
        {
          timeout: 60000,
        }
      );

      const content = response.data.message?.content || '';

      return {
        content,
        usage: response.data.eval_count !== undefined ? {
          promptTokens: response.data.prompt_eval_count || 0,
          completionTokens: response.data.eval_count || 0,
        } : undefined,
      };
    } catch {
      // Fall back to generate endpoint
      const response = await axios.post(
        `${this.baseUrl}/api/generate`,
        {
          model,
          prompt,
          options: {
            num_predict: maxTokens,
            temperature,
          },
          stream: false,
        },
        {
          timeout: 60000,
        }
      );

      return {
        content: response.data.response || '',
        usage: response.data.eval_count !== undefined ? {
          promptTokens: response.data.prompt_eval_count || 0,
          completionTokens: response.data.eval_count || 0,
        } : undefined,
      };
    }
  }
}
