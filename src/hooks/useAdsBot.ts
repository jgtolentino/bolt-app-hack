/**
 * useAdsBot - React hook for AdsBot integration
 * Provides a clean interface for components to interact with AdsBot
 */

import { useState, useCallback, useRef } from 'react';
import { adsbotService, AdsBotQueryParams, AIResponse } from '../services/adsbotService';
import { useFilterStore } from '../features/filters/filterStore';

export interface UseAdsBotOptions {
  autoIncludeFilters?: boolean;
  cacheResponses?: boolean;
  onSuccess?: (response: AIResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseAdsBotReturn {
  // Core query function
  query: (params: AdsBotQueryParams) => Promise<AIResponse>;
  
  // Convenience methods
  generateInsight: (templateId: string, data?: Record<string, any>) => Promise<string>;
  askQuestion: (question: string, context?: Record<string, any>) => Promise<string>;
  forecast: (type: 'demand' | 'stockout' | 'churn', data?: Record<string, any>) => Promise<AIResponse>;
  analyze: (type: 'price' | 'substitution' | 'demographic' | 'basket', data?: Record<string, any>) => Promise<AIResponse>;
  
  // State
  isLoading: boolean;
  error: Error | null;
  lastResponse: AIResponse | null;
  history: AIResponse[];
  
  // Utilities
  clearHistory: () => void;
  clearCache: () => void;
}

export function useAdsBot(options: UseAdsBotOptions = {}): UseAdsBotReturn {
  const {
    autoIncludeFilters = true,
    cacheResponses = true,
    onSuccess,
    onError
  } = options;

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const [history, setHistory] = useState<AIResponse[]>([]);
  
  // Get current filters from store
  const filters = useFilterStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Core query function
   */
  const query = useCallback(async (params: AdsBotQueryParams): Promise<AIResponse> => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);

    try {
      // Auto-include filters if enabled
      const enrichedParams: AdsBotQueryParams = {
        ...params,
        filters: autoIncludeFilters 
          ? { ...filters, ...params.filters }
          : params.filters,
        context: {
          ...params.context,
          timestamp: new Date().toISOString(),
          cacheEnabled: cacheResponses
        }
      };

      // Execute query
      const response = await adsbotService.query(enrichedParams);
      
      // Update state
      setLastResponse(response);
      setHistory(prev => [...prev, response]);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(response);
      }
      
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Query failed');
      setError(error);
      
      // Call error callback
      if (onError) {
        onError(error);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [filters, autoIncludeFilters, cacheResponses, onSuccess, onError]);

  /**
   * Generate insight using template
   */
  const generateInsight = useCallback(async (
    templateId: string,
    data?: Record<string, any>
  ): Promise<string> => {
    const response = await query({
      type: 'insight',
      templateId,
      data: data || {},
    });
    return response.content;
  }, [query]);

  /**
   * Ask a question
   */
  const askQuestion = useCallback(async (
    question: string,
    context?: Record<string, any>
  ): Promise<string> => {
    const response = await query({
      type: 'chat',
      text: question,
      context
    });
    return response.content;
  }, [query]);

  /**
   * Generate forecast
   */
  const forecast = useCallback(async (
    type: 'demand' | 'stockout' | 'churn',
    data?: Record<string, any>
  ): Promise<AIResponse> => {
    return adsbotService.forecast(
      type,
      data || {},
      autoIncludeFilters ? filters : undefined
    );
  }, [filters, autoIncludeFilters]);

  /**
   * Analyze data
   */
  const analyze = useCallback(async (
    type: 'price' | 'substitution' | 'demographic' | 'basket',
    data?: Record<string, any>
  ): Promise<AIResponse> => {
    return adsbotService.analyze(
      type,
      data || {},
      autoIncludeFilters ? filters : undefined
    );
  }, [filters, autoIncludeFilters]);

  /**
   * Clear query history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    setLastResponse(null);
  }, []);

  /**
   * Clear AdsBot cache
   */
  const clearCache = useCallback(() => {
    adsbotService.clearCache();
  }, []);

  return {
    // Core function
    query,
    
    // Convenience methods
    generateInsight,
    askQuestion,
    forecast,
    analyze,
    
    // State
    isLoading,
    error,
    lastResponse,
    history,
    
    // Utilities
    clearHistory,
    clearCache
  };
}

/**
 * Hook for specific insight templates
 */
export function useAdsBotInsight(
  templateId: string,
  data?: Record<string, any>,
  options?: UseAdsBotOptions
) {
  const { generateInsight, isLoading, error } = useAdsBot(options);
  const [insight, setInsight] = useState<string | null>(null);

  // Auto-fetch on mount and when data changes
  useState(() => {
    generateInsight(templateId, data)
      .then(setInsight)
      .catch(() => setInsight(null));
  });

  return { insight, isLoading, error };
}

/**
 * Hook for chat interface
 */
export function useAdsBotChat(options?: UseAdsBotOptions) {
  const adsbot = useAdsBot(options);
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);

  const sendMessage = useCallback(async (message: string) => {
    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: message,
      timestamp: new Date()
    }]);

    try {
      // Get response
      const response = await adsbot.askQuestion(message, {
        history: messages.slice(-5) // Include last 5 messages for context
      });

      // Add assistant message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }]);

      return response;
    } catch (error) {
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      }]);
      throw error;
    }
  }, [adsbot, messages]);

  return {
    ...adsbot,
    messages,
    sendMessage,
    clearMessages: () => setMessages([])
  };
}