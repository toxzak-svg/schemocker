/**
 * Field Enricher — AI-powered semantic field generation
 * 
 * When a field name suggests semantic content (bio, description, comment, etc.),
 * this module generates realistic LLM-powered content instead of faker noise.
 * 
 * Zero breaking change: only activates when AI provider is configured via env vars.
 */

import { resolveAIConfig } from '../ai/provider.js';

const SEMANTIC_FIELD_PATTERNS = [
  'bio', 'description', 'summary', 'body', 'content', 'comment',
  'review', 'message', 'text', 'about', 'bio', 'tagline', 'headline',
  'caption', 'excerpt', 'note', 'memo', 'post', 'article', 'story'
];

/**
 * Check if a field name suggests semantic content worth enriching
 */
export function isSemanticField(fieldName: string): boolean {
  const name = fieldName.toLowerCase();
  return SEMANTIC_FIELD_PATTERNS.some(pattern => name.includes(pattern));
}

/**
 * Check if AI generation is available (provider + key configured)
 */
function isAIConfigured(): boolean {
  try {
    const config = resolveAIConfig();
    if (!config.apiKey && config.provider === 'openai') return false;
    if (config.provider === 'ollama' || config.provider === 'vllm') return true;
    return !!config.apiKey;
  } catch {
    return false;
  }
}

/**
 * Generate a realistic enrichment prompt for a semantic field
 */
function buildPrompt(fieldName: string, parentSchema?: Record<string, unknown>): string {
  const field = fieldName.replace(/([A-Z])/g, ' $1').toLowerCase();
  const singular = field.replace(/s$/, '');
  
  const examples: Record<string, string> = {
    bio: 'A 1-2 sentence professional or personal biography',
    description: 'A 1-3 sentence description of the subject',
    summary: 'A brief 1-2 sentence summary',
    body: '2-4 sentences of body text',
    comment: 'A realistic user comment or reply',
    review: 'A product or service review with opinion',
    message: 'A direct message or notification text',
    content: 'General content text, 2-4 sentences',
    about: 'An about/me description, 1-3 sentences',
    tagline: 'A short catchy tagline or headline',
    headline: 'A compelling headline or title',
    caption: 'An image or post caption, 1 sentence',
    excerpt: 'A short excerpt or preview text',
    note: 'A brief note or memo',
    post: 'A social media post or update',
    article: 'A short article snippet',
    story: 'A brief narrative or story excerpt',
  };

  const type = examples[singular] || examples[field] || `A realistic ${singular}`;
  
  let prompt = `Generate exactly one ${type}. `;
  prompt += `Be specific and realistic, not generic. `;
  prompt += `Return ONLY the text, no quotes, no preamble.`;
  
  return prompt;
}

/**
 * Generate enriched semantic content for a field using AI
 */
export async function enrichField(fieldName: string, parentSchema?: Record<string, unknown>): Promise<string | null> {
  if (!isSemanticField(fieldName)) return null;
  if (!isAIConfigured()) return null;

  try {
    const { createAIProvider } = await import('../ai/index.js');
    const provider = createAIProvider();
    const prompt = buildPrompt(fieldName, parentSchema);
    
    const response = await provider.complete(prompt, { maxTokens: 256, temperature: 0.8 });
    
    const content = response.content.trim();
    // Ensure we got something back
    if (content.length > 0) {
      return content;
    }
    return null;
  } catch (error) {
    // Fail silently — fall back to faker logic
    console.warn(`Field enrichment failed for "${fieldName}": ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Synchronous check + async generation.
 * Returns null if not semantic or not configured (caller uses faker fallback).
 * If semantic and configured, returns a Promise for the enriched content.
 */
export function shouldEnrich(fieldName: string): boolean {
  return isSemanticField(fieldName) && isAIConfigured();
}
