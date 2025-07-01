# 🔥 IMMEDIATE FIX FOR 401 ERRORS

## THE PROBLEM:
You have `NEXT_PUBLIC_` variables in Vercel, but the app uses `VITE_` variables!

## THE FIX:

### Go to: https://vercel.com/scout-db/bolt-app-hack/settings/environment-variables

### Add these EXACT variables (with VITE_ prefix):

1. **VITE_SUPABASE_URL**
   ```
   https://baqlxgwdfjltivlfmsbr.supabase.co
   ```
   Environment: ✅ Production ✅ Preview ✅ Development

2. **VITE_SUPABASE_ANON_KEY**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcWx4Z3dkZmpsdGl2bGZtc2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4NTk4OTYsImV4cCI6MjA0NjQzNTg5Nn0.pboVC-YgyH7CrJfh7N5fxJLAaW13ej-lqV-tVvFHF3A
   ```
   Environment: ✅ Production ✅ Preview ✅ Development

3. **VITE_OPENAI_API_KEY**
   ```
   [Your actual OpenAI key]
   ```
   Environment: ✅ Production

4. **VITE_ANTHROPIC_API_KEY**
   ```
   [Your actual Anthropic key]
   ```
   Environment: ✅ Production

### Then redeploy:
```bash
vercel --prod --force
```

## IMPORTANT:
- This is a **Vite** app, NOT Next.js
- Must use `VITE_` prefix, NOT `NEXT_PUBLIC_`
- The hardcoded fallbacks only work if env vars fail to load