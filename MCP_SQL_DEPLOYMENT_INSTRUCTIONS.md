# 🚀 MCP SQL Deployment - Fixed Version

## The Issue
The JSONB to TEXT[] casting error was because the `permissions` field was defined as JSONB but being used as TEXT[].

## Fixed Files Ready
I've created `MCP_DEPLOYMENT_FIXED.sql` with all corrections.

## Deploy via SQL Editor

1. **Open Supabase SQL Editor**: 
   https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/sql

2. **Create New Query**

3. **Copy and Paste**: 
   - Open `MCP_DEPLOYMENT_FIXED.sql` in your editor
   - Copy ALL content
   - Paste into SQL editor

4. **Run the Query**
   - Click "Run" button
   - Should see "Success" messages

## What Was Fixed

Changed:
```sql
permissions JSONB DEFAULT '[]'::jsonb
```

To:
```sql
permissions TEXT[] DEFAULT '{}'
```

This fixes the type mismatch error you encountered.

## After Deployment

1. **Check Tables Created**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name LIKE 'mcp_%';
   ```

2. **Verify Agents Seeded**:
   ```sql
   SELECT name, category FROM mcp_agents;
   ```

3. **Test from Terminal**:
   ```bash
   npx tsx src/test-mcp-integration.ts
   ```

## Edge Functions

After SQL deployment, deploy edge functions:
```bash
supabase functions deploy mcp-register-agent
supabase functions deploy mcp-store-context
supabase functions deploy mcp-execute-tool
supabase functions deploy mcp-send-message
```

Or create them manually in the dashboard:
https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/functions