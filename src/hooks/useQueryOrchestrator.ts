/**
 * React hook for Query Orchestrator integration
 * Provides easy access to the orchestration layer from React components
 */

import { useState, useCallback, useEffect } from 'react';
import { queryOrchestrator, QueryRequest, QueryResponse } from '../services/query-orchestrator';
import { useFilterStore } from '../features/filters/filterStore';

export interface UseQueryOrchestratorOptions {
  autoIncludeFilters?: boolean;
  context?: 'dashboard' | 'chat' | 'alert' | 'automation';
  onResponse?: (response: QueryResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseQueryOrchestratorReturn {
  query: (request: string | QueryRequest) => Promise<QueryResponse>;
  isLoading: boolean;
  lastResponse: QueryResponse | null;
  error: Error | null;
  history: Array<{ query: string; response: QueryResponse; timestamp: Date }>;
  metrics: {
    totalQueries: number;
    avgProcessingTime: number;
    successRate: number;
    fallbackRate: number;
  };
  clearHistory: () => void;
  retryLastQuery: () => Promise<QueryResponse | null>;
}

export function useQueryOrchestrator(options: UseQueryOrchestratorOptions = {}): UseQueryOrchestratorReturn {
  const {
    autoIncludeFilters = true,
    context = 'dashboard',
    onResponse,
    onError
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [lastQuery, setLastQuery] = useState<QueryRequest | null>(null);

  // Get current filters from the filter store
  const filters = useFilterStore();

  const query = useCallback(async (request: string | QueryRequest): Promise<QueryResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // Normalize request
      const queryRequest: QueryRequest = typeof request === 'string' 
        ? { query: request, context }
        : { context, ...request };

      // Auto-include filters if enabled
      if (autoIncludeFilters && !queryRequest.filters) {
        queryRequest.filters = {
          dateRange: filters.dateRange,
          selectedRegions: filters.selectedRegions,
          selectedBrands: filters.selectedBrands,
          selectedStoreTypes: filters.selectedStoreTypes,
          selectedPaymentMethods: filters.selectedPaymentMethods
        };
      }

      // Store the query for potential retry
      setLastQuery(queryRequest);

      // Execute the query
      const response = await queryOrchestrator.processQuery(queryRequest);
      
      setLastResponse(response);
      
      // Call success callback
      onResponse?.(response);
      
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [autoIncludeFilters, context, filters, onResponse, onError]);

  const retryLastQuery = useCallback(async (): Promise<QueryResponse | null> => {
    if (!lastQuery) {
      console.warn('No previous query to retry');
      return null;
    }

    return query(lastQuery);
  }, [lastQuery, query]);

  const clearHistory = useCallback(() => {
    setLastResponse(null);
    setError(null);
    setLastQuery(null);
  }, []);

  // Get orchestrator metrics and history
  const metrics = queryOrchestrator.getMetrics();
  const history = queryOrchestrator.getHistory();

  return {
    query,
    isLoading,
    lastResponse,
    error,
    history,
    metrics,
    clearHistory,
    retryLastQuery
  };
}

/**
 * Hook for real-time query suggestions based on current context
 */
export function useQuerySuggestions(context?: Record<string, any>) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    // Generate contextual suggestions based on current page/filters
    const generateSuggestions = () => {
      const baseSuggestions = [
        'Show me today\'s sales performance',
        'What are the top selling products?',
        'Compare this week vs last week',
        'Which regions need attention?',
        'Show me current alerts'
      ];

      // Add context-specific suggestions
      const contextSuggestions: string[] = [];
      
      if (context?.page === 'executive-overview') {
        contextSuggestions.push(
          'Why are sales trending up/down?',
          'What\'s driving regional performance?',
          'Show me substitution patterns'
        );
      } else if (context?.page === 'brand-switching') {
        contextSuggestions.push(
          'Which competitors are gaining share?',
          'Show JTI vs Philip Morris performance',
          'Analyze substitution reasons'
        );
      } else if (context?.page === 'product-sku') {
        contextSuggestions.push(
          'Which SKUs are underperforming?',
          'Show product mix optimization',
          'Analyze price sensitivity'
        );
      }

      setSuggestions([...baseSuggestions, ...contextSuggestions]);
    };

    generateSuggestions();
  }, [context]);

  return suggestions;
}

/**
 * Hook for monitoring query performance and health
 */
export function useQueryHealth() {
  const [health, setHealth] = useState({
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    avgResponseTime: 0,
    errorRate: 0,
    lastCheck: new Date()
  });

  useEffect(() => {
    const checkHealth = () => {
      const metrics = queryOrchestrator.getMetrics();
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      // Determine health status based on metrics
      if (metrics.avgProcessingTime > 10000) { // > 10 seconds
        status = 'unhealthy';
      } else if (metrics.avgProcessingTime > 5000 || metrics.fallbackRate > 0.3) { // > 5 seconds or 30% fallback
        status = 'degraded';
      }

      setHealth({
        status,
        avgResponseTime: metrics.avgProcessingTime,
        errorRate: 1 - metrics.successRate,
        lastCheck: new Date()
      });
    };

    // Check immediately
    checkHealth();

    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  return health;
}

/**
 * Hook for batch query processing
 */
export function useBatchQuery() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<Array<{ query: string; response?: QueryResponse; error?: Error }>>([]);

  const processBatch = useCallback(async (queries: string[]): Promise<void> => {
    setIsProcessing(true);
    setResults([]);

    const batchResults: Array<{ query: string; response?: QueryResponse; error?: Error }> = [];

    for (const query of queries) {
      try {
        const response = await queryOrchestrator.processQuery({ query, context: 'automation' });
        batchResults.push({ query, response });
      } catch (error) {
        batchResults.push({ query, error: error as Error });
      }
    }

    setResults(batchResults);
    setIsProcessing(false);
  }, []);

  return {
    processBatch,
    isProcessing,
    results,
    clearResults: () => setResults([])
  };
}