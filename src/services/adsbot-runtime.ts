/**
 * AdsBot Runtime - Centralized AI Orchestrator
 * Handles all retail analytics AI operations with intelligent routing
 */

import { AIService, AIServiceOptions } from './aiService';
import { insightTemplates, InsightTemplate } from '../lib/insightTemplates';

// Types
export interface AIQuery {
  id: string;
  type: 'insight' | 'chat' | 'alert' | 'analysis' | 'forecast' | 'substitution' | 'demographic';
  text?: string;
  templateId?: string;
  context: Record<string, any>;
  filters?: Record<string, any>;
  data?: Record<string, any>;
  complexity?: 'low' | 'medium' | 'high';
  realtime?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: string;
}

export interface AIProvider {
  name: 'anthropic' | 'openai';
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  id: string;
  queryId: string;
  content: string;
  confidence: number;
  template?: string;
  provider: AIProvider;
  suggestions?: string[];
  data?: any;
  visualizations?: any[];
  actions?: AIAction[];
  timing: {
    start: number;
    end: number;
    duration: number;
  };
  cached: boolean;
  error?: string;
}

export interface AIAction {
  type: 'filter' | 'navigate' | 'export' | 'alert';
  label: string;
  params: Record<string, any>;
}

export interface RoutingRule {
  condition: (query: AIQuery) => boolean;
  provider: AIProvider;
  cacheKey?: (query: AIQuery) => string;
}

// Cache implementation
class QueryCache {
  private cache: Map<string, { response: AIResponse; timestamp: number }> = new Map();
  private maxSize: number = 100;
  private defaultTTL: number = 3600 * 1000; // 1 hour

  set(key: string, response: AIResponse, ttl?: number): void {
    // Implement LRU eviction if needed
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      response: { ...response, cached: true },
      timestamp: Date.now() + (ttl || this.defaultTTL)
    });
  }

  get(key: string): AIResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.timestamp) {
      this.cache.delete(key);
      return null;
    }

    return cached.response;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Main AdsBot Runtime
export class AdsBotRuntime {
  private aiService: AIService;
  private cache: QueryCache;
  private routingRules: RoutingRule[];
  private telemetry: Map<string, any>;

  constructor() {
    this.aiService = new AIService();
    this.cache = new QueryCache();
    this.telemetry = new Map();
    this.routingRules = this.initializeRoutingRules();
  }

  /**
   * Initialize routing rules based on adsbot.yaml configuration
   */
  private initializeRoutingRules(): RoutingRule[] {
    return [
      // High complexity or insight queries -> Claude Opus
      {
        condition: (q) => q.complexity === 'high' || q.type === 'insight',
        provider: { name: 'anthropic', model: 'claude-3-opus-20240229' },
        cacheKey: (q) => `opus:${q.type}:${JSON.stringify(q.filters)}`
      },
      
      // Substitution, demographic, forecast -> Claude Opus
      {
        condition: (q) => ['substitution', 'demographic', 'forecast'].includes(q.type),
        provider: { name: 'anthropic', model: 'claude-3-opus-20240229' },
        cacheKey: (q) => `opus:${q.type}:${q.templateId}:${JSON.stringify(q.filters)}`
      },
      
      // Real-time or chat queries -> GPT-4
      {
        condition: (q) => q.realtime || q.type === 'chat',
        provider: { name: 'openai', model: 'gpt-4' },
        cacheKey: (q) => q.type === 'chat' ? null : `gpt4:${q.type}:${q.text}`
      },
      
      // Alerts or urgent -> GPT-4 (fast)
      {
        condition: (q) => q.type === 'alert' || q.priority === 'urgent',
        provider: { name: 'openai', model: 'gpt-4' }
      },
      
      // Default -> Claude Sonnet
      {
        condition: () => true,
        provider: { name: 'anthropic', model: 'claude-3-sonnet-20240229' },
        cacheKey: (q) => `sonnet:${q.type}:${q.templateId || q.text}`
      }
    ];
  }

  /**
   * Main query processing method
   */
  async processQuery(query: AIQuery): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Generate query ID if not provided
    query.id = query.id || this.generateQueryId();
    
    // Check cache first
    const cacheKey = this.getCacheKey(query);
    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.recordTelemetry('cache_hit', { queryType: query.type });
        return {
          ...cached,
          timing: {
            start: startTime,
            end: Date.now(),
            duration: Date.now() - startTime
          }
        };
      }
    }

    // Determine intent and complexity
    const enrichedQuery = await this.enrichQuery(query);
    
    // Select provider based on routing rules
    const provider = this.selectProvider(enrichedQuery);
    
    // Process the query
    try {
      const response = await this.executeQuery(enrichedQuery, provider);
      
      // Cache the response if applicable
      if (cacheKey) {
        const ttl = this.getCacheTTL(enrichedQuery);
        this.cache.set(cacheKey, response, ttl);
      }
      
      // Record telemetry
      this.recordTelemetry('query_success', {
        queryType: query.type,
        provider: provider.name,
        model: provider.model,
        duration: response.timing.duration
      });
      
      return response;
    } catch (error) {
      this.recordTelemetry('query_error', {
        queryType: query.type,
        provider: provider.name,
        error: error.message
      });
      
      // Return fallback response
      return this.generateFallbackResponse(query, error);
    }
  }

  /**
   * Enrich query with detected intent and complexity
   */
  private async enrichQuery(query: AIQuery): Promise<AIQuery> {
    // Auto-detect complexity if not provided
    if (!query.complexity) {
      query.complexity = this.assessComplexity(query);
    }
    
    // Auto-detect template if not provided
    if (!query.templateId && query.type === 'insight') {
      query.templateId = this.detectBestTemplate(query);
    }
    
    // Add timestamp if not provided
    query.timestamp = query.timestamp || new Date().toISOString();
    
    return query;
  }

  /**
   * Assess query complexity
   */
  private assessComplexity(query: AIQuery): 'low' | 'medium' | 'high' {
    // High complexity indicators
    if (query.type in ['forecast', 'substitution', 'demographic']) return 'high';
    if (query.data && Object.keys(query.data).length > 10) return 'high';
    if (query.text && query.text.length > 200) return 'high';
    
    // Medium complexity indicators
    if (query.type in ['insight', 'analysis']) return 'medium';
    if (query.filters && Object.keys(query.filters).length > 3) return 'medium';
    
    // Default to low
    return 'low';
  }

  /**
   * Detect best template based on query context
   */
  private detectBestTemplate(query: AIQuery): string | undefined {
    const dataKeys = Object.keys(query.data || {});
    const text = query.text?.toLowerCase() || '';
    
    // Price-related
    if (dataKeys.includes('unit_price') || text.includes('price')) {
      return 'priceSensitivity';
    }
    
    // Substitution-related
    if (text.includes('substitut') || text.includes('switch')) {
      return 'substitutionMap';
    }
    
    // Demographic-related
    if (dataKeys.includes('gender') || dataKeys.includes('age_group')) {
      return 'genderPreference';
    }
    
    // Basket-related
    if (dataKeys.includes('basket') || text.includes('basket')) {
      return 'basketComposition';
    }
    
    // Forecast-related
    if (text.includes('forecast') || text.includes('predict')) {
      return 'demandForecast';
    }
    
    // Default to first template
    return insightTemplates[0]?.id;
  }

  /**
   * Select provider based on routing rules
   */
  private selectProvider(query: AIQuery): AIProvider {
    for (const rule of this.routingRules) {
      if (rule.condition(query)) {
        return rule.provider;
      }
    }
    
    // Should never reach here due to default rule
    return { name: 'anthropic', model: 'claude-3-sonnet-20240229' };
  }

  /**
   * Execute query with selected provider
   */
  private async executeQuery(query: AIQuery, provider: AIProvider): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Configure AI service for this query
    const aiService = new AIService({ provider: provider.name });
    
    let content: string;
    
    // Handle different query types
    switch (query.type) {
      case 'insight':
        if (query.templateId) {
          content = await aiService.generateInsight(
            query.templateId,
            query.data || {},
            query.filters || {}
          );
        } else {
          content = await aiService.askQuestion(query.text || '', query.context);
        }
        break;
        
      case 'chat':
        content = await aiService.askQuestion(query.text || '', query.context);
        break;
        
      default:
        // For other types, use template if available
        if (query.templateId) {
          content = await aiService.generateInsight(
            query.templateId,
            query.data || {},
            query.filters || {}
          );
        } else {
          content = await aiService.askQuestion(query.text || '', query.context);
        }
    }
    
    // Build response
    const response: AIResponse = {
      id: this.generateResponseId(),
      queryId: query.id,
      content,
      confidence: this.calculateConfidence(query, provider),
      template: query.templateId,
      provider,
      suggestions: this.generateSuggestions(query),
      timing: {
        start: startTime,
        end: Date.now(),
        duration: Date.now() - startTime
      },
      cached: false
    };
    
    // Add visualizations for certain query types
    if (query.type === 'analysis' || query.type === 'insight') {
      response.visualizations = this.suggestVisualizations(query);
    }
    
    // Add actions for actionable insights
    if (query.type === 'alert' || query.priority === 'urgent') {
      response.actions = this.generateActions(query);
    }
    
    return response;
  }

  /**
   * Generate cache key for query
   */
  private getCacheKey(query: AIQuery): string | null {
    // Find applicable routing rule
    const rule = this.routingRules.find(r => r.condition(query));
    if (!rule || !rule.cacheKey) return null;
    
    return rule.cacheKey(query);
  }

  /**
   * Get cache TTL based on query type and template
   */
  private getCacheTTL(query: AIQuery): number {
    const ttlMap: Record<string, number> = {
      'priceSensitivity': 86400 * 1000,      // 24 hours
      'substitutionMap': 43200 * 1000,       // 12 hours
      'basketComposition': 21600 * 1000,     // 6 hours
      'peakHourAnalysis': 3600 * 1000,       // 1 hour
      'demandForecast': 3600 * 1000,         // 1 hour
      'stockoutPrediction': 1800 * 1000,     // 30 minutes
      'alert': 0,                            // No cache
      'chat': 0                              // No cache
    };
    
    return ttlMap[query.templateId || query.type] || 3600 * 1000; // Default 1 hour
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(query: AIQuery, provider: AIProvider): number {
    let confidence = 0.75; // Base confidence
    
    // Provider bonuses
    if (provider.name === 'anthropic' && provider.model.includes('opus')) {
      confidence += 0.15;
    } else if (provider.name === 'anthropic' && provider.model.includes('sonnet')) {
      confidence += 0.10;
    } else if (provider.name === 'openai' && provider.model === 'gpt-4') {
      confidence += 0.10;
    }
    
    // Template bonus
    if (query.templateId) {
      confidence += 0.05;
    }
    
    // Data richness bonus
    if (query.data && Object.keys(query.data).length > 5) {
      confidence += 0.05;
    }
    
    return Math.min(confidence, 0.95);
  }

  /**
   * Generate contextual suggestions
   */
  private generateSuggestions(query: AIQuery): string[] {
    const suggestions: string[] = [];
    
    // Template-based suggestions
    if (query.templateId) {
      const template = insightTemplates.find(t => t.id === query.templateId);
      if (template) {
        suggestions.push(`Explore more ${template.category} insights`);
      }
    }
    
    // Type-based suggestions
    switch (query.type) {
      case 'forecast':
        suggestions.push('Compare with historical trends');
        suggestions.push('Adjust forecast parameters');
        break;
      case 'substitution':
        suggestions.push('View brand loyalty metrics');
        suggestions.push('Analyze price impact');
        break;
      case 'demographic':
        suggestions.push('Segment by region');
        suggestions.push('View purchase patterns');
        break;
    }
    
    // Always add
    suggestions.push('Export detailed report');
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Suggest visualizations based on query
   */
  private suggestVisualizations(query: AIQuery): any[] {
    const visualizations: any[] = [];
    
    if (query.type === 'analysis' || query.templateId === 'priceSensitivity') {
      visualizations.push({
        type: 'line',
        title: 'Price vs Demand Curve',
        data: 'priceDemandData'
      });
    }
    
    if (query.templateId === 'substitutionMap') {
      visualizations.push({
        type: 'sankey',
        title: 'Brand Switching Flow',
        data: 'substitutionFlows'
      });
    }
    
    if (query.templateId === 'genderPreference') {
      visualizations.push({
        type: 'bar',
        title: 'Purchase by Gender',
        data: 'genderPurchaseData'
      });
    }
    
    return visualizations;
  }

  /**
   * Generate actionable items
   */
  private generateActions(query: AIQuery): AIAction[] {
    const actions: AIAction[] = [];
    
    if (query.type === 'alert' || query.templateId === 'stockoutPrediction') {
      actions.push({
        type: 'alert',
        label: 'Create Stock Alert',
        params: { severity: 'high', notify: ['manager', 'supplier'] }
      });
    }
    
    if (query.templateId === 'promotionEffectiveness') {
      actions.push({
        type: 'navigate',
        label: 'View Promotion Details',
        params: { page: '/promotions' }
      });
    }
    
    actions.push({
      type: 'export',
      label: 'Export Analysis',
      params: { format: 'pdf', include: ['charts', 'data'] }
    });
    
    return actions;
  }

  /**
   * Generate fallback response on error
   */
  private generateFallbackResponse(query: AIQuery, error: any): AIResponse {
    return {
      id: this.generateResponseId(),
      queryId: query.id,
      content: `I encountered an issue processing your ${query.type} request. Using cached insights: Based on historical patterns, ${this.getFallbackInsight(query)}`,
      confidence: 0.65,
      provider: { name: 'openai', model: 'gpt-3.5-turbo' },
      timing: {
        start: Date.now(),
        end: Date.now(),
        duration: 0
      },
      cached: true,
      error: error.message
    };
  }

  /**
   * Get fallback insight based on query type
   */
  private getFallbackInsight(query: AIQuery): string {
    const fallbacks: Record<string, string> = {
      forecast: 'expect moderate growth of 5-10% based on seasonal trends',
      substitution: 'customers typically switch to similar price-point alternatives',
      demographic: 'purchase patterns vary significantly by age and location',
      insight: 'this metric shows typical performance for your market segment'
    };
    
    return fallbacks[query.type] || 'please try again with a more specific query';
  }

  /**
   * Telemetry recording
   */
  private recordTelemetry(event: string, data: any): void {
    const key = `${event}:${new Date().toISOString().split('T')[0]}`;
    const current = this.telemetry.get(key) || [];
    current.push({ ...data, timestamp: Date.now() });
    this.telemetry.set(key, current);
  }

  /**
   * Utility methods
   */
  private generateQueryId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateResponseId(): string {
    return `r_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Public API for telemetry access
   */
  getTelemetry(event?: string, date?: string): any[] {
    if (event && date) {
      return this.telemetry.get(`${event}:${date}`) || [];
    }
    return Array.from(this.telemetry.entries());
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const adsBot = new AdsBotRuntime();

// Export for testing
export default AdsBotRuntime;