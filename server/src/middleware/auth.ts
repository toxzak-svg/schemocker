/**
 * API Key authentication middleware
 * 
 * Header: x-api-key: <key>
 * 
 * Tiers:
 * - Free tier: 10 req/hour, watermark added to schemas
 * - Pro tier: 100 req/hour, no watermark
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

export interface ApiKeyInfo {
  key: string;
  tier: 'free' | 'pro';
  requestsRemaining: number;
  stripeCustomerId?: string;
  createdAt: Date;
}

// In-memory store — swap for a real DB in production
const apiKeys = new Map<string, ApiKeyInfo>();

// Free tier API keys (for demo/testing — generate via /billing/checkout)
const FREE_DEMO_KEY = 'schemock_free_demo';
apiKeys.set(FREE_DEMO_KEY, {
  key: FREE_DEMO_KEY,
  tier: 'free',
  requestsRemaining: config.freeRequestsPerHour,
  createdAt: new Date(),
});

// Request tracking per key
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function getRequestsRemaining(key: string): number {
  const info = apiKeys.get(key);
  if (!info) return 0;

  const now = Date.now();
  const tracked = requestCounts.get(key);

  if (!tracked || now > tracked.resetAt) {
    const limit = info.tier === 'pro' ? config.proRequestsPerHour : config.freeRequestsPerHour;
    requestCounts.set(key, { count: 0, resetAt: now + 60 * 60 * 1000 });
    return limit;
  }

  const limit = info.tier === 'pro' ? config.proRequestsPerHour : config.freeRequestsPerHour;
  return Math.max(0, limit - tracked.count);
}

export function incrementRequestCount(key: string): void {
  const now = Date.now();
  const tracked = requestCounts.get(key);

  if (!tracked || now > tracked.resetAt) {
    const info = apiKeys.get(key);
    const limit = info?.tier === 'pro' ? config.proRequestsPerHour : config.freeRequestsPerHour;
    requestCounts.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
  } else {
    tracked.count++;
  }
}

export function generateApiKey(): string {
  return `sk_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
}

export function registerApiKey(tier: 'free' | 'pro' = 'free', stripeCustomerId?: string): ApiKeyInfo {
  const key = generateApiKey();
  const info: ApiKeyInfo = {
    key,
    tier,
    requestsRemaining: tier === 'pro' ? config.proRequestsPerHour : config.freeRequestsPerHour,
    stripeCustomerId,
    createdAt: new Date(),
  };
  apiKeys.set(key, info);
  return info;
}

export function upgradeToPro(apiKey: string, stripeCustomerId?: string): boolean {
  const info = apiKeys.get(apiKey);
  if (!info) return false;
  info.tier = 'pro';
  if (stripeCustomerId) info.stripeCustomerId = stripeCustomerId;
  return true;
}

export function downgradeToFree(apiKey: string): boolean {
  const info = apiKeys.get(apiKey);
  if (!info) return false;
  info.tier = 'free';
  return true;
}

export function isValidApiKey(key: string): boolean {
  return apiKeys.has(key);
}

export function getApiKeyInfo(key: string): ApiKeyInfo | undefined {
  return apiKeys.get(key);
}

// Middleware
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({ error: 'MISSING_API_KEY', message: 'x-api-key header required' });
    return;
  }

  if (!isValidApiKey(apiKey)) {
    res.status(401).json({ error: 'INVALID_API_KEY', message: 'Invalid or expired API key' });
    return;
  }

  const remaining = getRequestsRemaining(apiKey);
  if (remaining <= 0) {
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Upgrade at https://schemocker.com/pricing',
    });
    return;
  }

  // Attach key info to request
  (req as any).apiKey = apiKey;
  (req as any).apiKeyInfo = getApiKeyInfo(apiKey);
  (req as any).requestsRemaining = remaining;

  incrementRequestCount(apiKey);
  next();
}
