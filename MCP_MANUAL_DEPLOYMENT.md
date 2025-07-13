# 🚀 MCP Server Manual Deployment Guide

## Option 1: Run the Automated Script

```bash
./scripts/deploy-mcp-server.sh
```

When prompted, paste your database password from:
https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/settings/database

## Option 2: Manual Step-by-Step Deployment

If the script doesn't work or you prefer manual control, run these commands:

### 1️⃣ Deploy Database Migrations

```bash
# This will prompt for your database password
supabase db push
```

Password location: https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/settings/database

### 2️⃣ Deploy Edge Functions

Deploy each function individually:

```bash
# Deploy MCP edge functions
supabase functions deploy mcp-register-agent
supabase functions deploy mcp-store-context  
supabase functions deploy mcp-execute-tool
supabase functions deploy mcp-send-message
```

### 3️⃣ Verify Deployment

After deployment, run these tests:

```bash
# Check database tables and functions
npx tsx src/test-mcp-database.ts

# Test connection
npx tsx src/test-supabase-connection.ts

# Full integration test
npx tsx src/test-mcp-integration.ts
```

## Expected Results After Deployment

### Database Test Output:
```
✅ mcp_agents: Table exists
✅ mcp_contexts: Table exists
✅ mcp_tools: Table exists
✅ mcp_messages: Table exists
✅ mcp_resources: Table exists
✅ mcp_prompts: Table exists
✅ RPC functions: Working
✅ mcp-register-agent: Deployed
✅ mcp-store-context: Deployed
✅ mcp-execute-tool: Deployed
✅ mcp-send-message: Deployed
```

### Integration Test Output:
```
✅ Claudia initialized
✅ Gagambi initialized
✅ KeyKey initialized
✅ Context stored
✅ Context retrieved
✅ Request routed
✅ All tests completed successfully!
```

## 🔧 Troubleshooting

### "password authentication failed"
- Make sure you're using the database password, not the dashboard password
- Get it from: Settings → Database → Connection string → [password]

### "permission denied for schema public"
- This might happen if RLS is too restrictive
- Try using the service role key for initial setup

### "function does not exist" 
- Make sure migrations deployed successfully
- Check for errors in: supabase db push output

### Edge function errors
- Check logs at: https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/logs/edge-logs
- Ensure Deno is installed if deploying locally

## 📝 Post-Deployment 

Once deployed, create the agent status file:

```yaml
# mcp-agent-status.yaml
agents:
  claudia:
    status: active
    mcp_compatible: true
    initialized_at: 2024-07-02T20:00:00Z
    capabilities:
      - routing
      - orchestration
  gagambi:
    status: active
    mcp_compatible: true
    capabilities:
      - data_enrichment
      - analytics
  keykey:
    status: active
    mcp_compatible: true
    capabilities:
      - authentication
      - security
```

Your MCP server is now ready for production use! 🎉