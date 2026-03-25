# Schemocker API Server

Hosted backend for Schemocker. Handles AI schema generation, API key auth, rate limiting, and Stripe billing.

## Quick Start

```bash
cd server
cp .env.example .env
# Edit .env with your Stripe and NIM keys
npm install
npm run dev
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| GET | `/pricing` | No | List plans |
| POST | `/v1/schema/generate` | API Key | Generate schema from NL |
| POST | `/v1/schema/mutate` | API Key | Mutate existing schema |
| GET | `/v1/schema/usage` | API Key | Check usage |
| POST | `/billing/checkout` | No | Create Stripe checkout |
| POST | `/billing/portal` | No | Stripe customer portal |
| POST | `/billing/keys` | No | Create API key |
| GET | `/billing/config` | No | Public config (Stripe PK) |

## Using the API

```bash
# Get an API key (free tier)
curl -X POST https://api.schemocker.com/billing/keys \
  -H "Content-Type: application/json" \
  -d '{"tier":"free"}'

# Generate a schema
curl -X POST https://api.schemocker.com/v1/schema/generate \
  -H "x-api-key: sk_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"description":"a blog with users and posts"}'
```

## Deploying

The server is a standard Node.js Express app. Deploy to any Node.js host:

```bash
npm run build
npm start
```

Recommended: Railway, Render, Fly.io, or a $5 VPS.
