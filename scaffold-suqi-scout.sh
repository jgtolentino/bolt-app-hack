#!/bin/bash
set -euo pipefail

# Scaffold for suqi-db-app (Scout Dashboard - Retail Analytics)

echo "🏪 Scaffolding suqi-db-app (Scout Dashboard)..."

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
# Suqi DB App - Scout Dashboard

Retail analytics dashboard using the `scout_dash` schema in TBWA Enterprise Platform.

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

This project uses the `scout_dash` schema in the TBWA Supabase cluster.

- **Read Access**: Via shared MCP reader at https://mcp.tbwa.ai
- **Write Access**: CI/CD only via local writer MCP (port 8891)
- **Schema**: `scout_dash`
- **Search Path**: `scout_dash, public`

## 🔐 Security

- All secrets managed by KeyKey
- LLMs have read-only access via `scout_anon` role
- Writes restricted to CI/CD pipeline via `scout_service_role`

## 📈 Features

- Real-time sales dashboards
- Store performance analytics
- Product mix analysis
- Customer insights
- Regional comparisons
- Transaction trends

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│         Supabase Cluster            │
│  ┌─────────────────────────────┐   │
│  │      scout_dash schema       │   │
│  │  - transactions              │   │
│  │  - stores                    │   │
│  │  - products                  │   │
│  │  - transaction_items         │   │
│  │  - customers                 │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
            ↑ Read Only
┌─────────────────────────────────────┐
│      MCP Reader (port 8888)         │
│   search_path: scout_dash,public    │
└─────────────────────────────────────┘
```

## 📖 Documentation

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
SUPABASE_ANON_KEY=<scout_anon_key>
SUPABASE_SERVICE_KEY=<scout_service_key>

# MCP Configuration
MCP_READER_URL=https://mcp.tbwa.ai
MCP_WRITER_PORT=8891
SCHEMA_NAME=scout_dash
SEARCH_PATH=scout_dash,public

# API Configuration
API_PORT=3001
NODE_ENV=development

# Application
NEXT_PUBLIC_APP_NAME="Scout Dashboard"
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

# Create package.json
cat > package.json << 'EOF'
{
  "name": "suqi-db-app",
  "version": "0.1.0",
  "private": true,
  "description": "Scout Dashboard - Retail Analytics using scout_dash schema",
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

# Create Prisma schema for scout_dash
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["scout_dash", "public"]
}

// Scout Dashboard Models

model Store {
  store_id      String   @id @default(uuid())
  store_name    String
  region        String
  city          String
  store_type    String
  opening_date  DateTime
  status        String   @default("active")
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  
  transactions  Transaction[]
  
  @@schema("scout_dash")
}

model Product {
  product_id    String   @id @default(uuid())
  product_name  String
  brand         String
  category      String
  sub_category  String?
  unit_price    Decimal  @db.Decimal(10, 2)
  status        String   @default("active")
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  
  transaction_items TransactionItem[]
  
  @@schema("scout_dash")
}

model Customer {
  customer_id   String   @id @default(uuid())
  customer_type String
  segment       String?
  region        String?
  created_at    DateTime @default(now())
  
  transactions  Transaction[]
  
  @@schema("scout_dash")
}

model Transaction {
  transaction_id String   @id @default(uuid())
  store_id      String
  customer_id   String?
  date          DateTime
  total_amount  Decimal  @db.Decimal(10, 2)
  items_count   Int
  payment_method String
  status        String   @default("completed")
  created_at    DateTime @default(now())
  
  store         Store    @relation(fields: [store_id], references: [store_id])
  customer      Customer? @relation(fields: [customer_id], references: [customer_id])
  items         TransactionItem[]
  
  @@index([date])
  @@index([store_id])
  @@schema("scout_dash")
}

model TransactionItem {
  item_id        String   @id @default(uuid())
  transaction_id String
  product_id     String
  quantity       Decimal  @db.Decimal(10, 2)
  unit_price     Decimal  @db.Decimal(10, 2)
  total_price    Decimal  @db.Decimal(10, 2)
  discount       Decimal? @db.Decimal(10, 2)
  
  transaction    Transaction @relation(fields: [transaction_id], references: [transaction_id])
  product        Product     @relation(fields: [product_id], references: [product_id])
  
  @@index([transaction_id])
  @@schema("scout_dash")
}

// Materialized Views (read-only)
model DailySales {
  date          DateTime @id
  store_id      String
  total_sales   Decimal  @db.Decimal(12, 2)
  transactions  Int
  unique_customers Int
  
  @@map("mv_daily_sales")
  @@schema("scout_dash")
}

model ProductPerformance {
  product_id    String   @id
  period        DateTime
  units_sold    Decimal  @db.Decimal(12, 2)
  revenue       Decimal  @db.Decimal(12, 2)
  rank          Int
  
  @@map("mv_product_performance")
  @@schema("scout_dash")
}
EOF

# Create initial migration
cat > prisma/migrations/001_init_scout_dash.sql << 'EOF'
-- Initial schema setup for scout_dash
-- This runs in CI/CD via writer MCP

-- Ensure schema exists
CREATE SCHEMA IF NOT EXISTS scout_dash;

-- Set search path
SET search_path TO scout_dash, public;

-- Create roles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'scout_anon') THEN
    CREATE ROLE scout_anon;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'scout_service_role') THEN
    CREATE ROLE scout_service_role;
  END IF;
END $$;

-- Grant permissions
GRANT USAGE ON SCHEMA scout_dash TO scout_anon, mcp_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA scout_dash TO scout_anon, mcp_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA scout_dash 
  GRANT SELECT ON TABLES TO scout_anon, mcp_reader;

GRANT ALL PRIVILEGES ON SCHEMA scout_dash TO scout_service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA scout_dash TO scout_service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA scout_dash 
  GRANT ALL PRIVILEGES ON TABLES TO scout_service_role;

-- Enable RLS on all tables
ALTER TABLE scout_dash.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_dash.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_dash.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_dash.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_dash.transaction_items ENABLE ROW LEVEL SECURITY;

-- Create read policies
CREATE POLICY "Read access for anon" ON scout_dash.stores
  FOR SELECT TO scout_anon, mcp_reader USING (true);
  
CREATE POLICY "Read access for anon" ON scout_dash.products
  FOR SELECT TO scout_anon, mcp_reader USING (true);

CREATE POLICY "Read access for anon" ON scout_dash.customers
  FOR SELECT TO scout_anon, mcp_reader USING (true);

CREATE POLICY "Read access for anon" ON scout_dash.transactions
  FOR SELECT TO scout_anon, mcp_reader USING (true);

CREATE POLICY "Read access for anon" ON scout_dash.transaction_items
  FOR SELECT TO scout_anon, mcp_reader USING (true);

-- Create indexes for performance
CREATE INDEX idx_transactions_date ON scout_dash.transactions(date);
CREATE INDEX idx_transactions_store ON scout_dash.transactions(store_id);
CREATE INDEX idx_transaction_items_transaction ON scout_dash.transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product ON scout_dash.transaction_items(product_id);

-- Create materialized views
CREATE MATERIALIZED VIEW scout_dash.mv_daily_sales AS
SELECT 
  date_trunc('day', t.date) as date,
  t.store_id,
  SUM(t.total_amount) as total_sales,
  COUNT(DISTINCT t.transaction_id) as transactions,
  COUNT(DISTINCT t.customer_id) as unique_customers
FROM scout_dash.transactions t
GROUP BY date_trunc('day', t.date), t.store_id;

CREATE INDEX idx_daily_sales ON scout_dash.mv_daily_sales(date, store_id);

-- Grant read access to materialized views
GRANT SELECT ON scout_dash.mv_daily_sales TO scout_anon, mcp_reader;
EOF

# Create OpenAPI spec
cat > openapi/scout-reader.yaml << 'EOF'
openapi: 3.0.0
info:
  title: Scout Dashboard MCP Reader
  version: 1.0.0
  description: Read-only access to scout_dash schema for retail analytics
servers:
  - url: https://mcp.tbwa.ai
    description: Production MCP Reader (port 8888)
security:
  - apiKey: []
paths:
  /api/query:
    post:
      operationId: queryScoutDash
      summary: Query Scout Dashboard data (read-only)
      x-search-path: "scout_dash,public"
      x-default-schema: "scout_dash"
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
                    Tables: stores, products, customers, transactions, transaction_items
                    Views: mv_daily_sales, mv_product_performance
                  example: |
                    SELECT 
                      s.store_name,
                      s.region,
                      SUM(t.total_amount) as total_sales
                    FROM transactions t
                    JOIN stores s ON t.store_id = s.store_id
                    WHERE t.date >= CURRENT_DATE - INTERVAL '30 days'
                    GROUP BY s.store_name, s.region
                    ORDER BY total_sales DESC
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
  SCHEMA_NAME: scout_dash
  WRITER_PORT: 8891

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
          SUPABASE_SERVICE_KEY: ${{ secrets.SCOUT_SERVICE_KEY }}
        run: |
          echo "🚀 Starting writer MCP for scout_dash..."
          
          docker run -d \
            -e SUPABASE_URL=$SUPABASE_URL \
            -e SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY \
            -e SCHEMA_NAME=scout_dash \
            -e SEARCH_PATH=scout_dash,public \
            -e READ_ONLY=false \
            -p 8891:3000 \
            --name mcp-writer-scout \
            ghcr.io/tbwa/mcp-server:latest
          
          # Wait for startup
          sleep 10
          
      - name: Run Migrations
        run: |
          for migration in prisma/migrations/*.sql; do
            echo "Running $migration..."
            curl -X POST http://localhost:8891/api/execute \
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
          SERVICE_ID: ${{ secrets.RENDER_SERVICE_ID_SCOUT }}
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

# Create direnv file
cat > .envrc << 'EOF'
# Auto-load environment for Scout Dashboard
echo "🏪 Loading Scout Dashboard environment..."

if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
  echo "✅ Loaded scout_dash schema environment"
else
  echo "⚠️  No .env.local found"
  echo "   Run: cp .env.template .env.local"
  echo "   Then fill in the values from KeyKey"
fi

# Set DATABASE_URL for Prisma
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_KEY" ]; then
  # Extract host from Supabase URL
  SUPABASE_HOST=$(echo $SUPABASE_URL | sed 's|https://||' | cut -d'.' -f1)
  export DATABASE_URL="postgresql://postgres:${SUPABASE_SERVICE_KEY}@${SUPABASE_HOST}.pooler.supabase.com:6543/postgres?schema=scout_dash"
fi
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
    "lint": {},
    "typecheck": {},
    "test": {}
  }
}
EOF

# Create pnpm-workspace.yaml
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'services/*'
EOF

echo "✅ Scaffolded suqi-db-app (Scout Dashboard)!"
echo ""
echo "Next steps:"
echo "1. git add ."
echo "2. git commit -m 'feat: Initial scaffold for scout_dash schema'"
echo "3. git push -u origin main"
echo ""
echo "Add these to KeyKey's Doppler:"
echo "- SCOUT_SERVICE_KEY"
echo "- SCOUT_ANON_KEY"
echo "- RENDER_SERVICE_ID_SCOUT"