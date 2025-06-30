# Deployment Environment Variables Setup

This guide explains how to set up environment variables for the AI integration to work in production.

## Required Environment Variables

```bash
VITE_SUPABASE_URL=https://baqlxgwdfjltivlfmsbr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcWx4Z3dkZmpsdGl2bGZtc2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNTc5OTYsImV4cCI6MjA2NjczMzk5Nn0.lq1ZFea-FCiYnRGtwTgo-6e_TUQ2YYPeqJ3I9SVVkak
VITE_OPENAI_API_KEY=your-openai-api-key-here
```

## Vercel Deployment

### Option 1: Via Dashboard
1. Go to [vercel.com](https://vercel.com) and select your project
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable above
4. Redeploy

### Option 2: Via CLI
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Add environment variables
vercel env add VITE_OPENAI_API_KEY production
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production

# Deploy
vercel --prod
```

## Netlify Deployment

1. Go to your Netlify dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Click **Add a variable** and add each variable
4. Trigger a new deploy

## Railway Deployment

```bash
# Using Railway CLI
railway variables add VITE_OPENAI_API_KEY="your-key"
railway variables add VITE_SUPABASE_URL="your-url"
railway variables add VITE_SUPABASE_ANON_KEY="your-key"
railway up
```

## Render Deployment

1. Go to your Render dashboard
2. Select your service
3. Go to **Environment** tab
4. Add each variable
5. Click **Save Changes** (auto-deploys)

## Important Security Notes

- **NEVER** commit API keys to git
- **NEVER** expose keys in client-side code without proper security
- Consider using environment-specific keys (dev/staging/prod)
- Rotate keys regularly
- Use read-only keys where possible

## Testing the Deployment

After deployment, verify the AI integration works:

1. Open your deployed app
2. Navigate to the AI Assistant page
3. Try asking a question
4. Check browser console for any errors

If you see errors like "OpenAI API key not found", the environment variables aren't properly set.