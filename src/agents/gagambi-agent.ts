import { MCPClient } from '../lib/mcp-client'

/**
 * Gagambi Agent - Data enrichment and analytics specialist
 * Handles data queries, enrichment, and batch processing
 */
export class GagambiAgent {
  private mcp: MCPClient

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.mcp = new MCPClient({
      supabaseUrl,
      supabaseKey,
      agentName: 'gagambi'
    })
  }

  async initialize() {
    await this.mcp.initialize(
      'Data enrichment and analytics agent for complex data operations',
      'enrichment'
    )
  }

  /**
   * Process data enrichment request
   */
  async processDataRequest(
    conversationId: string,
    request: any
  ): Promise<any> {
    // Log incoming request
    await this.mcp.logMessage(
      conversationId,
      'system',
      `Processing data request from ${request.requester}`,
      { request_type: 'data_enrichment' }
    )

    // Store processing context
    await this.mcp.storeContext(
      `data_request:${conversationId}`,
      'task',
      {
        request,
        status: 'processing',
        started_at: new Date().toISOString()
      }
    )

    try {
      // Execute data query
      const queryResult = await this.mcp.executeTool('query_data', {
        table: 'transactions',
        filters: this.extractFilters(request.request)
      })

      // Generate insights if data found
      if (queryResult.content[0]?.text) {
        const data = JSON.parse(queryResult.content[0].text)
        
        if (data.length > 0) {
          const insightResult = await this.mcp.executeTool('generate_insight', {
            data,
            analysis_type: 'trend'
          })

          // Update context with results
          await this.mcp.storeContext(
            `data_request:${conversationId}`,
            'task',
            {
              request,
              status: 'completed',
              results: {
                record_count: data.length,
                insight: insightResult.content[0]?.text
              },
              completed_at: new Date().toISOString()
            }
          )

          // Send results back to requester
          await this.mcp.sendMessage(
            request.requester,
            'data_response',
            {
              conversation_id: conversationId,
              success: true,
              data: {
                records: data.length,
                insight: insightResult.content[0]?.text,
                summary: this.generateSummary(data)
              }
            }
          )

          return {
            success: true,
            message: 'Data processed successfully',
            recordCount: data.length
          }
        }
      }

      // No data found
      await this.mcp.sendMessage(
        request.requester,
        'data_response',
        {
          conversation_id: conversationId,
          success: false,
          message: 'No data found matching the criteria'
        }
      )

      return {
        success: false,
        message: 'No data found'
      }

    } catch (error) {
      // Log error
      await this.mcp.logMessage(
        conversationId,
        'system',
        `Error processing data request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error: true }
      )

      // Update context with error
      await this.mcp.storeContext(
        `data_request:${conversationId}`,
        'task',
        {
          request,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          failed_at: new Date().toISOString()
        }
      )

      throw error
    }
  }

  /**
   * Extract filters from natural language request
   */
  private extractFilters(request: string): Record<string, any> {
    const filters: Record<string, any> = {}
    
    // Simple pattern matching - in production, use NLP
    if (/today|daily/.test(request.toLowerCase())) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      filters.created_at = { gte: today.toISOString() }
    }
    
    if (/this week|weekly/.test(request.toLowerCase())) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)
      filters.created_at = { gte: weekStart.toISOString() }
    }

    // Extract numeric limits
    const limitMatch = request.match(/(\d+)\s*(records?|items?|results?)/i)
    if (limitMatch) {
      filters.limit = parseInt(limitMatch[1])
    } else {
      filters.limit = 100 // Default limit
    }

    return filters
  }

  /**
   * Generate summary from data
   */
  private generateSummary(data: any[]): string {
    if (!data || data.length === 0) {
      return 'No data to summarize'
    }

    // Calculate basic statistics
    const totalAmount = data.reduce((sum, item) => sum + (item.amount || 0), 0)
    const avgAmount = totalAmount / data.length

    return `Processed ${data.length} records with total amount: $${totalAmount.toFixed(2)}, average: $${avgAmount.toFixed(2)}`
  }

  /**
   * Batch process multiple data requests
   */
  async batchProcess(requests: any[]): Promise<any[]> {
    const results = []
    
    for (const request of requests) {
      try {
        const result = await this.processDataRequest(
          request.conversation_id,
          request
        )
        results.push(result)
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Processing failed'
        })
      }
    }

    return results
  }
}