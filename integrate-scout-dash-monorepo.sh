#!/bin/bash
set -euo pipefail

# Integration script to merge Scout Dash monorepo into suqi-db-app structure
# Following TBWA Enterprise Platform architecture

echo "🚀 Integrating Scout Dash Monorepo into suqi-db-app..."

# Ensure we're in the right directory
BOLT_APP_DIR="/Users/tbwa/bolt-app-hack"
SCOUT_MONOREPO_DIR="/Users/tbwa/scout-dash-monorepo"
SUQI_DB_APP_DIR="/Users/tbwa/suqi-db-app"

# First, ensure suqi-db-app repo exists
if [ ! -d "$SUQI_DB_APP_DIR" ]; then
    echo "📦 Cloning suqi-db-app repository..."
    cd /Users/tbwa
    git clone https://github.com/jgtolentino/suqi-db-app.git
fi

cd "$SUQI_DB_APP_DIR"

echo "📁 Creating integrated structure..."

# Create the base structure if it doesn't exist
mkdir -p apps/{web,api,desktop}/{src,public}
mkdir -p packages/{ui,charts,widgets,types,utils,validation,sdk}
mkdir -p connectors/{supabase,sqlite,snowflake}
mkdir -p plugins
mkdir -p importers/{powerbi,tableau,common}
mkdir -p cli/src
mkdir -p marketplace-registry
mkdir -p services/mcp-writer/{src,config}
mkdir -p prisma/migrations
mkdir -p scripts
mkdir -p docs
mkdir -p infra/{docker,k8s,terraform}
mkdir -p .github/workflows

# Copy Scout Dash monorepo components
echo "📋 Copying Scout Dash components..."

# Copy apps
if [ -d "$SCOUT_MONOREPO_DIR/apps/web" ]; then
    cp -r "$SCOUT_MONOREPO_DIR/apps/web/"* apps/web/ 2>/dev/null || true
fi

if [ -d "$SCOUT_MONOREPO_DIR/apps/api" ]; then
    cp -r "$SCOUT_MONOREPO_DIR/apps/api/"* apps/api/ 2>/dev/null || true
fi

if [ -d "$SCOUT_MONOREPO_DIR/apps/desktop" ]; then
    cp -r "$SCOUT_MONOREPO_DIR/apps/desktop/"* apps/desktop/ 2>/dev/null || true
fi

# Copy packages
for pkg in ui charts widgets types utils validation sdk; do
    if [ -d "$SCOUT_MONOREPO_DIR/packages/$pkg" ]; then
        cp -r "$SCOUT_MONOREPO_DIR/packages/$pkg/"* "packages/$pkg/" 2>/dev/null || true
    fi
done

# Copy connectors
for conn in supabase sqlite snowflake; do
    if [ -d "$SCOUT_MONOREPO_DIR/connectors/$conn" ]; then
        cp -r "$SCOUT_MONOREPO_DIR/connectors/$conn/"* "connectors/$conn/" 2>/dev/null || true
    fi
done

# Copy other components
[ -d "$SCOUT_MONOREPO_DIR/cli" ] && cp -r "$SCOUT_MONOREPO_DIR/cli/"* cli/ 2>/dev/null || true
[ -d "$SCOUT_MONOREPO_DIR/plugins" ] && cp -r "$SCOUT_MONOREPO_DIR/plugins/"* plugins/ 2>/dev/null || true
[ -d "$SCOUT_MONOREPO_DIR/marketplace-registry" ] && cp -r "$SCOUT_MONOREPO_DIR/marketplace-registry/"* marketplace-registry/ 2>/dev/null || true
[ -d "$SCOUT_MONOREPO_DIR/docs" ] && cp -r "$SCOUT_MONOREPO_DIR/docs/"* docs/ 2>/dev/null || true

# Create integrated package.json
cat > package.json << 'EOF'
{
  "name": "suqi-db-app",
  "version": "3.0.0",
  "description": "Scout Dashboard - Retail Analytics Platform",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*",
    "connectors/*",
    "plugins/*",
    "services/*",
    "cli"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "clean": "turbo run clean",
    "db:push": "cd apps/api && pnpm prisma db push",
    "db:migrate": "cd apps/api && pnpm prisma migrate dev",
    "db:studio": "cd apps/api && pnpm prisma studio",
    "desktop:build": "cd apps/desktop && pnpm desktop:build",
    "cli": "cd cli && pnpm dev",
    "deploy": "turbo run deploy",
    "mcp:dev": "cd services/mcp-writer && pnpm dev",
    "mcp:migrate": "cd services/mcp-writer && pnpm migrate"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "turbo": "^1.11.0",
    "typescript": "^5.3.0",
    "prettier": "^3.2.0",
    "eslint": "^8.56.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.14.0"
}
EOF

# Create turbo.json for monorepo management
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "out/**"]
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "clean": {
      "cache": false
    },
    "deploy": {
      "dependsOn": ["build", "test"],
      "cache": false
    }
  }
}
EOF

# Create Prisma schema for scout_dash
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["scout_dash", "public"]
}

// Scout Dash schema models
model Store {
  id              String   @id @default(cuid())
  code            String   @unique
  name            String
  type            String
  region          String
  province        String
  city            String
  barangay        String?
  latitude        Float?
  longitude       Float?
  isActive        Boolean  @default(true)
  openingTime     String?
  closingTime     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  transactions    Transaction[]
  
  @@map("stores")
  @@schema("scout_dash")
}

model Product {
  id              String   @id @default(cuid())
  sku             String   @unique
  name            String
  brand           String
  category        String
  subcategory     String?
  unitPrice       Float
  cost            Float?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  transactionItems TransactionItem[]
  
  @@map("products")
  @@schema("scout_dash")
}

model Customer {
  id              String   @id @default(cuid())
  code            String   @unique
  name            String?
  type            String
  ageGroup        String?
  gender          String?
  occupation      String?
  incomeLevel     String?
  creditLimit     Float?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  transactions    Transaction[]
  
  @@map("customers")
  @@schema("scout_dash")
}

model Transaction {
  id                String   @id @default(cuid())
  code              String   @unique
  storeId           String
  customerId        String?
  timestamp         DateTime
  totalAmount       Float
  paymentMethod     String
  transactionType   String
  duration          Int?
  dayOfWeek         Int
  hour              Int
  isPayday          Boolean  @default(false)
  isHoliday         Boolean  @default(false)
  createdAt         DateTime @default(now())
  
  store             Store    @relation(fields: [storeId], references: [id])
  customer          Customer? @relation(fields: [customerId], references: [id])
  items             TransactionItem[]
  
  @@map("transactions")
  @@schema("scout_dash")
}

model TransactionItem {
  id                String   @id @default(cuid())
  transactionId     String
  productId         String
  quantity          Float
  unitPrice         Float
  totalPrice        Float
  discount          Float?
  isSubstitution    Boolean  @default(false)
  originalProductId String?
  
  transaction       Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  product           Product @relation(fields: [productId], references: [id])
  
  @@map("transaction_items")
  @@schema("scout_dash")
}
EOF

# Create MCP writer service
cat > services/mcp-writer/package.json << 'EOF'
{
  "name": "@suqi-db-app/mcp-writer",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "migrate": "tsx src/migrate.ts"
  },
  "dependencies": {
    "@anthropic/mcp": "^0.4.0",
    "@supabase/supabase-js": "^2.39.0",
    "dotenv": "^16.3.1",
    "prisma": "^5.8.0",
    "@prisma/client": "^5.8.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "tsx": "^4.6.0",
    "typescript": "^5.3.0"
  }
}
EOF

# Create environment template
cat > .env.template << 'EOF'
# Database
DATABASE_URL="postgresql://scout_service_role:${SCOUT_SERVICE_KEY}@db.cxzllzyxwpyptfretryc.supabase.co:5432/postgres?schema=scout_dash&pgbouncer=true"

# Supabase
SUPABASE_URL="https://cxzllzyxwpyptfretryc.supabase.co"
SUPABASE_ANON_KEY="${SCOUT_ANON_KEY}"
SUPABASE_SERVICE_ROLE_KEY="${SCOUT_SERVICE_KEY}"

# MCP Configuration
MCP_WRITER_PORT=8891
MCP_READER_URL="https://mcp.tbwa.ai"

# API Configuration
API_PORT=4000
NEXT_PUBLIC_API_URL="http://localhost:4000"

# JWT Secret
JWT_SECRET="${JWT_SECRET}"

# Redis (for queues and caching)
REDIS_HOST="localhost"
REDIS_PORT=6379
EOF

# Create GitHub Actions workflow
cat > .github/workflows/ci-cd.yml << 'EOF'
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo lint type-check test

  migrate:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      
      - name: Sync secrets from KeyKey
        uses: keykey-ai/action@v1
        with:
          api-key: ${{ secrets.KEYKEY_API_KEY }}
          project: tbwa-platform
          environment: production
      
      - name: Run migrations via MCP writer
        run: |
          cd services/mcp-writer
          pnpm install
          pnpm migrate
        env:
          DATABASE_URL: ${{ env.DATABASE_URL }}
          SCOUT_SERVICE_KEY: ${{ env.SCOUT_SERVICE_KEY }}

  deploy:
    needs: migrate
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render
        run: |
          curl -X POST \
            "https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID_SCOUT }}/deploys" \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"clearCache": false}'
EOF

# Create README with full integration details
cat > README.md << 'EOF'
# Suqi DB App - Scout Dashboard

Enterprise retail analytics platform built on the Scout Dash monorepo architecture.

## 🏗️ Architecture

This project integrates the Scout Dash 3.0 Marketplace Edition monorepo into the TBWA Enterprise Platform architecture.

```
suqi-db-app/
├── apps/
│   ├── web/          # Next.js dashboard
│   ├── api/          # Express + Prisma API
│   └── desktop/      # Electron desktop app
├── packages/         # Shared UI components and utilities
├── connectors/       # Data source connectors
├── plugins/          # Dashboard plugins
├── services/         # MCP writer service
└── prisma/          # Database schema
```

## 🚀 Features

- **Dashboard-as-Code**: Generate dashboards from JSON blueprints
- **Multi-Connector Support**: Supabase, SQLite, Snowflake, PBIX/TWBX
- **Plugin Marketplace**: Extensible visualization ecosystem
- **Offline-First**: SQLite caching with background sync
- **Real-time Updates**: WebSocket support for live metrics

## 📊 Database

Uses the `scout_dash` schema in TBWA Supabase cluster:
- **Read Access**: Via shared MCP reader at https://mcp.tbwa.ai
- **Write Access**: CI/CD only via local writer MCP (port 8891)

## 🔐 Security

- All secrets managed by KeyKey
- LLMs have read-only access via `scout_anon` role
- Writes restricted to CI/CD pipeline
- Row-level security enforced

## 🛠️ Development

```bash
# Setup environment
direnv allow

# Install dependencies
pnpm install

# Start development
pnpm dev

# Build desktop app
pnpm desktop:build

# Run CLI
pnpm cli
```

## 📦 Deployment

Push to main branch triggers:
1. KeyKey syncs secrets
2. MCP writer runs migrations
3. Render deploys application

## 📖 Documentation

- [Architecture Guide](docs/ARCHITECTURE.md)
- [Plugin Development](docs/PLUGIN_GUIDE.md)
- [API Reference](docs/API.md)
EOF

echo "✅ Integration complete!"
echo ""
echo "📋 Next steps:"
echo "1. cd $SUQI_DB_APP_DIR"
echo "2. git add ."
echo "3. git commit -m 'feat: integrate Scout Dash monorepo architecture'"
echo "4. git push origin main"
echo ""
echo "🔐 Add these secrets to Doppler/KeyKey:"
echo "- SCOUT_SERVICE_KEY"
echo "- SCOUT_ANON_KEY"
echo "- JWT_SECRET"
echo "- RENDER_SERVICE_ID_SCOUT"
echo "- RENDER_API_KEY"