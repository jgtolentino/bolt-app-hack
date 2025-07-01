# ⚠️ URGENT SECURITY NOTICE

## Exposed API Keys

You have shared API keys in our conversation that need immediate attention:

### OpenAI API Key
- **Key**: `sk-proj-jXvRgFtSpxp8dtxZTrzy17vb...` (truncated for this notice)
- **Status**: EXPOSED - Revoke immediately
- **Action Required**: 
  1. Go to https://platform.openai.com/api-keys
  2. Revoke this key
  3. Generate a new key
  4. Never share keys in chat

### Anthropic API Key  
- **Key**: `sk-ant-api03-p6as39OufIcYRj56CPvpNMpoyXepq2e...` (truncated for this notice)
- **Status**: EXPOSED - Revoke immediately
- **Action Required**:
  1. Go to https://console.anthropic.com/settings/keys
  2. Revoke this key
  3. Generate a new key
  4. Never share keys in chat

## Immediate Actions

1. **Revoke Both Keys Now**: These keys are compromised and could be used by anyone who sees this conversation

2. **Generate New Keys**: Create fresh API keys from both providers

3. **Secure Storage**: Add new keys to `.env` file:
   ```bash
   # Create .env file from template
   cp .env.example .env
   
   # Edit .env and add your NEW keys
   VITE_OPENAI_API_KEY=your-new-openai-key
   VITE_ANTHROPIC_API_KEY=your-new-anthropic-key
   ```

4. **Never Commit .env**: Ensure `.env` is in `.gitignore`:
   ```bash
   # Verify .env is ignored
   grep "^.env$" .gitignore || echo ".env" >> .gitignore
   ```

## Best Practices

### ✅ DO:
- Store API keys in environment variables
- Use `.env` files for local development
- Use secure key management services in production
- Rotate keys regularly

### ❌ DON'T:
- Share keys in chat messages
- Commit keys to git repositories  
- Hard-code keys in source files
- Use the same keys across environments

## Production Deployment

For production, use proper secret management:

### Vercel
```bash
vercel env add VITE_OPENAI_API_KEY
vercel env add VITE_ANTHROPIC_API_KEY
```

### Netlify
Add via Netlify UI: Site Settings → Environment Variables

### Azure
Use Azure Key Vault for secure key storage

## Verification

After setting up new keys:

1. Test locally:
   ```bash
   npm run dev
   # Check console for "AI Service initialized with OpenAI"
   ```

2. Test AI features work with new keys

3. Monitor usage on provider dashboards

Remember: API keys are like passwords - keep them secret, keep them safe!