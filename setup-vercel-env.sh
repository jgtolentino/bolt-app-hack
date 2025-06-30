#!/bin/bash

# Setup Vercel environment variables
# Prerequisites: npm install -g vercel

echo "🚀 Setting up Vercel environment variables..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel if needed
echo "📝 Checking Vercel authentication..."
vercel whoami || vercel login

# Set environment variables from .env.local
echo "⚙️ Adding environment variables to Vercel..."

# Read .env.local and set each variable
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ ! "$key" =~ ^#.*$ ]] && [[ -n "$key" ]]; then
        # Remove quotes from value if present
        value="${value%\"}"
        value="${value#\"}"
        value="${value%\'}"
        value="${value#\'}"
        
        # Skip Supabase service role key for client deployment
        if [[ "$key" != "SUPABASE_SERVICE_ROLE_KEY" ]]; then
            echo "Setting $key..."
            echo "$value" | vercel env add "$key" production
        fi
    fi
done < .env.local

echo "✅ Vercel environment variables set successfully!"
echo "🔄 Ready to deploy..."
echo "Run 'vercel --prod' to deploy with these variables"

echo "
📌 Manual verification steps:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Verify all variables are set correctly
5. Redeploy if needed
"