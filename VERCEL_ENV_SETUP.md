# Secure Environment Variable Setup for Vercel Deployment

## Environment Variable Guidelines

When deploying to Vercel, follow these security practices for environment variables:

### 🔒 Sensitive Variables (NEVER prefix with VITE_)

These variables will only be available to server-side code (Vercel Functions, Edge Functions):

- `NFT_STORAGE_KEY`
- `PINATA_API_KEY`
- `PINATA_API_SECRET`
- `PINATA_JWT`
- `SUPABASE_ANON_KEY`
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`

### 🌐 Public Variables (Can use VITE_ prefix)

These variables are safe to be included in client-side code:

- `VITE_SUPABASE_URL`
- `VITE_SOLANA_RPC_URL`
- `VITE_GATEWAY_URL`
- `VITE_SERVER_URL`

## Setting Up Environment Variables in Vercel

1. Navigate to your project in the Vercel dashboard
2. Go to **Project Settings** → **Environment Variables**
3. Add each environment variable with the correct name format:
   - NO `VITE_` prefix for sensitive variables
   - `VITE_` prefix only for public variables

## API Routes for Secure Operations

All sensitive operations should be performed via secure API routes in the `/api` folder:

- `/api/token-operations.js`: Handles operations that require sensitive keys

## Client-Side Code

When you need to perform sensitive operations from client-side code:

```javascript
// Instead of directly using sensitive keys
// ❌ const apiKey = import.meta.env.VITE_PINATA_API_KEY;

// ✅ Make a call to your secure API endpoint
const response = await fetch('/api/token-operations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operation: 'upload-to-ipfs',
    data: formData
  })
});
```

## Vercel Deployments

For each environment (preview, development, production), you can set different environment variables. This allows you to use different API keys for different environments.

## Environment Strategy for Development

During local development, you can still use a local `.env` file with VITE_ prefixes for convenience, but ensure that in production these variables are set up according to the guidelines above.
