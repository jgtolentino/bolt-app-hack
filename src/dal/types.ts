/**
 * DAL (Data Abstraction Layer) Types
 * Defines interfaces for Scout's unified data access layer
 */

export interface QueryResult<T = any> {
  data: T[];
  total?: number;
  success: boolean;
  error?: string;
  responseTime: number;
}

export interface HealthStatus {
  connected: boolean;
  responseTime: number;
  lastCheck: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ConnectorConfig {
  id: string;
  name: string;
  type: 'sqlite' | 'postgresql' | 'supabase' | 'mock' | 'odbc';
  connectionString: string;
  options?: Record<string, any>;
  priority?: number;
  enabled?: boolean;
}

export interface DALConnector {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  
  // Core operations
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  execute(sql: string, params?: any[]): Promise<{ success: boolean; rowsAffected?: number }>;
  
  // Health management
  ping(): Promise<HealthStatus>;
  close(): Promise<void>;
  
  // Metadata
  getMetadata(): Record<string, any>;
  isConnected(): boolean;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

export interface DALGatewayConfig {
  defaultConnector: string;
  fallbackConnector?: string;
  healthCheckInterval: number;
  circuitBreaker: CircuitBreakerOptions;
  retryPolicy: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  };
}

export interface SyncQueueItem {
  id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  data: any;
  timestamp: Date;
  retries: number;
}

export interface DALMetrics {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageResponseTime: number;
  activeConnections: number;
  circuitBreakerState: Record<string, CircuitBreakerState>;
  lastHealthCheck: Date;
  syncQueue?: {
    pendingItems: number;
    isProcessing: boolean;
    metrics: any;
  };
}