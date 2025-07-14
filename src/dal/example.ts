/**
 * DAL Usage Example
 * Demonstrates how to use Scout's Data Abstraction Layer
 */

import { initializeDAL, getDAL, DALPresets } from './index';

// Example 1: Quick setup with presets
async function exampleQuickSetup() {
  console.log('🚀 Example 1: Quick DAL setup for web environment');
  
  try {
    // Initialize DAL for web environment
    const dal = await DALPresets.web();
    
    // Test basic query
    const result = await dal.query('SELECT COUNT(*) as total FROM transactions');
    console.log('Query result:', result);
    
    // Check health
    const health = await dal.healthCheck();
    console.log('Health status:', health);
    
    // Get metrics
    const metrics = dal.getMetrics();
    console.log('DAL metrics:', metrics);
    
    await dal.close();
  } catch (error) {
    console.error('Example 1 failed:', error);
  }
}

// Example 2: Custom configuration
async function exampleCustomConfig() {
  console.log('🚀 Example 2: Custom DAL configuration');
  
  try {
    const dal = await initializeDAL({
      defaultConnector: 'mock',
      fallbackConnector: 'mock',
      healthCheckInterval: 15000, // 15 seconds
      circuitBreaker: {
        failureThreshold: 3,
        resetTimeout: 30000,
        monitoringPeriod: 60000
      }
    }, [
      {
        id: 'mock',
        name: 'Mock Data Source',
        type: 'mock',
        connectionString: 'mock://localhost',
        enabled: true,
        options: {
          latency: 100 // 100ms simulated latency
        }
      }
    ]);
    
    // Test with mock data
    const transactions = await dal.getTransactions({ region: 'NCR' });
    console.log(`Found ${transactions.length} transactions in NCR`);
    
    // Test sync queue functionality
    try {
      await dal.execute('INSERT INTO transactions VALUES (?, ?, ?)', [
        'test_1', 'store_1', new Date().toISOString()
      ]);
      console.log('✅ Insert operation completed');
    } catch (error) {
      console.log('Insert failed, checking sync queue...');
      const queueStatus = dal.getSyncQueueStatus();
      console.log('Sync queue status:', queueStatus);
    }
    
    await dal.close();
  } catch (error) {
    console.error('Example 2 failed:', error);
  }
}

// Example 3: Singleton pattern usage
async function exampleSingleton() {
  console.log('🚀 Example 3: Using singleton DAL instance');
  
  try {
    // Get the global DAL instance (auto-detects environment)
    const dal = await getDAL();
    
    // The DAL will automatically choose the best connector for the environment
    const connectorStatus = dal.getConnectorStatus();
    console.log('Available connectors:', Object.keys(connectorStatus));
    
    // Start health monitoring
    dal.startHealthMonitoring();
    
    // Test fallback behavior
    console.log('Testing fallback behavior...');
    
    // This should work even if primary connector is down
    const stats = await dal.query(`
      SELECT 
        COUNT(*) as total_transactions,
        AVG(peso_value) as avg_value
      FROM transactions
    `);
    
    console.log('Transaction stats:', stats.data);
    
    // Stop monitoring before closing
    dal.stopHealthMonitoring();
  } catch (error) {
    console.error('Example 3 failed:', error);
  }
}

// Example 4: Circuit breaker and retry behavior
async function exampleCircuitBreaker() {
  console.log('🚀 Example 4: Circuit breaker demonstration');
  
  try {
    const dal = await initializeDAL({
      defaultConnector: 'mock',
      circuitBreaker: {
        failureThreshold: 2, // Fail fast for demo
        resetTimeout: 5000,  // 5 second reset
        monitoringPeriod: 10000
      }
    });
    
    // Simulate multiple failures to trigger circuit breaker
    for (let i = 0; i < 5; i++) {
      try {
        // This query will fail on mock connector
        await dal.query('SELECT * FROM nonexistent_table');
      } catch (error) {
        console.log(`Attempt ${i + 1} failed:`, error.message);
        
        // Check circuit breaker state
        const metrics = dal.getMetrics();
        console.log('Circuit breaker states:', metrics.circuitBreakerState);
      }
      
      // Wait between attempts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    await dal.close();
  } catch (error) {
    console.error('Example 4 failed:', error);
  }
}

// Example 5: Connector switching
async function exampleConnectorSwitching() {
  console.log('🚀 Example 5: Dynamic connector switching');
  
  try {
    const dal = await initializeDAL({}, [
      {
        id: 'mock1',
        name: 'Mock Connector 1',
        type: 'mock',
        connectionString: 'mock://server1',
        enabled: true,
        options: { latency: 50 }
      },
      {
        id: 'mock2',
        name: 'Mock Connector 2', 
        type: 'mock',
        connectionString: 'mock://server2',
        enabled: true,
        options: { latency: 200 }
      }
    ]);
    
    // Test with first connector
    const start1 = Date.now();
    await dal.query('SELECT 1');
    const time1 = Date.now() - start1;
    console.log(`Query time with mock1: ${time1}ms`);
    
    // Switch to second connector
    await dal.setActiveConnector('mock2');
    
    // Test with second connector
    const start2 = Date.now();
    await dal.query('SELECT 1');
    const time2 = Date.now() - start2;
    console.log(`Query time with mock2: ${time2}ms`);
    
    // Show connector status
    const status = dal.getConnectorStatus();
    Object.entries(status).forEach(([id, info]) => {
      console.log(`${id}: active=${info.isActive}, latency=${info.mock?.latency}ms`);
    });
    
    await dal.close();
  } catch (error) {
    console.error('Example 5 failed:', error);
  }
}

// Run all examples
export async function runDALExamples() {
  console.log('🎯 Running Scout DAL Examples...\n');
  
  await exampleQuickSetup();
  console.log('\n---\n');
  
  await exampleCustomConfig();
  console.log('\n---\n');
  
  await exampleSingleton();
  console.log('\n---\n');
  
  await exampleCircuitBreaker();
  console.log('\n---\n');
  
  await exampleConnectorSwitching();
  
  console.log('\n🎉 All DAL examples completed!');
}

// Export for testing
export {
  exampleQuickSetup,
  exampleCustomConfig,
  exampleSingleton,
  exampleCircuitBreaker,
  exampleConnectorSwitching
};

// Run examples if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runDALExamples().catch(console.error);
}