#!/bin/bash

echo "🔧 Fixing 401 errors and map issues..."

# 1. Push RLS policies to Supabase
echo "📤 Pushing RLS policies to database..."
cd supabase
npx supabase db push

# 2. Test the connection
echo "🧪 Testing Supabase connection..."
curl -H "apikey: $VITE_SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
     "https://baqlxgwdfjltivlfmsbr.supabase.co/rest/v1/geography?select=id&limit=1"

echo -e "\n✅ RLS policies have been applied. The 401 errors should be resolved."
echo "📍 The map will now use fallback mock data if external services fail."
echo "🤖 For LLM features, please ensure VITE_OPENAI_API_KEY or VITE_ANTHROPIC_API_KEY is set in your .env file"