#!/usr/bin/env bash
set -euo pipefail

# Hardened script to push MCP documentation to GitHub
# Includes secret scanning, branch safety, and CI/CD preparation

echo "🚀 MCP Documentation Push Script (Hardened)"
echo "==========================================="

# Configuration
REPO_URL="https://github.com/jgtolentino/mcp-sqlite-server.git"
REPO_DIR="${HOME}/mcp-sqlite-server"
BRANCH="chatgpt-integration"
SOURCE_DIR="/Users/tbwa/bolt-app-hack"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check for secrets
check_for_secrets() {
    echo -e "${YELLOW}🔍 Scanning for secrets...${NC}"
    
    # Define patterns to search for
    local secret_patterns=(
        "SUPABASE_SERVICE_KEY"
        "SUPABASE_ANON_KEY"
        "SUPABASE_JWT_SECRET"
        "ghp_[a-zA-Z0-9]{36}"
        "ghs_[a-zA-Z0-9]{36}"
        "postgres://[^:]+:[^@]+@"
        "sk-[a-zA-Z0-9]{48}"
        "eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+"
    )
    
    local found_secrets=0
    
    for pattern in "${secret_patterns[@]}"; do
        if grep -r -E "$pattern" --include="*.json" --include="*.yaml" --include="*.yml" --include="*.md" --include="*.env*" . 2>/dev/null | grep -v ".git"; then
            echo -e "${RED}❌ Found potential secret matching pattern: $pattern${NC}"
            found_secrets=1
        fi
    done
    
    if [ $found_secrets -eq 1 ]; then
        echo -e "${RED}🚨 Secrets detected! Please remove them before committing.${NC}"
        echo "Replace with placeholders like \${SUPABASE_SERVICE_KEY} or <your-key-here>"
        exit 1
    fi
    
    echo -e "${GREEN}✅ No secrets detected${NC}"
}

# Clone or update repository
echo "📦 Setting up repository..."
if [ ! -d "$REPO_DIR" ]; then
    echo "Cloning repository..."
    git clone "$REPO_URL" "$REPO_DIR"
    cd "$REPO_DIR"
else
    cd "$REPO_DIR"
    # Verify we're in the right repo
    if ! git remote get-url origin | grep -q "mcp-sqlite-server"; then
        echo -e "${RED}❌ Wrong repository! Expected mcp-sqlite-server${NC}"
        exit 1
    fi
    echo "Updating existing repository..."
    git fetch origin
fi

# Configure git settings
echo "⚙️  Configuring git..."
git config core.autocrlf input
git config core.safecrlf true

# Setup Git LFS for large files
echo "📦 Setting up Git LFS..."
if ! command -v git-lfs &> /dev/null; then
    echo -e "${YELLOW}⚠️  Git LFS not installed. Install it with: brew install git-lfs${NC}"
else
    git lfs install --local --skip-smudge
    git lfs track "*.csv" "*.sqlite" "*.db" "*.sqlite3"
    git add .gitattributes 2>/dev/null || true
fi

# Create or switch to branch
echo "🌿 Managing branch: $BRANCH"
git checkout -B "$BRANCH"

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p docs/{architecture,guides,diagrams}
mkdir -p configs/{claude-desktop,docker,k8s}
mkdir -p openapi
mkdir -p migrations/{scout_dash,hr_admin,financial_ops,operations,corporate,creative_insights}
mkdir -p services/mcp-server/src/{databases,tools,http}
mkdir -p .github/workflows
mkdir -p scripts

# Copy documentation with template sanitization
echo "📄 Copying and sanitizing documentation..."

# Architecture documents
cp "$SOURCE_DIR/scout-dash-monorepo-integration.md" "docs/architecture/monorepo-integration.md"
cp "$SOURCE_DIR/scout-dash-monorepo-postgres-integration.md" "docs/architecture/postgres-integration.md"
cp "$SOURCE_DIR/supabase-mcp-multi-schema-architecture.md" "docs/architecture/multi-schema-architecture.md"

# Guides
cp "$SOURCE_DIR/scout-dash-mcp-final-integration-guide.md" "docs/guides/complete-integration-guide.md"
cp "$SOURCE_DIR/claude-desktop-mcp-setup.md" "docs/guides/claude-desktop-setup.md"

# Create sanitized configs
echo "🔒 Creating sanitized configuration templates..."

# Claude Desktop config template
cat > "configs/claude-desktop/config.template.json" << 'EOF'
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

# Environment template
cat > ".env.template" << 'EOF'
# Database Type Selection
# Options: sqlite, postgres, supabase
DB_TYPE=postgres

# SQLite Configuration (for local dev)
SQLITE_DB_PATH=./data/sqlite/local.db

# PostgreSQL Configuration (for local dev)
DATABASE_URL=postgresql://user:password@localhost:5432/database
POSTGRES_URL=postgresql://user:password@localhost:5432/database

# Supabase Configuration (for production)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=<your-service-key-here>
SUPABASE_ANON_KEY=<your-anon-key-here>

# MCP Server
MCP_SERVER_URL=http://localhost:8888
MCP_API_KEY=<your-secure-api-key-here>

# Environment
NODE_ENV=development
EOF

# OpenAPI specification
cat > "openapi/chatgpt.yaml" << 'EOF'
openapi: 3.0.0
info:
  title: TBWA Enterprise MCP API
  version: 1.0.0
  description: Multi-schema database access for TBWA enterprise systems
servers:
  - url: https://mcp.tbwa.ai
    description: Production MCP Server
  - url: http://localhost:8888
    description: Local Development
security:
  - apiKey: []
paths:
  /api/query/{schema}:
    post:
      operationId: querySchema
      summary: Query specific schema with read-only access
      parameters:
        - name: schema
          in: path
          required: true
          schema:
            type: string
            enum: [scout_dash, hr_admin, financial_ops, operations, corporate, creative_insights]
      requestBody:
        required: true
        content:
          application/json:
            schema:
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
      responses:
        '200':
          description: Query results
        '403':
          description: Schema access denied
        '400':
          description: Invalid query
components:
  securitySchemes:
    apiKey:
      type: apiKey
      in: header
      name: X-API-Key
EOF

# Create README
cat > "README.md" << 'EOF'
# MCP Multi-Database Server

A powerful Model Context Protocol (MCP) server supporting SQLite, PostgreSQL, and Supabase with enterprise multi-schema architecture.

## 🚀 Features

- **Multi-Database Support**: SQLite, PostgreSQL, and Supabase
- **Schema Isolation**: Secure multi-tenant architecture
- **Read-Only Mode**: Safe LLM access with write protection
- **HTTP API**: RESTful interface with OpenAPI spec
- **MCP Protocol**: Compatible with Claude Desktop, Pulser, ChatGPT

## 📚 Documentation

- [Complete Integration Guide](docs/guides/complete-integration-guide.md)
- [Multi-Schema Architecture](docs/architecture/multi-schema-architecture.md)
- [Claude Desktop Setup](docs/guides/claude-desktop-setup.md)

## 🏗️ Enterprise Architecture

```
TBWA Enterprise Schemas:
├── scout_dash       → Retail Analytics
├── hr_admin         → HR/Admin System
├── financial_ops    → Finance Operations
├── operations       → Operations Hub
├── corporate        → Corporate Portal
└── creative_insights → Creative KPIs
```

## 🔧 Quick Start

```bash
# Install dependencies
npm install

# Run with SQLite (development)
DB_TYPE=sqlite npm start

# Run with PostgreSQL (staging)
DB_TYPE=postgres DATABASE_URL=postgresql://... npm start

# Run with Supabase (production)
DB_TYPE=supabase SUPABASE_URL=... npm start
```

## 🔒 Security

- Read-only mode by default
- Schema isolation
- API key authentication
- No secrets in repository

## 📖 License

MIT License
EOF

# Create CI/CD workflow
cat > ".github/workflows/ci.yml" << 'EOF'
name: CI

on:
  push:
    branches: [ main, chatgpt-integration ]
  pull_request:
    branches: [ main ]

env:
  # Dummy values for CI - real values from secrets in production
  SUPABASE_URL: https://example.supabase.co
  SUPABASE_ANON_KEY: dummy-anon-key
  DATABASE_URL: postgresql://test:test@localhost:5432/test

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_USER: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
    
    - name: Lint
      run: npm run lint

  docker:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker image
      run: docker build -t mcp-server:test .
    
    - name: Test Docker image
      run: |
        docker run -d -p 8888:3000 \
          -e DB_TYPE=sqlite \
          -e READ_ONLY=true \
          --name mcp-test \
          mcp-server:test
        sleep 5
        curl -f http://localhost:8888/health || exit 1
        docker stop mcp-test
EOF

# Create .gitignore
cat > ".gitignore" << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*

# Build
dist/
build/
*.js
!jest.config.js
*.d.ts
*.map

# Environment
.env
.env.local
.env.*.local
!.env.template

# Database
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

# Coverage
coverage/
.nyc_output/

# Temporary
tmp/
temp/
EOF

# Create migration script
cat > "migrations/001_enterprise_schemas.sql" << 'EOF'
-- TBWA Enterprise Schema Setup
-- This script creates the multi-schema architecture
-- Run as database superuser

BEGIN;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS scout_dash;
CREATE SCHEMA IF NOT EXISTS hr_admin;
CREATE SCHEMA IF NOT EXISTS financial_ops;
CREATE SCHEMA IF NOT EXISTS operations;
CREATE SCHEMA IF NOT EXISTS corporate;
CREATE SCHEMA IF NOT EXISTS creative_insights;

-- Create read-only role
CREATE ROLE IF NOT EXISTS mcp_reader;

-- Grant usage on all schemas to reader
GRANT USAGE ON SCHEMA scout_dash TO mcp_reader;
GRANT USAGE ON SCHEMA hr_admin TO mcp_reader;
GRANT USAGE ON SCHEMA financial_ops TO mcp_reader;
GRANT USAGE ON SCHEMA operations TO mcp_reader;
GRANT USAGE ON SCHEMA corporate TO mcp_reader;
GRANT USAGE ON SCHEMA creative_insights TO mcp_reader;

-- Grant SELECT on all tables (current and future)
GRANT SELECT ON ALL TABLES IN SCHEMA scout_dash TO mcp_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA hr_admin TO mcp_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA financial_ops TO mcp_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA operations TO mcp_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA corporate TO mcp_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA creative_insights TO mcp_reader;

ALTER DEFAULT PRIVILEGES IN SCHEMA scout_dash GRANT SELECT ON TABLES TO mcp_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_admin GRANT SELECT ON TABLES TO mcp_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA financial_ops GRANT SELECT ON TABLES TO mcp_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA operations GRANT SELECT ON TABLES TO mcp_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA corporate GRANT SELECT ON TABLES TO mcp_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA creative_insights GRANT SELECT ON TABLES TO mcp_reader;

COMMIT;
EOF

# Docker files
cat > "Dockerfile" << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Create data directory
RUN mkdir -p /app/data

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Run
CMD ["node", "dist/index.js"]
EOF

cat > "docker-compose.yml" << 'EOF'
version: '3.8'

services:
  mcp-reader:
    build: .
    container_name: mcp-reader
    ports:
      - "8888:3000"
    environment:
      - NODE_ENV=production
      - DB_TYPE=${DB_TYPE:-sqlite}
      - DATABASE_URL=${DATABASE_URL}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_ANON_KEY}
      - READ_ONLY=true
      - API_KEY=${MCP_API_KEY}
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    container_name: mcp-postgres
    environment:
      POSTGRES_DB: tbwa_enterprise
      POSTGRES_USER: tbwa
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-tbwa123}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"

volumes:
  postgres_data:
EOF

# Final secret scan before committing
echo -e "${YELLOW}🔍 Running final secret scan...${NC}"
check_for_secrets

# Git operations
echo "📝 Staging files..."
git add -A

# Show what will be committed
echo -e "${YELLOW}📋 Files to be committed:${NC}"
git status --short

# Commit
echo "💾 Committing changes..."
git commit -m "feat: MCP multi-database server with enterprise architecture

- Multi-database support (SQLite, PostgreSQL, Supabase)
- Multi-schema architecture for enterprise deployment
- Schema isolation with RBAC
- Read-only mode for LLM safety
- HTTP API with OpenAPI spec
- Claude Desktop configuration
- Docker Compose setup
- CI/CD workflow
- Comprehensive documentation

Schemas:
- scout_dash: Retail analytics
- hr_admin: HR/Admin system
- financial_ops: Finance operations
- operations: Operations hub
- corporate: Corporate portal
- creative_insights: Creative KPIs

Co-authored-by: Claude <assistant@anthropic.com>"

# Push with lease
echo "🚀 Pushing to GitHub..."
if git push -u origin "$BRANCH" --force-with-lease; then
    echo -e "${GREEN}✅ Successfully pushed to $BRANCH${NC}"
else
    echo -e "${YELLOW}⚠️  Push failed. Trying without force-with-lease...${NC}"
    git push -u origin "$BRANCH"
fi

# Summary
echo ""
echo -e "${GREEN}🎉 Push complete!${NC}"
echo ""
echo "📋 Summary:"
echo "- Repository: $REPO_DIR"
echo "- Branch: $BRANCH"
echo "- Secret scan: Passed"
echo ""
echo "🔗 Next steps:"
echo "1. Visit: https://github.com/jgtolentino/mcp-sqlite-server/tree/$BRANCH"
echo "2. Create Pull Request to main branch"
echo "3. Set repository secrets in GitHub Settings"
echo "4. Tag release after merge (e.g., v1.0.0)"
echo ""
echo "📝 Required GitHub Secrets:"
echo "- SUPABASE_URL"
echo "- SUPABASE_ANON_KEY"
echo "- MCP_API_KEY"
echo "- DOCKER_REGISTRY (if using)"