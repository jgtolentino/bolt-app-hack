# Scout Data Abstraction Layer (DAL)

The Scout DAL provides a unified interface for data access across multiple sources with built-in reliability features including circuit breakers, health monitoring, automatic failover, and offline sync capabilities.

## 🎯 Architecture Overview

```
┌────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ React App  │────▶│   DAL Gateway   │────▶│   Connectors    │
│ Components │     │                 │     │                 │
└────────────┘     │ • Health Check  │     │ • SQLite        │
                   │ • Circuit Break │     │ • Supabase      │
                   │ • Sync Queue    │     │ • Mock          │
                   │ • Metrics       │     │ • Custom        │
                   └─────────────────┘     └─────────────────┘
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { getDAL } from './dal';

// Get auto-configured DAL instance
const dal = await getDAL();

// Query data
const transactions = await dal.getTransactions({ region: 'NCR' });

// Execute commands
await dal.execute('INSERT INTO transactions VALUES (?, ?, ?)', [
  'txn_123', 'store_1', new Date().toISOString()
]);

// Check health
const health = await dal.healthCheck();
```

### Environment Presets

```typescript
import { DALPresets } from './dal';

// For desktop Electron apps
const dal = await DALPresets.desktop();

// For web applications  
const dal = await DALPresets.web();

// For development/testing
const dal = await DALPresets.development();

// For production
const dal = await DALPresets.production();
```

## 🔧 Configuration

### Custom DAL Setup

```typescript
import { initializeDAL } from './dal';

const dal = await initializeDAL({
  defaultConnector: 'local',
  fallbackConnector: 'mock',
  healthCheckInterval: 30000, // 30 seconds
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 60000,      // 1 minute
    monitoringPeriod: 60000
  },
  retryPolicy: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000
  }
});
```

### Connector Configuration

```typescript
const connectors = [
  {
    id: 'local',
    name: 'Local SQLite',
    type: 'sqlite',
    connectionString: './data/scout.db',
    priority: 1,
    enabled: true
  },
  {
    id: 'cloud',
    name: 'Supabase Cloud',
    type: 'supabase', 
    connectionString: 'https://your-project.supabase.co',
    priority: 2,
    enabled: true,
    options: {
      key: process.env.SUPABASE_SERVICE_KEY
    }
  }
];

const dal = await initializeDAL(config, connectors);
```

## 📊 Available Connectors

### SQLite Connector
- **Type**: `sqlite`
- **Use Case**: Local desktop storage, development
- **Features**: Full SQL support, transactions, WAL mode
- **Connection**: File path or `:memory:`

```typescript
{
  id: 'local',
  type: 'sqlite',
  connectionString: './data/scout.db',
  options: {
    verbose: false // Enable SQL logging
  }
}
```

### Supabase Connector
- **Type**: `supabase`
- **Use Case**: Cloud PostgreSQL with REST API
- **Features**: Real-time, auth integration, edge functions
- **Connection**: Supabase project URL + API key

```typescript
{
  id: 'cloud',
  type: 'supabase',
  connectionString: 'https://project.supabase.co',
  options: {
    key: 'your-anon-or-service-key',
    clientOptions: {
      auth: { persistSession: false }
    }
  }
}
```

### Mock Connector
- **Type**: `mock`
- **Use Case**: Testing, fallback, development
- **Features**: Simulated latency, realistic data
- **Connection**: `mock://localhost`

```typescript
{
  id: 'mock',
  type: 'mock', 
  connectionString: 'mock://localhost',
  options: {
    latency: 50 // Simulated network delay (ms)
  }
}
```

## 🔄 Circuit Breaker & Health

### Automatic Failover

The DAL automatically monitors connector health and switches to fallback connectors when failures are detected:

```typescript
// Start health monitoring (automatic with presets)
dal.startHealthMonitoring();

// Manual health check
const health = await dal.healthCheck();
console.log(health);
// {
//   local: { connected: true, responseTime: 45 },
//   cloud: { connected: false, error: "timeout" }
// }

// Get circuit breaker states
const metrics = dal.getMetrics();
console.log(metrics.circuitBreakerState);
```

### Manual Connector Switching

```typescript
// Switch to specific connector
await dal.setActiveConnector('cloud');

// Check current status
const status = dal.getConnectorStatus();
Object.entries(status).forEach(([id, info]) => {
  console.log(`${id}: active=${info.isActive}, health=${info.connected}`);
});
```

## 📋 Offline Sync Queue

When write operations fail, they're automatically queued for retry when connectivity is restored:

```typescript
// Queued operations are handled automatically
try {
  await dal.execute('INSERT INTO transactions VALUES (?, ?)', ['id', 'data']);
} catch (error) {
  // Operation was queued for later sync
  console.log('Operation queued for retry');
}

// Check sync queue status
const queueStatus = dal.getSyncQueueStatus();
console.log(`${queueStatus.items.length} operations pending sync`);

// Force immediate sync attempt
await dal.forceSyncQueue();

// Clear queue (if needed)
dal.clearSyncQueue();
```

## 📈 Monitoring & Metrics

### Performance Metrics

```typescript
const metrics = dal.getMetrics();
console.log({
  totalQueries: metrics.totalQueries,
  successRate: metrics.successfulQueries / metrics.totalQueries,
  avgResponseTime: metrics.averageResponseTime,
  activeConnections: metrics.activeConnections,
  queuedOperations: metrics.syncQueue?.pendingItems
});
```

### Detailed Status

```typescript
const status = dal.getConnectorStatus();
// Returns detailed info for each connector:
// - Connection metadata
// - Circuit breaker state  
// - Health metrics
// - Configuration
```

## 🎯 Data Operations

### Standard Queries

```typescript
// Raw SQL queries
const result = await dal.query('SELECT * FROM transactions WHERE region = ?', ['NCR']);

// Execute commands
await dal.execute('UPDATE transactions SET processed = 1 WHERE id = ?', ['txn_123']);
```

### High-Level Methods

```typescript
// Get filtered transactions
const transactions = await dal.getTransactions({
  region: 'NCR',
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// Get paginated results
const page1 = await dal.query('SELECT * FROM transactions LIMIT 100 OFFSET 0');
const page2 = await dal.query('SELECT * FROM transactions LIMIT 100 OFFSET 100');
```

## 🔒 Security Considerations

1. **Service Keys**: Only use service role keys in server environments
2. **Connection Strings**: Mask sensitive data in logs
3. **Query Validation**: Sanitize user inputs 
4. **RLS**: Enable Row Level Security for Supabase tables

```typescript
// Connection strings are automatically masked in logs
const connector = dal.getConnectorStatus()['cloud'];
console.log(connector.config.connectionString); 
// "https://project.supabase.co" (key is hidden)
```

## 🧪 Testing

### Unit Tests

```typescript
import { initializeDAL } from './dal';

describe('DAL Gateway', () => {
  let dal;
  
  beforeEach(async () => {
    dal = await initializeDAL({
      defaultConnector: 'mock'
    }, [{
      id: 'mock',
      type: 'mock',
      connectionString: 'mock://test',
      enabled: true
    }]);
  });
  
  afterEach(async () => {
    await dal.close();
  });
  
  test('should handle queries', async () => {
    const result = await dal.query('SELECT 1');
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests

```typescript
// Test real connectors in CI/CD
const dal = await initializeDAL({}, [
  {
    id: 'test-db',
    type: 'sqlite',
    connectionString: ':memory:',
    enabled: true
  }
]);

// Setup test schema
await dal.execute(`
  CREATE TABLE test_transactions (
    id TEXT PRIMARY KEY,
    amount REAL,
    created_at TEXT
  )
`);

// Run tests...
```

## 🚨 Error Handling

### Common Error Patterns

```typescript
try {
  const result = await dal.query('SELECT * FROM transactions');
  
  if (!result.success) {
    console.error('Query failed:', result.error);
    return;
  }
  
  // Process result.data
} catch (error) {
  if (error.message.includes('Circuit breaker is OPEN')) {
    // All connectors are down
    console.log('System temporarily unavailable');
  } else if (error.message.includes('timeout')) {
    // Slow network
    console.log('Request timed out, retrying...');
  } else {
    // Other errors
    console.error('Unexpected error:', error);
  }
}
```

### Graceful Degradation

```typescript
async function getTransactionsWithFallback() {
  try {
    return await dal.getTransactions();
  } catch (error) {
    console.warn('DAL unavailable, using cached data');
    return getCachedTransactions();
  }
}
```

## 🔧 Advanced Usage

### Custom Connector

```typescript
import { BaseConnector, ConnectorConfig } from './dal';

class CustomConnector extends BaseConnector {
  protected async connect(): Promise<void> {
    // Implement connection logic
  }
  
  protected async executeQuery<T>(sql: string, params?: any[]): Promise<T[]> {
    // Implement query execution
  }
  
  // ... other required methods
}

// Register custom connector
dal.registerConnector({
  id: 'custom',
  type: 'custom' as any,
  // ... config
});
```

### Event Handling

```typescript
// Circuit breaker state changes are logged automatically
// Custom handling can be added via connector callbacks

const connector = new SupabaseConnector(config);
// Events are handled internally by the DAL Gateway
```

## 📚 API Reference

### DALGateway Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `query<T>(sql, params?)` | Execute SELECT query | `Promise<QueryResult<T>>` |
| `execute(sql, params?)` | Execute INSERT/UPDATE/DELETE | `Promise<{success, rowsAffected}>` |
| `getTransactions(filters?)` | Get filtered transactions | `Promise<Transaction[]>` |
| `healthCheck()` | Check all connector health | `Promise<Record<string, HealthStatus>>` |
| `setActiveConnector(id)` | Switch active connector | `Promise<void>` |
| `startHealthMonitoring()` | Start background health checks | `void` |
| `stopHealthMonitoring()` | Stop health monitoring | `void` |
| `getMetrics()` | Get performance metrics | `DALMetrics` |
| `getConnectorStatus()` | Get detailed connector info | `Record<string, any>` |
| `getSyncQueueStatus()` | Get sync queue status | `SyncQueueStatus` |
| `forceSyncQueue()` | Process sync queue immediately | `Promise<void>` |
| `clearSyncQueue()` | Clear all queued operations | `void` |
| `close()` | Close all connections | `Promise<void>` |

### Configuration Types

See `src/dal/types.ts` for complete type definitions.

## 🤝 Contributing

1. Add new connectors by extending `BaseConnector`
2. Update tests for new functionality
3. Document configuration options
4. Follow existing patterns for error handling

## 📄 License

Part of the Scout Analytics system.