# 🚀 Deploy Scout Analytics Dashboard NOW

The deployment failed because API keys aren't set. Here's how to fix it:

## Quick Fix (2 minutes)

### Step 1: Set Your API Keys

Run these commands in your terminal and paste your actual API keys when prompted:

```bash
# Add OpenAI key (starts with sk-)
vercel env add VITE_OPENAI_API_KEY production

# Add Anthropic key (starts with sk-ant-)
vercel env add VITE_ANTHROPIC_API_KEY production
```

### Step 2: Deploy

```bash
vercel --prod --force
```

## Alternative: Use Vercel Dashboard

1. Open: https://vercel.com/scout-db/bolt-app-hack/settings/environment-variables
2. Add these **Production** variables:
   - `VITE_OPENAI_API_KEY` → your OpenAI key
   - `VITE_ANTHROPIC_API_KEY` → your Anthropic key
3. Click "Save"
4. Go to Deployments tab and click "Redeploy" on latest commit

## Get API Keys

- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/settings/keys

## Important Notes

- The app will NOT work without real API keys
- No mock mode available - this is intentional
- Keys are encrypted by Vercel - safe for production
- Current deployment (9d03286) doesn't have the live-only mode
- You need to deploy commit 570c2bc or later

## Verify Deployment

After deployment, check:
1. https://bolt-app-hack.vercel.app
2. Navigate to AI Chat
3. Ask "What are today's sales?"
4. Should work with real AI responses