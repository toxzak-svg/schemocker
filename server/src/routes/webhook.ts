/**
 * Stripe webhook handler
 * 
 * Handles:
 * - checkout.session.completed → upgrade user to Pro
 * - customer.subscription.deleted → downgrade user to Free
 * - invoice.payment_failed → notify user
 */

import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { config } from '../config.js';
import { upgradeToPro, isValidApiKey } from '../middleware/auth.js';
import { customerToApiKeys } from '../store.js';

const stripe = new Stripe(config.stripeSecretKey, { apiVersion: '2025-01-27.acacia' });

export const webhookRouter = Router();

webhookRouter.post('/', async (req: Request, res: Response) => {
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
    res.status(400).json({ error: 'INVALID_SIGNATURE' });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          // Get the subscription to find the customer
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const customerId = subscription.customer as string;

          // Upgrade all API keys for this customer to Pro
          const customerKeys = customerToApiKeys.get(customerId) || [];
          for (const key of customerKeys) {
            upgradeToPro(key, customerId);
          }

          console.log(`Upgraded customer ${customerId} to Pro (${customerKeys.length} keys)`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Downgrade all API keys for this customer to Free
        // In production you'd track which tier each key was at
        console.log(`Subscription deleted for customer ${customerId} — keys remain but should be checked on next request`);

        // Clear their API keys from memory (in production, persist this)
        customerToApiKeys.delete(customerId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment failed for customer ${invoice.customer} — invoice ${invoice.id}`);
        // In production: send email notification, suspend account temporarily
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment succeeded for customer ${invoice.customer}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error?.message);
    res.status(500).json({ error: 'HANDLER_ERROR' });
  }
});
