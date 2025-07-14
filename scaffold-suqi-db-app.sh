#!/bin/bash
set -euo pipefail

# Quick scaffold for suqi-db-app (Financial Operations)

echo "🏗️  Scaffolding suqi-db-app..."

# Clone the empty repo
cd /Users/tbwa
git clone https://github.com/jgtolentino/suqi-db-app.git || echo "Repo already exists"
cd suqi-db-app

# Create the complete structure
mkdir -p apps/{web,api}/{src,public}
mkdir -p services/mcp-writer/{src,config}
mkdir -p prisma/migrations
mkdir -p openapi
mkdir -p ci
mkdir -p infra
mkdir -p .github/workflows
mkdir -p scripts

# Create README
cat > README.md << 'EOF'
# Suqi DB App - Financial Operations

Part of the TBWA Enterprise Platform using schema `financial_ops`.

## 🚀 Quick Start

```bash
# Setup environment
direnv allow

# Install dependencies
pnpm install

# Start development
pnpm dev
```

## 📊 Database Schema

This project uses the `financial_ops` schema in the TBWA Supabase cluster.

- **Read Access**: Via shared MCP reader at https://mcp.tbwa.ai
- **Write Access**: CI/CD only via local writer MCP (port 8893)
- **Schema**: `financial_ops`
- **Search Path**: `financial_ops, public`

## 🔐 Security

- All secrets managed by KeyKey
- LLMs have read-only access via `fin_anon` role
- Writes restricted to CI/CD pipeline via `fin_service_role`

## 📚 Features

- Invoice management
- Budget tracking
- Financial reporting
- Expense management
- FP&A dashboards

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│         Supabase Cluster            │
│  ┌─────────────────────────────┐   │
│  │    financial_ops schema      │   │
│  │  - invoices                  │   │
│  │  - budgets                   │   │
│  │  - expenses                  │   │
│  │  - forecasts                 │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
            ↑ Read Only
┌─────────────────────────────────────┐
│      MCP Reader (port 8888)         │
│   search_path: financial_ops,public │
└─────────────────────────────────────┘
```

## 📖 Documentation

See [TBWA Platform Docs](https://github.com/jgtolentino/mcp-sqlite-server/tree/chatgpt-integration/docs)
EOF

# Create comprehensive .gitignore
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

# Testing
coverage/

# Misc
.turbo/
.vercel/
EOF

# Create .env.template
cat > .env.template << 'EOF'
# Database Configuration
SUPABASE_URL=https://cxzllzyxwpyptfretryc.supabase.co
SUPABASE_ANON_KEY=<fin_anon_key>
SUPABASE_SERVICE_KEY=<fin_service_key>

# MCP Configuration
MCP_READER_URL=https://mcp.tbwa.ai
MCP_WRITER_PORT=8893
SCHEMA_NAME=financial_ops
SEARCH_PATH=financial_ops,public

# API Configuration
API_PORT=3001
NODE_ENV=development

# Application
NEXT_PUBLIC_APP_NAME="Suqi Financial Operations"
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

# Create package.json
cat > package.json << 'EOF'
{
  "name": "suqi-db-app",
  "version": "0.1.0",
  "private": true,
  "description": "TBWA Financial Operations using financial_ops schema",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "start": "turbo run start",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "keykey:sync": "gh workflow run keykey-sync.yml"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "prisma": "^5.0.0",
    "tsx": "^4.0.0",
    "turbo": "^1.10.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "@supabase/supabase-js": "^2.39.0"
  },
  "workspaces": [
    "apps/*",
    "services/*"
  ]
}
EOF

# Create Prisma schema for financial_ops
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["financial_ops", "public"]
}

// Financial Operations Models

model Invoice {
  id              String   @id @default(uuid())
  invoice_number  String   @unique
  customer_id     String
  amount          Decimal  @db.Decimal(10, 2)
  currency        String   @default("USD")
  status          String   @default("pending")
  due_date        DateTime
  paid_date       DateTime?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  line_items      InvoiceLineItem[]
  payments        Payment[]
  
  @@schema("financial_ops")
}

model InvoiceLineItem {
  id          String   @id @default(uuid())
  invoice_id  String
  description String
  quantity    Decimal  @db.Decimal(10, 2)
  unit_price  Decimal  @db.Decimal(10, 2)
  amount      Decimal  @db.Decimal(10, 2)
  
  invoice     Invoice  @relation(fields: [invoice_id], references: [id])
  
  @@schema("financial_ops")
}

model Budget {
  id              String   @id @default(uuid())
  name            String
  fiscal_year     Int
  fiscal_quarter  Int?
  department      String
  amount          Decimal  @db.Decimal(12, 2)
  currency        String   @default("USD")
  status          String   @default("active")
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  expenses        Expense[]
  
  @@schema("financial_ops")
}

model Expense {
  id              String   @id @default(uuid())
  budget_id       String?
  category        String
  description     String
  amount          Decimal  @db.Decimal(10, 2)
  currency        String   @default("USD")
  expense_date    DateTime
  approved_by     String?
  status          String   @default("pending")
  created_at      DateTime @default(now())
  
  budget          Budget?  @relation(fields: [budget_id], references: [id])
  
  @@schema("financial_ops")
}

model Payment {
  id              String   @id @default(uuid())
  invoice_id      String
  amount          Decimal  @db.Decimal(10, 2)
  currency        String   @default("USD")
  payment_date    DateTime @default(now())
  payment_method  String
  reference       String?
  
  invoice         Invoice  @relation(fields: [invoice_id], references: [id])
  
  @@schema("financial_ops")
}

model Forecast {
  id              String   @id @default(uuid())
  name            String
  type            String   // revenue, expense, cashflow
  period_start    DateTime
  period_end      DateTime
  amount          Decimal  @db.Decimal(12, 2)
  confidence      Int      // 0-100
  notes           String?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  @@schema("financial_ops")
}
EOF

# Create initial migration
cat > prisma/migrations/001_init_financial_ops.sql << 'EOF'
-- Initial schema setup for financial_ops
-- This runs in CI/CD via writer MCP

-- Ensure schema exists
CREATE SCHEMA IF NOT EXISTS financial_ops;

-- Set search path
SET search_path TO financial_ops, public;

-- Create roles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'fin_anon') THEN
    CREATE ROLE fin_anon;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'fin_service_role') THEN
    CREATE ROLE fin_service_role;
  END IF;
END $$;

-- Grant permissions
GRANT USAGE ON SCHEMA financial_ops TO fin_anon, mcp_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA financial_ops TO fin_anon, mcp_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA financial_ops 
  GRANT SELECT ON TABLES TO fin_anon, mcp_reader;

GRANT ALL PRIVILEGES ON SCHEMA financial_ops TO fin_service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA financial_ops TO fin_service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA financial_ops 
  GRANT ALL PRIVILEGES ON TABLES TO fin_service_role;

-- Enable RLS on all tables
ALTER TABLE financial_ops.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ops.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ops.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ops.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ops.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ops.forecasts ENABLE ROW LEVEL SECURITY;

-- Create read policies
CREATE POLICY "Read access for anon" ON financial_ops.invoices
  FOR SELECT TO fin_anon, mcp_reader USING (true);
  
CREATE POLICY "Read access for anon" ON financial_ops.budgets
  FOR SELECT TO fin_anon, mcp_reader USING (true);
  
-- Add similar policies for other tables...

-- Create indexes
CREATE INDEX idx_invoices_status ON financial_ops.invoices(status);
CREATE INDEX idx_invoices_due_date ON financial_ops.invoices(due_date);
CREATE INDEX idx_expenses_date ON financial_ops.expenses(expense_date);
CREATE INDEX idx_budgets_fiscal ON financial_ops.budgets(fiscal_year, fiscal_quarter);
EOF

# Create OpenAPI spec
cat > openapi/financial-reader.yaml << 'EOF'
openapi: 3.0.0
info:
  title: Suqi Financial Operations MCP Reader
  version: 1.0.0
  description: Read-only access to financial_ops schema
servers:
  - url: https://mcp.tbwa.ai
    description: Production MCP Reader (port 8888)
security:
  - apiKey: []
paths:
  /api/query:
    post:
      operationId: queryFinancialOps
      summary: Query financial operations data (read-only)
      x-search-path: "financial_ops,public"
      x-default-schema: "financial_ops"
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
                  description: |
                    SELECT or EXPLAIN queries only.
                    Tables available: invoices, budgets, expenses, payments, forecasts
                  example: "SELECT * FROM invoices WHERE status = 'pending' ORDER BY due_date"
                params:
                  type: array
                  items:
                    type: string
                  description: Query parameters for prepared statements
      responses:
        '200':
          description: Query results
          content:
            application/json:
              schema:
                type: object
                properties:
                  rows:
                    type: array
                    items:
                      type: object
                  rowCount:
                    type: integer
                  fields:
                    type: array
                    items:
                      type: object
                      properties:
                        name:
                          type: string
                        type:
                          type: string
components:
  securitySchemes:
    apiKey:
      type: apiKey
      in: header
      name: X-API-Key
EOF

# Create GitHub Actions workflow
cat > .github/workflows/main.yml << 'EOF'
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  SCHEMA_NAME: financial_ops
  WRITER_PORT: 8893

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
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.FIN_SERVICE_KEY }}
        run: |
          echo "🚀 Starting writer MCP for financial_ops..."
          
          docker run -d \
            -e SUPABASE_URL=$SUPABASE_URL \
            -e SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY \
            -e SCHEMA_NAME=financial_ops \
            -e SEARCH_PATH=financial_ops,public \
            -e READ_ONLY=false \
            -p 8893:3000 \
            --name mcp-writer-fin \
            ghcr.io/tbwa/mcp-server:latest
          
          # Wait for startup
          sleep 10
          
      - name: Run Migrations
        run: |
          for migration in prisma/migrations/*.sql; do
            echo "Running $migration..."
            curl -X POST http://localhost:8893/api/execute \
              -H "Content-Type: application/json" \
              -H "X-API-Key: ${{ secrets.MCP_API_KEY }}" \
              -d "{\"sql\": \"$(cat $migration | jq -Rs .)\"}"
          done
          
      - name: Generate Prisma Client
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
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
      
      - name: Build Applications
        run: |
          pnpm install --frozen-lockfile
          pnpm build
      
      - name: Deploy to Render
        env:
          RENDER_API_KEY: ${{ secrets.KEYKEY_RENDER_TOKEN }}
          SERVICE_ID: ${{ secrets.RENDER_SERVICE_ID_FIN }}
        run: |
          curl -X POST \
            -H "Authorization: Bearer $RENDER_API_KEY" \
            https://api.render.com/v1/services/$SERVICE_ID/deploys

  keykey-sync:
    name: 🤖 KeyKey Secret Sync
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger KeyKey Sync
        env:
          GH_TOKEN: ${{ secrets.KEYKEY_PAT }}
        run: |
          gh workflow run keykey-sync.yml -R jgtolentino/mcp-sqlite-server
EOF

# Create Docker Compose for local dev
cat > infra/docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Next.js Web App
  web:
    build:
      context: ../apps/web
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_APP_NAME=Suqi Financial Operations
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    volumes:
      - ../apps/web:/app
      - /app/node_modules
      - /app/.next
    command: pnpm dev

  # API Server
  api:
    build:
      context: ../apps/api
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=${DATABASE_URL}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - MCP_READER_URL=${MCP_READER_URL}
      - SCHEMA_NAME=financial_ops
    volumes:
      - ../apps/api:/app
      - /app/node_modules
    command: pnpm dev

  # Local MCP Reader Stub
  mcp-reader-stub:
    image: node:20-alpine
    ports:
      - "8888:8888"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SCHEMA_NAME=financial_ops
      - SEARCH_PATH=financial_ops,public
      - READ_ONLY=true
    volumes:
      - ../services/mcp-reader-stub:/app
    working_dir: /app
    command: |
      sh -c "
        echo '🔍 MCP Reader Stub for financial_ops'
        echo 'Simulating read-only access to Supabase'
        while true; do sleep 30; done
      "

volumes:
  node_modules:
EOF

# Create basic app structures
mkdir -p apps/web/src/app
cat > apps/web/package.json << 'EOF'
{
  "name": "@suqi-db-app/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.39.0",
    "@tanstack/react-query": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
EOF

mkdir -p apps/api/src
cat > apps/api/package.json << 'EOF'
{
  "name": "@suqi-db-app/api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit",
    "test": "jest"
  },
  "dependencies": {
    "fastify": "^4.24.0",
    "@fastify/cors": "^8.4.0",
    "@prisma/client": "^5.0.0",
    "@supabase/supabase-js": "^2.39.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  }
}
EOF

# Create turbo.json
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "outputs": []
    },
    "test": {
      "outputs": ["coverage/**"],
      "cache": false
    }
  }
}
EOF

# Create pnpm-workspace.yaml
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'services/*'
EOF

# Create .envrc for direnv
cat > .envrc << 'EOF'
# Auto-load environment for suqi-db-app
echo "💰 Loading Financial Operations environment..."

if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
  echo "✅ Loaded financial_ops schema environment"
else
  echo "⚠️  No .env.local found"
  echo "   Run: cp .env.template .env.local"
  echo "   Then fill in the values from KeyKey"
fi

# Set DATABASE_URL for Prisma
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_KEY" ]; then
  # Extract host from Supabase URL
  SUPABASE_HOST=$(echo $SUPABASE_URL | sed 's|https://||' | cut -d'.' -f1)
  export DATABASE_URL="postgresql://postgres:${SUPABASE_SERVICE_KEY}@${SUPABASE_HOST}.pooler.supabase.com:6543/postgres?schema=financial_ops"
fi
EOF

echo "✅ Scaffolded suqi-db-app!"
echo ""
echo "Next steps:"
echo "1. git add ."
echo "2. git commit -m 'feat: Initial scaffold for financial_ops schema'"
echo "3. git push -u origin main"
echo ""
echo "Add these to KeyKey's Doppler:"
echo "- FIN_SERVICE_KEY"
echo "- FIN_ANON_KEY"
echo "- RENDER_SERVICE_ID_FIN"