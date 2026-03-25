/**
 * Billing routes — Stripe checkout
 * 
 * GET  /billing/checkout?plan=pro — create Stripe checkout session
 * GET  /billing/portal          — create Stripe customer portal session
 * GET  /billing/keys            — list API keys for current customer
 * POST /billing/keys            — create new API key
 */

import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { config } from '../config.js';
import { registerApiKey, upgradeToPro, isValidApiKey } from '../middleware/auth.js';
import { customerToApiKeys } from '../store.js';

const stripe = new Stripe(config.stripeSecretKey, { apiVersion: '2025-01-27.acacia' });

export const billingRouter = Router();

/**
 * POST /billing/checkout
 * Create a Stripe checkout session for Pro plan
 */
billingRouter.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { priceId, successUrl, cancelUrl, customerId } = req.body;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [
        {
          price: priceId || config.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || config.stripeSuccessUrl,
      cancel_url: cancelUrl || config.stripeCancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    };

    if (customerId) {
      sessionParams.customer = customerId;
    } else {
      sessionParams.customer_creation = 'always';
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    res.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('Stripe checkout error:', error?.message);
    res.status(500).json({ error: 'CHECKOUT_ERROR', message: error?.message });
  }
});

/**
 * GET /billing/portal
 * Create a Stripe customer portal session
 */
billingRouter.post('/portal', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      res.status(400).json({ error: 'MISSING_CUSTOMER', message: 'customerId required' });
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'https://schemocker.com/dashboard',
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe portal error:', error?.message);
    res.status(500).json({ error: 'PORTAL_ERROR', message: error?.message });
  }
});

/**
 * POST /billing/keys
 * Create a new API key (optionally tied to a Stripe customer)
 */
billingRouter.post('/keys', async (req: Request, res: Response) => {
  try {
    const { customerId, tier = 'free' } = req.body;

    const info = registerApiKey(tier === 'pro' ? 'pro' : 'free', customerId);

    // Track customer → keys mapping
    if (customerId) {
      const keys = customerToApiKeys.get(customerId) || [];
      keys.push(info.key);
      customerToApiKeys.set(customerId, keys);
    }

    res.json({
      key: info.key,
      tier: info.tier,
      createdAt: info.createdAt,
    });
  } catch (error: any) {
    console.error('Key creation error:', error?.message);
    res.status(500).json({ error: 'KEY_ERROR', message: error?.message });
  }
});

/**
 * GET /billing/keys
 * List API keys for a Stripe customer
 */
billingRouter.get('/keys', (req: Request, res: Response) => {
  const customerId = req.headers['x-customer-id'] as string;

  if (!customerId) {
    res.status(400).json({ error: 'MISSING_CUSTOMER', message: 'x-customer-id header required' });
    return;
  }

  const keys = customerToApiKeys.get(customerId) || [];
  const keyInfos = keys.map((key) => {
    const info = isValidApiKey(key);
    return info ? { key, tier: info.tier, createdAt: info.createdAt } : null;
  }).filter(Boolean);

  res.json({ keys: keyInfos });
});

/**
 * GET /billing/config
 * Public config for the frontend (publishable key, pricing)
 */
billingRouter.get('/config', (_req: Request, res: Response) => {
  res.json({
    stripePublishableKey: config.stripePublishableKey,
    stripePriceId: config.stripePriceId,
  });
});
