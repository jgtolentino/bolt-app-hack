import { MCPClient } from '../lib/mcp-client'

/**
 * Claudia Agent - Claude-powered assistant for complex tasks
 * Primary router and orchestrator for the Pulser system
 */
export class ClaudiaAgent {
  private mcp: MCPClient

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.mcp = new MCPClient({
      supabaseUrl,
      supabaseKey,
      agentName: 'claudia'
    })
  }

  async initialize() {
    await this.mcp.initialize(
      'Claude-powered assistant for complex tasks and agent orchestration',
      'system'
    )
  }

  /**
   * Route a user request to the appropriate agent
   */
  async routeRequest(
    userMessage: string,
    conversationId: string
  ): Promise<string> {
    // Log the incoming request
    await this.mcp.logMessage(
      conversationId,
      'user',
      userMessage,
      { source: 'user_input' }
    )

    // Store conversation context
    await this.mcp.storeContext(
      `conversation:${conversationId}`,
      'conversation',
      {
        last_message: userMessage,
        timestamp: new Date().toISOString()
      },
      { ttlMinutes: 60 }
    )

    // Analyze request to determine routing
    const analysis = await this.analyzeRequest(userMessage)
    
    // Route to appropriate agent
    if (analysis.requiresData) {
      return await this.delegateToGagambi(conversationId, userMessage)
    } else if (analysis.requiresTesting) {
      return await this.delegateToTess(conversationId, userMessage)
    } else if (analysis.requiresAuth) {
      return await this.delegateToKeyKey(conversationId, userMessage)
    } else {
      // Handle directly
      return await this.handleDirectly(conversationId, userMessage)
    }
  }

  private async analyzeRequest(message: string): Promise<{
    requiresData: boolean
    requiresTesting: boolean
    requiresAuth: boolean
  }> {
    // Simple keyword analysis - in production, use Claude API
    const lowerMessage = message.toLowerCase()
    
    return {
      requiresData: /data|analytics|enrichment|database/.test(lowerMessage),
      requiresTesting: /test|qa|quality|bug/.test(lowerMessage),
      requiresAuth: /auth|security|login|permission/.test(lowerMessage)
    }
  }

  private async delegateToGagambi(
    conversationId: string,
    message: string
  ): Promise<string> {
    // Send message to Gagambi agent
    const messageId = await this.mcp.sendMessage(
      'gagambi',
      'data_request',
      {
        conversation_id: conversationId,
        request: message,
        requester: 'claudia'
      }
    )

    // Log the delegation
    await this.mcp.logMessage(
      conversationId,
      'system',
      'Delegating to Gagambi for data enrichment',
      { message_id: messageId }
    )

    return 'I\'ve forwarded your request to our data specialist Gagambi. They will analyze your data requirements.'
  }

  private async delegateToTess(
    conversationId: string,
    message: string
  ): Promise<string> {
    const messageId = await this.mcp.sendMessage(
      'tess',
      'test_request',
      {
        conversation_id: conversationId,
        request: message,
        requester: 'claudia'
      }
    )

    await this.mcp.logMessage(
      conversationId,
      'system',
      'Delegating to Tess for QA analysis',
      { message_id: messageId }
    )

    return 'I\'ve sent your request to Tess, our QA specialist. They will help with testing requirements.'
  }

  private async delegateToKeyKey(
    conversationId: string,
    message: string
  ): Promise<string> {
    const messageId = await this.mcp.sendMessage(
      'keykey',
      'auth_request',
      {
        conversation_id: conversationId,
        request: message,
        requester: 'claudia'
      }
    )

    await this.mcp.logMessage(
      conversationId,
      'system',
      'Delegating to KeyKey for security analysis',
      { message_id: messageId }
    )

    return 'I\'ve forwarded your security-related request to KeyKey, our authentication specialist.'
  }

  private async handleDirectly(
    conversationId: string,
    _message: string
  ): Promise<string> {
    // Execute general query tool
    const result = await this.mcp.executeTool('query_data', {
      table: 'transactions',
      filters: { limit: 10 }
    })

    // Log response
    await this.mcp.logMessage(
      conversationId,
      'assistant',
      result.content[0]?.text || 'No data found',
      { tool_used: 'query_data' }
    )

    return 'I\'ve processed your request. ' + (result.content[0]?.text || 'No specific data was required.')
  }

  /**
   * Get agent statistics
   */
  async getStats() {
    return await this.mcp.getStats()
  }
}