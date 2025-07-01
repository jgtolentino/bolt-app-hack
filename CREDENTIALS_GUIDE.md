# 🔐 Centralized Credentials Guide

All credentials are now managed in **ONE place** for security and convenience.

## 📍 Location

Your credentials are stored in: `/Users/tbwa/Documents/GitHub/bolt-app-hack/.env.local`

## 🚀 Quick Setup

### 1. View Current Credentials Status

```bash
# Open your app and check the console
npm run dev
# Look for "Credential Status:" in the console
```

### 2. Edit Credentials

```bash
# Open in your editor
code .env.local
# or
nano .env.local
```

### 3. Required Credentials

#### Supabase (Required)
```env
VITE_SUPABASE_URL=https://baqlxgwdfjltivlfmsbr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

#### AI Providers (At least one required)
```env
# OpenAI
VITE_OPENAI_API_KEY=sk-proj-...
VITE_AI_MODEL=gpt-4

# Anthropic (Recommended as fallback)
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
```

## 🏗️ Architecture

### Centralized Configuration (`src/config/credentials.ts`)

All services now pull credentials from this single source:

```typescript
import { getCredentials } from '../config/credentials';

const credentials = getCredentials();
// Access any credential
const openAIKey = credentials.ai.openai.apiKey;
```

### Services Using Central Config

1. **AI Service** (`src/services/aiService.ts`)
   - OpenAI API key
   - Anthropic API key
   - Model configurations

2. **Supabase** (`src/lib/supabase.ts`)
   - Supabase URL
   - Supabase Anon Key
   - Service Role Key

3. **AdsBot Runtime** (`src/services/adsbot-runtime.ts`)
   - All AI provider credentials
   - Fallback configurations

## 🔒 Security Best Practices

### ✅ DO:
- Keep `.env.local` in `.gitignore`
- Rotate API keys monthly
- Use different keys for dev/prod
- Monitor usage on provider dashboards

### ❌ DON'T:
- Commit `.env.local` to git
- Share keys in chat/email
- Use production keys in development
- Log keys to console

## 🛠️ Utility Functions

### Check Credentials
```typescript
import { validateCredentials, logCredentialStatus } from '../config/credentials';

// Validate all required credentials
const { valid, missing } = validateCredentials();
if (!valid) {
  console.error('Missing:', missing);
}

// Log status (safely masked)
logCredentialStatus();
```

### Check AI Providers
```typescript
import { hasAIProvider, getPreferredAIProvider } from '../config/credentials';

// Check if specific provider is configured
if (hasAIProvider('anthropic')) {
  // Use Anthropic
}

// Get best available provider
const provider = getPreferredAIProvider(); // Returns 'anthropic', 'openai', or null
```

## 📝 Environment Template

A complete template is available at `.env.template` with all possible variables:

```bash
# Create your .env.local from template
cp .env.template .env.local
```

## 🚨 Troubleshooting

### "No API keys configured"
1. Check `.env.local` exists
2. Verify keys are not placeholders
3. Restart dev server after changes

### "Invalid API key"
1. Check for typos in keys
2. Verify key hasn't been revoked
3. Ensure correct format (sk-proj-... for OpenAI)

### "Supabase connection failed"
1. Verify URL format: `https://xxxxx.supabase.co`
2. Check anon key is complete (very long string)
3. Test connection in Supabase dashboard

## 🔄 Migration from Old Setup

If you had credentials in multiple places:

1. All `import.meta.env.VITE_*` calls now use `getCredentials()`
2. Database configs consolidated in `credentials.database`
3. AI configs unified in `credentials.ai`

## 📊 Credential Status on Startup

When you run the app, you'll see:

```
Credential Status:
==================
Database: ✓ Configured
Supabase URL: ✓ Configured
Supabase Anon Key: sk-p...OoA
OpenAI API Key: sk-p...OoA
Anthropic API Key: your...ere
Google Analytics: ✗ Not configured
```

This helps quickly identify what's configured and what's missing.

---

All credentials are now in **ONE place**: `.env.local` 🎉