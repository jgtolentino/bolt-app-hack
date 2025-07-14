#!/bin/bash

# Script to push all MCP documentation to GitHub repository
# This script organizes and commits all the documentation we've created

echo "🚀 Preparing to push MCP documentation to GitHub"

# Set variables
REPO_DIR="/Users/tbwa/mcp-sqlite-server"
BRANCH="chatgpt-integration"
DOCS_DIR="$REPO_DIR/docs"
ARCHITECTURE_DIR="$DOCS_DIR/architecture"
GUIDES_DIR="$DOCS_DIR/guides"
CONFIGS_DIR="$REPO_DIR/configs"

# Clone or update repository
if [ ! -d "$REPO_DIR" ]; then
    echo "📦 Cloning repository..."
    git clone https://github.com/jgtolentino/mcp-sqlite-server.git "$REPO_DIR"
    cd "$REPO_DIR"
else
    echo "📂 Repository exists, updating..."
    cd "$REPO_DIR"
    git fetch origin
fi

# Create or switch to chatgpt-integration branch
if git show-ref --verify --quiet refs/heads/$BRANCH; then
    echo "🔄 Switching to existing $BRANCH branch"
    git checkout $BRANCH
    git pull origin $BRANCH
else
    echo "🌿 Creating new $BRANCH branch"
    git checkout -b $BRANCH
fi

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p "$DOCS_DIR"
mkdir -p "$ARCHITECTURE_DIR"
mkdir -p "$GUIDES_DIR"
mkdir -p "$CONFIGS_DIR"
mkdir -p "$REPO_DIR/migrations"
mkdir -p "$REPO_DIR/services/mcp-server/src/databases"

# Copy all documentation files
echo "📄 Copying documentation files..."

# Architecture documents
cp /Users/tbwa/bolt-app-hack/scout-dash-monorepo-integration.md "$ARCHITECTURE_DIR/monorepo-integration.md"
cp /Users/tbwa/bolt-app-hack/scout-dash-monorepo-postgres-integration.md "$ARCHITECTURE_DIR/postgres-integration.md"
cp /Users/tbwa/bolt-app-hack/supabase-mcp-multi-schema-architecture.md "$ARCHITECTURE_DIR/multi-schema-architecture.md"
cp /Users/tbwa/bolt-app-hack/scout-dash-mcp-final-integration-guide.md "$GUIDES_DIR/complete-integration-guide.md"

# Setup guides
cp /Users/tbwa/bolt-app-hack/claude-desktop-mcp-setup.md "$GUIDES_DIR/claude-desktop-setup.md"

# Create main README
cat > "$REPO_DIR/README.md" << 'EOF'
# MCP Multi-Database Server

A powerful Model Context Protocol (MCP) server that supports SQLite, PostgreSQL, and Supabase with multi-schema architecture.

## 🚀 Features

- **Multi-Database Support**: SQLite, PostgreSQL, and Supabase
- **Schema Isolation**: Secure multi-tenant architecture with schema-per-project
- **Read-Only Mode**: Safe LLM access with write protection
- **HTTP API**: RESTful interface for web integrations
- **MCP Protocol**: Compatible with Claude Desktop, Pulser, and other MCP clients
- **ChatGPT Integration**: OpenAPI spec for Custom GPTs

## 📚 Documentation

- [Complete Integration Guide](docs/guides/complete-integration-guide.md)
- [Multi-Schema Architecture](docs/architecture/multi-schema-architecture.md)
- [Claude Desktop Setup](docs/guides/claude-desktop-setup.md)
- [Monorepo Integration](docs/architecture/monorepo-integration.md)
- [PostgreSQL/Supabase Guide](docs/architecture/postgres-integration.md)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (Single Project)                 │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Schemas:                                         │
│  ├── scout_dash       (Retail Analytics)                    │
│  ├── hr_admin         (HR/Admin System)                     │
│  ├── financial_ops    (Finance Operations)                  │
│  ├── operations       (Operations Hub)                      │
│  ├── corporate        (Corporate Portal)                    │
│  └── creative_insights (Creative KPIs)                      │
└─────────────────────────────────────────────────────────────┘
                              ↑
                              │ Read-Only
                              │
┌─────────────────────────────────────────────────────────────┐
│              MCP READER (Port 8888) - Always On             │
│                    Shared by ALL LLMs                        │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Quick Start

### Install MCP Server

```bash
npm install -g @modelcontextprotocol/server-filesystem
npm install
```

### Configure for Your Database

**SQLite** (Development):
```bash
DB_TYPE=sqlite DB_PATH=./data/dev.db npm start
```

**PostgreSQL** (Staging):
```bash
DB_TYPE=postgres POSTGRES_URL=postgresql://user:pass@localhost:5432/db npm start
```

**Supabase** (Production):
```bash
DB_TYPE=supabase SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=xxx npm start
```

## 🔒 Security

- Read-only mode by default for LLM access
- Schema isolation for multi-tenant deployments
- Row Level Security (RLS) support
- API key authentication
- Separate writer instances for CI/CD only

## 📖 License

MIT License - See LICENSE file for details
EOF

# Create enterprise schema setup
cat > "$REPO_DIR/migrations/001_enterprise_schemas.sql" << 'EOF'
-- TBWA Enterprise Schema Setup
-- Run as superuser

BEGIN;

-- Create all schemas
CREATE SCHEMA IF NOT EXISTS scout_dash;      -- Retail Analytics
CREATE SCHEMA IF NOT EXISTS hr_admin;        -- HR/Admin System
CREATE SCHEMA IF NOT EXISTS financial_ops;   -- Finance Operations
CREATE SCHEMA IF NOT EXISTS operations;      -- Operations Hub
CREATE SCHEMA IF NOT EXISTS corporate;       -- Corporate Portal
CREATE SCHEMA IF NOT EXISTS creative_insights; -- Creative KPIs

-- Create read-only roles
CREATE ROLE IF NOT EXISTS mcp_reader;
CREATE ROLE IF NOT EXISTS scout_anon;
CREATE ROLE IF NOT EXISTS hr_anon;
CREATE ROLE IF NOT EXISTS finance_anon;
CREATE ROLE IF NOT EXISTS ops_anon;
CREATE ROLE IF NOT EXISTS corp_anon;
CREATE ROLE IF NOT EXISTS creative_anon;

-- Grant usage on schemas
GRANT USAGE ON SCHEMA scout_dash TO scout_anon, mcp_reader;
GRANT USAGE ON SCHEMA hr_admin TO hr_anon, mcp_reader;
GRANT USAGE ON SCHEMA financial_ops TO finance_anon, mcp_reader;
GRANT USAGE ON SCHEMA operations TO ops_anon, mcp_reader;
GRANT USAGE ON SCHEMA corporate TO corp_anon, mcp_reader;
GRANT USAGE ON SCHEMA creative_insights TO creative_anon, mcp_reader;

-- Grant SELECT on all tables
GRANT SELECT ON ALL TABLES IN SCHEMA scout_dash TO scout_anon, mcp_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA hr_admin TO hr_anon, mcp_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA financial_ops TO finance_anon, mcp_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA operations TO ops_anon, mcp_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA corporate TO corp_anon, mcp_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA creative_insights TO creative_anon, mcp_reader;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA scout_dash GRANT SELECT ON TABLES TO scout_anon, mcp_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_admin GRANT SELECT ON TABLES TO hr_anon, mcp_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA financial_ops GRANT SELECT ON TABLES TO finance_anon, mcp_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA operations GRANT SELECT ON TABLES TO ops_anon, mcp_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA corporate GRANT SELECT ON TABLES TO corp_anon, mcp_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA creative_insights GRANT SELECT ON TABLES TO creative_anon, mcp_reader;

COMMIT;
EOF

# Create example configs
cat > "$CONFIGS_DIR/claude-desktop-config.json" << 'EOF'
{
  "mcpServers": {
    "fs-scout": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "~/projects/scout-dash"]
    },
    "fs-hr": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "~/projects/hris"]
    },
    "fs-finance": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "~/projects/finance-suite"]
    },
    "fs-ops": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "~/projects/ops-hub"]
    },
    "fs-corp": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "~/projects/corporate"]
    },
    "supabase-reader": {
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        "DB_TYPE": "supabase",
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_KEY": "${SUPABASE_ANON_KEY}",
        "READ_ONLY": "true",
        "ALLOWED_SCHEMAS": "scout_dash,hr_admin,financial_ops,operations,corporate,creative_insights,public"
      }
    }
  }
}
EOF

# Create docker-compose for production
cat > "$REPO_DIR/docker-compose.yml" << 'EOF'
version: '3.8'

services:
  # Read-only MCP for all LLM agents
  mcp-reader:
    build: .
    container_name: supabase-mcp-reader
    ports:
      - "8888:3000"
    environment:
      - NODE_ENV=production
      - DB_TYPE=supabase
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_ANON_KEY}
      - READ_ONLY=true
      - ALLOWED_SCHEMAS=scout_dash,hr_admin,financial_ops,operations,corporate,creative_insights,public
      - API_KEY=${MCP_API_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # PostgreSQL for local development
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: tbwa_enterprise
      POSTGRES_USER: tbwa
      POSTGRES_PASSWORD: tbwa123
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"

volumes:
  postgres_data:
EOF

# Create ChatGPT OpenAPI spec
cat > "$CONFIGS_DIR/chatgpt-openapi.yaml" << 'EOF'
openapi: 3.0.0
info:
  title: TBWA Enterprise MCP API
  version: 1.0.0
  description: Multi-schema database access for TBWA enterprise systems
servers:
  - url: https://mcp.tbwa.ai
    description: Production MCP Server
security:
  - apiKey: []
paths:
  /api/query/scout_dash:
    post:
      operationId: queryScoutDashboard
      summary: Query Scout Dashboard retail analytics
      x-schema: scout_dash
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/QueryRequest'
      responses:
        '200':
          description: Query results
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QueryResponse'
  
  /api/query/hr_admin:
    post:
      operationId: queryHRAdmin
      summary: Query HR/Admin system data
      x-schema: hr_admin
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/QueryRequest'
      responses:
        '200':
          description: Query results
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QueryResponse'
  
  /api/query/financial_ops:
    post:
      operationId: queryFinance
      summary: Query financial operations data
      x-schema: financial_ops
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/QueryRequest'
      responses:
        '200':
          description: Query results
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QueryResponse'

components:
  schemas:
    QueryRequest:
      type: object
      required:
        - sql
      properties:
        sql:
          type: string
          description: SQL query to execute (SELECT/EXPLAIN only)
        params:
          type: array
          items:
            type: string
          description: Query parameters
    
    QueryResponse:
      type: object
      properties:
        success:
          type: boolean
        schema:
          type: string
        data:
          type: object
          properties:
            rows:
              type: array
              items:
                type: object
            fields:
              type: array
              items:
                type: object
                properties:
                  name:
                    type: string
                  type:
                    type: string
  
  securitySchemes:
    apiKey:
      type: apiKey
      in: header
      name: X-API-Key
EOF

# Create .gitignore
cat > "$REPO_DIR/.gitignore" << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.js
*.d.ts
*.map

# Environment files
.env
.env.local
.env.*.local

# Database files
*.db
*.sqlite
*.sqlite3
data/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Test coverage
coverage/
.nyc_output/
EOF

# Add all files
echo "📝 Adding files to git..."
git add .

# Commit with comprehensive message
echo "💾 Committing changes..."
git commit -m "feat: Complete MCP multi-database server with enterprise architecture

- Multi-database support (SQLite, PostgreSQL, Supabase)
- Multi-schema architecture for enterprise deployment
- Schema isolation with proper RBAC
- Read-only mode for LLM safety
- HTTP API with OpenAPI spec for ChatGPT
- Claude Desktop configuration examples
- Docker Compose for local and production
- Comprehensive documentation and guides
- Migration scripts for TBWA enterprise schemas

Schemas included:
- scout_dash: Retail analytics dashboard
- hr_admin: HR and administration system
- financial_ops: Finance operations and FP&A
- operations: Operations and project management
- corporate: Corporate governance and compliance
- creative_insights: Creative campaign KPIs

This provides a complete, production-ready solution for TBWA's
multi-project data platform with proper security boundaries."

# Push to remote
echo "🚀 Pushing to GitHub..."
git push -u origin $BRANCH

echo "✅ All documentation pushed to GitHub!"
echo ""
echo "📋 Summary:"
echo "- Repository: $REPO_DIR"
echo "- Branch: $BRANCH"
echo "- Documentation: $DOCS_DIR"
echo "- Configs: $CONFIGS_DIR"
echo ""
echo "🔗 Next steps:"
echo "1. Visit: https://github.com/jgtolentino/mcp-sqlite-server/tree/$BRANCH"
echo "2. Create a Pull Request to merge into main"
echo "3. Tag a release for the multi-database version"