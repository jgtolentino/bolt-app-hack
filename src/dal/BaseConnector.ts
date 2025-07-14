/**
 * Base Connector Class
 * Provides common functionality for all DAL connectors
 */

import { DALConnector, ConnectorConfig, HealthStatus, QueryResult } from './types';

export abstract class BaseConnector implements DALConnector {
  public readonly id: string;
  public readonly name: string;
  public readonly type: string;
  protected config: ConnectorConfig;
  protected connected: boolean = false;
  protected lastHealthCheck?: Date;
  protected connectionMetadata: Record<string, any> = {};

  constructor(config: ConnectorConfig) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.config = config;
  }

  // Abstract methods that must be implemented by concrete connectors
  protected abstract connect(): Promise<void>;
  protected abstract disconnect(): Promise<void>;
  protected abstract executeQuery<T>(sql: string, params?: any[]): Promise<T[]>;
  protected abstract executeCommand(sql: string, params?: any[]): Promise<{ rowsAffected?: number }>;

  // Core DAL operations
  async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    const startTime = Date.now();
    
    try {
      await this.ensureConnected();
      const data = await this.executeQuery<T>(sql, params);
      const responseTime = Date.now() - startTime;
      
      return {
        data,
        total: data.length,
        success: true,
        responseTime
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      return {
        data: [],
        success: false,
        error: error.message,
        responseTime
      };
    }
  }

  async execute(sql: string, params?: any[]): Promise<{ success: boolean; rowsAffected?: number }> {
    try {
      await this.ensureConnected();
      const result = await this.executeCommand(sql, params);
      
      return {
        success: true,
        rowsAffected: result.rowsAffected
      };
    } catch (error: any) {
      return {
        success: false
      };
    }
  }

  // Health management
  async ping(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Try a simple query
      await this.query('SELECT 1 as ping');
      const responseTime = Date.now() - startTime;
      
      const status: HealthStatus = {
        connected: true,
        responseTime,
        lastCheck: new Date()
      };
      
      this.lastHealthCheck = status.lastCheck;
      return status;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      const status: HealthStatus = {
        connected: false,
        responseTime,
        lastCheck: new Date(),
        error: error.message
      };
      
      this.lastHealthCheck = status.lastCheck;
      this.connected = false;
      return status;
    }
  }

  async close(): Promise<void> {
    try {
      await this.disconnect();
      this.connected = false;
    } catch (error) {
      console.warn(`Error closing connector ${this.id}:`, error);
    }
  }

  // Metadata and status
  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      connected: this.connected,
      lastHealthCheck: this.lastHealthCheck,
      config: {
        ...this.config,
        connectionString: this.maskConnectionString(this.config.connectionString)
      },
      ...this.connectionMetadata
    };
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Protected utilities
  protected async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.connect();
      this.connected = true;
    }
  }

  protected maskConnectionString(connectionString: string): string {
    // Mask sensitive information in connection strings
    return connectionString.replace(/(password|key|secret)=[^;]+/gi, '$1=***');
  }

  protected logQuery(sql: string, params?: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.id}] Query:`, sql.substring(0, 100), params ? `(${params.length} params)` : '');
    }
  }

  protected handleError(error: any, context: string): Error {
    const message = `[${this.id}] ${context}: ${error.message}`;
    console.error(message, error);
    return new Error(message);
  }
}