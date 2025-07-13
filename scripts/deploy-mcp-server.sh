#!/bin/bash
set -euo pipefail

# MCP Server Deployment Script
# This script deploys the MCP server to your Supabase instance

echo "🚀 MCP Server Deployment Script"
echo "==============================="
echo

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found!${NC}"
    echo "Please install it from: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Function to deploy migrations
deploy_migrations() {
    echo -e "${YELLOW}📦 Deploying database migrations...${NC}"
    
    # Deploy migrations (will prompt for password)
    echo "Deploying MCP server schema, RPC functions, and RLS policies..."
    supabase db push
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Migrations deployed successfully!${NC}"
    else
        echo -e "${RED}❌ Migration deployment failed${NC}"
        exit 1
    fi
}

# Function to deploy edge functions
deploy_edge_functions() {
    echo -e "\n${YELLOW}🔧 Deploying edge functions...${NC}"
    
    # List of edge functions to deploy
    functions=(
        "mcp-register-agent"
        "mcp-store-context"
        "mcp-execute-tool"
        "mcp-send-message"
    )
    
    for func in "${functions[@]}"; do
        echo "Deploying $func..."
        supabase functions deploy "$func"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ $func deployed${NC}"
        else
            echo -e "${RED}❌ Failed to deploy $func${NC}"
        fi
    done
}

# Function to show next steps
show_next_steps() {
    echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
    echo
    echo "Next steps:"
    echo "1. Get your Supabase URL and anon key from:"
    echo "   ${YELLOW}https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/settings/api${NC}"
    echo
    echo "2. Initialize agents in your code:"
    echo "   \`\`\`typescript"
    echo "   import { ClaudiaAgent } from './src/agents/claudia-agent'"
    echo "   const claudia = new ClaudiaAgent(SUPABASE_URL, SUPABASE_ANON_KEY)"
    echo "   await claudia.initialize()"
    echo "   \`\`\`"
    echo
    echo "3. Test the integration:"
    echo "   - Try registering an agent"
    echo "   - Store and retrieve context"
    echo "   - Send messages between agents"
    echo
    echo "4. Monitor in Supabase Dashboard:"
    echo "   ${YELLOW}https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/editor${NC}"
}

# Main deployment flow
echo "This script will deploy:"
echo "- Database migrations (schema, RPC functions, RLS policies)"
echo "- Edge functions (4 MCP endpoints)"
echo
echo -e "${YELLOW}You will be prompted for your database password.${NC}"
echo "Get it from: https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/settings/database"
echo
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Deploy migrations
deploy_migrations

# Deploy edge functions
deploy_edge_functions

# Show next steps
show_next_steps