/**
 * NVIDIA NIM Adapter
 * 
 * Uses NVIDIA's NIM (NVIDIA Inference Microservices) API.
 * OpenAI-compatible — same interface as OpenAI adapter.
 * 
 * Set SCHEMOCKER_NIM_API_KEY env var, or pass apiKey in config.
 * Set SCHEMOCKER_NIM_BASE_URL to override the default NIM endpoint.
 */

import axios from 'axios';
import type { AIProvider, AIConfig, AIResponse } from './provider.js';

export class NIMAdapter implements AIProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || process.env.SCHEMOCKER_NIM_API_KEY || process.env.NIM_API_KEY || '';
    this.baseUrl = baseUrl || process.env.SCHEMOCKER_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
    
    if (!this.apiKey) {
      throw new Error(
        'NIM API key not set. Set SCHEMOCKER_NIM_API_KEY, NIM_API_KEY env var, or pass apiKey to constructor.'
      );
    }
  }

  async complete(prompt: string, config?: Partial<AIConfig>): Promise<AIResponse> {
    const model = config?.model || process.env.SCHEMOCKER_NIM_MODEL || 'meta/llama-3.1-8b-instruct';
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
        timeout: 60000,
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
