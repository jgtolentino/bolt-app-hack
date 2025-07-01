/**
 * AdsBot Service - Thin wrapper around adsbot-runtime
 * Provides a clean interface for the dashboard to interact with AdsBot
 */

import { adsBot, AIQuery, AIResponse } from './adsbot-runtime';

export interface AdsBotQueryParams {
  type?: 'insight' | 'chat' | 'alert' | 'analysis' | 'forecast' | 'substitution' | 'demographic';
  text?: string;
  templateId?: string;
  context?: Record<string, any>;
  filters?: Record<string, any>;
  data?: Record<string, any>;
  complexity?: 'low' | 'medium' | 'high';
  realtime?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface AdsBotConfig {
  enableCache?: boolean;
  enableTelemetry?: boolean;
  preferredProvider?: 'anthropic' | 'openai' | 'auto';
}

class AdsBotService {
  private config: AdsBotConfig;

  constructor(config: AdsBotConfig = {}) {
    this.config = {
      enableCache: true,
      enableTelemetry: true,
      preferredProvider: 'auto',
      ...config
    };
  }

  /**
   * Process a query through AdsBot
   */
  async query(params: AdsBotQueryParams): Promise<AIResponse> {
    // Build the query object
    const query: AIQuery = {
      id: this.generateQueryId(),
      type: params.type || 'chat',
      text: params.text,
      templateId: params.templateId,
      context: params.context || {},
      filters: params.filters,
      data: params.data,
      complexity: params.complexity,
      realtime: params.realtime,
      priority: params.priority,
      timestamp: new Date().toISOString()
    };

    // Process through AdsBot runtime
    try {
      const response = await adsBot.processQuery(query);
      
      // Log telemetry if enabled
      if (this.config.enableTelemetry) {
        this.logQueryMetrics(query, response);
      }
      
      return response;
    } catch (error) {
      console.error('[AdsBotService] Query failed:', error);
      throw error;
    }
  }

  /**
   * Quick insight generation using templates
   */
  async generateInsight(
    templateId: string,
    data: Record<string, any>,
    filters: Record<string, any> = {}
  ): Promise<string> {
    const response = await this.query({
      type: 'insight',
      templateId,
      data,
      filters
    });
    
    return response.content;
  }

  /**
   * Chat-style question answering
   */
  async askQuestion(
    question: string,
    context?: Record<string, any>
  ): Promise<string> {
    const response = await this.query({
      type: 'chat',
      text: question,
      context
    });
    
    return response.content;
  }

  /**
   * Generate forecast
   */
  async forecast(
    forecastType: 'demand' | 'stockout' | 'churn',
    data: Record<string, any>,
    filters?: Record<string, any>
  ): Promise<AIResponse> {
    const templateMap = {
      demand: 'demandForecast',
      stockout: 'stockoutPrediction',
      churn: 'churnRiskAnalysis'
    };

    return this.query({
      type: 'forecast',
      templateId: templateMap[forecastType],
      data,
      filters,
      complexity: 'high'
    });
  }

  /**
   * Analyze specific aspects
   */
  async analyze(
    analysisType: 'price' | 'substitution' | 'demographic' | 'basket',
    data: Record<string, any>,
    filters?: Record<string, any>
  ): Promise<AIResponse> {
    const templateMap = {
      price: 'priceSensitivity',
      substitution: 'substitutionMap',
      demographic: 'genderPreference',
      basket: 'basketComposition'
    };

    return this.query({
      type: 'analysis',
      templateId: templateMap[analysisType],
      data,
      filters,
      complexity: analysisType === 'price' || analysisType === 'substitution' ? 'high' : 'medium'
    });
  }

  /**
   * Generate real-time alert
   */
  async createAlert(
    alertType: string,
    data: Record<string, any>,
    priority: 'normal' | 'high' | 'urgent' = 'high'
  ): Promise<AIResponse> {
    return this.query({
      type: 'alert',
      text: `Generate ${alertType} alert`,
      data,
      priority,
      realtime: true
    });
  }

  /**
   * Get telemetry data
   */
  getTelemetry(event?: string, date?: string): any[] {
    return adsBot.getTelemetry(event, date);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    adsBot.clearCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { hits: number; misses: number; size: number } {
    const telemetry = this.getTelemetry();
    const cacheHits = telemetry.filter(t => t[0].includes('cache_hit')).length;
    const totalQueries = telemetry.filter(t => t[0].includes('query_')).length;
    
    return {
      hits: cacheHits,
      misses: totalQueries - cacheHits,
      size: 0 // Would need to expose from runtime
    };
  }

  /**
   * Private helper methods
   */
  private generateQueryId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logQueryMetrics(query: AIQuery, response: AIResponse): void {
    // Simple metrics logging
    console.debug('[AdsBotService] Query processed:', {
      type: query.type,
      template: query.templateId,
      provider: response.provider.name,
      duration: response.timing.duration,
      cached: response.cached,
      confidence: response.confidence
    });
  }
}

// Export singleton instance
export const adsbotService = new AdsBotService();

// Export class for custom configurations
export { AdsBotService };

// Re-export types for convenience
export type { AIResponse, AIAction } from './adsbot-runtime';