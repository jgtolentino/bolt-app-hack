#!/bin/bash

# Apply Dashboard Optimizations
# This script applies database optimizations and builds the optimized dashboard

echo "🚀 Applying Scout Dashboard Optimizations..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${BLUE}Step 1: Installing dependencies...${NC}"
npm install

echo -e "${BLUE}Step 2: Running database migrations...${NC}"
if [ -f "supabase/migrations/20250630_optimize_dashboard_functions.sql" ]; then
    echo -e "${YELLOW}Note: Please run the optimization migration in your Supabase dashboard:${NC}"
    echo "supabase/migrations/20250630_optimize_dashboard_functions.sql"
else
    echo -e "${RED}Warning: Optimization migration file not found${NC}"
fi

echo -e "${BLUE}Step 3: Building optimized dashboard...${NC}"
npm run build

echo -e "${BLUE}Step 4: Analyzing bundle size...${NC}"
if [ -d "dist" ]; then
    total_size=$(du -sh dist | cut -f1)
    echo -e "${GREEN}Total build size: $total_size${NC}"
    
    # Show largest files
    echo -e "${YELLOW}Largest files:${NC}"
    find dist -type f -name "*.js" -o -name "*.css" | xargs ls -lh | sort -k5 -hr | head -5
fi

echo -e "${GREEN}✅ Optimization complete!${NC}"
echo ""
echo -e "${YELLOW}Performance improvements implemented:${NC}"
echo "• Lazy loading for all route components"
echo "• Optimized data fetching with caching"
echo "• Parallel API queries with React Query"
echo "• Database functions for aggregated metrics"
echo "• Bundle splitting for better caching"
echo "• Performance monitoring (press Shift+P in app)"
echo ""
echo -e "${BLUE}To deploy the optimized build:${NC}"
echo "1. For Vercel: vercel --prod"
echo "2. For Netlify: netlify deploy --prod"
echo ""
echo -e "${YELLOW}Tips for best performance:${NC}"
echo "• Enable Supabase connection pooling"
echo "• Use CDN for static assets"
echo "• Enable HTTP/2 on your server"
echo "• Configure proper cache headers"