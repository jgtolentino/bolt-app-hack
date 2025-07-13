# 🚀 Edge Functions - Quick Copy Guide

Copy these exactly as shown into the Supabase Functions dashboard:

## 1️⃣ First, Create Shared CORS File

**File:** `_shared/cors.ts`
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}
```

## 2️⃣ Function: mcp-register-agent

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { name, description, category = 'system', capabilities = {} } = await req.json()

    const { data, error } = await supabaseClient.rpc('mcp_register_agent', {
      p_name: name,
      p_description: description,
      p_category: category,
      p_capabilities: capabilities
    })

    if (error) throw error

    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        result: { agent_id: data, name, status: 'active' }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

## 3️⃣ Function: mcp-store-context

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { agent_id, context_id, context_type, data, tags = [], ttl_minutes } = await req.json()

    const { data: contextId, error } = await supabaseClient.rpc('mcp_store_context', {
      p_agent_id: agent_id,
      p_context_id: context_id,
      p_context_type: context_type,
      p_data: data,
      p_tags: tags,
      p_ttl_minutes: ttl_minutes
    })

    if (error) throw error

    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        result: { id: contextId, context_id, stored_at: new Date().toISOString() }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

## 4️⃣ Function: mcp-execute-tool

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { agent_id, tool, arguments: toolArgs } = await req.json()

    const { data, error } = await supabaseClient.rpc('mcp_execute_tool', {
      p_agent_id: agent_id,
      p_tool_name: tool,
      p_input: toolArgs || {}
    })

    if (error) throw error

    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        result: {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
          isError: data?.success === false
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

## 5️⃣ Function: mcp-send-message

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { from_agent_id, to_agent, message_type, payload } = await req.json()

    const { data: messageId, error } = await supabaseClient.rpc('mcp_send_agent_message', {
      p_from_agent_id: from_agent_id,
      p_to_agent_name: to_agent,
      p_message_type: message_type,
      p_payload: payload
    })

    if (error) throw error

    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        result: {
          message_id: messageId,
          status: 'sent',
          sent_at: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

## 📋 Deployment Checklist

- [ ] Go to: https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/functions
- [ ] Create function: `mcp-register-agent`
- [ ] Create function: `mcp-store-context`
- [ ] Create function: `mcp-execute-tool`
- [ ] Create function: `mcp-send-message`
- [ ] Test with: `npx tsx src/test-mcp-database.ts`

Each function should show "Active" status when deployed successfully! 🎉