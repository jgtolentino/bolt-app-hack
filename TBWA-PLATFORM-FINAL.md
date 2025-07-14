# TBWA Enterprise Platform - Final Architecture

## 🎯 Correct Project Mapping

Both projects are on GitHub:

| Project | Repository | Schema(s) | Purpose | Writer Port(s) |
|---------|------------|-----------|---------|----------------|
| **suqi-db-app** | [github.com/jgtolentino/suqi-db-app](https://github.com/jgtolentino/suqi-db-app) | `scout_dash` | Scout Dashboard (Retail Analytics) | 8891 |
| **hris-fris** | [github.com/jgtolentino/agency-databank](https://github.com/jgtolentino/agency-databank) | `hr_admin` + `financial_ops` | HR & Finance System | 8894 (HR), 8893 (Fin) |

## 📁 Local Directory Structure

```
/Users/tbwa/
├── suqi-db-app/                    # Scout Dashboard
│   ├── apps/
│   ├── services/
│   ├── prisma/
│   └── package.json
│
└── agency-databank/                # Agency tools monorepo
    └── hris-fris/                  # HR + Finance system
        ├── apps/
        ├── services/
        ├── prisma/
        └── package.json
```

## 🏗️ Complete Platform Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TBWA ENTERPRISE PLATFORM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────┐        ┌─────────────────────────────────┐         │
│  │    suqi-db-app      │        │       agency-databank           │         │
│  │  (Scout Dashboard)  │        │    └── hris-fris/              │         │
│  │                     │        │        (HR + Finance)           │         │
│  └──────────┬──────────┘        └──────────────┬──────────────────┘         │
│             │                                   │                             │
│             ↓                                   ↓                             │
│      ┌──────────┐                    ┌─────────────────────┐                │
│      │scout_dash│                    │hr_admin│financial_ops│                │
│      └──────────┘                    └─────────────────────┘                │
│             ↓                                   ↓                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    SUPABASE (Single PostgreSQL Cluster)              │    │
│  │  ┌────────────┬─────────────┬──────────────┬────────────┬────────┐ │    │
│  │  │scout_dash  │  hr_admin   │financial_ops │ operations │corporate│ │    │
│  │  └────────────┴─────────────┴──────────────┴────────────┴────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      ↑                                        │
│                                      │ Read-Only Access                       │
│                                      │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    MCP READER (https://mcp.tbwa.ai)                  │    │
│  │                         Port 8888 - Always On                        │    │
│  │                      Shared by ALL LLM Agents                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                    ↗              ↑              ↖                           │
│                   /               │               \                          │
│            Claude Desktop      Pulser         ChatGPT                       │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔐 Security & Access Model

### Read Path (LLMs)
```
LLM Agent → MCP Reader (8888) → Read-Only PAT → Supabase Schema → RLS → Data
```
- Single shared reader for all agents
- Schema-specific PATs (scout_anon, hr_anon, fin_anon)
- Row Level Security enforced
- No write operations possible

### Write Path (CI/CD Only)
```
GitHub Actions → Writer MCP (889X) → Service Role Key → Schema → Data
```
- Separate writer per schema
- Never exposed to LLMs
- Service role keys with full permissions
- Triggered only in CI/CD pipeline

## 🤖 KeyKey Secret Management

```yaml
Doppler Project: tbwa-platform
├── Global Secrets
│   ├── SUPABASE_URL
│   ├── MCP_API_KEY
│   └── KEYKEY_RENDER_TOKEN
│
├── Scout Dashboard
│   ├── SCOUT_SERVICE_KEY      # Writer access
│   ├── SCOUT_ANON_KEY         # Reader access
│   └── RENDER_SERVICE_ID_SCOUT
│
└── HRIS-FRIS
    ├── HR_SERVICE_KEY         # HR writer
    ├── HR_ANON_KEY           # HR reader
    ├── FIN_SERVICE_KEY       # Finance writer
    ├── FIN_ANON_KEY         # Finance reader
    └── RENDER_SERVICE_ID_HRIS
```

## 📋 Quick Reference

### MCP Ports
| Schema | Reader Port | Writer Port | Purpose |
|--------|-------------|-------------|---------|
| ALL | 8888 | - | Shared reader for all LLMs |
| scout_dash | 8888 | 8891 | Scout Dashboard |
| financial_ops | 8888 | 8893 | Finance operations |
| hr_admin | 8888 | 8894 | HR administration |
| operations | 8888 | 8895 | Operations (future) |
| corporate | 8888 | 8896 | Corporate (future) |

### Development Commands

```bash
# Scout Dashboard
cd ~/suqi-db-app
direnv allow
pnpm dev

# HRIS-FRIS
cd ~/agency-databank/hris-fris
direnv allow
pnpm dev

# Deploy changes
git push origin main  # Triggers CI/CD
```

### Adding New Projects

1. **Create schema** in Supabase
2. **Run scaffold** script
3. **Add secrets** to KeyKey/Doppler
4. **Push to GitHub** to deploy

## 🚀 Deployment Pipeline

```
Developer pushes → GitHub Actions → KeyKey syncs secrets → 
→ Writer MCP runs migrations → Prisma generates types → 
→ Build & test → Deploy to Render → Health check
```

## 🎯 Benefits

1. **Single Database** - One Supabase bill, infinite projects
2. **Schema Isolation** - Complete separation between projects
3. **LLM Safety** - Read-only access prevents AI accidents
4. **Zero Secret Touch** - KeyKey handles everything
5. **Scalable Pattern** - Copy scaffold for new projects

This architecture supports unlimited TBWA projects with maximum security and minimum complexity!