# 📋 MCP Server Final Setup TODO

## ✅ Completed Tasks
- [x] Database schema deployed (8 tables)
- [x] RPC functions deployed (13 functions)
- [x] Initial 5 agents registered (Claudia, Gagambi, KeyKey, Iggy, Tess)
- [x] Sample tools configured (3 tools)

## 🔧 Remaining Tasks

### 1. Fix RLS Policy (2 minutes)
- [ ] Go to: https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/sql
- [ ] Copy content from `fix-mcp-messages-rls.sql`
- [ ] Paste and run in SQL editor
- [ ] Verify no errors

### 2. Deploy Edge Functions (10 minutes)
Go to: https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/functions

- [ ] **Function 1: mcp-register-agent**
  - Click "New function"
  - Name: `mcp-register-agent`
  - Copy code from: `supabase/functions/mcp-register-agent/index.ts`
  - Deploy

- [ ] **Function 2: mcp-store-context**
  - Click "New function"
  - Name: `mcp-store-context`
  - Copy code from: `supabase/functions/mcp-store-context/index.ts`
  - Deploy

- [ ] **Function 3: mcp-execute-tool**
  - Click "New function"
  - Name: `mcp-execute-tool`
  - Copy code from: `supabase/functions/mcp-execute-tool/index.ts`
  - Deploy

- [ ] **Function 4: mcp-send-message**
  - Click "New function"
  - Name: `mcp-send-message`
  - Copy code from: `supabase/functions/mcp-send-message/index.ts`
  - Deploy

### 3. Test Basic MCP Functions (2 minutes)
- [ ] Run: `npx tsx src/test-mcp-integration.ts`
- [ ] Verify all tests pass
- [ ] Check for any errors

### 4. Register All 66 Agents (5 minutes)
- [ ] Create `src/agents/all_agents.json` with full agent list
- [ ] Create `src/mcp/register-all-agents.ts` script
- [ ] Run: `npx tsx src/mcp/register-all-agents.ts`
- [ ] Verify all 66 agents registered

### 5. Final Verification (2 minutes)
- [ ] Run: `npx tsx src/check-mcp-agents.ts`
- [ ] Confirm 66 agents listed
- [ ] Generate final `mcp-agent-status.yaml`

## 📊 Progress Tracker

| Task | Status | Time | Notes |
|------|--------|------|-------|
| Database | ✅ Done | - | All tables created |
| RLS Fix | ⏳ Todo | 2 min | Run SQL patch |
| Edge Functions | ⏳ Todo | 10 min | Deploy 4 functions |
| Test MCP | ⏳ Todo | 2 min | Verify integration |
| Register 66 Agents | ⏳ Todo | 5 min | Bulk registration |
| Final Check | ⏳ Todo | 2 min | Status report |

**Total Time Needed: ~21 minutes**

## 🚀 Quick Commands Reference

```bash
# After edge functions deployed:
npx tsx src/test-mcp-integration.ts

# Register all agents:
npx tsx src/mcp/register-all-agents.ts

# Check final status:
npx tsx src/check-mcp-agents.ts
```

## 📝 Files to Create

1. **src/agents/all_agents.json** - Full list of 66 agents
2. **src/mcp/register-all-agents.ts** - Bulk registration script

## 🎯 Success Criteria

- All edge functions return 200 status
- Integration test passes without errors
- 66 agents show in agent list
- No RLS policy errors in logs