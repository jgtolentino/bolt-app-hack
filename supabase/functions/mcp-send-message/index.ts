import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

interface SendMessageRequest {
  from_agent_id: string
  to_agent: string
  message_type: string
  payload: Record<string, any>
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
      from_agent_id, 
      to_agent, 
      message_type, 
      payload 
    } = await req.json() as SendMessageRequest

    // Validate required fields
    if (!from_agent_id || !to_agent || !message_type || !payload) {
      return new Response(
        JSON.stringify({ 
          jsonrpc: '2.0',
          error: { 
            code: -32602, 
            message: 'Invalid params: all fields are required' 
          }
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Send message via RPC
    const { data: messageId, error } = await supabaseClient.rpc('mcp_send_agent_message', {
      p_from_agent_id: from_agent_id,
      p_to_agent_name: to_agent,
      p_message_type: message_type,
      p_payload: payload
    })

    if (error) {
      console.error('Error sending message:', error)
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
          message_id: messageId,
          status: 'sent',
          sent_at: new Date().toISOString()
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