#!/bin/bash

# Setup Netlify environment variables
# Prerequisites: npm install -g netlify-cli

echo "🚀 Setting up Netlify environment variables..."

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Login to Netlify if needed
echo "📝 Checking Netlify authentication..."
netlify status || netlify login

# Set environment variables from .env.local
echo "⚙️ Adding environment variables to Netlify..."

# Read .env.local and set each variable
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ ! "$key" =~ ^#.*$ ]] && [[ -n "$key" ]]; then
        # Remove quotes from value if present
        value="${value%\"}"
        value="${value#\"}"
        value="${value%\'}"
        value="${value#\'}"
        
        echo "Setting $key..."
        netlify env:set "$key" "$value" --context production
    fi
done < .env.local

echo "✅ Netlify environment variables set successfully!"
echo "🔄 Triggering a new deploy..."
netlify deploy --prod

echo "
📌 Manual verification steps:
1. Go to https://app.netlify.com
2. Select your site: thunderous-jalebi-6f0dc7
3. Go to Site configuration → Environment variables
4. Verify all variables are set correctly
5. If needed, trigger a new deploy from the UI
"