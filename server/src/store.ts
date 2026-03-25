/**
 * In-memory store for API keys and customer mappings
 * 
 * In production, replace with a real database (Postgres, Redis, etc.)
 */

// Track Stripe customer IDs → API keys
export const customerToApiKeys = new Map<string, string[]>();
