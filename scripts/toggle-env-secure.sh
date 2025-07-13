#!/usr/bin/env bash
set -euo pipefail

# Secure environment toggle script
# Never exposes secrets, maintains security boundaries

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

target="${1:-}"

# Ensure .env is gitignored
if ! grep -q "^\.env$" "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
    echo -e "${RED}⚠️  WARNING: .env is not in .gitignore!${NC}"
    echo ".env" >> "$PROJECT_ROOT/.gitignore"
fi

case $target in
  local)
    if [ ! -f "$PROJECT_ROOT/.env.local" ]; then
        echo -e "${RED}Error: .env.local not found${NC}"
        echo "Create it with: cp .env.example .env.local"
        exit 1
    fi
    
    # Backup current if exists
    [ -f "$PROJECT_ROOT/.env" ] && cp "$PROJECT_ROOT/.env" "$PROJECT_ROOT/.env.backup.$(date +%Y%m%d_%H%M%S)"
    
    cp "$PROJECT_ROOT/.env.local" "$PROJECT_ROOT/.env"
    echo -e "${GREEN}🚀 Switched to local environment${NC}"
    echo -e "${YELLOW}Using credentials from .env.local${NC}"
    ;;
    
  cloud|production)
    if [ ! -f "$PROJECT_ROOT/.env.cloud" ]; then
        echo -e "${RED}Error: .env.cloud not found${NC}"
        echo "For production, use platform environment variables instead"
        exit 1
    fi
    
    # Security check - ensure no service keys in cloud env
    if grep -E "(SERVICE_ROLE|_SECRET|_PRIVATE)" "$PROJECT_ROOT/.env.cloud" >/dev/null 2>&1; then
        echo -e "${RED}⚠️  ERROR: .env.cloud contains sensitive keys!${NC}"
        echo "Remove all SERVICE_ROLE_KEY and SECRET keys from .env.cloud"
        exit 1
    fi
    
    # Backup current if exists
    [ -f "$PROJECT_ROOT/.env" ] && cp "$PROJECT_ROOT/.env" "$PROJECT_ROOT/.env.backup.$(date +%Y%m%d_%H%M%S)"
    
    cp "$PROJECT_ROOT/.env.cloud" "$PROJECT_ROOT/.env"
    echo -e "${GREEN}☁️  Switched to cloud environment${NC}"
    echo -e "${YELLOW}⚠️  Only public keys should be in .env.cloud${NC}"
    ;;
    
  decrypt)
    # Load from encrypted secrets
    if ! command -v sops >/dev/null 2>&1; then
        echo -e "${RED}Error: sops not installed${NC}"
        echo "Install with: brew install sops"
        exit 1
    fi
    
    if ! command -v yq >/dev/null 2>&1; then
        echo -e "${RED}Error: yq not installed${NC}"
        echo "Install with: brew install yq"
        exit 1
    fi
    
    export SOPS_AGE_KEY_FILE="$HOME/.config/age/keys.txt"
    if [ ! -f "$SOPS_AGE_KEY_FILE" ]; then
        echo -e "${RED}Error: Age key not found at $SOPS_AGE_KEY_FILE${NC}"
        echo "Run: ./scripts/init-secret-hygiene.sh"
        exit 1
    fi
    
    MODULE="${2:-bolt-app-hack}"
    sops -d "$PROJECT_ROOT/secrets.enc.yaml" | yq eval ".$MODULE" - > "$PROJECT_ROOT/.env"
    echo -e "${GREEN}🔓 Loaded encrypted $MODULE secrets to .env${NC}"
    ;;
    
  check)
    # Security check for current environment
    echo -e "${YELLOW}🔍 Checking current environment...${NC}"
    if [ -f "$PROJECT_ROOT/.env" ]; then
        echo ""
        echo "Environment file stats:"
        echo "- Lines: $(wc -l < "$PROJECT_ROOT/.env")"
        echo "- Size: $(ls -lh "$PROJECT_ROOT/.env" | awk '{print $5}')"
        echo ""
        
        # Check for sensitive patterns
        FOUND_SENSITIVE=false
        
        if grep -E "sk-[a-zA-Z0-9]{48}" "$PROJECT_ROOT/.env" >/dev/null 2>&1; then
            echo -e "${RED}⚠️  Found OpenAI API key${NC}"
            FOUND_SENSITIVE=true
        fi
        
        if grep -E "sk-ant-[a-zA-Z0-9-]{95}" "$PROJECT_ROOT/.env" >/dev/null 2>&1; then
            echo -e "${RED}⚠️  Found Anthropic API key${NC}"
            FOUND_SENSITIVE=true
        fi
        
        if grep -E "gsk_[a-zA-Z0-9]{52}" "$PROJECT_ROOT/.env" >/dev/null 2>&1; then
            echo -e "${RED}⚠️  Found Groq API key${NC}"
            FOUND_SENSITIVE=true
        fi
        
        if grep -E "SERVICE_ROLE_KEY" "$PROJECT_ROOT/.env" >/dev/null 2>&1; then
            echo -e "${RED}⚠️  Found Supabase service role key${NC}"
            FOUND_SENSITIVE=true
        fi
        
        if [ "$FOUND_SENSITIVE" = false ]; then
            echo -e "${GREEN}✅ No sensitive keys detected${NC}"
        else
            echo ""
            echo -e "${YELLOW}Note: Sensitive keys should only be in .env.local or encrypted${NC}"
        fi
    else
        echo "No .env file found"
    fi
    ;;
    
  clean)
    # Remove all .env files except examples
    echo -e "${YELLOW}🧹 Cleaning environment files...${NC}"
    
    rm -f "$PROJECT_ROOT/.env"
    rm -f "$PROJECT_ROOT/.env.backup"*
    
    echo -e "${GREEN}✅ Cleaned environment files${NC}"
    echo "Kept: .env.example, .env.local, .env.cloud (if they exist)"
    ;;
    
  *)
    cat <<EOF
Usage: $(basename "$0") [command] [options]

Commands:
  local              Use .env.local for development
  cloud              Use .env.cloud (public keys only)
  decrypt [module]   Load from encrypted secrets.enc.yaml
  check              Security check current .env
  clean              Remove all .env files except examples

Examples:
  $(basename "$0") local                    # Switch to local dev
  $(basename "$0") cloud                    # Switch to cloud (public keys)
  $(basename "$0") decrypt bolt-app-hack    # Load frontend secrets
  $(basename "$0") decrypt bolt-api         # Load API secrets
  $(basename "$0") check                    # Check for leaked keys

Security notes:
- .env.local should contain your local development secrets
- .env.cloud should ONLY contain public keys (anon key, public tokens)
- Service keys and secrets should be in platform env vars or encrypted
EOF
    exit 1
    ;;
esac

echo ""
echo -e "${YELLOW}Note: Restart your development server for changes to take effect${NC}"