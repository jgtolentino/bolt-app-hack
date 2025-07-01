#!/bin/bash

echo "🚀 Setting ALL Environment Variables for Production"
echo "================================================="
echo ""
echo "This script will set up all required environment variables."
echo "Please have your API keys ready."
echo ""

# Supabase (already set, but let's ensure they're there)
echo "https://baqlxgwdfjltivlfmsbr.supabase.co" | vercel env add VITE_SUPABASE_URL production --force
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcWx4Z3dkZmpsdGl2bGZtc2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4NTk4OTYsImV4cCI6MjA0NjQzNTg5Nn0.pboVC-YgyH7CrJfh7N5fxJLAaW13ej-lqV-tVvFHF3A" | vercel env add VITE_SUPABASE_ANON_KEY production --force

# OpenAI
echo ""
echo "Enter your OpenAI API key (starts with sk-):"
read OPENAI_KEY
echo "$OPENAI_KEY" | vercel env add VITE_OPENAI_API_KEY production --force

# Anthropic
echo ""
echo "Enter your Anthropic API key (starts with sk-ant-):"
read ANTHROPIC_KEY
echo "$ANTHROPIC_KEY" | vercel env add VITE_ANTHROPIC_API_KEY production --force

echo ""
echo "✅ All environment variables set!"
echo ""
echo "Deploying with all variables..."
vercel --prod --force

echo ""
echo "🎉 DONE! Your app is ready at https://bolt-app-hack.vercel.app"
echo "No more errors!"