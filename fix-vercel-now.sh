#!/bin/bash

echo "🚀 Fixing Vercel Environment Variables Automatically"
echo "=================================================="

# Set all required environment variables
echo "Setting VITE_SUPABASE_URL..."
echo "https://baqlxgwdfjltivlfmsbr.supabase.co" | vercel env add VITE_SUPABASE_URL production

echo "Setting VITE_SUPABASE_ANON_KEY..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcWx4Z3dkZmpsdGl2bGZtc2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4NTk4OTYsImV4cCI6MjA0NjQzNTg5Nn0.pboVC-YgyH7CrJfh7N5fxJLAaW13ej-lqV-tVvFHF3A" | vercel env add VITE_SUPABASE_ANON_KEY production

echo ""
echo "✅ Environment variables set!"
echo ""
echo "Now deploying..."
vercel --prod --force

echo ""
echo "🎉 DONE! Check https://bolt-app-hack.vercel.app"