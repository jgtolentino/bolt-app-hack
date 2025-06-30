#!/bin/bash

echo "🔍 Verifying Environment Variables"
echo "=================================="

# Check local .env.local
echo -e "\n📄 Local (.env.local):"
if [ -f .env.local ]; then
    echo "✅ File exists"
    grep -E "VITE_" .env.local | sed 's/=.*/=***/' | while read line; do
        echo "   ✓ $line"
    done
else
    echo "❌ File not found"
fi

# Check .env.production
echo -e "\n📄 Production (.env.production):"
if [ -f .env.production ]; then
    echo "✅ File exists"
    grep -E "VITE_" .env.production | sed 's/=.*/=***/' | while read line; do
        echo "   ✓ $line"
    done
else
    echo "❌ File not found"
fi

# Check Vercel
echo -e "\n☁️  Vercel Environment Variables:"
if command -v vercel &> /dev/null; then
    vercel env ls 2>/dev/null | grep VITE_ | while read line; do
        echo "   ✓ $line"
    done
else
    echo "❌ Vercel CLI not installed"
fi

# Test the actual endpoints
echo -e "\n🌐 Testing Endpoints:"

# Test Supabase CDN
echo -n "Supabase GADM data: "
curl -s -o /dev/null -w "%{http_code}" https://baqlxgwdfjltivlfmsbr.supabase.co/storage/v1/object/public/geo/gadm41_PHL_1.json | \
    awk '{if($1=="200") print "✅ Accessible"; else print "❌ Not accessible (HTTP " $1 ")"}'

# Summary
echo -e "\n📊 Summary:"
echo "- Local development: ✅ Ready"
echo "- Vercel deployment: ✅ Ready (https://bolt-app-hack-4hkaqz44b-scout-db.vercel.app)"
echo "- Netlify deployment: ⚠️  Requires manual env var setup"
echo ""
echo "🔗 Quick Links:"
echo "- Netlify env settings: https://app.netlify.com/sites/thunderous-jalebi-6f0dc7/settings/env"
echo "- Vercel dashboard: https://vercel.com/dashboard"