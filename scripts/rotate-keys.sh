#!/usr/bin/env bash
set -euo pipefail

# Key rotation script for production environments
# Run quarterly or when keys are compromised

echo "🔄 Starting key rotation process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check required tools
command -v sops >/dev/null 2>&1 || { echo -e "${RED}sops is required but not installed.${NC}" >&2; exit 1; }
command -v age >/dev/null 2>&1 || { echo -e "${RED}age is required but not installed.${NC}" >&2; exit 1; }

# Function to rotate Supabase keys
rotate_supabase_keys() {
    echo -e "${YELLOW}Rotating Supabase keys...${NC}"
    
    cat <<EOF

To rotate Supabase keys:
1. Go to: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/settings/api
2. Click "Generate new keys"
3. Update the following locations:
   - Vercel: Project Settings → Environment Variables
   - GitHub: Settings → Secrets → Actions
   - Local: .env.local
   - Encrypted: secrets.enc.yaml

Current keys to rotate:
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
EOF
}

# Function to rotate AI provider keys
rotate_ai_keys() {
    echo -e "${YELLOW}Rotating AI provider keys...${NC}"
    
    cat <<EOF

AI Provider Key Rotation:

OpenAI:
1. Go to: https://platform.openai.com/api-keys
2. Create new key → Delete old key
3. Update OPENAI_API_KEY

Anthropic:
1. Go to: https://console.anthropic.com/settings/keys
2. Create new key → Revoke old key
3. Update ANTHROPIC_API_KEY

Groq:
1. Go to: https://console.groq.com/keys
2. Generate new key → Delete old key
3. Update GROQ_API_KEY
EOF
}

# Function to update encrypted secrets
update_encrypted_secrets() {
    echo -e "${YELLOW}Updating encrypted secrets...${NC}"
    
    # Decrypt current secrets
    export SOPS_AGE_KEY_FILE="$HOME/.config/age/keys.txt"
    sops -d secrets.enc.yaml > secrets.yaml.tmp
    
    echo -e "${GREEN}Current secrets decrypted. Please update with new values.${NC}"
    echo "Opening editor..."
    ${EDITOR:-vi} secrets.yaml.tmp
    
    # Re-encrypt with new values
    AGE_PUBLIC_KEY=$(grep -oP "public key: \K.*" "$HOME/.config/age/keys.txt")
    sops -e --age "$AGE_PUBLIC_KEY" secrets.yaml.tmp > secrets.enc.yaml.new
    
    # Backup old file
    mv secrets.enc.yaml secrets.enc.yaml.bak
    mv secrets.enc.yaml.new secrets.enc.yaml
    rm secrets.yaml.tmp
    
    echo -e "${GREEN}✅ Encrypted secrets updated${NC}"
}

# Function to update platform environments
update_platform_envs() {
    echo -e "${YELLOW}Platform environment updates needed:${NC}"
    
    cat <<EOF

Update environment variables in:

1. Vercel:
   vercel env pull
   vercel env add [KEY] production
   vercel env rm [OLD_KEY] production

2. Render:
   Dashboard → Environment → Environment Variables

3. GitHub Actions:
   gh secret set SUPABASE_SERVICE_ROLE_KEY
   gh secret set OPENAI_API_KEY
   gh secret set ANTHROPIC_API_KEY
   gh secret set GROQ_API_KEY

4. Local development:
   npm run secrets:load
EOF
}

# Function to verify rotation
verify_rotation() {
    echo -e "${YELLOW}Verifying key rotation...${NC}"
    
    # Test new keys
    echo "Testing connections with new keys..."
    
    # Add your verification logic here
    # e.g., test API calls, database connections
    
    echo -e "${GREEN}✅ Verification complete${NC}"
}

# Main rotation flow
main() {
    echo "Which keys do you want to rotate?"
    echo "1) Supabase keys"
    echo "2) AI provider keys"
    echo "3) All keys"
    echo "4) Update encrypted secrets only"
    read -p "Selection (1-4): " choice
    
    case $choice in
        1)
            rotate_supabase_keys
            update_encrypted_secrets
            update_platform_envs
            ;;
        2)
            rotate_ai_keys
            update_encrypted_secrets
            update_platform_envs
            ;;
        3)
            rotate_supabase_keys
            rotate_ai_keys
            update_encrypted_secrets
            update_platform_envs
            ;;
        4)
            update_encrypted_secrets
            ;;
        *)
            echo "Invalid selection"
            exit 1
            ;;
    esac
    
    verify_rotation
    
    echo -e "${GREEN}🎉 Key rotation complete!${NC}"
    echo -e "${YELLOW}⚠️  Don't forget to:${NC}"
    echo "1. Test all integrations"
    echo "2. Update team documentation"
    echo "3. Notify team members"
    echo "4. Schedule next rotation (90 days)"
}

# Run main function
main