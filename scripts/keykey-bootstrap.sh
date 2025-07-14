#!/bin/bash
set -euo pipefail

# KeyKey Bootstrap Script - Automates all secret management
# This script sets up KeyKey as the sole secret manager for TBWA platform

echo "🤖 KeyKey Secrets Bootstrap"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"
    
    local missing=0
    
    # Check for required tools
    for tool in doppler gh curl jq; do
        if ! command -v $tool &> /dev/null; then
            echo -e "${RED}❌ Missing: $tool${NC}"
            missing=1
        else
            echo -e "${GREEN}✓ Found: $tool${NC}"
        fi
    done
    
    if [ $missing -eq 1 ]; then
        echo -e "${RED}Please install missing tools first${NC}"
        exit 1
    fi
}

# Initialize KeyKey's identity
init_keykey() {
    echo -e "\n${BLUE}Initializing KeyKey...${NC}"
    
    # Check if KeyKey project exists
    if ! doppler projects get keykey-bot &>/dev/null; then
        echo "Creating KeyKey bot project..."
        doppler projects create keykey-bot
    fi
    
    # Check for KeyKey's own credentials
    if [ -z "${KEYKEY_GITHUB_PAT:-}" ]; then
        echo -e "${YELLOW}Please create a GitHub PAT with repo, workflow, and secrets scopes${NC}"
        echo "Visit: https://github.com/settings/tokens/new"
        read -p "Enter GitHub PAT for KeyKey: " -s KEYKEY_GITHUB_PAT
        echo
    fi
    
    if [ -z "${KEYKEY_RENDER_TOKEN:-}" ]; then
        echo -e "${YELLOW}Please create a Render API token${NC}"
        echo "Visit: https://dashboard.render.com/account/api-keys"
        read -p "Enter Render API token for KeyKey: " -s KEYKEY_RENDER_TOKEN
        echo
    fi
    
    # Store KeyKey's credentials
    echo "Storing KeyKey's credentials..."
    doppler secrets set GITHUB_PAT="$KEYKEY_GITHUB_PAT" --project keykey-bot --silent
    doppler secrets set RENDER_TOKEN="$KEYKEY_RENDER_TOKEN" --project keykey-bot --silent
    
    echo -e "${GREEN}✓ KeyKey identity established${NC}"
}

# Setup TBWA platform secrets
setup_platform_secrets() {
    echo -e "\n${BLUE}Setting up TBWA platform secrets...${NC}"
    
    # Create platform project if needed
    if ! doppler projects get tbwa-platform &>/dev/null; then
        echo "Creating TBWA platform project..."
        doppler projects create tbwa-platform
    fi
    
    # Define all required secrets
    declare -A secrets=(
        ["SUPABASE_URL"]="https://cxzllzyxwpyptfretryc.supabase.co"
        ["SUPABASE_ANON_KEY"]=""
        ["SUPABASE_SERVICE_KEY"]=""
        ["MCP_API_KEY"]=""
        ["SCOUT_SERVICE_KEY"]=""
        ["HR_SERVICE_KEY"]=""
        ["FINANCE_SERVICE_KEY"]=""
        ["OPS_SERVICE_KEY"]=""
        ["CORP_SERVICE_KEY"]=""
        ["CREATIVE_SERVICE_KEY"]=""
    )
    
    # Check which secrets need to be set
    echo "Checking existing secrets..."
    for key in "${!secrets[@]}"; do
        if ! doppler secrets get "$key" --project tbwa-platform --plain &>/dev/null; then
            if [ -n "${secrets[$key]}" ]; then
                # Use default value
                doppler secrets set "$key"="${secrets[$key]}" --project tbwa-platform --silent
                echo -e "${GREEN}✓ Set $key (default)${NC}"
            else
                # Need user input
                echo -e "${YELLOW}Missing: $key${NC}"
                read -p "Enter value for $key: " -s value
                echo
                doppler secrets set "$key"="$value" --project tbwa-platform --silent
                echo -e "${GREEN}✓ Set $key${NC}"
            fi
        else
            echo -e "${GREEN}✓ $key already set${NC}"
        fi
    done
}

# Sync secrets to GitHub
sync_to_github() {
    echo -e "\n${BLUE}Syncing secrets to GitHub...${NC}"
    
    # Get KeyKey's GitHub token
    export GH_TOKEN=$(doppler secrets get GITHUB_PAT --plain --project keykey-bot)
    
    # Get repository
    read -p "Enter GitHub repository (e.g., jgtolentino/mcp-sqlite-server): " repo
    
    # Sync platform secrets
    echo "Syncing platform secrets..."
    doppler secrets download --no-file --format env --project tbwa-platform | while IFS='=' read -r key value; do
        if [ -n "$key" ] && [ -n "$value" ]; then
            echo -e "  → Setting $key"
            gh secret set "$key" -b"$value" -R "$repo" 2>/dev/null || echo -e "${RED}    Failed to set $key${NC}"
        fi
    done
    
    # Also store KeyKey's tokens for CI
    echo "Storing KeyKey tokens for CI..."
    gh secret set KEYKEY_PAT -b"$GH_TOKEN" -R "$repo"
    gh secret set KEYKEY_RENDER_TOKEN -b"$(doppler secrets get RENDER_TOKEN --plain --project keykey-bot)" -R "$repo"
    
    # Store Render service IDs if available
    if [ -n "${RENDER_MCP_SERVICE_ID:-}" ]; then
        gh secret set RENDER_MCP_SERVICE_ID -b"$RENDER_MCP_SERVICE_ID" -R "$repo"
    fi
    
    echo -e "${GREEN}✓ GitHub secrets synchronized${NC}"
}

# Setup GitHub Actions workflow
setup_github_actions() {
    echo -e "\n${BLUE}Setting up GitHub Actions...${NC}"
    
    local workflow_dir=".github/workflows"
    mkdir -p "$workflow_dir"
    
    # Create KeyKey sync workflow
    cat > "$workflow_dir/keykey-sync.yml" << 'EOF'
name: KeyKey Secret Sync

on:
  push:
    branches: [main, chatgpt-integration]
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  sync-secrets:
    name: 🤖 KeyKey Sync
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      
    - name: Verify KeyKey Access
      env:
        GH_TOKEN: ${{ secrets.KEYKEY_PAT }}
      run: |
        echo "🔐 KeyKey checking access..."
        gh auth status || { echo "❌ KeyKey PAT invalid"; exit 1; }
        
    - name: Check Required Secrets
      run: |
        : "${SUPABASE_URL:?Missing SUPABASE_URL}"
        : "${SUPABASE_ANON_KEY:?Missing SUPABASE_ANON_KEY}"
        : "${MCP_API_KEY:?Missing MCP_API_KEY}"
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        MCP_API_KEY: ${{ secrets.MCP_API_KEY }}
        
    - name: Sync to Render
      if: env.RENDER_MCP_SERVICE_ID != ''
      env:
        RENDER_TOKEN: ${{ secrets.KEYKEY_RENDER_TOKEN }}
        RENDER_MCP_SERVICE_ID: ${{ secrets.RENDER_MCP_SERVICE_ID }}
      run: |
        echo "🚀 Syncing to Render service: $RENDER_MCP_SERVICE_ID"
        
        curl -X PATCH \
          -H "Authorization: Bearer $RENDER_TOKEN" \
          -H "Content-Type: application/json" \
          https://api.render.com/v1/services/$RENDER_MCP_SERVICE_ID/env-vars \
          -d '[
            {"key": "SUPABASE_URL", "value": "${{ secrets.SUPABASE_URL }}"},
            {"key": "SUPABASE_ANON_KEY", "value": "${{ secrets.SUPABASE_ANON_KEY }}"},
            {"key": "MCP_API_KEY", "value": "${{ secrets.MCP_API_KEY }}"}
          ]'
EOF
    
    echo -e "${GREEN}✓ GitHub Actions workflow created${NC}"
}

# Create local developer setup
setup_local_dev() {
    echo -e "\n${BLUE}Setting up local development...${NC}"
    
    # Create .envrc for direnv
    cat > .envrc << 'EOF'
# KeyKey-managed environment
echo "🤖 KeyKey loading environment..."

if command -v doppler >/dev/null 2>&1; then
  if doppler projects get tbwa-platform &>/dev/null; then
    eval "$(doppler secrets download --no-file --format env --project tbwa-platform)"
    echo "✅ Loaded from Doppler"
  else
    echo "⚠️  Doppler not configured. Run: doppler login"
  fi
elif [ -f .env.local ]; then
  source .env.local
  echo "✅ Loaded from .env.local"
else
  echo "⚠️  No environment loaded. Run: npm run keykey:setup"
fi
EOF
    
    # Create package.json scripts
    if [ -f package.json ]; then
        echo -e "${YELLOW}Add these scripts to your package.json:${NC}"
        cat << 'EOF'

  "scripts": {
    "keykey:setup": "bash scripts/keykey-bootstrap.sh",
    "keykey:sync": "gh workflow run keykey-sync.yml",
    "keykey:verify": "doppler secrets --project tbwa-platform",
    "keykey:rotate": "bash scripts/keykey-rotate.sh"
  }
EOF
    fi
    
    echo -e "${GREEN}✓ Local development setup complete${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}KeyKey will automate all your secret management!${NC}"
    echo ""
    
    check_prerequisites
    init_keykey
    setup_platform_secrets
    sync_to_github
    setup_github_actions
    setup_local_dev
    
    echo ""
    echo -e "${GREEN}🎉 KeyKey setup complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Commit and push the GitHub Actions workflow"
    echo "2. Run: direnv allow (to load environment)"
    echo "3. Set RENDER_MCP_SERVICE_ID in GitHub secrets when you have it"
    echo ""
    echo -e "${BLUE}KeyKey is now managing all your secrets!${NC} 🤖"
}

# Run main function
main "$@"