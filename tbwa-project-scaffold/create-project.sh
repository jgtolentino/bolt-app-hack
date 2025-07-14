#!/bin/bash
set -euo pipefail

# TBWA Project Scaffolding Script
# Creates a new project repository with the battle-tested layout

echo "🏗️  TBWA Project Scaffolder"
echo "=========================="
echo ""

# Get project details
read -p "Project name (e.g., suqi-db-app): " PROJECT_NAME
read -p "Schema name (e.g., financial_ops): " SCHEMA_NAME
read -p "Schema short name (e.g., fin): " SCHEMA_SHORT
read -p "Writer MCP port (e.g., 8893): " WRITER_PORT
read -p "GitHub repo (e.g., jgtolentino/suqi-db-app): " GITHUB_REPO

# Create project directory
echo "📁 Creating project structure..."
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Initialize git
git init

# Create directory structure
mkdir -p apps/{web,api}
mkdir -p services/mcp-writer/{src,config}
mkdir -p prisma
mkdir -p migrations
mkdir -p openapi
mkdir -p ci
mkdir -p infra
mkdir -p .github/workflows
mkdir -p scripts

# Create README
cat > README.md << EOF
# $PROJECT_NAME

Part of the TBWA Enterprise Platform using schema \`$SCHEMA_NAME\`.

## 🚀 Quick Start

\`\`\`bash
# Setup environment
direnv allow

# Install dependencies
pnpm install

# Start development
pnpm dev
\`\`\`

## 📊 Database Schema

This project uses the \`$SCHEMA_NAME\` schema in the TBWA Supabase cluster.

- **Read Access**: Via shared MCP reader at https://mcp.tbwa.ai
- **Write Access**: CI/CD only via local writer MCP (port $WRITER_PORT)

## 🔐 Security

- All secrets managed by KeyKey
- LLMs have read-only access
- Writes restricted to CI/CD pipeline

## 📚 Documentation

See [TBWA Platform Docs](https://github.com/jgtolentino/mcp-sqlite-server/tree/chatgpt-integration/docs)
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Environment
.env
.env.local
.env.*.local
!.env.template

# Build outputs
dist/
build/
.next/
out/

# Database
*.db
*.sqlite
prisma/migrations/dev/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

# Testing
coverage/
.nyc_output/

# Misc
.turbo/
.vercel/
EOF

# Create .env.template
cat > .env.template << EOF
# Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=<${SCHEMA_SHORT}_anon_key>
SUPABASE_SERVICE_KEY=<${SCHEMA_SHORT}_service_key>

# MCP Configuration
MCP_READER_URL=https://mcp.tbwa.ai
MCP_WRITER_PORT=$WRITER_PORT
SCHEMA_NAME=$SCHEMA_NAME
SEARCH_PATH=$SCHEMA_NAME,public

# API Configuration
API_PORT=3001
NODE_ENV=development
EOF

# Create package.json
cat > package.json << EOF
{
  "name": "$PROJECT_NAME",
  "version": "0.1.0",
  "private": true,
  "description": "TBWA $PROJECT_NAME using $SCHEMA_NAME schema",
  "scripts": {
    "dev": "docker-compose -f infra/docker-compose.yml up",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "tsx prisma/seed.ts",
    "keykey:sync": "gh workflow run env-sync.yml"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "prisma": "^5.0.0",
    "tsx": "^4.0.0",
    "turbo": "^1.10.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0"
  },
  "workspaces": [
    "apps/*",
    "services/*"
  ]
}
EOF

# Create Prisma schema
cat > prisma/schema.prisma << EOF
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["$SCHEMA_NAME", "public"]
}

// Define your models here with @@schema("$SCHEMA_NAME")
// Example:
// model User {
//   id        String   @id @default(uuid())
//   email     String   @unique
//   name      String?
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
//   
//   @@schema("$SCHEMA_NAME")
// }
EOF

# Create initial migration
cat > migrations/001_init.sql << EOF
-- Initial schema setup for $SCHEMA_NAME
-- This runs in CI/CD via writer MCP

-- Ensure schema exists
CREATE SCHEMA IF NOT EXISTS $SCHEMA_NAME;

-- Grant permissions
GRANT USAGE ON SCHEMA $SCHEMA_NAME TO ${SCHEMA_SHORT}_anon;
GRANT SELECT ON ALL TABLES IN SCHEMA $SCHEMA_NAME TO ${SCHEMA_SHORT}_anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA $SCHEMA_NAME 
  GRANT SELECT ON TABLES TO ${SCHEMA_SHORT}_anon;

-- Create initial tables
-- CREATE TABLE $SCHEMA_NAME.your_table (...);
EOF

# Create OpenAPI spec
cat > openapi/reader.yaml << EOF
openapi: 3.0.0
info:
  title: $PROJECT_NAME MCP Reader API
  version: 1.0.0
  description: Read-only access to $SCHEMA_NAME schema
servers:
  - url: https://mcp.tbwa.ai
    description: Production MCP Reader
security:
  - apiKey: []
paths:
  /api/query:
    post:
      operationId: query${SCHEMA_NAME}
      summary: Query $SCHEMA_NAME data (read-only)
      x-search-path: "$SCHEMA_NAME,public"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                sql:
                  type: string
                  description: SELECT or EXPLAIN queries only
                params:
                  type: array
                  items:
                    type: string
      responses:
        '200':
          description: Query results
components:
  securitySchemes:
    apiKey:
      type: apiKey
      in: header
      name: X-API-Key
EOF

# Create Docker Compose
cat > infra/docker-compose.yml << EOF
version: '3.8'

services:
  # Web app (if using Next.js/Vite)
  web:
    build: ../apps/web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    volumes:
      - ../apps/web:/app
      - /app/node_modules
    command: npm run dev

  # API server
  api:
    build: ../apps/api
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=\${DATABASE_URL}
      - MCP_READER_URL=\${MCP_READER_URL}
      - SCHEMA_NAME=$SCHEMA_NAME
    volumes:
      - ../apps/api:/app
      - /app/node_modules
    command: npm run dev

  # Local MCP reader stub (for dev)
  mcp-reader-stub:
    image: node:20-alpine
    ports:
      - "8888:8888"
    environment:
      - SUPABASE_URL=\${SUPABASE_URL}
      - SUPABASE_ANON_KEY=\${SUPABASE_ANON_KEY}
      - SCHEMA_NAME=$SCHEMA_NAME
      - READ_ONLY=true
    command: |
      sh -c "echo 'MCP Reader Stub for $SCHEMA_NAME' && sleep infinity"
EOF

# Create GitHub Actions workflow
cat > .github/workflows/main.yml << EOF
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-test:
    name: Lint & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test

  migrate:
    name: Database Migration
    needs: lint-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start Writer MCP
        env:
          SUPABASE_URL: \${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: \${{ secrets.${SCHEMA_SHORT^^}_SERVICE_KEY }}
        run: |
          # Start writer MCP on port $WRITER_PORT
          docker run -d \\
            -e SUPABASE_URL=\$SUPABASE_URL \\
            -e SUPABASE_SERVICE_KEY=\$SUPABASE_SERVICE_KEY \\
            -e SCHEMA_NAME=$SCHEMA_NAME \\
            -e READ_ONLY=false \\
            -p $WRITER_PORT:3000 \\
            --name mcp-writer \\
            ghcr.io/tbwa/mcp-server:latest
          
          # Wait for startup
          sleep 10
          
      - name: Run Migrations
        run: |
          for migration in migrations/*.sql; do
            echo "Running \$migration..."
            curl -X POST http://localhost:$WRITER_PORT/api/execute \\
              -H "Content-Type: application/json" \\
              -H "X-API-Key: \${{ secrets.MCP_API_KEY }}" \\
              -d "{\"sql\": \"\$(cat \$migration)\"}"
          done
          
      - name: Generate Prisma Client
        run: |
          pnpm prisma generate
          pnpm prisma db pull

  deploy:
    name: Deploy
    needs: migrate
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render
        env:
          RENDER_API_KEY: \${{ secrets.KEYKEY_RENDER_TOKEN }}
          SERVICE_ID: \${{ secrets.RENDER_SERVICE_ID_${SCHEMA_SHORT^^} }}
        run: |
          curl -X POST \\
            -H "Authorization: Bearer \$RENDER_API_KEY" \\
            https://api.render.com/v1/services/\$SERVICE_ID/deploys
EOF

# Create CI reusable workflows
cat > ci/env-sync.yml << EOF
name: KeyKey Environment Sync
description: Syncs secrets from Doppler to GitHub and Render

runs:
  using: composite
  steps:
    - name: Sync Secrets
      shell: bash
      run: |
        echo "🤖 KeyKey syncing secrets for $SCHEMA_NAME..."
        # KeyKey handles this automatically
EOF

cat > ci/migrate.yml << EOF
name: Database Migration
description: Runs migrations via writer MCP

inputs:
  schema:
    description: 'Target schema name'
    required: true
    default: '$SCHEMA_NAME'
  port:
    description: 'Writer MCP port'
    required: true
    default: '$WRITER_PORT'

runs:
  using: composite
  steps:
    - name: Run Migrations
      shell: bash
      run: |
        echo "🗄️ Running migrations for \${{ inputs.schema }}..."
        # Migration logic here
EOF

# Create basic app structures
mkdir -p apps/web/src
cat > apps/web/package.json << EOF
{
  "name": "@$PROJECT_NAME/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  }
}
EOF

mkdir -p apps/api/src
cat > apps/api/package.json << EOF
{
  "name": "@$PROJECT_NAME/api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit"
  }
}
EOF

# Create turbo.json
cat > turbo.json << EOF
{
  "\$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {},
    "test": {}
  }
}
EOF

# Create pnpm-workspace.yaml
cat > pnpm-workspace.yaml << EOF
packages:
  - 'apps/*'
  - 'services/*'
EOF

# Create direnv file
cat > .envrc << EOF
# Auto-load environment for $PROJECT_NAME
if [ -f .env.local ]; then
  source .env.local
  echo "✅ Loaded $SCHEMA_NAME environment"
else
  echo "⚠️  No .env.local found. Copy from .env.template"
fi
EOF

echo ""
echo "✅ Project scaffold created!"
echo ""
echo "Next steps:"
echo "1. cd $PROJECT_NAME"
echo "2. git remote add origin git@github.com:$GITHUB_REPO.git"
echo "3. cp .env.template .env.local (and fill in values)"
echo "4. direnv allow"
echo "5. pnpm install"
echo "6. git add . && git commit -m 'Initial scaffold for $SCHEMA_NAME'"
echo "7. git push -u origin main"
echo ""
echo "Don't forget to add these secrets to KeyKey:"
echo "- ${SCHEMA_SHORT^^}_SERVICE_KEY"
echo "- ${SCHEMA_SHORT^^}_ANON_KEY"
echo "- RENDER_SERVICE_ID_${SCHEMA_SHORT^^}"