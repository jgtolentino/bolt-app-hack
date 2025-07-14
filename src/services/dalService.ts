/**
 * DAL Service for Scout Dashboard
 * Replaces apiService with DAL Gateway-based data access
 * Provides the same interface while using the unified DAL
 */

import { getDAL, DALGateway } from '../dal';
import { Transaction } from './apiService'; // Reuse existing types

// Data transformation utilities (same as apiService)
const transformTimestamp = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(item => ({
      ...item,
      timestamp: typeof item.timestamp === 'string' 
        ? new Date(item.timestamp) 
        : item.timestamp || new Date()
    }));
  }
  return data;
};

class DALService {
  private dalGateway?: DALGateway;
  private initialized = false;

  /**
   * Lazy initialization of DAL Gateway
   */
  private async ensureInitialized(): Promise<DALGateway> {
    if (!this.dalGateway) {
      try {
        this.dalGateway = await getDAL();
        this.initialized = true;
        console.log('🌐 DAL Service initialized');
      } catch (error) {
        console.error('Failed to initialize DAL:', error);
        throw new Error('DAL initialization failed');
      }
    }
    return this.dalGateway;
  }

  /**
   * Get transactions with filters
   */
  async getTransactions(filters: Record<string, any> = {}): Promise<Transaction[]> {
    const dal = await this.ensureInitialized();
    
    try {
      const result = await dal.getTransactions(filters);
      return transformTimestamp(result);
    } catch (error: any) {
      console.error('DAL getTransactions failed:', error);
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
  }

  /**
   * Get hourly patterns
   */
  async getHourlyPatterns(): Promise<any[]> {
    const dal = await this.ensureInitialized();
    
    try {
      const sql = `
        SELECT 
          CAST(strftime('%H', timestamp) AS INTEGER) as hour,
          COUNT(*) as transaction_count,
          AVG(peso_value) as avg_value,
          SUM(peso_value) as total_value
        FROM transactions 
        WHERE timestamp >= datetime('now', '-30 days')
        GROUP BY hour
        ORDER BY hour
      `;
      
      const result = await dal.query(sql);
      return result.data;
    } catch (error: any) {
      console.error('DAL getHourlyPatterns failed:', error);
      
      // Fallback to mock data
      return Array.from({ length: 24 }, (_, hour) => ({
        hour,
        transaction_count: Math.floor(Math.random() * 100) + 10,
        avg_value: Math.round((Math.random() * 200 + 50) * 100) / 100,
        total_value: Math.round((Math.random() * 5000 + 500) * 100) / 100
      }));
    }
  }

  /**
   * Get geographic data
   */
  async getGeographicData(): Promise<any[]> {
    const dal = await this.ensureInitialized();
    
    try {
      const sql = `
        SELECT 
          region,
          COUNT(*) as transaction_count,
          SUM(peso_value) as total_value,
          AVG(peso_value) as avg_value
        FROM transactions 
        GROUP BY region
        ORDER BY total_value DESC
      `;
      
      const result = await dal.query(sql);
      return result.data;
    } catch (error: any) {
      console.error('DAL getGeographicData failed:', error);
      
      // Fallback data
      const regions = ['NCR', 'CALABARZON', 'Central Luzon', 'Western Visayas', 'Central Visayas'];
      return regions.map(region => ({
        region,
        transaction_count: Math.floor(Math.random() * 1000) + 100,
        total_value: Math.round((Math.random() * 50000 + 10000) * 100) / 100,
        avg_value: Math.round((Math.random() * 200 + 50) * 100) / 100
      }));
    }
  }

  /**
   * Get substitution data
   */
  async getSubstitutionData(): Promise<any[]> {
    const dal = await this.ensureInitialized();
    
    try {
      const sql = `
        SELECT 
          substitution_from,
          substitution_to,
          substitution_reason,
          COUNT(*) as occurrence_count
        FROM transactions 
        WHERE substitution_occurred = 1 
          AND substitution_from IS NOT NULL 
          AND substitution_from != ''
        GROUP BY substitution_from, substitution_to, substitution_reason
        ORDER BY occurrence_count DESC
        LIMIT 100
      `;
      
      const result = await dal.query(sql);
      return result.data;
    } catch (error: any) {
      console.error('DAL getSubstitutionData failed:', error);
      return [];
    }
  }

  /**
   * Get filter options
   */
  async getFilterOptions(): Promise<any> {
    const dal = await this.ensureInitialized();
    
    try {
      const [regionsResult, categoriesResult, brandsResult] = await Promise.all([
        dal.query('SELECT DISTINCT region FROM transactions WHERE region IS NOT NULL ORDER BY region'),
        dal.query('SELECT DISTINCT product_category FROM transactions WHERE product_category IS NOT NULL ORDER BY product_category'),
        dal.query('SELECT DISTINCT brand_name FROM transactions WHERE brand_name IS NOT NULL ORDER BY brand_name')
      ]);

      return {
        regions: regionsResult.data.map(r => r.region),
        categories: categoriesResult.data.map(c => c.product_category),
        brands: brandsResult.data.map(b => b.brand_name)
      };
    } catch (error: any) {
      console.error('DAL getFilterOptions failed:', error);
      
      // Fallback options
      return {
        regions: ['NCR', 'CALABARZON', 'Central Luzon', 'Western Visayas', 'Central Visayas'],
        categories: ['personal_care', 'beverages', 'snacks', 'food', 'household'],
        brands: ['Safeguard', 'Coca-Cola', 'Jack n Jill', 'Lucky Me', 'Surf', 'Nescafe']
      };
    }
  }

  /**
   * Get stats
   */
  async getStats(): Promise<any> {
    const dal = await this.ensureInitialized();
    
    try {
      const [
        totalResult,
        todayResult,
        avgResult,
        topRegionResult
      ] = await Promise.all([
        dal.query('SELECT COUNT(*) as total FROM transactions'),
        dal.query("SELECT COUNT(*) as today FROM transactions WHERE date(timestamp) = date('now')"),
        dal.query('SELECT AVG(peso_value) as avg_value FROM transactions'),
        dal.query(`
          SELECT region, COUNT(*) as count 
          FROM transactions 
          GROUP BY region 
          ORDER BY count DESC 
          LIMIT 1
        `)
      ]);

      return {
        totalTransactions: totalResult.data[0]?.total || 0,
        todayTransactions: todayResult.data[0]?.today || 0,
        averageValue: Math.round((avgResult.data[0]?.avg_value || 0) * 100) / 100,
        topRegion: topRegionResult.data[0]?.region || 'Unknown'
      };
    } catch (error: any) {
      console.error('DAL getStats failed:', error);
      
      // Fallback stats
      return {
        totalTransactions: 31542,
        todayTransactions: 127,
        averageValue: 156.78,
        topRegion: 'NCR'
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<any> {
    try {
      const dal = await this.ensureInitialized();
      const health = await dal.healthCheck();
      const metrics = dal.getMetrics();
      
      return {
        status: 'healthy',
        connectors: health,
        metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get DAL status and metrics
   */
  async getDALStatus(): Promise<any> {
    try {
      const dal = await this.ensureInitialized();
      return {
        initialized: this.initialized,
        connectors: dal.getConnectorStatus(),
        metrics: dal.getMetrics(),
        health: await dal.healthCheck()
      };
    } catch (error: any) {
      return {
        initialized: false,
        error: error.message
      };
    }
  }

  /**
   * Switch active connector
   */
  async switchConnector(connectorId: string): Promise<void> {
    const dal = await this.ensureInitialized();
    await dal.setActiveConnector(connectorId);
    console.log(`Switched to connector: ${connectorId}`);
  }

  /**
   * Execute raw SQL query (for advanced use cases)
   */
  async executeSQL(sql: string, params?: any[]): Promise<any> {
    const dal = await this.ensureInitialized();
    const result = await dal.query(sql, params);
    return result.data;
  }

  /**
   * Cleanup - close DAL connections
   */
  async close(): Promise<void> {
    if (this.dalGateway) {
      await this.dalGateway.close();
      this.dalGateway = undefined;
      this.initialized = false;
    }
  }
}

// Export singleton instance
export const dalService = new DALService();

// Export with same interface as apiService for easy replacement
export const apiService = dalService;

// Export function for getting transactions with fallback (same as apiService)
export async function getTransactionsWithFallback(filters: Record<string, any> = {}): Promise<Transaction[]> {
  try {
    return await dalService.getTransactions(filters);
  } catch (error) {
    console.warn('⚠️ DAL unavailable, using mock data:', error);
    
    // Generate mock data as fallback
    const { generateMockData } = await import('../utils/mockDataGenerator');
    const mockData = generateMockData(1000);
    
    // Apply filters to mock data
    return mockData.filter(t => {
      if (filters.region && t.region !== filters.region) return false;
      if (filters.barangay && t.barangay !== filters.barangay) return false;
      if (filters.category && !t.items?.some(i => i.category === filters.category)) return false;
      return true;
    });
  }
}

// Additional DAL-specific exports
export { DALService };
export default dalService;