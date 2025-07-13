# 🚀 MCP Server Deployment Quick Start

## Prerequisites

1. **Supabase CLI** installed ([installation guide](https://supabase.com/docs/guides/cli))
2. **Database password** from [Supabase Dashboard](https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/settings/database)
3. **API keys** from [API Settings](https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/settings/api)

## Step 1: Deploy Everything

Run the deployment script:

```bash
./scripts/deploy-mcp-server.sh
```

This will:
- Deploy database migrations (schema, RPC functions, RLS policies)
- Deploy 4 edge functions for MCP operations
- Prompt you for your database password

## Step 2: Get Your Credentials

1. Go to [API Settings](https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/settings/api)
2. Copy:
   - **Project URL**: `https://baqlxgwdfjltivlfmsbr.supabase.co`
   - **Anon/Public Key**: `eyJ...` (the long one)

3. Update your `.env`:
```env
VITE_SUPABASE_URL=https://baqlxgwdfjltivlfmsbr.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 3: Test the Integration

Run the test script:

```bash
npm run dev # Start your dev server first
npx tsx src/test-mcp-integration.ts
```

Expected output:
```
🧪 Testing MCP Server Integration
=================================

1️⃣ Initializing agents...
✅ Claudia initialized
✅ Gagambi initialized
✅ KeyKey initialized

2️⃣ Testing context storage...
✅ Context stored
✅ Context retrieved: { test: true, ... }

3️⃣ Testing conversation flow...
✅ Request routed: I've forwarded your request...

✅ All tests completed successfully!
```

## Step 4: Use in Your Application

```typescript
import { ClaudiaAgent } from './agents/claudia-agent'

// Initialize once
const claudia = new ClaudiaAgent(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)
await claudia.initialize()

// Use throughout your app
const response = await claudia.routeRequest(
  userMessage,
  conversationId
)
```

## Verify Deployment

### Check Database Tables
Go to [Table Editor](https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/editor) and verify these tables exist:
- `mcp_agents` (should have 5 pre-seeded agents)
- `mcp_contexts`
- `mcp_tools` (should have 3 sample tools)
- `mcp_messages`
- `mcp_resources`
- `mcp_prompts`

### Check Edge Functions
Go to [Edge Functions](https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/functions) and verify:
- `mcp-register-agent` ✅
- `mcp-store-context` ✅
- `mcp-execute-tool` ✅
- `mcp-send-message` ✅

### Monitor Logs
- [Edge Function Logs](https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/logs/edge-logs)
- [Database Logs](https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/logs/postgres-logs)

## Troubleshooting

### "Migrations failed"
- Ensure you have the correct database password
- Check if you're connected to the right project

### "Edge function not found"
- Deploy functions individually:
  ```bash
  supabase functions deploy mcp-register-agent
  supabase functions deploy mcp-store-context
  supabase functions deploy mcp-execute-tool
  supabase functions deploy mcp-send-message
  ```

### "Permission denied"
- RLS policies might be too restrictive
- Use service role key for admin operations
- Check agent permissions in `mcp_agent_tools` table

### "Tool execution failed"
- Ensure the agent has permission for the tool
- Check `mcp_tools` and `mcp_agent_tools` tables
- View error details in edge function logs

## 🎉 Success!

Your MCP server is now live and ready to power your Pulser agents. The agents can:
- 🤖 Register and manage themselves
- 💾 Store and share context
- 🔧 Execute tools with permissions
- 💬 Communicate with each other
- 🔒 Enforce security policies

Happy agent orchestration! 🚀