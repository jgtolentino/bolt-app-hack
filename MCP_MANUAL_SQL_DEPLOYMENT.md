# 🚀 MCP Manual SQL Deployment

Since we're having connection issues, here's how to deploy manually via the Supabase Dashboard:

## Step 1: Open SQL Editor

1. Go to: https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/sql
2. Click "New query"

## Step 2: Run Migrations in Order

Copy and paste each migration file content into the SQL editor and run them in this order:

### 1️⃣ First Migration: Schema
- Open: `supabase/migrations/20250702_mcp_server_schema.sql`
- Copy entire content
- Paste in SQL editor
- Click "Run"

### 2️⃣ Second Migration: RPC Functions  
- Open: `supabase/migrations/20250702_mcp_rpc_functions.sql`
- Copy entire content
- Paste in SQL editor
- Click "Run"

### 3️⃣ Third Migration: RLS Policies
- Open: `supabase/migrations/20250702_mcp_rls_policies.sql`
- Copy entire content
- Paste in SQL editor
- Click "Run"

## Step 3: Deploy Edge Functions

Go to: https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/functions

For each function, click "New function" and:

1. **mcp-register-agent**
   - Name: `mcp-register-agent`
   - Copy code from: `supabase/functions/mcp-register-agent/index.ts`

2. **mcp-store-context**
   - Name: `mcp-store-context`
   - Copy code from: `supabase/functions/mcp-store-context/index.ts`

3. **mcp-execute-tool**
   - Name: `mcp-execute-tool`
   - Copy code from: `supabase/functions/mcp-execute-tool/index.ts`

4. **mcp-send-message**
   - Name: `mcp-send-message`
   - Copy code from: `supabase/functions/mcp-send-message/index.ts`

Also copy the shared files:
- `supabase/functions/_shared/cors.ts`
- `supabase/functions/_shared/mcp-schemas.ts`

## Step 4: Verify Deployment

After deployment, run:
```bash
npx tsx src/test-mcp-integration.ts
```

## Alternative: Export as Single SQL File

I can also create a single SQL file with all migrations combined if that's easier to run.