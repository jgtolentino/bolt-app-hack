/**
 * Supabase Connector
 * Handles Supabase PostgreSQL connections via the Supabase client
 */

import { BaseConnector } from '../BaseConnector';
import { ConnectorConfig } from '../types';

export class SupabaseConnector extends BaseConnector {
  private client: any = null;
  private url: string;
  private key: string;

  constructor(config: ConnectorConfig) {
    super(config);
    
    // Parse connection string or use config options
    if (config.connectionString.startsWith('postgresql://') || config.connectionString.startsWith('postgres://')) {
      // Parse PostgreSQL URL for Supabase
      const url = new URL(config.connectionString);
      this.url = `https://${url.hostname.split('.')[0]}.supabase.co`;
      this.key = config.options?.key || config.options?.anonKey || '';
    } else if (config.connectionString.startsWith('https://')) {
      // Direct Supabase URL
      this.url = config.connectionString;
      this.key = config.options?.key || config.options?.anonKey || '';
    } else {
      throw new Error('Invalid Supabase connection string format');
    }

    if (!this.key) {
      throw new Error('Supabase key is required');
    }
  }

  protected async connect(): Promise<void> {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      
      this.client = createClient(this.url, this.key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        db: {
          schema: 'public'
        },
        ...(this.config.options?.clientOptions || {})
      });

      // Test connection
      const { data, error } = await this.client
        .from('transactions')
        .select('id')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 = table not found, which is OK
        throw new Error(`Connection test failed: ${error.message}`);
      }

      this.connectionMetadata = {
        url: this.url,
        schema: 'public',
        clientVersion: 'latest'
      };
    } catch (error: any) {
      throw this.handleError(error, 'connection failed');
    }
  }

  protected async disconnect(): Promise<void> {
    // Supabase client doesn't need explicit disconnection
    this.client = null;
  }

  protected async executeQuery<T>(sql: string, params?: any[]): Promise<T[]> {
    this.logQuery(sql, params);
    
    try {
      if (!this.client) {
        throw new Error('Client not connected');
      }

      // For Supabase, we need to use RPC for raw SQL queries
      const { data, error } = await this.client.rpc('execute_sql', {
        query: sql,
        params: params || []
      });

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      // If RPC function doesn't exist, try to map common queries to Supabase operations
      if (error.message.includes('function execute_sql') || error.message.includes('does not exist')) {
        return this.mapSQLToSupabaseQuery<T>(sql, params);
      }
      throw this.handleError(error, 'query execution failed');
    }
  }

  protected async executeCommand(sql: string, params?: any[]): Promise<{ rowsAffected?: number }> {
    this.logQuery(sql, params);
    
    try {
      if (!this.client) {
        throw new Error('Client not connected');
      }

      // Try RPC first
      const { data, error } = await this.client.rpc('execute_sql', {
        query: sql,
        params: params || []
      });

      if (error) {
        throw new Error(`Command failed: ${error.message}`);
      }

      return {
        rowsAffected: data?.rowsAffected || 0
      };
    } catch (error: any) {
      // Fallback to mapped operations
      if (error.message.includes('function execute_sql')) {
        return this.mapSQLToSupabaseCommand(sql, params);
      }
      throw this.handleError(error, 'command execution failed');
    }
  }

  // Map common SQL queries to Supabase operations when RPC is not available
  private async mapSQLToSupabaseQuery<T>(sql: string, params?: any[]): Promise<T[]> {
    const sqlLower = sql.toLowerCase().trim();
    
    if (sqlLower.startsWith('select')) {
      // Parse basic SELECT queries
      if (sqlLower.includes('from transactions')) {
        let query = this.client.from('transactions').select('*');
        
        // Basic WHERE clause parsing
        if (sqlLower.includes('where')) {
          // This is a simplified parser - in production you'd want a proper SQL parser
          if (sqlLower.includes('region =')) {
            const regionMatch = sql.match(/region\s*=\s*['"](.*?)['"]|region\s*=\s*\$(\d+)/i);
            if (regionMatch) {
              const regionValue = regionMatch[1] || (params && params[parseInt(regionMatch[2]) - 1]);
              query = query.eq('region', regionValue);
            }
          }
        }
        
        // Basic LIMIT
        if (sqlLower.includes('limit')) {
          const limitMatch = sql.match(/limit\s+(\d+)/i);
          if (limitMatch) {
            query = query.limit(parseInt(limitMatch[1]));
          }
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      }
    }
    
    // For unsupported queries, return empty result
    console.warn(`Unsupported SQL query for Supabase mapping: ${sql.substring(0, 100)}...`);
    return [];
  }

  private async mapSQLToSupabaseCommand(sql: string, params?: any[]): Promise<{ rowsAffected?: number }> {
    // Basic INSERT/UPDATE/DELETE mapping
    console.warn(`Unsupported SQL command for Supabase mapping: ${sql.substring(0, 100)}...`);
    return { rowsAffected: 0 };
  }

  // Supabase-specific methods
  async getTransactions(filters: any = {}): Promise<T[]> {
    let query = this.client.from('transactions').select('*');
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value);
      }
    });
    
    const { data, error } = await query.limit(10000);
    if (error) throw error;
    
    return data || [];
  }

  async insertTransaction(transaction: any): Promise<any> {
    const { data, error } = await this.client
      .from('transactions')
      .insert([transaction])
      .select();
    
    if (error) throw error;
    return data?.[0];
  }

  async upsertTransactions(transactions: any[]): Promise<number> {
    const { data, error } = await this.client
      .from('transactions')
      .upsert(transactions, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) throw error;
    return data?.length || 0;
  }

  async getStats(): Promise<any> {
    const [countResult, regionStats] = await Promise.all([
      this.client.from('transactions').select('*', { count: 'exact', head: true }),
      this.client.from('transactions')
        .select('region, peso_value.sum()')
        .group('region')
        .order('peso_value.sum()', { ascending: false })
    ]);

    return {
      totalTransactions: countResult.count || 0,
      topRegions: regionStats.data || []
    };
  }

  getMetadata(): Record<string, any> {
    const baseMetadata = super.getMetadata();
    
    baseMetadata.supabase = {
      url: this.url,
      hasRPCSupport: false, // Will be determined during runtime
      apiVersion: 'v1'
    };

    return baseMetadata;
  }
}