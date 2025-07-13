import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

interface StoreContextRequest {
  agent_id: string
  context_id: string
  context_type: 'conversation' | 'task' | 'session'
  data: Record<string, any>
  tags?: string[]
  ttl_minutes?: number
}

serve(async (req) => {
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

    const { 
      agent_id, 
      context_id, 
      context_type, 
      data, 
      tags = [], 
      ttl_minutes 
    } = await req.json() as StoreContextRequest

    // Validate required fields
    if (!agent_id || !context_id || !context_type || !data) {
      return new Response(
        JSON.stringify({ 
          jsonrpc: '2.0',
          error: { 
            code: -32602, 
            message: 'Invalid params: agent_id, context_id, context_type, and data are required' 
          }
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Call the RPC function
    const { data: contextId, error } = await supabaseClient.rpc('mcp_store_context', {
      p_agent_id: agent_id,
      p_context_id: context_id,
      p_context_type: context_type,
      p_data: data,
      p_tags: tags,
      p_ttl_minutes: ttl_minutes
    })

    if (error) {
      console.error('Error storing context:', error)
      return new Response(
        JSON.stringify({ 
          jsonrpc: '2.0',
          error: { 
            code: -32603, 
            message: error.message 
          }
        }),
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
          id: contextId,
          context_id,
          stored_at: new Date().toISOString(),
          expires_at: ttl_minutes 
            ? new Date(Date.now() + ttl_minutes * 60000).toISOString() 
            : null
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