/**
 * Schema Inferrer — NL description → JSON Schema
 * 
 * Takes a natural language description of an API and returns a valid JSON Schema.
 * Uses the configured AI provider under the hood.
 */

import type { AIProvider, AIConfig, AIResponse } from './provider.js';
import { resolveAIConfig } from './provider.js';

const SCHEMA_INFERENCE_PROMPT = `You are a JSON Schema expert. Given a natural language description of an API, generate a valid JSON Schema draft.

Rules:
- Output ONLY valid JSON Schema (no markdown, no explanation, no surrounding text)
- The schema must have "type": "object" at root
- Include "properties" with appropriate types
- Use "format" for common patterns: "uuid", "email", "date-time", "uri"
- Use "required" array for mandatory fields
- Include realistic example values in "default" where helpful
- Add "description" fields to explain fields
- For arrays, use "items" with appropriate schema
- Infer sensible constraints: minLength, maxLength, minimum, maximum where obvious
- Use "x-schemock-routes" at root level to define HTTP endpoints

Example input: "a social media post with author name, content, likes count, and tags"
Example output:
{
  "type": "object",
  "title": "SocialMediaPost",
  "description": "A social media post",
  "properties": {
    "id": { "type": "string", "format": "uuid", "description": "Unique post identifier" },
    "authorName": { "type": "string", "description": "Display name of the post author", "default": "Sarah Chen" },
    "content": { "type": "string", "description": "Main post content", "maxLength": 5000, "default": "Just shipped a new feature! 🚀" },
    "likesCount": { "type": "integer", "minimum": 0, "description": "Number of likes", "default": 42 },
    "tags": { "type": "array", "items": { "type": "string" }, "description": "Post hashtags", "default": ["ai", "dev"] },
    "createdAt": { "type": "string", "format": "date-time", "description": "ISO timestamp" }
  },
  "required": ["id", "authorName", "content", "createdAt"],
  "x-schemock-routes": [
    { "method": "get", "path": "/api/posts", "description": "List all posts" },
    { "method": "get", "path": "/api/posts/:id", "description": "Get a post by ID" },
    { "method": "post", "path": "/api/posts", "description": "Create a new post" }
  ]
}

Now generate a JSON Schema for this API:

`;

export interface InferResult {
  schema: Record<string, unknown>;
  raw: string;
}

/**
 * Infer a JSON Schema from a natural language description.
 */
export async function inferSchema(
  nlDescription: string,
  provider: AIProvider,
  config?: Partial<AIConfig>
): Promise<InferResult> {
  const resolved = resolveAIConfig(config);
  const response = await provider.complete(
    SCHEMA_INFERENCE_PROMPT + nlDescription,
    resolved
  );

  return parseSchemaResponse(response.content);
}

/**
 * Mutate an existing schema with a natural language instruction.
 */
export async function mutateSchema(
  currentSchema: Record<string, unknown>,
  instruction: string,
  provider: AIProvider,
  config?: Partial<AIConfig>
): Promise<InferResult> {
  const resolved = resolveAIConfig(config);

  const mutationPrompt = `You are a JSON Schema expert. Given an existing JSON Schema and a natural language instruction, produce the modified JSON Schema.

Rules:
- Output ONLY valid JSON (no markdown, no explanation)
- Apply the instruction to the schema
- Preserve all existing fields that aren't being changed
- If the instruction says to add something, add it with sensible defaults
- If the instruction says to remove something, remove that field

Current schema:
${JSON.stringify(currentSchema, null, 2)}

Instruction: "${instruction}"

Modified schema:
`;

  const response = await provider.complete(mutationPrompt, resolved);
  return parseSchemaResponse(response.content);
}

/**
 * Parse the raw LLM output into a schema object.
 * Strips markdown code fences if present.
 */
function parseSchemaResponse(raw: string): InferResult {
  let cleaned = raw.trim();

  // Strip markdown code fences
  if (cleaned.startsWith('```')) {
    const firstNewline = cleaned.indexOf('\n');
    if (firstNewline !== -1) {
      cleaned = cleaned.slice(firstNewline + 1);
    }
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3).trim();
  }

  try {
    const schema = JSON.parse(cleaned);
    return { schema, raw: cleaned };
  } catch {
    throw new Error(`Failed to parse LLM output as JSON Schema. Raw output:\n${cleaned.slice(0, 500)}`);
  }
}
