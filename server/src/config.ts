/**
 * Server configuration from environment variables
 */

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Stripe
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripePriceId: process.env.STRIPE_PRICE_ID || '', // e.g., price_123 from Stripe dashboard
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  stripeSuccessUrl: process.env.STRIPE_SUCCESS_URL || 'https://schemocker.com/dashboard?success=true',
  stripeCancelUrl: process.env.STRIPE_CANCEL_URL || 'https://schemocker.com/pricing?canceled=true',

  // NIM
  nimApiKey: process.env.NIM_API_KEY || '',
  nimBaseUrl: process.env.NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
  nimModel: process.env.NIM_MODEL || 'meta/llama-3.1-8b-instruct',

  // Auth
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',

  // Rate limits
  freeRequestsPerHour: 10,
  proRequestsPerHour: 100,
};
