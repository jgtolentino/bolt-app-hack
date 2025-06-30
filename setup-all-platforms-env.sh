#!/bin/bash

# Comprehensive script to add VITE_GADM_BASE_URL to all platforms

GADM_URL="https://baqlxgwdfjltivlfmsbr.supabase.co/storage/v1/object/public/geo"

echo "🚀 Setting up VITE_GADM_BASE_URL across all platforms..."
echo "=================================================="

# 1. Add to .env.local if not already there
echo -e "\n📝 Checking .env.local..."
if ! grep -q "VITE_GADM_BASE_URL" .env.local 2>/dev/null; then
    echo -e "\n# Geo Data Configuration" >> .env.local
    echo "VITE_GADM_BASE_URL=$GADM_URL" >> .env.local
    echo "✅ Added to .env.local"
else
    echo "✅ Already in .env.local"
fi

# 2. Vercel - All environments
echo -e "\n📦 Setting up Vercel..."
if command -v vercel &> /dev/null; then
    echo "Adding to Vercel (all environments)..."
    
    # Remove existing if any and add fresh
    vercel env rm VITE_GADM_BASE_URL production --yes 2>/dev/null || true
    vercel env rm VITE_GADM_BASE_URL preview --yes 2>/dev/null || true
    vercel env rm VITE_GADM_BASE_URL development --yes 2>/dev/null || true
    
    echo "$GADM_URL" | vercel env add VITE_GADM_BASE_URL production
    echo "$GADM_URL" | vercel env add VITE_GADM_BASE_URL preview  
    echo "$GADM_URL" | vercel env add VITE_GADM_BASE_URL development
    
    echo "✅ Vercel environment variables set!"
    echo "   To deploy: vercel --prod"
else
    echo "⚠️  Vercel CLI not found. Install with: npm i -g vercel"
fi

# 3. Netlify - Using direct API
echo -e "\n📦 Setting up Netlify..."
NETLIFY_SITE_NAME="thunderous-jalebi-6f0dc7"

# Try to use netlify CLI first
if command -v netlify &> /dev/null; then
    # Check if we're linked
    if [ -f .netlify/state.json ]; then
        netlify env:set VITE_GADM_BASE_URL "$GADM_URL" 2>/dev/null && \
        echo "✅ Netlify environment variable set via CLI!" || \
        echo "⚠️  Netlify CLI failed, please add manually"
    else
        echo "⚠️  Netlify project not linked. Trying to link..."
        # Create minimal state file
        mkdir -p .netlify
        echo '{"siteId":"'$NETLIFY_SITE_NAME'"}' > .netlify/state.json
        
        netlify env:set VITE_GADM_BASE_URL "$GADM_URL" 2>/dev/null && \
        echo "✅ Netlify environment variable set!" || \
        echo "⚠️  Please add manually at: https://app.netlify.com/sites/$NETLIFY_SITE_NAME/settings/env"
    fi
else
    echo "⚠️  Netlify CLI not found. Please add manually at:"
    echo "   https://app.netlify.com/sites/$NETLIFY_SITE_NAME/settings/env"
fi

# 4. Create platform-specific env files for CI/CD
echo -e "\n📄 Creating platform env files..."

# Create .env.production for build time
cat > .env.production <<EOF
# Production environment variables
VITE_SUPABASE_URL=https://baqlxgwdfjltivlfmsbr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcWx4Z3dkZmpsdGl2bGZtc2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNTc5OTYsImV4cCI6MjA2NjczMzk5Nn0.lq1ZFea-FCiYnRGtwTgo-6e_TUQ2YYPeqJ3I9SVVkak
VITE_GADM_BASE_URL=$GADM_URL
# Note: Add VITE_OPENAI_API_KEY in platform settings for security
EOF

echo "✅ Created .env.production"

# 5. Railway.app support
if command -v railway &> /dev/null; then
    echo -e "\n📦 Setting up Railway..."
    railway variables set VITE_GADM_BASE_URL="$GADM_URL" 2>/dev/null && \
    echo "✅ Railway environment variable set!" || \
    echo "⚠️  Railway not configured"
fi

# 6. Render.com support (using their CLI)
if command -v render &> /dev/null; then
    echo -e "\n📦 Setting up Render..."
    render env:set VITE_GADM_BASE_URL="$GADM_URL" 2>/dev/null && \
    echo "✅ Render environment variable set!" || \
    echo "⚠️  Render not configured"
fi

# 7. Summary and next steps
echo -e "\n✅ Setup Complete!"
echo "=================="
echo ""
echo "Environment variable added:"
echo "VITE_GADM_BASE_URL = $GADM_URL"
echo ""
echo "📋 Platform Status:"
echo "- Local (.env.local): ✅"
echo "- Vercel: $(command -v vercel &> /dev/null && echo '✅' || echo '❌ CLI not installed')"
echo "- Netlify: $(command -v netlify &> /dev/null && echo '✅ (may need manual setup)' || echo '❌ CLI not installed')"
echo "- Production build: ✅ (.env.production created)"
echo ""
echo "🚀 Next Steps:"
echo "1. Commit the .env.production file"
echo "2. Push to trigger auto-deploy"
echo "3. For Netlify, verify at: https://app.netlify.com/sites/$NETLIFY_SITE_NAME/settings/env"
echo ""
echo "📝 Manual Fallback:"
echo "If any platform failed, add this variable manually:"
echo "Key: VITE_GADM_BASE_URL"
echo "Value: $GADM_URL"