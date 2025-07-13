#!/bin/bash
set -euo pipefail

# Direct MCP Deployment with Password
echo "🚀 Direct MCP Server Deployment"
echo "==============================="
echo

# Check if password is provided
if [ -z "${1:-}" ]; then
    echo "Usage: ./deploy-mcp-direct.sh YOUR_DATABASE_PASSWORD"
    echo
    echo "Example:"
    echo "  ./deploy-mcp-direct.sh MyDatabasePassword123"
    echo
    echo "Get your password from:"
    echo "https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/settings/database"
    exit 1
fi

DB_PASSWORD="$1"

echo "📦 Deploying database migrations..."

# Deploy with password directly
SUPABASE_DB_PASSWORD="$DB_PASSWORD" supabase db push --password "$DB_PASSWORD"

if [ $? -eq 0 ]; then
    echo "✅ Migrations deployed successfully!"
else
    echo "❌ Migration deployment failed"
    echo "Please check your password and try again"
    exit 1
fi

# Deploy edge functions
echo
echo "🔧 Deploying edge functions..."

functions=(
    "mcp-register-agent"
    "mcp-store-context"
    "mcp-execute-tool"
    "mcp-send-message"
)

for func in "${functions[@]}"; do
    echo "Deploying $func..."
    supabase functions deploy "$func"
done

echo
echo "✅ Deployment complete!"
echo "Run this to test: npx tsx src/test-mcp-integration.ts"