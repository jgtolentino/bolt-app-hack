# Vercel Environment Variables Update Guide

## Issue
The production deployment at [https://bolt-app-hack.vercel.app](https://bolt-app-hack.vercel.app) is experiencing 401 authentication errors with Supabase API calls.

## Root Cause
The Supabase ANON key in the Vercel environment variables is outdated or incorrect.

## Solution

### 1. Update Vercel Environment Variables

Go to your [Vercel Dashboard](https://vercel.com/dashboard) and navigate to:
1. Select the `bolt-app-hack` project
2. Go to **Settings** → **Environment Variables**
3. Update the following variables:

```bash
VITE_SUPABASE_URL=https://baqlxgwdfjltivlfmsbr.supabase.co
VITE_SUPABASE_ANON_KEY=[Use the ANON key from credentials.ts or your Supabase dashboard]
```

### 2. Verify Other Environment Variables

Ensure these are also set if needed:
```bash
VITE_OPENAI_API_KEY=[Your OpenAI API key]
VITE_ANTHROPIC_API_KEY=[Your Anthropic API key]
VITE_AI_MODEL=gpt-4
VITE_ANTHROPIC_MODEL=claude-3-sonnet-20240229
VITE_APP_ENV=production
```

### 3. Redeploy

After updating the environment variables:
1. Trigger a new deployment in Vercel
2. Or push a commit to trigger automatic deployment

### 4. Alternative: Use Vercel CLI

If you have Vercel CLI installed:
```bash
vercel env pull .env.production
# Update the values in .env.production
vercel env push production
vercel --prod
```

## Current 401 Errors

The following API calls are failing:
- `/rest/v1/clients`
- `/rest/v1/stores`
- `/rest/v1/brands`
- `/rest/v1/product_categories`
- `/rest/v1/products`
- `/rest/v1/dashboard_filters`

All are returning 401 (Unauthorized) status.

## Testing

After deployment, verify the fix by:
1. Opening browser developer console (F12)
2. Checking Network tab for successful 200 responses
3. Ensuring data loads in the dashboard

## Important Notes

- The new ANON key was issued on November 6, 2024 and expires in 2034
- The old key from July 2024 appears to be revoked or invalid
- Always use environment variables for sensitive keys, never commit them to git