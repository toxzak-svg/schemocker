/**
 * Stripe webhook handler
 * 
 * Handles:
 * - checkout.session.completed → create or upgrade API key for customer
 * - customer.subscription.deleted → downgrade all keys to free tier
 * - invoice.payment_failed → log warning (account still active during grace period)
 * - invoice.payment_succeeded → confirm subscription active
 */

import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { config } from '../config.js';
import { registerApiKey, upgradeToPro, downgradeToFree, isValidApiKey } from '../middleware/auth.js';
import { customerToApiKeys } from '../store.js';

// Validate Stripe is configured
if (!config.stripeSecretKey || !config.stripeWebhookSecret) {
  console.warn('Stripe not configured — webhook endpoint will return errors');
}

const stripe = new Stripe(config.stripeSecretKey || 'sk_placeholder', { apiVersion: '2024-12-18.acacia' });

export const webhookRouter = Router();

webhookRouter.post('/', async (req: Request, res: Response) => {
  if (!config.stripeWebhookSecret) {
    res.status(500).json({ error: 'STRIPE_NOT_CONFIGURED', message: 'Webhook secret not set' });
    return;
  }

  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripeWebhookSecret
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err?.message);
    res.status(400).json({ error: 'INVALID_SIGNATURE', message: err?.message });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const customerId = subscription.customer as string;
          const customerEmail = session.customer_details?.email || subscription.customer_email || '';

          // Find existing keys for this customer or create one
          let keys = customerToApiKeys.get(customerId) || [];

          if (keys.length === 0) {
            // No existing keys — create a new Pro key for this customer
            const newKey = registerApiKey('pro', customerId);
            keys = [newKey.key];
            customerToApiKeys.set(customerId, keys);
            console.log(`Created new Pro API key for customer ${customerId} (${customerEmail})`);
          } else {
            // Upgrade existing keys
            for (const key of keys) {
              upgradeToPro(key, customerId);
            }
            console.log(`Upgraded ${keys.length} keys for customer ${customerId} to Pro`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Downgrade all API keys for this customer to Free
        const keys = customerToApiKeys.get(customerId) || [];
        for (const key of keys) {
          downgradeToFree(key);
        }

        console.log(`Subscription deleted for customer ${customerId} — ${keys.length} keys downgraded to free tier`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(`Payment failed for customer ${invoice.customer} — invoice ${invoice.id}`);
        // Account stays active during Stripe's grace period (usually 7 days)
        // Don't revoke access yet — they'll reinstate on next payment
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment succeeded for customer ${invoice.customer}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        // Handle plan changes (e.g., changing tiers)
        if (subscription.status === 'active') {
          const customerId = subscription.customer as string;
          const keys = customerToApiKeys.get(customerId) || [];
          for (const key of keys) {
            upgradeToPro(key, customerId);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error?.message);
    res.status(500).json({ error: 'HANDLER_ERROR', message: 'Webhook handler failed' });
  }
});
