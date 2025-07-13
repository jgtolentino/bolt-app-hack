import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

interface ExecuteToolRequest {
  agent_id: string
  tool: string
  arguments: Record<string, any>
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

    const { agent_id, tool, arguments: toolArgs } = await req.json() as ExecuteToolRequest

    // Validate required fields
    if (!agent_id || !tool) {
      return new Response(
        JSON.stringify({ 
          jsonrpc: '2.0',
          error: { 
            code: -32602, 
            message: 'Invalid params: agent_id and tool are required' 
          }
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Log the tool call for auditing
    await supabaseClient.rpc('mcp_log_message', {
      p_conversation_id: crypto.randomUUID(),
      p_agent_id: agent_id,
      p_message_type: 'tool_call',
      p_role: 'system',
      p_content: `Executing tool: ${tool}`,
      p_metadata: { tool, arguments: toolArgs },
      p_tool_calls: [{
        id: crypto.randomUUID(),
        name: tool,
        arguments: toolArgs
      }]
    })

    // Execute the tool via RPC
    const { data, error } = await supabaseClient.rpc('mcp_execute_tool', {
      p_agent_id: agent_id,
      p_tool_name: tool,
      p_input: toolArgs || {}
    })

    if (error) {
      console.error('Error executing tool:', error)
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
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2)
            }
          ],
          isError: data?.success === false
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