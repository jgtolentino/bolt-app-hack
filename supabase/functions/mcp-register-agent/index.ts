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