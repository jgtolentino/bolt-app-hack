# 🚀 Edge Function Deployment - Step by Step

## Method 1: Via Supabase Dashboard (Recommended)

### Step 1: Open Functions Dashboard
Go to: https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/functions

### Step 2: Deploy Each Function

#### Function 1: mcp-register-agent
1. Click **"New function"**
2. Name: `mcp-register-agent`
3. Click **"Create function"**
4. In the code editor, **DELETE** the default code
5. **COPY** this code:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

interface RegisterAgentRequest {
  name: string
  description: string
  category?: 'qa' | 'dashboard' | 'enrichment' | 'system'
  capabilities?: Record<string, any>
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { name, description, category = 'system', capabilities = {} } = await req.json() as RegisterAgentRequest

    // Validate required fields
    if (!name || !description) {
      return new Response(
        JSON.stringify({ error: 'Name and description are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Call the RPC function
    const { data, error } = await supabaseClient.rpc('mcp_register_agent', {
      p_name: name,
      p_description: description,
      p_category: category,
      p_capabilities: capabilities
    })

    if (error) {
      console.error('Error registering agent:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Return MCP-compatible response
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        result: {
          agent_id: data,
          name,
          status: 'active',
          registered_at: new Date().toISOString()
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (err) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ 
        jsonrpc: '2.0',
        error: { 
          code: -32603, 
          message: 'Internal error',
          data: err instanceof Error ? err.message : 'Unknown error'
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

6. Click **"Save"**
7. Click **"Deploy"**
8. Wait for "Deployment successful" message

#### Function 2: mcp-store-context
1. Click **"New function"**
2. Name: `mcp-store-context`
3. **COPY** code from: `supabase/functions/mcp-store-context/index.ts`
4. **PASTE** in editor
5. Click **"Save"** then **"Deploy"**

#### Function 3: mcp-execute-tool
1. Click **"New function"**
2. Name: `mcp-execute-tool`
3. **COPY** code from: `supabase/functions/mcp-execute-tool/index.ts`
4. **PASTE** in editor
5. Click **"Save"** then **"Deploy"**

#### Function 4: mcp-send-message
1. Click **"New function"**
2. Name: `mcp-send-message`
3. **COPY** code from: `supabase/functions/mcp-send-message/index.ts`
4. **PASTE** in editor
5. Click **"Save"** then **"Deploy"**

### Step 3: Create Shared Files

In the dashboard, you'll also need to create the shared folder:

1. In any function, click on **"Files"** tab
2. Create folder: `_shared`
3. Create file: `_shared/cors.ts`
4. **PASTE** this:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}
```

## Method 2: Via Supabase CLI (If Dashboard Not Working)

If the dashboard method isn't working, try:

```bash
# Login first
supabase login

# Link to project
supabase link --project-ref baqlxgwdfjltivlfmsbr

# Deploy functions one by one
supabase functions deploy mcp-register-agent --no-verify-jwt
supabase functions deploy mcp-store-context --no-verify-jwt
supabase functions deploy mcp-execute-tool --no-verify-jwt
supabase functions deploy mcp-send-message --no-verify-jwt
```

## 🧪 Verify Deployment

After deploying all 4 functions:

```bash
# Test that functions are deployed
npx tsx src/test-mcp-database.ts
```

You should see:
```
✅ mcp-register-agent: Deployed
✅ mcp-store-context: Deployed
✅ mcp-execute-tool: Deployed
✅ mcp-send-message: Deployed
```

## 🎯 Success Indicators

In the Functions dashboard, you should see:
- 4 functions listed
- Each showing "Active" status
- Green checkmarks next to each

## ⚠️ Common Issues

### "Function already exists"
- That's OK! It means it's already deployed
- You can click on it and update the code if needed

### "Deployment failed"
- Check for syntax errors in the code
- Make sure you copied the ENTIRE code block
- Try deploying again

### "Cannot find module '../_shared/cors.ts'"
- Make sure you created the `_shared/cors.ts` file
- Or remove the import and add `const corsHeaders = { ... }` directly in each function

## 📝 Notes

- Each function takes about 30-60 seconds to deploy
- You can deploy them in parallel (open 4 tabs)
- The dashboard auto-saves but you must click "Deploy" to make it live

Once all 4 are deployed, your MCP server will be fully operational! 🎉