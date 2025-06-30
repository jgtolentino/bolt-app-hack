#!/bin/bash

# Setup Vercel environment variables
# Run this script to add all environment variables to Vercel

echo "Setting up Vercel environment variables..."

# Add OpenAI API Key
vercel env add VITE_OPENAI_API_KEY production < .env.local

# Add Supabase URL
vercel env add VITE_SUPABASE_URL production < .env.local

# Add Supabase Anon Key
vercel env add VITE_SUPABASE_ANON_KEY production < .env.local

echo "Environment variables added to Vercel!"
echo "Run 'vercel --prod' to deploy with these variables"