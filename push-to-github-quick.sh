#!/bin/bash
set -euo pipefail

# Quick push script that handles template placeholders correctly

echo "🚀 Quick Push to GitHub (chatgpt-integration branch)"
echo "===================================================="

cd /Users/tbwa/mcp-sqlite-server

# We're already on the chatgpt-integration branch
echo "📋 Current status:"
git status --short

# Add all files
echo "📝 Adding all files..."
git add -A

# Commit with descriptive message
echo "💾 Committing..."
git commit -m "feat: Complete MCP multi-database enterprise architecture

- Multi-database support (SQLite, PostgreSQL, Supabase)
- Enterprise multi-schema architecture:
  - scout_dash: Retail analytics
  - hr_admin: HR/Admin system
  - financial_ops: Finance operations
  - operations: Operations hub
  - corporate: Corporate portal
  - creative_insights: Creative KPIs
- Read-only MCP for LLM safety
- Schema isolation with RBAC
- HTTP API with OpenAPI spec
- Claude Desktop configuration templates
- Docker Compose setup
- CI/CD workflow with GitHub Actions
- Comprehensive documentation and guides

All sensitive values are templated with placeholders.
No actual secrets are included in this commit.

Co-authored-by: Claude <assistant@anthropic.com>" || echo "Nothing to commit"

# Push to remote
echo "🚀 Pushing to GitHub..."
git push -u origin chatgpt-integration

echo "✅ Done! Visit: https://github.com/jgtolentino/mcp-sqlite-server/tree/chatgpt-integration"