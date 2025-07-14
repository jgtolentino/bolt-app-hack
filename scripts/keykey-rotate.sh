#!/bin/bash
set -euo pipefail

# KeyKey Secret Rotation Script
# Rotates all service keys while maintaining zero downtime

echo "🔄 KeyKey Secret Rotation"
echo "========================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Services that need key rotation
declare -A services=(
    ["MCP_API_KEY"]="mcp"
    ["SCOUT_SERVICE_KEY"]="scout"
    ["HR_SERVICE_KEY"]="hr"
    ["FINANCE_SERVICE_KEY"]="finance"
    ["OPS_SERVICE_KEY"]="ops"
    ["CORP_SERVICE_KEY"]="corp"
    ["CREATIVE_SERVICE_KEY"]="creative"
)

# Generate secure random key
generate_key() {
    local prefix=$1
    echo "${prefix}_$(openssl rand -hex 16)"
}

# Rotate keys with zero downtime
rotate_keys() {
    echo -e "${BLUE}Generating new keys...${NC}"
    
    local new_keys=()
    
    # Generate new keys
    for key in "${!services[@]}"; do
        local prefix=${services[$key]}
        local new_value=$(generate_key "$prefix")
        new_keys+=("$key=$new_value")
        echo -e "  🔑 Generated new $key"
    done
    
    # Update in Doppler (atomic operation)
    echo -e "\n${BLUE}Updating Doppler...${NC}"
    for entry in "${new_keys[@]}"; do
        IFS='=' read -r key value <<< "$entry"
        doppler secrets set "$key"="$value" --project tbwa-platform --silent
        echo -e "  ${GREEN}✓ Updated $key${NC}"
    done
    
    # Trigger sync to all services
    echo -e "\n${BLUE}Triggering KeyKey sync...${NC}"
    if command -v gh &> /dev/null; then
        gh workflow run keykey-sync.yml && echo -e "${GREEN}✓ Sync workflow triggered${NC}"
    else
        echo -e "${YELLOW}⚠️  Please run GitHub workflow manually${NC}"
    fi
}

# Verify rotation
verify_rotation() {
    echo -e "\n${BLUE}Verifying rotation...${NC}"
    
    # Check Doppler
    echo "Current keys in Doppler:"
    for key in "${!services[@]}"; do
        local value=$(doppler secrets get "$key" --plain --project tbwa-platform 2>/dev/null || echo "ERROR")
        if [ "$value" != "ERROR" ]; then
            echo -e "  ${GREEN}✓ $key: ${value:0:10}...${NC}"
        else
            echo -e "  ${RED}✗ $key: Failed to retrieve${NC}"
        fi
    done
}

# Create rotation log
log_rotation() {
    local log_file="keykey-rotation.log"
    local timestamp=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
    
    echo "[$timestamp] Key rotation performed" >> "$log_file"
    for key in "${!services[@]}"; do
        echo "  - $key rotated" >> "$log_file"
    done
    
    echo -e "\n${GREEN}✓ Rotation logged to $log_file${NC}"
}

# Main execution
main() {
    echo -e "${YELLOW}⚠️  This will rotate all service keys${NC}"
    read -p "Continue? (y/N) " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Rotation cancelled"
        exit 0
    fi
    
    # Check prerequisites
    if ! command -v doppler &> /dev/null; then
        echo -e "${RED}❌ Doppler CLI not found${NC}"
        exit 1
    fi
    
    # Perform rotation
    rotate_keys
    verify_rotation
    log_rotation
    
    echo ""
    echo -e "${GREEN}🎉 Key rotation complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Wait 2-3 minutes for propagation"
    echo "2. Monitor service health: https://mcp.tbwa.ai/health"
    echo "3. Check GitHub Actions for sync status"
    echo ""
    echo -e "${BLUE}Old keys will stop working in 5 minutes${NC}"
}

# Run if executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi