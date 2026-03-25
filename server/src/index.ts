/**
 * Schemocker API Server
 * 
 * Hosted API for AI-powered JSON Schema generation.
 * Handles auth, rate limiting, NIM calls, and Stripe billing.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { schemaRouter } from './routes/schema.js';
import { billingRouter } from './routes/billing.js';
import { webhookRouter } from './routes/webhook.js';
import { authMiddleware } from './middleware/auth.js';
import { config } from './config.js';

const app = express();

// Webhooks need raw body — register before json middleware
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }), webhookRouter);

// Standard middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Rate limiting: 100 requests per hour per API key
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  keyGenerator: (req) => (req.headers['x-api-key'] as string) || req.ip || 'anonymous',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Upgrade at https://schemocker.com/pricing',
  },
});

app.use(limiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes — auth required
app.use('/v1/schema', authMiddleware, schemaRouter);

// Billing routes — no auth (uses Stripe session)
app.use('/billing', billingRouter);

// Pricing page
app.get('/pricing', (_req, res) => {
  res.json({
    plans: [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        requestsPerHour: 10,
        features: ['Schema generation', 'Basic models', 'Community support'],
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 1000, // $10/month in cents
        requestsPerHour: 100,
        features: ['Unlimited schemas', 'All models', 'Priority support', 'No watermarks'],
      },
    ],
  });
});

const port = config.port;
app.listen(port, () => {
  console.log(`Schemocker API running on port ${port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;
