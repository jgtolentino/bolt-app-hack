# TBWA Enterprise Platform Architecture

## 🏗️ Complete Project Mapping

### Projects and Their Schemas

| Project | Repository | Schema(s) | Purpose | Writer Port |
|---------|------------|-----------|---------|-------------|
| **suqi-db-app** | [GitHub](https://github.com/jgtolentino/suqi-db-app) | `scout_dash` | Retail Analytics Dashboard | 8891 |
| **hris-fris** | [Google Drive](https://github.com/jgtolentino/agency-databank) | `hr_admin` + `financial_ops` | HR & Finance System | 8894 (HR), 8893 (Fin) |
| **ops-hub** | TBD | `operations` | Operations Management | 8895 |
| **corporate-portal** | TBD | `corporate` | Governance & Compliance | 8896 |
| **creative-insights** | TBD | `creative_insights` | Campaign Performance | 8897 |

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TBWA ENTERPRISE PLATFORM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ suqi-db-app │  │  hris-fris  │  │  ops-hub    │  │ corp-portal │        │
│  │   (Scout)   │  │ (HR + Fin)  │  │(Operations) │  │ (Corporate) │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                 │                 │                 │               │
│         ↓                 ↓                 ↓                 ↓               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        SUPABASE (Single Cluster)                     │    │
│  │  ┌────────────┬─────────────┬──────────────┬────────────┬────────┐ │    │
│  │  │scout_dash  │  hr_admin   │financial_ops │ operations │corporate│ │    │
│  │  └────────────┴─────────────┴──────────────┴────────────┴────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      ↑                                        │
│                                      │ Read-Only                              │
│                                      │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    MCP READER (port 8888) - Always On                │    │
│  │                         Shared by ALL LLMs                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                          ↗           ↑           ↖                            │
│                         /            │            \                           │
│                   Claude         Pulser       ChatGPT                        │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔐 Security Model

### Read Access (LLMs)
- **Single MCP Reader** on port 8888
- **Read-only PATs** per schema
- **Row Level Security** enforced
- **Schema isolation** via search_path

### Write Access (CI/CD Only)
- **Writer MCPs** per schema (ports 889X)
- **Service role keys** with write permissions
- **Never exposed** to LLMs
- **Triggered only** in GitHub Actions

## 🤖 KeyKey Automation

```
┌─────────────────────────────────────┐
│          KeyKey Bot                 │
│    (Secret Management Engine)       │
├─────────────────────────────────────┤
│                                     │
│  Doppler Project: tbwa-platform     │
│  ├── SUPABASE_URL                  │
│  ├── SUPABASE_ANON_KEY             │
│  ├── SCOUT_SERVICE_KEY             │
│  ├── HR_SERVICE_KEY                │
│  ├── FIN_SERVICE_KEY               │
│  └── [schema]_SERVICE_KEY          │
│                                     │
└──────────────┬──────────────────────┘
               │ Syncs to
               ↓
      ┌────────┴────────┐
      │                 │
GitHub Secrets    Render Env Vars
```

## 📁 Repository Structure (Per Project)

```
<project>/
├── apps/
│   ├── web/                 # Frontend (Next.js/Vite)
│   └── api/                 # Backend API
├── services/
│   └── mcp-writer/          # CI/CD writer MCP
├── prisma/
│   └── schema.prisma        # Schema for this project
├── migrations/
│   └── *.sql                # SQL migrations
├── openapi/
│   └── reader.yaml          # OpenAPI spec
├── .github/workflows/
│   └── main.yml             # CI/CD pipeline
└── README.md
```

## 🚀 Development Workflow

### Local Development
```bash
# 1. Clone project
git clone <project-repo>
cd <project>

# 2. Setup environment
direnv allow              # Auto-loads secrets
cp .env.template .env.local

# 3. Install & run
pnpm install
pnpm dev                  # Starts web + api + local MCP stub
```

### Adding a New Project
```bash
# 1. Create schema in Supabase
CREATE SCHEMA new_project_ops;

# 2. Scaffold project
./scaffold-new-project.sh

# 3. Add secrets to KeyKey
doppler secrets set NEW_SERVICE_KEY="..." --project tbwa-platform

# 4. Push and deploy
git push origin main
```

## 📊 Schema Reference

### scout_dash (Retail Analytics)
- transactions
- stores
- products
- customers
- transaction_items

### hr_admin (Human Resources)
- employees
- departments
- payroll
- benefits
- time_tracking
- performance_reviews

### financial_ops (Finance)
- invoices
- budgets
- expenses
- payments
- forecasts

### operations (Operations Hub)
- projects
- resources
- tasks
- logistics
- inventory

### corporate (Governance)
- policies
- compliance_records
- legal_documents
- board_resolutions
- audit_logs

### creative_insights (Marketing)
- campaigns
- creatives
- performance_metrics
- audience_segments
- roi_analysis

## 🔗 Quick Links

- **MCP Reader**: https://mcp.tbwa.ai (port 8888)
- **Supabase Dashboard**: https://supabase.com/dashboard/project/cxzllzyxwpyptfretryc
- **Platform Docs**: https://github.com/jgtolentino/mcp-sqlite-server/tree/chatgpt-integration
- **KeyKey Status**: Run `doppler secrets --project tbwa-platform`

## 💡 Best Practices

1. **Never commit secrets** - Use KeyKey/Doppler
2. **Schema isolation** - Each project owns its schema
3. **Read-only LLMs** - All AI access is read-only
4. **CI/CD writes** - Only automation can write
5. **Single source of truth** - One Supabase cluster
6. **Automated sync** - KeyKey handles all secrets

This architecture scales infinitely - just add a new schema and project!