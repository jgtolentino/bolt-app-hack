# Scout Dash Monorepo → Suqi DB App Integration Guide

## 🎯 Overview

This guide explains how the Scout Dash 3.0 Marketplace Edition monorepo is integrated into the TBWA Enterprise Platform architecture as part of the suqi-db-app repository.

## 📊 Architecture Comparison

### Before: Standalone Scout Dash Monorepo
```
scout-dash-monorepo/              # Independent monorepo
├── apps/                        # All apps together
├── packages/                    # Shared packages
├── connectors/                  # Data connectors
├── plugins/                     # Plugin system
└── cli/                        # CLI tools
```

### After: Integrated Suqi DB App
```
suqi-db-app/                     # Part of TBWA platform
├── apps/                        # Scout Dash apps
├── packages/                    # Scout Dash packages
├── connectors/                  # Scout Dash connectors
├── plugins/                     # Scout Dash plugins
├── services/                    # MCP writer (NEW)
│   └── mcp-writer/             # Schema-specific writer
├── prisma/                      # Scout_dash schema
└── .github/                     # TBWA CI/CD pipeline
```

## 🔄 Integration Process

### 1. Run Integration Script
```bash
cd /Users/tbwa/bolt-app-hack
chmod +x integrate-scout-dash-monorepo.sh
./integrate-scout-dash-monorepo.sh
```

### 2. What Gets Migrated

| Component | From Scout Dash | To Suqi DB App | Changes |
|-----------|----------------|----------------|---------|
| **Web App** | `/apps/web` | `/apps/web` | No changes |
| **API** | `/apps/api` | `/apps/api` | Add scout_dash schema |
| **Desktop** | `/apps/desktop` | `/apps/desktop` | Update build paths |
| **Packages** | `/packages/*` | `/packages/*` | No changes |
| **Connectors** | `/connectors/*` | `/connectors/*` | Configure for scout_dash |
| **Plugins** | `/plugins/*` | `/plugins/*` | No changes |
| **CLI** | `/cli` | `/cli` | Update for TBWA platform |
| **Database** | Generic schema | `scout_dash` schema | Schema-specific models |
| **MCP** | Not included | `/services/mcp-writer` | NEW: TBWA integration |

### 3. New Components Added

#### MCP Writer Service (`/services/mcp-writer`)
- Port: 8891
- Purpose: CI/CD migrations only
- Never exposed to LLMs
- Uses SCOUT_SERVICE_KEY

#### TBWA Platform Integration
- KeyKey secret management
- Shared MCP reader (port 8888)
- Schema isolation (scout_dash)
- CI/CD pipeline

## 🔐 Security Model

### Read Access (LLMs)
```
Claude/ChatGPT → MCP Reader (:8888) → scout_anon role → scout_dash schema
```
- Read-only access
- Row-level security
- No write permissions

### Write Access (CI/CD)
```
GitHub Actions → MCP Writer (:8891) → scout_service_role → scout_dash schema
```
- Full permissions
- Migrations only
- Never exposed publicly

## 📁 File Structure Details

### Apps Structure
```
apps/
├── web/                    # Next.js dashboard
│   ├── src/
│   │   ├── pages/         # Dashboard pages
│   │   ├── components/    # React components
│   │   └── charts/        # Chart components
│   └── package.json
├── api/                    # Express API
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── prisma/        # Database client
│   └── package.json
└── desktop/               # Electron app
    ├── electron-main.ts
    ├── preload.ts
    └── package.json
```

### Services Structure
```
services/
└── mcp-writer/            # MCP migration service
    ├── src/
    │   ├── index.ts       # MCP server
    │   └── migrate.ts     # Migration runner
    └── package.json
```

### Prisma Configuration
```
prisma/
├── schema.prisma          # Scout_dash models
└── migrations/            # Schema migrations
```

## 🚀 Development Workflow

### Local Development
```bash
# 1. Setup environment
cd ~/suqi-db-app
direnv allow

# 2. Install dependencies
pnpm install

# 3. Start all services
pnpm dev

# This runs:
# - Web app on http://localhost:3000
# - API on http://localhost:4000
# - Desktop in development mode
```

### Building Desktop App
```bash
# Build DMG for macOS
pnpm desktop:build

# Output: apps/desktop/dist-electron/Scout-Dash-3.0.dmg
```

### Using the CLI
```bash
# Build dashboard from blueprint
pnpm cli dash build dashboard.json

# Import PBIX file
pnpm cli import pbix report.pbix --to-blueprint
```

## 🔑 Environment Variables

### Required Secrets (from KeyKey)
```bash
# Database
DATABASE_URL        # Uses SCOUT_SERVICE_KEY
SCOUT_SERVICE_KEY   # Write access
SCOUT_ANON_KEY      # Read access

# Supabase
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Application
JWT_SECRET
RENDER_SERVICE_ID_SCOUT
RENDER_API_KEY
```

### Local Development (.env.local)
```bash
# API
API_PORT=4000
NEXT_PUBLIC_API_URL=http://localhost:4000

# MCP
MCP_WRITER_PORT=8891
MCP_READER_URL=https://mcp.tbwa.ai

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 📈 Database Schema

The `scout_dash` schema includes:
- `stores` - Retail store locations
- `products` - Product catalog
- `customers` - Customer profiles
- `transactions` - Sales transactions
- `transaction_items` - Line items

## 🚢 Deployment

### Automatic Deployment
1. Push to `main` branch
2. GitHub Actions runs tests
3. KeyKey syncs secrets
4. MCP writer runs migrations
5. Render deploys application

### Manual Deployment
```bash
# Run migrations
cd services/mcp-writer
pnpm migrate

# Deploy to Render
curl -X POST \
  "https://api.render.com/v1/services/$RENDER_SERVICE_ID_SCOUT/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

## 🔍 Verification

### Check Integration
```bash
# 1. Verify structure
ls -la apps/ packages/ connectors/ services/

# 2. Test MCP writer
cd services/mcp-writer
pnpm dev

# 3. Test database connection
cd apps/api
pnpm prisma db pull

# 4. Run tests
pnpm test
```

### Common Issues

#### Issue: Missing dependencies
```bash
pnpm install
```

#### Issue: Database connection fails
Check DATABASE_URL includes:
- `schema=scout_dash`
- Correct SCOUT_SERVICE_KEY

#### Issue: Build fails
```bash
pnpm clean
pnpm install
pnpm build
```

## 📚 Additional Resources

- [TBWA Platform Architecture](TBWA-PLATFORM-FINAL.md)
- [Scout Dash Architecture](../scout-dash-monorepo/docs/ARCHITECTURE.md)
- [Supabase MCP Guide](supabase-mcp-multi-schema-architecture.md)

## ✅ Success Criteria

You know the integration is successful when:
1. ✅ All Scout Dash features work in suqi-db-app
2. ✅ Desktop app builds successfully
3. ✅ LLMs can query via MCP reader
4. ✅ CI/CD pipeline deploys automatically
5. ✅ Schema isolation is maintained