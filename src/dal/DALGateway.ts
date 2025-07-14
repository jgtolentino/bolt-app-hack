/**
 * DAL Gateway
 * Central orchestrator for Scout's Data Abstraction Layer
 * Manages connectors, health checking, circuit breakers, and fallback logic
 */

import { 
  DALConnector, 
  ConnectorConfig, 
  DALGatewayConfig, 
  QueryResult, 
  HealthStatus,
  DALMetrics,
  SyncQueueItem,
  CircuitBreakerState
} from './types';
import { CircuitBreaker } from './CircuitBreaker';
import { SyncQueue, createSQLSyncQueue } from './SyncQueue';

// Connector imports
import { SQLiteConnector } from './connectors/SQLiteConnector';
import { SupabaseConnector } from './connectors/SupabaseConnector';
import { MockConnector } from './connectors/MockConnector';

export class DALGateway {
  private connectors: Map<string, DALConnector> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private config: DALGatewayConfig;
  private activeConnectorId: string;
  private healthCheckInterval?: NodeJS.Timeout;
  private syncQueue: SyncQueue;
  private syncInterval?: NodeJS.Timeout;
  private metrics: DALMetrics;

  constructor(config: Partial<DALGatewayConfig> = {}) {
    this.config = {
      defaultConnector: 'mock',
      fallbackConnector: 'mock',
      healthCheckInterval: 30000, // 30 seconds
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 60000
      },
      retryPolicy: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000
      },
      ...config
    };

    this.activeConnectorId = this.config.defaultConnector;
    this.metrics = this.initializeMetrics();
    
    // Initialize sync queue
    this.syncQueue = createSQLSyncQueue({
      maxQueueSize: 5000,
      persistToStorage: true
    });
    
    console.log('🌐 DAL Gateway initialized with config:', {
      default: this.config.defaultConnector,
      fallback: this.config.fallbackConnector,
      healthInterval: this.config.healthCheckInterval,
      syncQueueEnabled: true
    });
  }

  // Connector Management
  async registerConnector(config: ConnectorConfig): Promise<void> {
    try {
      let connector: DALConnector;

      switch (config.type) {
        case 'sqlite':
          connector = new SQLiteConnector(config);
          break;
        case 'supabase':
        case 'postgresql':
          connector = new SupabaseConnector(config);
          break;
        case 'mock':
          connector = new MockConnector(config);
          break;
        default:
          throw new Error(`Unsupported connector type: ${config.type}`);
      }

      // Create circuit breaker for this connector
      const circuitBreaker = new CircuitBreaker(
        this.config.circuitBreaker,
        (state) => this.onCircuitBreakerStateChange(config.id, state)
      );

      this.connectors.set(config.id, connector);
      this.circuitBreakers.set(config.id, circuitBreaker);

      // Test connection
      try {
        await connector.ping();
        console.log(`✅ Connector registered: ${config.id} (${config.type})`);
      } catch (error) {
        console.warn(`⚠️ Connector registered but unhealthy: ${config.id}`, error);
      }

    } catch (error: any) {
      console.error(`❌ Failed to register connector ${config.id}:`, error);
      throw error;
    }
  }

  async setActiveConnector(connectorId: string): Promise<void> {
    if (!this.connectors.has(connectorId)) {
      throw new Error(`Connector not found: ${connectorId}`);
    }

    const connector = this.connectors.get(connectorId)!;
    const circuitBreaker = this.circuitBreakers.get(connectorId)!;

    try {
      // Test connection before switching
      await circuitBreaker.execute(() => connector.ping());
      
      this.activeConnectorId = connectorId;
      console.log(`🔄 Switched to connector: ${connectorId}`);
      
      // Process sync queue if we're coming back online
      this.processSyncQueue();
      
    } catch (error) {
      console.warn(`Failed to switch to connector ${connectorId}:`, error);
      throw error;
    }
  }

  // Core Query Operations
  async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    const startTime = Date.now();
    this.metrics.totalQueries++;

    try {
      const result = await this.executeWithFallback(
        (connector) => connector.query<T>(sql, params)
      );

      this.metrics.successfulQueries++;
      this.updateAverageResponseTime(Date.now() - startTime);
      
      return result;
    } catch (error: any) {
      this.metrics.failedQueries++;
      console.error('DAL Query failed:', error);
      
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  async execute(sql: string, params?: any[]): Promise<{ success: boolean; rowsAffected?: number }> {
    try {
      return await this.executeWithFallback(
        (connector) => connector.execute(sql, params)
      );
    } catch (error: any) {
      // If write fails, queue it for sync later
      if (this.shouldQueueOperation(sql)) {
        try {
          this.syncQueue.enqueue({
            operation: this.parseOperationType(sql),
            table: this.parseTableName(sql),
            data: { sql, params }
          });
          
          console.log('📋 Operation queued for later sync due to failure');
          
          // Return success since we've queued it
          return { success: true, rowsAffected: 0 };
        } catch (queueError) {
          console.error('Failed to queue operation:', queueError);
        }
      }
      
      throw new Error(`Execute failed: ${error.message}`);
    }
  }

  // High-level data operations
  async getTransactions(filters: Record<string, any> = {}): Promise<any[]> {
    // Build SQL query from filters
    let sql = 'SELECT * FROM transactions';
    const params: any[] = [];
    const conditions: string[] = [];

    Object.entries(filters).forEach(([key, value], index) => {
      if (value !== undefined && value !== null && value !== '') {
        conditions.push(`${key} = $${index + 1}`);
        params.push(value);
      }
    });

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY timestamp DESC LIMIT 10000';

    const result = await this.query(sql, params);
    return result.data;
  }

  // Health Management
  async healthCheck(): Promise<Record<string, HealthStatus>> {
    const health: Record<string, HealthStatus> = {};

    for (const [id, connector] of this.connectors) {
      try {
        health[id] = await connector.ping();
      } catch (error: any) {
        health[id] = {
          connected: false,
          responseTime: 0,
          lastCheck: new Date(),
          error: error.message
        };
      }
    }

    this.metrics.lastHealthCheck = new Date();
    return health;
  }

  startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.healthCheck();
        const activeHealth = health[this.activeConnectorId];

        if (!activeHealth?.connected && this.config.fallbackConnector) {
          console.warn(`Active connector ${this.activeConnectorId} unhealthy, checking fallback...`);
          
          const fallbackHealth = health[this.config.fallbackConnector];
          if (fallbackHealth?.connected) {
            console.log(`Switching to fallback connector: ${this.config.fallbackConnector}`);
            this.activeConnectorId = this.config.fallbackConnector;
            
            // Process sync queue when coming back online
            this.processSyncQueue();
          }
        } else if (activeHealth?.connected) {
          // Primary connector is healthy, process any queued operations
          this.processSyncQueue();
        }
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, this.config.healthCheckInterval);

    // Also start sync queue processing interval
    this.startSyncQueueProcessing();

    console.log(`🔍 Health monitoring started (${this.config.healthCheckInterval}ms interval)`);
  }

  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
  }

  // Circuit Breaker Event Handler
  private onCircuitBreakerStateChange(connectorId: string, state: CircuitBreakerState): void {
    console.log(`🔌 Circuit breaker state changed for ${connectorId}:`, state.state);
    
    this.metrics.circuitBreakerState[connectorId] = state;

    // If active connector circuit opens, try fallback
    if (connectorId === this.activeConnectorId && state.state === 'OPEN' && this.config.fallbackConnector) {
      console.log(`⚠️ Active connector circuit opened, switching to fallback: ${this.config.fallbackConnector}`);
      this.activeConnectorId = this.config.fallbackConnector;
    }
  }

  // Fallback Execution
  private async executeWithFallback<T>(
    operation: (connector: DALConnector) => Promise<T>
  ): Promise<T> {
    const connector = this.connectors.get(this.activeConnectorId);
    if (!connector) {
      throw new Error(`Active connector not found: ${this.activeConnectorId}`);
    }

    const circuitBreaker = this.circuitBreakers.get(this.activeConnectorId)!;

    try {
      return await circuitBreaker.execute(() => operation(connector));
    } catch (error) {
      // Try fallback if available and different from active
      if (this.config.fallbackConnector && 
          this.config.fallbackConnector !== this.activeConnectorId) {
        
        console.warn(`Operation failed on ${this.activeConnectorId}, trying fallback...`);
        
        const fallbackConnector = this.connectors.get(this.config.fallbackConnector);
        const fallbackCircuitBreaker = this.circuitBreakers.get(this.config.fallbackConnector);
        
        if (fallbackConnector && fallbackCircuitBreaker) {
          try {
            return await fallbackCircuitBreaker.execute(() => operation(fallbackConnector));
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
          }
        }
      }
      
      throw error;
    }
  }

  // Sync Queue Management
  private startSyncQueueProcessing(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Process sync queue every minute
    this.syncInterval = setInterval(() => {
      this.processSyncQueue();
    }, 60000);
  }

  private async processSyncQueue(): Promise<void> {
    const queueStatus = this.syncQueue.getStatus();
    
    if (queueStatus.items.length === 0 || queueStatus.isProcessing) {
      return;
    }

    try {
      await this.syncQueue.processQueue(async (item) => {
        // Try to execute the queued operation
        try {
          const result = await this.executeWithFallback(
            (connector) => connector.execute(item.data.sql, item.data.params)
          );
          
          return result.success;
        } catch (error) {
          console.warn(`Sync queue item failed: ${item.id}`, error);
          return false;
        }
      });
    } catch (error) {
      console.error('Error processing sync queue:', error);
    }
  }

  // SQL parsing utilities for sync queue
  private shouldQueueOperation(sql: string): boolean {
    const sqlLower = sql.toLowerCase().trim();
    return sqlLower.startsWith('insert') || 
           sqlLower.startsWith('update') || 
           sqlLower.startsWith('delete');
  }

  private parseOperationType(sql: string): 'INSERT' | 'UPDATE' | 'DELETE' {
    const sqlLower = sql.toLowerCase().trim();
    
    if (sqlLower.startsWith('insert')) return 'INSERT';
    if (sqlLower.startsWith('update')) return 'UPDATE';
    if (sqlLower.startsWith('delete')) return 'DELETE';
    
    return 'INSERT'; // Default fallback
  }

  private parseTableName(sql: string): string {
    const sqlLower = sql.toLowerCase().trim();
    
    // Simple table name extraction
    let match = sqlLower.match(/(?:insert\s+into|update|delete\s+from)\s+(\w+)/);
    return match?.[1] || 'unknown';
  }

  // Metrics and Status
  getMetrics(): DALMetrics {
    const syncQueueStatus = this.syncQueue.getStatus();
    
    return {
      ...this.metrics,
      activeConnections: this.connectors.size,
      syncQueue: {
        pendingItems: syncQueueStatus.items.length,
        isProcessing: syncQueueStatus.isProcessing,
        metrics: syncQueueStatus.metrics
      }
    };
  }

  getConnectorStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    for (const [id, connector] of this.connectors) {
      const circuitBreaker = this.circuitBreakers.get(id);
      
      status[id] = {
        ...connector.getMetadata(),
        isActive: id === this.activeConnectorId,
        circuitBreaker: circuitBreaker?.getMetrics(),
        health: this.metrics.circuitBreakerState[id]
      };
    }
    
    return status;
  }

  // Sync Queue Public API
  getSyncQueueStatus(): any {
    return this.syncQueue.getStatus();
  }

  clearSyncQueue(): void {
    this.syncQueue.clear();
  }

  async forceSyncQueue(): Promise<void> {
    await this.processSyncQueue();
  }

  // Cleanup
  async close(): Promise<void> {
    this.stopHealthMonitoring();
    
    // Close all connectors
    for (const [id, connector] of this.connectors) {
      try {
        await connector.close();
        console.log(`Closed connector: ${id}`);
      } catch (error) {
        console.warn(`Error closing connector ${id}:`, error);
      }
    }
    
    this.connectors.clear();
    this.circuitBreakers.clear();
  }

  // Private utilities
  private initializeMetrics(): DALMetrics {
    return {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageResponseTime: 0,
      activeConnections: 0,
      circuitBreakerState: {},
      lastHealthCheck: new Date()
    };
  }

  private updateAverageResponseTime(responseTime: number): void {
    const totalQueries = this.metrics.totalQueries;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalQueries - 1) + responseTime) / totalQueries;
  }
}