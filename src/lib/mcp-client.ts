import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface MCPClientConfig {
  supabaseUrl: string
  supabaseKey: string
  agentName: string
  agentDescription?: string
  category?: 'qa' | 'dashboard' | 'enrichment' | 'system'
}

interface MCPResponse<T = any> {
  jsonrpc: '2.0'
  result?: T
  error?: {
    code: number
    message: string
    data?: any
  }
}

interface ToolCallResult {
  content: Array<{
    type: 'text' | 'image'
    text?: string
    data?: string
    mimeType?: string
  }>
  isError?: boolean
}

export class MCPClient {
  private supabase: SupabaseClient
  private agentId?: string
  private agentName: string

  constructor(config: MCPClientConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey)
    this.agentName = config.agentName
  }

  /**
   * Initialize the agent with the MCP server
   */
  async initialize(description?: string, category?: string): Promise<void> {
    const { data, error } = await this.supabase.functions.invoke('mcp-register-agent', {
      body: {
        name: this.agentName,
        description: description || `${this.agentName} agent`,
        category: category || 'system',
        capabilities: {
          mcp_version: '1.0',
          supports_tools: true,
          supports_context: true
        }
      }
    })

    if (error) {
      throw new Error(`Failed to register agent: ${error.message}`)
    }

    const response = data as MCPResponse
    if (response.error) {
      throw new Error(`MCP Error: ${response.error.message}`)
    }

    this.agentId = response.result?.agent_id
  }

  /**
   * Store context for later retrieval
   */
  async storeContext(
    contextId: string,
    contextType: 'conversation' | 'task' | 'session',
    data: Record<string, any>,
    options?: {
      tags?: string[]
      ttlMinutes?: number
    }
  ): Promise<void> {
    if (!this.agentId) {
      throw new Error('Agent not initialized')
    }

    const { data: responseData, error } = await this.supabase.functions.invoke('mcp-store-context', {
      body: {
        agent_id: this.agentId,
        context_id: contextId,
        context_type: contextType,
        data,
        tags: options?.tags,
        ttl_minutes: options?.ttlMinutes
      }
    })

    if (error) {
      throw new Error(`Failed to store context: ${error.message}`)
    }

    const response = responseData as MCPResponse
    if (response.error) {
      throw new Error(`MCP Error: ${response.error.message}`)
    }
  }

  /**
   * Retrieve stored context
   */
  async getContext(contextId: string): Promise<any> {
    const { data, error } = await this.supabase
      .rpc('mcp_get_context', {
        p_context_id: contextId,
        p_agent_id: this.agentId
      })

    if (error) {
      throw new Error(`Failed to get context: ${error.message}`)
    }

    return data?.[0]?.data || null
  }

  /**
   * Execute a tool with permission checking
   */
  async executeTool(
    toolName: string,
    args: Record<string, any>
  ): Promise<ToolCallResult> {
    if (!this.agentId) {
      throw new Error('Agent not initialized')
    }

    const { data, error } = await this.supabase.functions.invoke('mcp-execute-tool', {
      body: {
        agent_id: this.agentId,
        tool: toolName,
        arguments: args
      }
    })

    if (error) {
      throw new Error(`Failed to execute tool: ${error.message}`)
    }

    const response = data as MCPResponse<ToolCallResult>
    if (response.error) {
      throw new Error(`MCP Error: ${response.error.message}`)
    }

    return response.result!
  }

  /**
   * Send a message to another agent
   */
  async sendMessage(
    toAgent: string,
    messageType: string,
    payload: Record<string, any>
  ): Promise<string> {
    if (!this.agentId) {
      throw new Error('Agent not initialized')
    }

    const { data, error } = await this.supabase.functions.invoke('mcp-send-message', {
      body: {
        from_agent_id: this.agentId,
        to_agent: toAgent,
        message_type: messageType,
        payload
      }
    })

    if (error) {
      throw new Error(`Failed to send message: ${error.message}`)
    }

    const response = data as MCPResponse<{ message_id: string }>
    if (response.error) {
      throw new Error(`MCP Error: ${response.error.message}`)
    }

    return response.result!.message_id
  }

  /**
   * Log a message to conversation history
   */
  async logMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.agentId) {
      throw new Error('Agent not initialized')
    }

    const { error } = await this.supabase.rpc('mcp_log_message', {
      p_conversation_id: conversationId,
      p_agent_id: this.agentId,
      p_message_type: 'message',
      p_role: role,
      p_content: content,
      p_metadata: metadata || {}
    })

    if (error) {
      throw new Error(`Failed to log message: ${error.message}`)
    }
  }

  /**
   * Get conversation history
   */
  async getConversation(conversationId: string, limit = 100): Promise<any[]> {
    const { data, error } = await this.supabase
      .rpc('mcp_get_conversation', {
        p_conversation_id: conversationId,
        p_limit: limit
      })

    if (error) {
      throw new Error(`Failed to get conversation: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get agent statistics
   */
  async getStats(): Promise<any> {
    if (!this.agentId) {
      throw new Error('Agent not initialized')
    }

    const { data, error } = await this.supabase
      .rpc('mcp_get_agent_stats', {
        p_agent_id: this.agentId
      })

    if (error) {
      throw new Error(`Failed to get stats: ${error.message}`)
    }

    return data?.[0] || {}
  }
}

// Example usage for Pulser agents
export function createPulserAgent(
  agentName: string,
  supabaseUrl: string,
  supabaseKey: string
): MCPClient {
  return new MCPClient({
    supabaseUrl,
    supabaseKey,
    agentName
  })
}