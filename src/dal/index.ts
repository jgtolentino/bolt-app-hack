/**
 * Scout DAL (Data Abstraction Layer)
 * Central export point for all DAL components
 */

// Core components
export { DALGateway } from './DALGateway';
export { BaseConnector } from './BaseConnector';
export { CircuitBreaker } from './CircuitBreaker';

// Connectors
export { SQLiteConnector } from './connectors/SQLiteConnector';
export { SupabaseConnector } from './connectors/SupabaseConnector';
export { MockConnector } from './connectors/MockConnector';

// Types
export * from './types';

// DAL Factory and Configuration
import { DALGateway } from './DALGateway';
import { ConnectorConfig, DALGatewayConfig } from './types';

/**
 * Default DAL configuration for Scout Analytics
 */
export const DEFAULT_DAL_CONFIG: Partial<DALGatewayConfig> = {
  defaultConnector: 'local',
  fallbackConnector: 'mock',
  healthCheckInterval: 30000, // 30 seconds
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    monitoringPeriod: 60000
  },
  retryPolicy: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000
  }
};

/**
 * Default connector configurations for Scout Analytics
 */
export const DEFAULT_CONNECTORS: ConnectorConfig[] = [
  {
    id: 'local',
    name: 'Local SQLite',
    type: 'sqlite',
    connectionString: './data/scout.db',
    priority: 1,
    enabled: true,
    options: {
      verbose: false
    }
  },
  {
    id: 'supabase',
    name: 'Supabase Cloud',
    type: 'supabase',
    connectionString: 'https://baqlxgwdfjltivlfmsbr.supabase.co',
    priority: 2,
    enabled: true,
    options: {
      key: process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }
  },
  {
    id: 'remote',
    name: 'MCP SQLite Server',
    type: 'sqlite', // Note: This would need a custom connector for HTTP-based SQLite
    connectionString: 'https://mcp-sqlite-server-1.onrender.com',
    priority: 3,
    enabled: true,
    options: {
      httpBased: true
    }
  },
  {
    id: 'mock',
    name: 'Mock Data',
    type: 'mock',
    connectionString: 'mock://localhost',
    priority: 4,
    enabled: true,
    options: {
      latency: 50
    }
  }
];

/**
 * Initialize DAL Gateway with default Scout configuration
 */
export async function initializeDAL(
  customConfig?: Partial<DALGatewayConfig>,
  customConnectors?: ConnectorConfig[]
): Promise<DALGateway> {
  
  const config = { ...DEFAULT_DAL_CONFIG, ...customConfig };
  const connectors = customConnectors || DEFAULT_CONNECTORS;
  
  console.log('🚀 Initializing Scout DAL Gateway...');
  
  const gateway = new DALGateway(config);
  
  // Register connectors
  for (const connectorConfig of connectors) {
    if (connectorConfig.enabled) {
      try {
        await gateway.registerConnector(connectorConfig);
      } catch (error) {
        console.warn(`Failed to register connector ${connectorConfig.id}:`, error);
      }
    }
  }
  
  // Set active connector (try in priority order)
  const enabledConnectors = connectors
    .filter(c => c.enabled)
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));
  
  for (const connector of enabledConnectors) {
    try {
      await gateway.setActiveConnector(connector.id);
      console.log(`✅ DAL Gateway active with connector: ${connector.id}`);
      break;
    } catch (error) {
      console.warn(`Failed to activate connector ${connector.id}:`, error);
    }
  }
  
  // Start health monitoring
  gateway.startHealthMonitoring();
  
  return gateway;
}

/**
 * Quick setup for different environments
 */
export const DALPresets = {
  
  // Desktop Electron app
  desktop: () => initializeDAL({
    defaultConnector: 'local',
    fallbackConnector: 'mock'
  }, [
    DEFAULT_CONNECTORS.find(c => c.id === 'local')!,
    {
      ...DEFAULT_CONNECTORS.find(c => c.id === 'supabase')!,
      priority: 2
    },
    DEFAULT_CONNECTORS.find(c => c.id === 'mock')!
  ]),
  
  // Web application
  web: () => initializeDAL({
    defaultConnector: 'supabase',
    fallbackConnector: 'mock'
  }, [
    DEFAULT_CONNECTORS.find(c => c.id === 'supabase')!,
    DEFAULT_CONNECTORS.find(c => c.id === 'remote')!,
    DEFAULT_CONNECTORS.find(c => c.id === 'mock')!
  ]),
  
  // Development/testing
  development: () => initializeDAL({
    defaultConnector: 'mock',
    fallbackConnector: 'mock',
    healthCheckInterval: 10000 // More frequent in dev
  }, [
    {
      ...DEFAULT_CONNECTORS.find(c => c.id === 'mock')!,
      options: { latency: 100 }
    }
  ]),
  
  // Production optimized
  production: () => initializeDAL({
    defaultConnector: 'supabase',
    fallbackConnector: 'local',
    circuitBreaker: {
      failureThreshold: 3, // Fail faster in production
      resetTimeout: 30000,
      monitoringPeriod: 60000
    }
  })
};

/**
 * Singleton DAL Gateway instance
 * Use this for simple applications that need only one DAL instance
 */
let globalDAL: DALGateway | null = null;

export async function getDAL(): Promise<DALGateway> {
  if (!globalDAL) {
    // Auto-detect environment
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
    const isNode = typeof window === 'undefined';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      globalDAL = await DALPresets.development();
    } else if (isElectron || isNode) {
      globalDAL = await DALPresets.desktop();
    } else {
      globalDAL = await DALPresets.web();
    }
  }
  
  return globalDAL;
}

export function resetDAL(): void {
  if (globalDAL) {
    globalDAL.close();
    globalDAL = null;
  }
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', () => {
    if (globalDAL) {
      globalDAL.close();
    }
  });
}