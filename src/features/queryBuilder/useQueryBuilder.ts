import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { QueryBuilder, QueryResult, createQuery, QueryTemplates } from './queryBuilder';
import type { QueryConfig, QueryFilter } from '../../constants/registry';

export interface UseQueryBuilderResult {
  executeQuery: (config: QueryConfig) => Promise<QueryResult>;
  executeDynamicMetrics: (
    metrics: string[],
    dimensions: string[],
    filters?: QueryFilter[],
    dateRange?: { from: Date; to: Date }
  ) => Promise<any>;
  isLoading: boolean;
  error: Error | null;
  lastQuery: string | null;
  lastResult: any[] | null;
}

export const useQueryBuilder = (): UseQueryBuilderResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any[] | null>(null);

  const executeQuery = useCallback(async (config: QueryConfig): Promise<QueryResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const queryBuilder = createQuery(config);
      const sql = queryBuilder.toSQL();
      setLastQuery(sql);
      
      // For now, execute using the RPC function
      const { data, error: rpcError } = await supabase.rpc('execute_dynamic_query', {
        query_text: sql
      });
      
      if (rpcError) throw rpcError;
      
      const result: QueryResult = {
        data: data || [],
        error: null,
        query: sql,
        executionTime: 0 // Would need to measure this properly
      };
      
      setLastResult(result.data);
      return result;
      
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      return {
        data: [],
        error,
        query: lastQuery || '',
        executionTime: 0
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const executeDynamicMetrics = useCallback(async (
    metrics: string[],
    dimensions: string[],
    filters?: QueryFilter[],
    dateRange?: { from: Date; to: Date }
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert QueryFilter array to JSONB format expected by the function
      const jsonFilters = filters?.map(f => ({
        dimension: f.dimension,
        operator: f.operator,
        value: f.value
      })) || [];
      
      const { data, error: rpcError } = await supabase.rpc('get_dynamic_metrics', {
        p_metrics: metrics,
        p_dimensions: dimensions,
        p_filters: jsonFilters,
        p_date_from: dateRange?.from.toISOString().split('T')[0] || null,
        p_date_to: dateRange?.to.toISOString().split('T')[0] || null,
        p_limit: 1000
      });
      
      if (rpcError) throw rpcError;
      
      // Transform the result into a more usable format
      const transformedData = (data || []).map(row => ({
        ...row.dimension_values,
        ...row.metric_values
      }));
      
      setLastResult(transformedData);
      return transformedData;
      
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    executeQuery,
    executeDynamicMetrics,
    isLoading,
    error,
    lastQuery,
    lastResult
  };
};

// Preset hooks for common queries
export const useRegionalSales = (filters: QueryFilter[] = []) => {
  const { executeQuery, ...rest } = useQueryBuilder();
  
  const fetchRegionalSales = useCallback(async () => {
    const config = QueryTemplates.regionalSales(filters);
    return executeQuery(config);
  }, [executeQuery, filters]);
  
  return { fetchRegionalSales, ...rest };
};

export const useClientPerformance = (clientName: string) => {
  const { executeQuery, ...rest } = useQueryBuilder();
  
  const fetchClientPerformance = useCallback(async () => {
    const config = QueryTemplates.clientProductPerformance(clientName);
    return executeQuery(config);
  }, [executeQuery, clientName]);
  
  return { fetchClientPerformance, ...rest };
};

export const useStoreCoverage = (filters: QueryFilter[] = []) => {
  const { executeQuery, ...rest } = useQueryBuilder();
  
  const fetchStoreCoverage = useCallback(async () => {
    const config = QueryTemplates.storeCoverage(filters);
    return executeQuery(config);
  }, [executeQuery, filters]);
  
  return { fetchStoreCoverage, ...rest };
};

export const useCategoryMix = (filters: QueryFilter[] = []) => {
  const { executeQuery, ...rest } = useQueryBuilder();
  
  const fetchCategoryMix = useCallback(async () => {
    const config = QueryTemplates.categoryMix(filters);
    return executeQuery(config);
  }, [executeQuery, filters]);
  
  return { fetchCategoryMix, ...rest };
};