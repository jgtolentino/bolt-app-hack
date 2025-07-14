# 🚀 Master To-Do List — Post-MCP-Reset (TBWA Platform)

**Status**: MCP Reader deployed but needs Supabase connection
**Date**: July 14, 2025

## 🔴 IMMEDIATE FIXES (Today)

### 1. Fix MCP Reader Connection ⚡
The reader MCP (mcp-supa-claude-gpt) is running but connected to SQLite instead of Supabase.

**Manual Fix (5 minutes):**
1. Go to [Render Dashboard](https://dashboard.render.com) → `mcp-supa-claude-gpt` → Environment
2. Add these variables:
```bash
SUPABASE_URL=https://cxzllzyxwpyptfretryc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g
DATABASE_URL=postgresql://postgres:D@shb0ardPA$20226@db.cxzllzyxwpyptfretryc.supabase.co:5432/postgres
DB_BACKEND=supabase
```
3. Click **Save** → **Manual Deploy**
4. Verify: `curl https://mcp-sqlite-server-1.onrender.com/health`
   - Should show: `{"status":"ok","database":"supabase"}`

### 2. Update Start Command 🛠️
In Render → Settings → Start Command:
```bash
node dist/sqlite-http-server.js
```

## 📋 COMPLETE PLATFORM SETUP CHECKLIST

### A. MCP Infrastructure ✅

| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Deploy Reader MCP to Render | ✅ Done | DevOps | Running at mcp-sqlite-server-1.onrender.com |
| Fix SQLite → Supabase connection | 🔴 TODO | You | Add env vars above |
| Configure NL-to-SQL flag | 🟡 Later | Platform | Add `--nl2sql` to enable text queries |
| Set up health monitoring | 🟡 Later | SRE | Add to Prometheus |

### B. Scout Dash Integration 🏗️

| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Run integration script | 🔴 TODO | Dev | `./integrate-scout-dash-monorepo.sh` |
| Push to suqi-db-app repo | 🔴 TODO | Dev | `cd ~/suqi-db-app && git push` |
| Configure scout_dash schema | ✅ Done | DBA | Schema exists in Supabase |
| Set up writer MCP (port 8891) | 🔴 TODO | Platform | In CI/CD pipeline |

### C. HRIS-FRIS Setup 📊

| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Clone agency-databank repo | 🔴 TODO | Dev | `git clone github.com/jgtolentino/agency-databank` |
| Run HRIS scaffold | 🔴 TODO | Dev | `./scaffold-hris-fris-fixed.sh` |
| Configure hr_admin schema | 🔴 TODO | DBA | Create in Supabase |
| Configure financial_ops schema | 🔴 TODO | DBA | Create in Supabase |
| Set up writer MCPs (8893, 8894) | 🔴 TODO | Platform | In CI/CD pipeline |

### D. KeyKey Secret Management 🔐

| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Create Doppler project | 🔴 TODO | DevOps | `tbwa-platform` |
| Add global secrets | 🔴 TODO | DevOps | See list below |
| Configure env-sync workflow | 🔴 TODO | DevOps | `.github/workflows/env-sync.yml` |
| Test secret rotation | 🔴 TODO | QA | Verify auto-propagation |

**Required Doppler Secrets:**
```yaml
# Global
SUPABASE_URL: https://cxzllzyxwpyptfretryc.supabase.co
KEYKEY_API_KEY: <your-keykey-api-key>
RENDER_API_KEY: <your-render-api-key>

# Scout Dashboard
SCOUT_SERVICE_KEY: <service-role-key>
SCOUT_ANON_KEY: <anon-key>
RENDER_SERVICE_ID_SCOUT: <render-service-id>

# HRIS-FRIS
HR_SERVICE_KEY: <hr-service-key>
HR_ANON_KEY: <hr-anon-key>
FIN_SERVICE_KEY: <finance-service-key>
FIN_ANON_KEY: <finance-anon-key>
RENDER_SERVICE_ID_HRIS: <render-service-id>
```

### E. Pulser CLI Integration 🤖

| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Run Pulser setup | ✅ Done | Platform | 7 agents created |
| Test :scout queries | 🔴 TODO | Dev | After MCP fix |
| Test :hr queries | 🔴 TODO | Dev | After schema setup |
| Test :fin queries | 🔴 TODO | Dev | After schema setup |
| Document usage | ✅ Done | Docs | `PULSER_USAGE.md` |

### F. CI/CD Pipeline Setup 🚀

| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Create shared workflows | 🔴 TODO | Platform | `.github/workflows/*.yml` |
| Test Scout deployment | 🔴 TODO | QA | Push to main |
| Test HRIS deployment | 🔴 TODO | QA | Push to main |
| Set up monitoring | 🔴 TODO | SRE | Deployment alerts |

### G. Documentation 📚

| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Platform architecture | ✅ Done | Docs | `enterprise_data_platform_diagram.md` |
| Integration guides | ✅ Done | Docs | Multiple guides created |
| API documentation | 🔴 TODO | Dev | OpenAPI specs |
| User guides | 🔴 TODO | Docs | For analysts |

## 🎯 QUICK START COMMANDS

### 1. Fix MCP Reader (Right Now!)
```bash
# Test current status
curl https://mcp-sqlite-server-1.onrender.com/health

# After adding env vars, test again
curl https://mcp-sqlite-server-1.onrender.com/health
# Should show: {"status":"ok","database":"supabase"}

# Test with Pulser
:supa "SELECT 1 as ok"
```

### 2. Deploy Scout Dash
```bash
cd ~/bolt-app-hack
./integrate-scout-dash-monorepo.sh
cd ~/suqi-db-app
git add .
git commit -m "feat: integrate Scout Dash 3.0"
git push origin main
```

### 3. Deploy HRIS-FRIS
```bash
cd ~/bolt-app-hack
./scaffold-hris-fris-fixed.sh
cd ~/agency-databank/hris-fris
git add .
git commit -m "feat: scaffold HRIS-FRIS system"
git push origin main
```

## 📊 Architecture Summary

```
                    TBWA Enterprise Data Platform
┌─────────────┬──────────┬──────────────┬──────────────┬─────────────┐
│ Scout Dash  │ HR Admin │ Finance Ops  │ Operations   │ Corporate   │
└─────────────┴──────────┴──────────────┴──────────────┴─────────────┘
                                │
                Supabase PostgreSQL (Single Cluster)
        ┌─────────────┬──────────┬──────────────┬────────────┐
        │ scout_dash  │ hr_admin │ financial_ops│ operations │
        └─────────────┴──────────┴──────────────┴────────────┘
                                │
                    MCP Reader (Port 8888) ← FIX THIS!
                    ┌──────────┴──────────┐
                    │                     │
                Claude              Pulser/ChatGPT
```

## ⏰ Timeline

- **Today**: Fix MCP connection, test Pulser
- **Tomorrow**: Deploy Scout Dash, set up KeyKey
- **This Week**: Complete HRIS-FRIS, full CI/CD
- **Next Week**: Add remaining schemas, documentation

## 🚨 CRITICAL PATH

1. **Fix MCP Reader NOW** - Everything depends on this
2. **Set up KeyKey** - Enables automated deployments
3. **Deploy Scout Dash** - First production project
4. **Deploy HRIS-FRIS** - Proves multi-schema pattern

## 📞 Support Contacts

- **Supabase Issues**: support@supabase.io
- **Render Issues**: support@render.com
- **KeyKey/Doppler**: docs.doppler.com
- **Internal**: #platform-engineering on Slack

---

**Remember**: The MCP reader connection is the foundation. Fix that first, then everything else follows! 🚀