#!/bin/bash

# Script to toggle between local and cloud environments
# Usage: ./scripts/toggle-env.sh [local|cloud]

set -e

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if environment argument is provided
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: Please specify environment (local or cloud)${NC}"
    echo "Usage: $0 [local|cloud]"
    exit 1
fi

ENV_TYPE=$1

case $ENV_TYPE in
    local)
        echo -e "${YELLOW}Switching to LOCAL environment...${NC}"
        
        # Check if .env.local exists
        if [ ! -f "$PROJECT_ROOT/.env.local" ]; then
            echo -e "${RED}Error: .env.local file not found!${NC}"
            exit 1
        fi
        
        # Backup current .env
        cp "$PROJECT_ROOT/.env" "$PROJECT_ROOT/.env.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Copy local config
        cp "$PROJECT_ROOT/.env.local" "$PROJECT_ROOT/.env"
        
        echo -e "${GREEN}✅ Switched to LOCAL environment${NC}"
        echo -e "${GREEN}Local database: postgresql://postgres:Post_gres26!@localhost:5432/scout_local${NC}"
        echo -e "${GREEN}Local Supabase: http://localhost:54321${NC}"
        echo -e "${GREEN}Supabase Studio: http://localhost:54323${NC}"
        ;;
        
    cloud)
        echo -e "${YELLOW}Switching to CLOUD environment...${NC}"
        
        # Check if .env.cloud exists
        if [ ! -f "$PROJECT_ROOT/.env.cloud" ]; then
            echo -e "${RED}Error: .env.cloud file not found!${NC}"
            exit 1
        fi
        
        # Backup current .env
        cp "$PROJECT_ROOT/.env" "$PROJECT_ROOT/.env.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Copy cloud config
        cp "$PROJECT_ROOT/.env.cloud" "$PROJECT_ROOT/.env"
        
        echo -e "${GREEN}✅ Switched to CLOUD environment${NC}"
        echo -e "${GREEN}Cloud Supabase: https://baqlxgwdfjltivlfmsbr.supabase.co${NC}"
        ;;
        
    *)
        echo -e "${RED}Error: Invalid environment. Use 'local' or 'cloud'${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}Note: Restart your development server for changes to take effect${NC}"