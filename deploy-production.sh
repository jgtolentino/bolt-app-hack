#!/bin/bash

echo "🚀 Scout Analytics Dashboard - Production Deployment"
echo "=================================================="
echo ""
echo "This app requires REAL API keys (no mock mode)."
echo ""
echo "Before deploying, you need to set up your API keys in Vercel."
echo ""
echo "Option 1: Interactive Setup (Recommended)"
echo "-----------------------------------------"
echo "Run these commands and enter your actual API keys when prompted:"
echo ""
echo "  vercel env add VITE_OPENAI_API_KEY production"
echo "  vercel env add VITE_ANTHROPIC_API_KEY production"
echo ""
echo "Option 2: Manual Setup via Vercel Dashboard"
echo "-------------------------------------------"
echo "1. Go to: https://vercel.com/scout-db/bolt-app-hack/settings/environment-variables"
echo "2. Add these production variables:"
echo "   - VITE_OPENAI_API_KEY = your-openai-key"
echo "   - VITE_ANTHROPIC_API_KEY = your-anthropic-key"
echo ""
echo "Option 3: Quick Setup (if you have keys ready)"
echo "----------------------------------------------"
echo "Export your keys first:"
echo "  export OPENAI_KEY='sk-...'"
echo "  export ANTHROPIC_KEY='sk-ant-...'"
echo ""
echo "Then run:"
echo "  echo \$OPENAI_KEY | vercel env add VITE_OPENAI_API_KEY production"
echo "  echo \$ANTHROPIC_KEY | vercel env add VITE_ANTHROPIC_API_KEY production"
echo ""
echo "After setting up keys, deploy with:"
echo "  vercel --prod --force"
echo ""
echo "Press Enter to open Vercel Dashboard or Ctrl+C to exit..."
read -r

# Open Vercel dashboard in browser
open "https://vercel.com/scout-db/bolt-app-hack/settings/environment-variables"