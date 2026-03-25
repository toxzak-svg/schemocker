/**
 * Schema generation routes
 * 
 * POST /v1/schema/generate — NL description → JSON Schema
 * POST /v1/schema/mutate  — current schema + instruction → mutated schema
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { config } from '../config.js';
import { getRequestsRemaining, getApiKeyInfo } from '../middleware/auth.js';

export const schemaRouter = Router();

const generateSchemaRequest = z.object({
  description: z.string().min(1).max(1000),
  model: z.string().optional(),
});

const mutateSchemaRequest = z.object({
  instruction: z.string().min(1).max(1000),
  currentSchema: z.record(z.any()),
  model: z.string().optional(),
});

/**
 * Add watermark to schema if on free tier
 */
function addWatermark(schema: Record<string, any>, apiKeyInfo: any): Record<string, any> {
  if (apiKeyInfo?.tier === 'pro') return schema;

  return {
    ...schema,
    'x-schemock-watermark': {
      poweredBy: 'Schemocker',
      tier: 'free',
      upgrade: 'https://schemocker.com/pricing',
    },
  };
}

/**
 * Call NIM API
 */
async function callNIM(prompt: string, model?: string): Promise<string> {
  try {
    const response = await axios.post(
      `${config.nimBaseUrl}/chat/completions`,
      {
        model: model || config.nimModel,
        messages: [
          {
            role: 'system',
            content: 'You are a JSON Schema expert. Only respond with valid JSON. No markdown, no explanation, no backticks. The JSON must be parseable by JSON.parse().'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1024,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${config.nimApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const content = response.data.choices?.[0]?.message?.content || '';

    if (!content) {
      throw new Error('NIM returned empty response');
    }

    return content;
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const msg = error.response.data?.error?.message || error.response.statusText;

      if (status === 401) throw new Error(`NIM auth failed: ${msg}`);
      if (status === 429) throw new Error(`NIM rate limited`);
      if (status >= 500) throw new Error(`NIM server error: ${msg}`);
    }
    throw error;
  }
}

/**
 * POST /v1/schema/generate
 * Generate a JSON Schema from natural language description
 */
schemaRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const parsed = generateSchemaRequest.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'INVALID_REQUEST', details: parsed.error.errors });
      return;
    }

    const { description, model } = parsed.data;
    const apiKeyInfo = (req as any).apiKeyInfo;

    const prompt = `You are a JSON Schema expert. Generate a valid JSON Schema for the following API description.

Requirements:
- Include "type": "object"
- Include appropriate "properties" with types and formats
- Include "$id" or "title" for the schema name
- Include "x-schemock-routes" array with appropriate REST endpoints (GET, POST, PUT, DELETE)
- Only include realistic fields based on the description

Description: ${description}

Return ONLY the JSON Schema as a valid JSON object. No markdown, no explanation, just the schema.`;

    const rawSchema = await callNIM(prompt, model);

    let schema: Record<string, any>;
    try {
      schema = JSON.parse(rawSchema);
    } catch {
      res.status(500).json({ error: 'SCHEMA_PARSE_ERROR', message: 'Failed to parse generated schema' });
      return;
    }

    const watermarked = addWatermark(schema, apiKeyInfo);
    const remaining = getRequestsRemaining((req as any).apiKey);

    res.json({
      schema: watermarked,
      usage: {
        requestsRemaining: remaining,
        tier: apiKeyInfo?.tier || 'free',
      },
    });
  } catch (error: any) {
    console.error('Schema generation error:', error?.message);
    const message = error?.message?.includes('NIM')
      ? error.message
      : 'Failed to generate schema. Please try again.';
    res.status(500).json({ error: 'GENERATION_ERROR', message });
  }
});

/**
 * POST /v1/schema/mutate
 * Mutate an existing schema based on natural language instruction
 */
schemaRouter.post('/mutate', async (req: Request, res: Response) => {
  try {
    const parsed = mutateSchemaRequest.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'INVALID_REQUEST', details: parsed.error.errors });
      return;
    }

    const { instruction, currentSchema, model } = parsed.data;
    const apiKeyInfo = (req as any).apiKeyInfo;

    const prompt = `You are a JSON Schema expert. Mutate the following JSON Schema based on the user's instruction.

Current Schema:
${JSON.stringify(currentSchema, null, 2)}

Instruction: ${instruction}

Return ONLY the mutated JSON Schema as a valid JSON object. No markdown, no explanation.`;

    const rawSchema = await callNIM(prompt, model);

    let schema: Record<string, any>;
    try {
      schema = JSON.parse(rawSchema);
    } catch {
      res.status(500).json({ error: 'SCHEMA_PARSE_ERROR', message: 'Failed to parse mutated schema' });
      return;
    }

    const watermarked = addWatermark(schema, apiKeyInfo);
    const remaining = getRequestsRemaining((req as any).apiKey);

    res.json({
      schema: watermarked,
      usage: {
        requestsRemaining: remaining,
        tier: apiKeyInfo?.tier || 'free',
      },
    });
  } catch (error: any) {
    console.error('Schema mutation error:', error?.message);
    const message = error?.message?.includes('NIM')
      ? error.message
      : 'Failed to mutate schema. Please try again.';
    res.status(500).json({ error: 'MUTATION_ERROR', message });
  }
});

/**
 * GET /v1/schema/usage
 * Check current usage for this API key
 */
schemaRouter.get('/usage', (req: Request, res: Response) => {
  const apiKey = (req as any).apiKey;
  const apiKeyInfo = getApiKeyInfo(apiKey);
  const remaining = getRequestsRemaining(apiKey);

  res.json({
    tier: apiKeyInfo?.tier || 'free',
    requestsRemaining: remaining,
    resetIn: '1 hour',
  });
});
