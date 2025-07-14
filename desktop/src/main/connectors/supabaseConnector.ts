/**
 * Supabase PostgreSQL Connector
 * Handles direct connection to Supabase database
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Store from 'electron-store';
import log from 'electron-log';

export interface SupabaseConfig {
  url: string;
  serviceKey: string;
  anonKey?: string;
}

export class SupabaseConnector {
  private client: SupabaseClient;
  private store: Store;

  constructor(store: Store, config?: SupabaseConfig) {
    this.store = store;
    
    const url = config?.url || store.get('supabaseUrl') || 'https://baqlxgwdfjltivlfmsbr.supabase.co';
    const key = config?.serviceKey || store.get('supabaseServiceKey') || process.env.SUPABASE_SERVICE_KEY;
    
    if (!url || !key) {
      throw new Error('Supabase URL and service key are required');
    }

    this.client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      db: {
        schema: 'public'
      }
    });

    log.info('Supabase connector initialized:', { url });
  }

  /**
   * Execute raw SQL query
   */
  async query(sql: string, params?: any[]): Promise<any> {
    try {
      // Use RPC function for raw SQL if available
      const { data, error } = await this.client.rpc('execute_sql', {
        query: sql,
        params: params || []
      });

      if (error) throw error;
      return data;
    } catch (error) {
      log.error('Supabase SQL query error:', error);
      throw error;
    }
  }

  /**
   * Get transactions with filters
   */
  async getTransactions(filters: any = {}): Promise<any[]> {
    try {
      let query = this.client
        .from('transactions')
        .select('*');

      // Apply filters
      if (filters.region) {
        query = query.eq('region', filters.region);
      }
      
      if (filters.barangay) {
        query = query.eq('barangay', filters.barangay);
      }
      
      if (filters.category) {
        query = query.eq('product_category', filters.category);
      }

      if (filters.startDate && filters.endDate) {
        query = query.gte('timestamp', filters.startDate)
                     .lte('timestamp', filters.endDate);
      }

      // Order and limit
      query = query.order('timestamp', { ascending: false })
                   .limit(10000);

      const { data, error } = await query;

      if (error) throw error;

      // Transform data for frontend compatibility
      return (data || []).map(record => ({
        ...record,
        // Ensure timestamp is a Date object
        timestamp: new Date(record.timestamp),
        // Convert JSON fields back to arrays if needed
        combo_basket: Array.isArray(record.combo_basket) 
          ? record.combo_basket 
          : JSON.parse(record.combo_basket || '[]')
      }));
    } catch (error) {
      log.error('Supabase getTransactions error:', error);
      throw error;
    }
  }

  /**
   * Insert new transaction
   */
  async insertTransaction(transaction: any): Promise<any> {
    try {
      const { data, error } = await this.client
        .from('transactions')
        .insert([{
          ...transaction,
          // Ensure proper data types
          combo_basket: Array.isArray(transaction.combo_basket)
            ? transaction.combo_basket
            : JSON.parse(transaction.combo_basket || '[]'),
          timestamp: new Date(transaction.timestamp).toISOString()
        }])
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      log.error('Supabase insert error:', error);
      throw error;
    }
  }

  /**
   * Bulk upsert transactions
   */
  async upsertTransactions(transactions: any[]): Promise<number> {
    try {
      const transformedTransactions = transactions.map(transaction => ({
        ...transaction,
        // Transform SQLite data to PostgreSQL format
        combo_basket: typeof transaction.combo_basket === 'string'
          ? JSON.parse(transaction.combo_basket)
          : transaction.combo_basket,
        // Convert integer booleans to actual booleans
        suggestion_accepted: Boolean(transaction.suggestion_accepted),
        substitution_occurred: Boolean(transaction.substitution_occurred),
        campaign_influenced: Boolean(transaction.campaign_influenced),
        is_tbwa_client: Boolean(transaction.is_tbwa_client),
        // Ensure timestamp is ISO string
        timestamp: new Date(transaction.timestamp).toISOString()
      }));

      const { data, error } = await this.client
        .from('transactions')
        .upsert(transformedTransactions, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select();

      if (error) throw error;

      log.info(`Upserted ${data?.length || 0} transactions to Supabase`);
      return data?.length || 0;
    } catch (error) {
      log.error('Supabase upsert error:', error);
      throw error;
    }
  }

  /**
   * Get records modified since timestamp
   */
  async getUpdatedSince(since: string): Promise<any[]> {
    try {
      const { data, error } = await this.client
        .from('transactions')
        .select('*')
        .gte('updated_at', since)
        .order('updated_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('Supabase getUpdatedSince error:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    try {
      // Use parallel queries for statistics
      const [countResult, regionStats, categoryStats] = await Promise.all([
        this.client.from('transactions').select('*', { count: 'exact', head: true }),
        this.client.from('transactions')
          .select('region, peso_value.sum()')
          .group('region')
          .order('peso_value.sum()', { ascending: false }),
        this.client.from('transactions')
          .select('product_category, peso_value.sum()')
          .group('product_category')
          .order('peso_value.sum()', { ascending: false })
      ]);

      return {
        totalTransactions: countResult.count || 0,
        topRegions: regionStats.data || [],
        topCategories: categoryStats.data || []
      };
    } catch (error) {
      log.error('Supabase getStats error:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const startTime = Date.now();
      const { error } = await this.client
        .from('transactions')
        .select('id')
        .limit(1);

      const responseTime = Date.now() - startTime;
      log.info(`Supabase health check: ${responseTime}ms`);

      return !error && responseTime < 5000; // Consider healthy if <5s
    } catch (error) {
      log.error('Supabase health check failed:', error);
      return false;
    }
  }

  /**
   * Test connection with detailed info
   */
  async testConnection(): Promise<{
    connected: boolean;
    responseTime: number;
    recordCount: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const { count, error } = await this.client
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          connected: false,
          responseTime,
          recordCount: 0,
          error: error.message
        };
      }

      return {
        connected: true,
        responseTime,
        recordCount: count || 0
      };
    } catch (error: any) {
      return {
        connected: false,
        responseTime: Date.now() - startTime,
        recordCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Get unique filter values
   */
  async getFilterOptions(): Promise<any> {
    try {
      const [regions, categories, brands] = await Promise.all([
        this.client.from('transactions').select('region').neq('region', null),
        this.client.from('transactions').select('product_category').neq('product_category', null),
        this.client.from('transactions').select('brand_name').neq('brand_name', null)
      ]);

      return {
        regions: [...new Set(regions.data?.map(r => r.region))].sort(),
        categories: [...new Set(categories.data?.map(c => c.product_category))].sort(),
        brands: [...new Set(brands.data?.map(b => b.brand_name))].sort()
      };
    } catch (error) {
      log.error('Supabase getFilterOptions error:', error);
      throw error;
    }
  }

  /**
   * Close connection (cleanup)
   */
  close(): void {
    // Supabase client doesn't need explicit closing
    log.info('Supabase connector closed');
  }
}