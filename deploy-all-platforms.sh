#!/bin/bash

# Deploy to all platforms with environment variables
# This script sets up env vars and deploys to both Netlify and Vercel

echo "🚀 Multi-Platform Deployment Script"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: .env.local not found!${NC}"
    echo "Please create .env.local with your environment variables first."
    exit 1
fi

# Function to setup Netlify
setup_netlify() {
    echo -e "\n${BLUE}📦 Setting up Netlify...${NC}"
    
    if ! command -v netlify &> /dev/null; then
        echo "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    # Check authentication
    netlify status &> /dev/null || netlify login
    
    # Set environment variables
    echo "Setting environment variables..."
    while IFS='=' read -r key value; do
        if [[ ! "$key" =~ ^#.*$ ]] && [[ -n "$key" ]]; then
            value="${value%\"}"
            value="${value#\"}"
            value="${value%\'}"
            value="${value#\'}"
            
            # Skip service role key for security
            if [[ "$key" != "SUPABASE_SERVICE_ROLE_KEY" ]]; then
                netlify env:set "$key" "$value" --context production &> /dev/null && \
                echo -e "${GREEN}✓${NC} $key"
            fi
        fi
    done < .env.local
    
    echo -e "${GREEN}✅ Netlify environment variables set!${NC}"
}

# Function to setup Vercel
setup_vercel() {
    echo -e "\n${BLUE}📦 Setting up Vercel...${NC}"
    
    if ! command -v vercel &> /dev/null; then
        echo "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Check authentication
    vercel whoami &> /dev/null || vercel login
    
    # Set environment variables
    echo "Setting environment variables..."
    while IFS='=' read -r key value; do
        if [[ ! "$key" =~ ^#.*$ ]] && [[ -n "$key" ]]; then
            value="${value%\"}"
            value="${value#\"}"
            value="${value%\'}"
            value="${value#\'}"
            
            # Skip service role key for security
            if [[ "$key" != "SUPABASE_SERVICE_ROLE_KEY" ]]; then
                echo "$value" | vercel env add "$key" production --yes &> /dev/null 2>&1 && \
                echo -e "${GREEN}✓${NC} $key"
            fi
        fi
    done < .env.local
    
    echo -e "${GREEN}✅ Vercel environment variables set!${NC}"
}

# Main menu
echo -e "${YELLOW}Select deployment option:${NC}"
echo "1) Deploy to Netlify only"
echo "2) Deploy to Vercel only"
echo "3) Deploy to both platforms"
echo "4) Setup env vars only (no deployment)"
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        setup_netlify
        echo -e "\n${BLUE}🚀 Deploying to Netlify...${NC}"
        netlify deploy --prod
        echo -e "${GREEN}✅ Netlify deployment complete!${NC}"
        echo -e "🌐 Site: ${BLUE}https://thunderous-jalebi-6f0dc7.netlify.app${NC}"
        ;;
    2)
        setup_vercel
        echo -e "\n${BLUE}🚀 Deploying to Vercel...${NC}"
        vercel --prod
        echo -e "${GREEN}✅ Vercel deployment complete!${NC}"
        ;;
    3)
        setup_netlify
        setup_vercel
        echo -e "\n${BLUE}🚀 Deploying to both platforms...${NC}"
        
        # Deploy to Netlify
        echo -e "\n${YELLOW}Deploying to Netlify...${NC}"
        netlify deploy --prod
        
        # Deploy to Vercel
        echo -e "\n${YELLOW}Deploying to Vercel...${NC}"
        vercel --prod
        
        echo -e "\n${GREEN}✅ All deployments complete!${NC}"
        echo -e "🌐 Netlify: ${BLUE}https://thunderous-jalebi-6f0dc7.netlify.app${NC}"
        echo -e "🌐 Vercel: Check the URL provided above"
        ;;
    4)
        setup_netlify
        setup_vercel
        echo -e "\n${GREEN}✅ Environment variables set for both platforms!${NC}"
        echo -e "${YELLOW}Run deployment manually when ready:${NC}"
        echo "  Netlify: netlify deploy --prod"
        echo "  Vercel: vercel --prod"
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo -e "\n${BLUE}📋 Environment variables set:${NC}"
echo "- VITE_OPENAI_API_KEY"
echo "- VITE_SUPABASE_URL"
echo "- VITE_SUPABASE_ANON_KEY"
echo -e "\n${YELLOW}Note: SUPABASE_SERVICE_ROLE_KEY was excluded for security${NC}"