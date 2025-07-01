/**
 * Query Orchestrator - Central intelligence for routing and processing queries
 * Coordinates between RAG engine, AI insights, and data services
 */

import { ragEngine, RAGResponse, QueryIntent } from './rag-engine';
import { adsbotService } from './adsbot-runtime';
import { useFilterStore } from '../features/filters/filterStore';

export interface QueryRequest {
  query: string;
  context?: 'dashboard' | 'chat' | 'alert' | 'automation';
  filters?: Record<string, any>;
  user_intent?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface QueryResponse {
  type: 'sql_result' | 'ai_insight' | 'visualization' | 'alert' | 'hybrid';
  data?: any[];
  insight?: string;
  visualization_config?: any;
  sql_executed?: string;
  confidence: number;
  processing_time: number;
  fallback_used?: boolean;
  next_suggestions?: string[];
}

export interface QueryRoute {
  condition: (query: string, intent: QueryIntent) => boolean;
  handler: (request: QueryRequest) => Promise<QueryResponse>;
  description: string;
  examples: string[];
}

/**
 * Main Query Orchestrator Class
 */
export class QueryOrchestrator {
  private routes: QueryRoute[] = [];
  private queryHistory: Array<{ query: string; response: QueryResponse; timestamp: Date }> = [];
  private performanceMetrics = {
    totalQueries: 0,
    avgProcessingTime: 0,
    successRate: 0,
    fallbackRate: 0
  };

  constructor() {
    this.setupRoutes();
  }

  /**
   * Main query processing entry point
   */
  async processQuery(request: QueryRequest): Promise<QueryResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Enrich request with current filters if not provided
      const enrichedRequest = await this.enrichRequest(request);
      
      // 2. Get intent classification from RAG engine
      const ragResponse = await ragEngine.queryToSQL(enrichedRequest.query, enrichedRequest.filters);
      
      // 3. Route to appropriate handler
      const route = this.findRoute(enrichedRequest.query, ragResponse.intent);
      
      // 4. Execute handler
      const response = await route.handler(enrichedRequest);
      
      // 5. Post-process and add metadata
      const finalResponse = await this.postProcessResponse(response, ragResponse, startTime);
      
      // 6. Update metrics and history
      this.updateMetrics(finalResponse, startTime);
      this.addToHistory(enrichedRequest.query, finalResponse);
      
      return finalResponse;
    } catch (error) {
      console.error('Query orchestration failed:', error);
      
      // Return fallback response
      const fallbackResponse: QueryResponse = {
        type: 'ai_insight',
        insight: 'Sorry, I encountered an error processing your query. Please try rephrasing your question.',
        confidence: 0.1,
        processing_time: Date.now() - startTime,
        fallback_used: true
      };
      
      this.updateMetrics(fallbackResponse, startTime);
      return fallbackResponse;
    }
  }

  /**
   * Setup routing rules for different query types
   */
  private setupRoutes(): void {
    // SQL Data Query Route
    this.routes.push({
      condition: (query, intent) => 
        intent.type === 'analytical' && 
        (intent.metrics.length > 0 || query.includes('data') || query.includes('show')),
      handler: this.handleSQLQuery.bind(this),
      description: 'Execute SQL queries for data retrieval and analysis',
      examples: [
        'Show me daily sales for the last 30 days',
        'What are the top 10 products by revenue?',
        'Regional performance breakdown'
      ]
    });

    // AI Insight Route
    this.routes.push({
      condition: (query, intent) => 
        intent.type === 'predictive' || 
        query.includes('why') || 
        query.includes('what if') ||
        query.includes('recommend'),
      handler: this.handleAIInsight.bind(this),
      description: 'Generate AI-powered insights and recommendations',
      examples: [
        'Why are sales declining in Region X?',
        'What if we increase prices by 10%?',
        'Recommend products for cross-selling'
      ]
    });

    // Alert/Operational Route
    this.routes.push({
      condition: (query, intent) => 
        intent.type === 'operational' ||
        query.includes('alert') ||
        query.includes('problem') ||
        query.includes('issue'),
      handler: this.handleOperationalQuery.bind(this),
      description: 'Process operational queries and alerts',
      examples: [
        'Show me current alerts',
        'What issues need immediate attention?',
        'Stock level problems'
      ]
    });

    // Comparison Route
    this.routes.push({
      condition: (query, intent) => 
        intent.type === 'comparative' ||
        query.includes('vs') ||
        query.includes('compare') ||
        query.includes('difference'),
      handler: this.handleComparisonQuery.bind(this),
      description: 'Handle comparative analysis queries',
      examples: [
        'Compare JTI vs Philip Morris sales',
        'NCR vs Mindanao performance',
        'This month vs last month'
      ]
    });

    // Hybrid Route (default fallback)
    this.routes.push({
      condition: () => true, // Always matches (fallback)
      handler: this.handleHybridQuery.bind(this),
      description: 'Hybrid approach combining SQL and AI insights',
      examples: ['General queries that need both data and insights']
    });
  }

  /**
   * Find the best route for a query
   */
  private findRoute(query: string, intent: QueryIntent): QueryRoute {
    return this.routes.find(route => route.condition(query, intent)) || this.routes[this.routes.length - 1];
  }

  /**
   * Enrich request with current dashboard context
   */
  private async enrichRequest(request: QueryRequest): Promise<QueryRequest> {
    // Get current filters from dashboard if not provided
    if (!request.filters && request.context === 'dashboard') {
      try {
        const filterStore = useFilterStore.getState();
        request.filters = {
          dateRange: filterStore.dateRange,
          region: filterStore.selectedRegions,
          brand: filterStore.selectedBrands,
          storeType: filterStore.selectedStoreTypes
        };
      } catch (error) {
        console.warn('Could not get current filters:', error);
      }
    }

    return request;
  }

  /**
   * Handle SQL-focused queries
   */
  private async handleSQLQuery(request: QueryRequest): Promise<QueryResponse> {
    const ragResponse = await ragEngine.queryToSQL(request.query, request.filters);
    
    try {
      const data = await ragEngine.executeQuery(ragResponse.sql);
      
      return {
        type: 'sql_result',
        data,
        sql_executed: ragResponse.sql,
        confidence: ragResponse.confidence,
        processing_time: 0, // Will be set in post-processing
        next_suggestions: this.generateSuggestions(request.query, 'sql_result')
      };
    } catch (error) {
      console.error('SQL execution failed:', error);
      
      // Fallback to AI insight
      const aiResponse = await adsbotService.query({
        prompt: `The user asked: "${request.query}". I couldn't execute the SQL query. Please provide insights based on general retail analytics knowledge.`,
        context: 'fallback',
        filters: request.filters
      });
      
      return {
        type: 'ai_insight',
        insight: aiResponse.response,
        confidence: 0.6,
        processing_time: 0,
        fallback_used: true
      };
    }
  }

  /**
   * Handle AI insight queries
   */
  private async handleAIInsight(request: QueryRequest): Promise<QueryResponse> {
    const aiResponse = await adsbotService.query({
      prompt: request.query,
      context: request.context || 'chat',
      filters: request.filters
    });

    return {
      type: 'ai_insight',
      insight: aiResponse.response,
      confidence: aiResponse.confidence || 0.8,
      processing_time: 0,
      next_suggestions: this.generateSuggestions(request.query, 'ai_insight')
    };
  }

  /**
   * Handle operational/alert queries
   */
  private async handleOperationalQuery(request: QueryRequest): Promise<QueryResponse> {
    // Mock alert data - in production, this would come from your monitoring system
    const alerts = [
      {
        type: 'critical',
        message: 'Milo 300ml projected to stock out in 2 days',
        region: 'NCR',
        priority: 'urgent'
      },
      {
        type: 'warning',
        message: 'JTI sales down 15% vs last week in Mindanao',
        region: 'Mindanao',
        priority: 'high'
      }
    ];

    const relevantAlerts = alerts.filter(alert => 
      request.query.toLowerCase().includes(alert.region.toLowerCase()) ||
      request.query.toLowerCase().includes('all') ||
      request.query.toLowerCase().includes('current')
    );

    return {
      type: 'alert',
      data: relevantAlerts,
      insight: `Found ${relevantAlerts.length} relevant alerts requiring attention.`,
      confidence: 0.9,
      processing_time: 0,
      next_suggestions: [
        'Show me detailed stock levels',
        'Which regions need immediate attention?',
        'Generate action plan for alerts'
      ]
    };
  }

  /**
   * Handle comparison queries
   */
  private async handleComparisonQuery(request: QueryRequest): Promise<QueryResponse> {
    // First get the data via SQL
    const ragResponse = await ragEngine.queryToSQL(request.query, request.filters);
    
    try {
      const data = await ragEngine.executeQuery(ragResponse.sql);
      
      // Then generate AI insights about the comparison
      const aiResponse = await adsbotService.query({
        prompt: `Analyze this comparison data and provide insights: ${JSON.stringify(data)}. Original question: ${request.query}`,
        context: 'analysis',
        filters: request.filters
      });

      return {
        type: 'hybrid',
        data,
        insight: aiResponse.response,
        sql_executed: ragResponse.sql,
        confidence: Math.min(ragResponse.confidence, aiResponse.confidence || 0.8),
        processing_time: 0,
        next_suggestions: this.generateSuggestions(request.query, 'comparison')
      };
    } catch (error) {
      console.error('Comparison query failed:', error);
      return this.handleAIInsight(request);
    }
  }

  /**
   * Handle hybrid queries (SQL + AI)
   */
  private async handleHybridQuery(request: QueryRequest): Promise<QueryResponse> {
    try {
      // Try SQL first
      const ragResponse = await ragEngine.queryToSQL(request.query, request.filters);
      const data = await ragEngine.executeQuery(ragResponse.sql);
      
      // Generate AI insights from the data
      const aiResponse = await adsbotService.query({
        prompt: `Based on this data: ${JSON.stringify(data.slice(0, 10))}, provide insights for: ${request.query}`,
        context: 'hybrid',
        filters: request.filters
      });

      return {
        type: 'hybrid',
        data,
        insight: aiResponse.response,
        sql_executed: ragResponse.sql,
        confidence: Math.min(ragResponse.confidence, aiResponse.confidence || 0.8),
        processing_time: 0,
        next_suggestions: this.generateSuggestions(request.query, 'hybrid')
      };
    } catch (error) {
      console.error('Hybrid query failed, falling back to AI only:', error);
      return this.handleAIInsight(request);
    }
  }

  /**
   * Post-process response with metadata
   */
  private async postProcessResponse(
    response: QueryResponse, 
    ragResponse: RAGResponse, 
    startTime: number
  ): Promise<QueryResponse> {
    response.processing_time = Date.now() - startTime;
    
    // Add visualization config for data results
    if (response.type === 'sql_result' || response.type === 'hybrid') {
      response.visualization_config = this.suggestVisualization(response.data);
    }

    return response;
  }

  /**
   * Suggest appropriate visualization for data
   */
  private suggestVisualization(data?: any[]): any {
    if (!data || data.length === 0) return null;

    const firstRow = data[0];
    const columns = Object.keys(firstRow);
    
    // Time series detection
    if (columns.some(col => col.includes('date') || col.includes('time'))) {
      return { type: 'line_chart', x_axis: 'date', y_axis: 'value' };
    }
    
    // Geographic data detection
    if (columns.some(col => col.includes('region') || col.includes('city'))) {
      return { type: 'map', region_column: 'region', value_column: 'revenue' };
    }
    
    // Categorical data
    if (columns.length === 2) {
      return { type: 'bar_chart', x_axis: columns[0], y_axis: columns[1] };
    }
    
    return { type: 'table' };
  }

  /**
   * Generate follow-up suggestions
   */
  private generateSuggestions(query: string, responseType: string): string[] {
    const baseSuggestions = [
      'Show me more details about this',
      'Compare with previous period',
      'Break down by region',
      'What are the key drivers?'
    ];

    const typeSuggestions: Record<string, string[]> = {
      sql_result: [
        'Visualize this data',
        'Export to CSV',
        'Create an alert for this metric'
      ],
      ai_insight: [
        'Show supporting data',
        'Get specific recommendations',
        'Create action plan'
      ],
      comparison: [
        'What caused the difference?',
        'Show historical trends',
        'Predict future performance'
      ]
    };

    return [...baseSuggestions, ...(typeSuggestions[responseType] || [])];
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(response: QueryResponse, startTime: number): void {
    this.performanceMetrics.totalQueries++;
    
    const processingTime = Date.now() - startTime;
    this.performanceMetrics.avgProcessingTime = 
      (this.performanceMetrics.avgProcessingTime * (this.performanceMetrics.totalQueries - 1) + processingTime) / 
      this.performanceMetrics.totalQueries;
    
    if (response.confidence > 0.7) {
      this.performanceMetrics.successRate = 
        (this.performanceMetrics.successRate * (this.performanceMetrics.totalQueries - 1) + 1) / 
        this.performanceMetrics.totalQueries;
    }
    
    if (response.fallback_used) {
      this.performanceMetrics.fallbackRate = 
        (this.performanceMetrics.fallbackRate * (this.performanceMetrics.totalQueries - 1) + 1) / 
        this.performanceMetrics.totalQueries;
    }
  }

  /**
   * Add query to history
   */
  private addToHistory(query: string, response: QueryResponse): void {
    this.queryHistory.unshift({
      query,
      response,
      timestamp: new Date()
    });

    // Keep only last 100 queries
    if (this.queryHistory.length > 100) {
      this.queryHistory = this.queryHistory.slice(0, 100);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * Get query history
   */
  getHistory(limit = 10) {
    return this.queryHistory.slice(0, limit);
  }

  /**
   * Get available routes for debugging
   */
  getRoutes() {
    return this.routes.map(route => ({
      description: route.description,
      examples: route.examples
    }));
  }
}

// Export singleton instance
export const queryOrchestrator = new QueryOrchestrator();