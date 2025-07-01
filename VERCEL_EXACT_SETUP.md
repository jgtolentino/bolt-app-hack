# EXACT VERCEL SETUP - NO MORE 401 ERRORS

## Go to: https://vercel.com/scout-db/bolt-app-hack/settings/environment-variables

## Add these EXACT 4 variables:

### 1. VITE_SUPABASE_URL
- Environment: Production
- Value: `https://baqlxgwdfjltivlfmsbr.supabase.co`

### 2. VITE_SUPABASE_ANON_KEY
- Environment: Production
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcWx4Z3dkZmpsdGl2bGZtc2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4NTk4OTYsImV4cCI6MjA0NjQzNTg5Nn0.pboVC-YgyH7CrJfh7N5fxJLAaW13ej-lqV-tVvFHF3A`

### 3. VITE_OPENAI_API_KEY
- Environment: Production
- Value: [YOUR ACTUAL OPENAI KEY]

### 4. VITE_ANTHROPIC_API_KEY
- Environment: Production
- Value: [YOUR ACTUAL ANTHROPIC KEY]

## Then run:
```bash
vercel --prod --force
```

## That's it. No more 401 errors.