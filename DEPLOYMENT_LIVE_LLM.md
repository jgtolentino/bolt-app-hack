# Live LLM Deployment Guide

## ❌ NO FALLBACK MODE - LIVE AI ONLY

This application is configured to run **exclusively** with live LLM APIs. There are no mock or fallback modes.

## Prerequisites

You MUST have:
- Valid OpenAI API key with GPT-4 access
- Valid Anthropic API key (optional but recommended for fallback)
- Sufficient API credits/quota

## Local Development

1. Copy environment template:
```bash
cp .env.production.example .env.local
```

2. Add your actual API keys:
```env
VITE_OPENAI_API_KEY=sk-YOUR-ACTUAL-KEY
VITE_ANTHROPIC_API_KEY=sk-ant-YOUR-ACTUAL-KEY
```

3. Test locally:
```bash
npm run dev
```

## Vercel Deployment

### Option 1: Vercel CLI

```bash
# Set environment variables
vercel env add VITE_OPENAI_API_KEY production
vercel env add VITE_OPENAI_API_BASE production
vercel env add VITE_OPENAI_MODEL production
vercel env add VITE_ANTHROPIC_API_KEY production
vercel env add VITE_ANTHROPIC_MODEL production

# Deploy
vercel --prod
```

### Option 2: Vercel Dashboard

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project: `bolt-app-hack`
3. Navigate to Settings → Environment Variables
4. Add the following **production** variables:

| Key | Value |
|-----|-------|
| `VITE_OPENAI_API_KEY` | Your OpenAI API key |
| `VITE_OPENAI_API_BASE` | `https://api.openai.com/v1` |
| `VITE_OPENAI_MODEL` | `gpt-4` |
| `VITE_ANTHROPIC_API_KEY` | Your Anthropic API key |
| `VITE_ANTHROPIC_MODEL` | `claude-3-sonnet-20240229` |

5. Trigger a new deployment

## Verification

After deployment, verify the AI features:

1. Open the deployed app
2. Navigate to AI Chat
3. Ask a question like "What are today's sales?"
4. If you see an error about missing API keys, check your environment variables

## Error Messages

If API keys are missing, you'll see:
- `❌ LLM Key not set. Refusing to proceed in fallback mode.`
- `❌ AI API key required. Add VITE_OPENAI_API_KEY or VITE_ANTHROPIC_API_KEY`

## Security Notes

- Never commit API keys to version control
- Use Vercel's encrypted environment variables
- Rotate keys regularly
- Monitor API usage to prevent unexpected charges

## Troubleshooting

1. **"No AI providers available"**
   - Ensure environment variables are set correctly
   - Check that variable names start with `VITE_`
   - Verify keys are valid and have credits

2. **"All AI providers failed"**
   - Check API key validity
   - Verify network connectivity
   - Ensure API rate limits aren't exceeded

3. **Build failures**
   - The app will NOT build without valid API keys
   - This is intentional - no fallback mode allowed