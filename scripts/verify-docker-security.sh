#!/usr/bin/env bash
set -euo pipefail

# Script to verify Docker images don't contain secrets
# Run after every build to ensure no leaks

echo "🔍 Docker Security Verification"
echo "==============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

IMAGE="${1:-}"

if [ -z "$IMAGE" ]; then
    echo "Usage: $0 <image:tag>"
    echo "Example: $0 bolt-app:latest"
    exit 1
fi

echo "Checking image: $IMAGE"
echo

# 1. Check image history for secrets
echo "1. Scanning image history for exposed secrets..."
HISTORY=$(docker history --no-trunc "$IMAGE" 2>/dev/null || echo "")

if [ -z "$HISTORY" ]; then
    echo -e "${RED}❌ Image not found: $IMAGE${NC}"
    exit 1
fi

# Patterns to check
SECRET_PATTERNS=(
    "sk-[a-zA-Z0-9]{48}"           # OpenAI
    "sk-ant-[a-zA-Z0-9-]{95}"       # Anthropic  
    "gsk_[a-zA-Z0-9]{52}"           # Groq
    "sbp_[a-zA-Z0-9]{40}"           # Supabase
    "eyJ[a-zA-Z0-9_-]{100,}"        # JWT/Service tokens
    "password.*=.*['\"]"            # Passwords
    "apikey.*=.*['\"]"              # API keys
    "secret.*=.*['\"]"              # Secrets
)

FOUND_SECRETS=false

for pattern in "${SECRET_PATTERNS[@]}"; do
    if echo "$HISTORY" | grep -E "$pattern" >/dev/null 2>&1; then
        echo -e "${RED}❌ Found potential secret matching pattern: $pattern${NC}"
        FOUND_SECRETS=true
    fi
done

if [ "$FOUND_SECRETS" = false ]; then
    echo -e "${GREEN}✅ No secrets found in image history${NC}"
fi

# 2. Check for common secret file paths
echo -e "\n2. Checking for secret files in image..."
CONTAINER_ID=$(docker create "$IMAGE" echo "test")

SECRET_PATHS=(
    "/.env"
    "/app/.env"
    "/app/.env.local"
    "/app/.env.production"
    "/app/secrets"
    "/app/config/secrets.json"
    "/.aws/credentials"
    "/.ssh/id_rsa"
    "/root/.ssh/id_rsa"
)

FOUND_FILES=false

for path in "${SECRET_PATHS[@]}"; do
    if docker cp "$CONTAINER_ID:$path" - >/dev/null 2>&1; then
        echo -e "${RED}❌ Found secret file: $path${NC}"
        FOUND_FILES=true
    fi
done

docker rm "$CONTAINER_ID" >/dev/null 2>&1

if [ "$FOUND_FILES" = false ]; then
    echo -e "${GREEN}✅ No secret files found in image${NC}"
fi

# 3. Check environment variables
echo -e "\n3. Checking environment variables..."
ENV_VARS=$(docker inspect "$IMAGE" | jq -r '.[0].Config.Env[]' 2>/dev/null || echo "")

FOUND_ENV_SECRETS=false

while IFS= read -r env_var; do
    for pattern in "${SECRET_PATTERNS[@]}"; do
        if echo "$env_var" | grep -E "$pattern" >/dev/null 2>&1; then
            echo -e "${RED}❌ Found secret in ENV: ${env_var%%=*}=***${NC}"
            FOUND_ENV_SECRETS=true
        fi
    done
    
    # Check for sensitive variable names
    if echo "$env_var" | grep -E "^(.*_KEY|.*_SECRET|.*_PASSWORD|.*_TOKEN)=" >/dev/null 2>&1; then
        if echo "$env_var" | grep -v "^VITE_" >/dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  Suspicious ENV variable: ${env_var%%=*}${NC}"
        fi
    fi
done <<< "$ENV_VARS"

if [ "$FOUND_ENV_SECRETS" = false ]; then
    echo -e "${GREEN}✅ No secrets found in environment variables${NC}"
fi

# 4. Check build args (in image config)
echo -e "\n4. Checking build arguments..."
BUILD_ARGS=$(docker inspect "$IMAGE" | jq -r '.[0].Config.Labels."org.opencontainers.image.build.args"' 2>/dev/null || echo "null")

if [ "$BUILD_ARGS" != "null" ] && [ -n "$BUILD_ARGS" ]; then
    echo -e "${YELLOW}⚠️  Build args found - verify no secrets: $BUILD_ARGS${NC}"
fi

# 5. Size check (large images might contain unnecessary data)
echo -e "\n5. Checking image size..."
SIZE=$(docker inspect "$IMAGE" | jq -r '.[0].Size' 2>/dev/null || echo "0")
SIZE_MB=$((SIZE / 1024 / 1024))

if [ $SIZE_MB -gt 500 ]; then
    echo -e "${YELLOW}⚠️  Large image size: ${SIZE_MB}MB - consider multi-stage build${NC}"
else
    echo -e "${GREEN}✅ Image size reasonable: ${SIZE_MB}MB${NC}"
fi

# Summary
echo -e "\n==============================="
if [ "$FOUND_SECRETS" = true ] || [ "$FOUND_FILES" = true ] || [ "$FOUND_ENV_SECRETS" = true ]; then
    echo -e "${RED}❌ SECURITY ISSUES FOUND!${NC}"
    echo -e "${RED}Do not push this image to a registry.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Image passed security checks${NC}"
    echo -e "${GREEN}Safe to push to registry${NC}"
fi

# Best practices reminder
echo -e "\n${YELLOW}Remember:${NC}"
echo "- Use Docker secrets or volume mounts for sensitive data"
echo "- Never use ARG for secrets (they persist in image)"
echo "- Read secrets from files at runtime"
echo "- Use .dockerignore to exclude .env files"