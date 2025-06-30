import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { QueryConfig } from '../../constants/registry';

export interface SavedQuery {
  id: string;
  query_name: string;
  description?: string;
  config: QueryConfig & {
    filters?: any[];
    timeRange?: string;
  };
  query_type: 'custom' | 'template' | 'scheduled';
  is_public: boolean;
  tags?: string[];
  execution_count: number;
  created_at: string;
  updated_at: string;
  last_run?: string;
  created_by?: string;
}

export interface QueryExecution {
  id: string;
  saved_query_id: string;
  executed_at: string;
  execution_time_ms?: number;
  row_count?: number;
  error_message?: string;
  executed_by?: string;
}

interface UseSavedQueriesResult {
  queries: SavedQuery[];
  recentQueries: SavedQuery[];
  publicQueries: SavedQuery[];
  isLoading: boolean;
  error: Error | null;
  saveQuery: (name: string, config: QueryConfig, options?: SaveQueryOptions) => Promise<SavedQuery>;
  loadQuery: (queryId: string) => Promise<SavedQuery | null>;
  deleteQuery: (queryId: string) => Promise<boolean>;
  updateQuery: (queryId: string, updates: Partial<SavedQuery>) => Promise<SavedQuery | null>;
  executeQuery: (queryId: string) => Promise<QueryExecution>;
  searchQueries: (searchTerm: string, tags?: string[]) => Promise<SavedQuery[]>;
}

interface SaveQueryOptions {
  description?: string;
  is_public?: boolean;
  tags?: string[];
  query_type?: 'custom' | 'template' | 'scheduled';
}

export const useSavedQueries = (userId?: string): UseSavedQueriesResult => {
  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [recentQueries, setRecentQueries] = useState<SavedQuery[]>([]);
  const [publicQueries, setPublicQueries] = useState<SavedQuery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch user's queries
  const fetchQueries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get user's queries
      const { data: userQueries, error: userError } = await supabase
        .from('saved_queries')
        .select('*')
        .order('updated_at', { ascending: false });

      if (userError) throw userError;

      // Get recent queries (last 5)
      const recent = (userQueries || []).slice(0, 5);

      // Get public queries
      const { data: publicData, error: publicError } = await supabase
        .from('saved_queries')
        .select('*')
        .eq('is_public', true)
        .order('execution_count', { ascending: false })
        .limit(10);

      if (publicError) throw publicError;

      setQueries(userQueries || []);
      setRecentQueries(recent);
      setPublicQueries(publicData || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load queries on mount
  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  // Save a new query
  const saveQuery = useCallback(async (
    name: string,
    config: QueryConfig,
    options?: SaveQueryOptions
  ): Promise<SavedQuery> => {
    try {
      const { data, error } = await supabase
        .from('saved_queries')
        .insert({
          query_name: name,
          config,
          description: options?.description,
          is_public: options?.is_public || false,
          tags: options?.tags || [],
          query_type: options?.query_type || 'custom',
          user_id: userId,
          created_by: userId // In production, get from auth
        })
        .select()
        .single();

      if (error) throw error;
      
      // Refresh queries
      await fetchQueries();
      
      return data;
    } catch (err) {
      throw err;
    }
  }, [userId, fetchQueries]);

  // Load a specific query
  const loadQuery = useCallback(async (queryId: string): Promise<SavedQuery | null> => {
    try {
      const { data, error } = await supabase
        .from('saved_queries')
        .select('*')
        .eq('id', queryId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, []);

  // Delete a query
  const deleteQuery = useCallback(async (queryId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('saved_queries')
        .delete()
        .eq('id', queryId);

      if (error) throw error;
      
      // Refresh queries
      await fetchQueries();
      
      return true;
    } catch (err) {
      setError(err as Error);
      return false;
    }
  }, [fetchQueries]);

  // Update a query
  const updateQuery = useCallback(async (
    queryId: string,
    updates: Partial<SavedQuery>
  ): Promise<SavedQuery | null> => {
    try {
      const { data, error } = await supabase
        .from('saved_queries')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', queryId)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh queries
      await fetchQueries();
      
      return data;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, [fetchQueries]);

  // Execute a saved query and log execution
  const executeQuery = useCallback(async (queryId: string): Promise<QueryExecution> => {
    const startTime = Date.now();
    
    try {
      // Update last_run timestamp
      await supabase
        .from('saved_queries')
        .update({ 
          last_run: new Date().toISOString(),
          execution_count: supabase.raw('execution_count + 1')
        })
        .eq('id', queryId);

      // Log execution
      const { data, error } = await supabase
        .from('query_executions')
        .insert({
          saved_query_id: queryId,
          execution_time_ms: Date.now() - startTime,
          executed_by: userId
        })
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (err) {
      // Log failed execution
      await supabase
        .from('query_executions')
        .insert({
          saved_query_id: queryId,
          execution_time_ms: Date.now() - startTime,
          error_message: (err as Error).message,
          executed_by: userId
        });
      
      throw err;
    }
  }, [userId]);

  // Search queries by name or tags
  const searchQueries = useCallback(async (
    searchTerm: string,
    tags?: string[]
  ): Promise<SavedQuery[]> => {
    try {
      let query = supabase
        .from('saved_queries')
        .select('*');

      // Search by name
      if (searchTerm) {
        query = query.or(`query_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Filter by tags
      if (tags && tags.length > 0) {
        query = query.contains('tags', tags);
      }

      const { data, error } = await query
        .order('execution_count', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      return data || [];
    } catch (err) {
      setError(err as Error);
      return [];
    }
  }, []);

  return {
    queries,
    recentQueries,
    publicQueries,
    isLoading,
    error,
    saveQuery,
    loadQuery,
    deleteQuery,
    updateQuery,
    executeQuery,
    searchQueries
  };
};

// Hook for managing query executions
export const useQueryExecutions = (savedQueryId: string) => {
  const [executions, setExecutions] = useState<QueryExecution[]>([]);
  const [stats, setStats] = useState({
    totalExecutions: 0,
    avgExecutionTime: 0,
    successRate: 0,
    lastExecuted: null as string | null
  });

  useEffect(() => {
    const fetchExecutions = async () => {
      const { data, error } = await supabase
        .from('query_executions')
        .select('*')
        .eq('saved_query_id', savedQueryId)
        .order('executed_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setExecutions(data);
        
        // Calculate stats
        const successful = data.filter(e => !e.error_message);
        const avgTime = successful.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / successful.length;
        
        setStats({
          totalExecutions: data.length,
          avgExecutionTime: avgTime || 0,
          successRate: (successful.length / data.length) * 100,
          lastExecuted: data[0]?.executed_at || null
        });
      }
    };

    if (savedQueryId) {
      fetchExecutions();
    }
  }, [savedQueryId]);

  return { executions, stats };
};