/**
 * Mock Connector
 * Provides mock data for testing and fallback scenarios
 */

import { BaseConnector } from '../BaseConnector';
import { ConnectorConfig } from '../types';

export class MockConnector extends BaseConnector {
  private mockData: Map<string, any[]> = new Map();
  private mockLatency: number = 50; // ms

  constructor(config: ConnectorConfig) {
    super(config);
    this.mockLatency = config.options?.latency || 50;
    this.initializeMockData();
  }

  protected async connect(): Promise<void> {
    // Simulate connection delay
    await this.delay(this.mockLatency);
    
    this.connectionMetadata = {
      mode: 'mock',
      latency: this.mockLatency,
      tables: Array.from(this.mockData.keys())
    };
  }

  protected async disconnect(): Promise<void> {
    // Mock connectors don't need disconnection
    this.mockData.clear();
  }

  protected async executeQuery<T>(sql: string, params?: any[]): Promise<T[]> {
    this.logQuery(sql, params);
    
    // Simulate network latency
    await this.delay(this.mockLatency);
    
    try {
      const sqlLower = sql.toLowerCase().trim();
      
      if (sqlLower === 'select 1 as ping') {
        return [{ ping: 1 }] as T[];
      }
      
      if (sqlLower.includes('from transactions')) {
        return this.queryTransactions<T>(sql, params);
      }
      
      if (sqlLower.includes('from stores')) {
        return this.queryStores<T>(sql, params);
      }
      
      if (sqlLower.includes('sqlite_master') || sqlLower.includes('information_schema')) {
        return this.queryMetadata<T>(sql);
      }
      
      // Default response for unhandled queries
      return [] as T[];
    } catch (error: any) {
      throw this.handleError(error, 'mock query failed');
    }
  }

  protected async executeCommand(sql: string, params?: any[]): Promise<{ rowsAffected?: number }> {
    this.logQuery(sql, params);
    
    // Simulate command execution
    await this.delay(this.mockLatency);
    
    const sqlLower = sql.toLowerCase().trim();
    
    if (sqlLower.startsWith('insert')) {
      return { rowsAffected: 1 };
    }
    
    if (sqlLower.startsWith('update')) {
      return { rowsAffected: Math.floor(Math.random() * 10) + 1 };
    }
    
    if (sqlLower.startsWith('delete')) {
      return { rowsAffected: Math.floor(Math.random() * 5) + 1 };
    }
    
    return { rowsAffected: 0 };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private initializeMockData(): void {
    // Generate mock transactions
    const transactions = this.generateMockTransactions(1000);
    this.mockData.set('transactions', transactions);
    
    // Generate mock stores
    const stores = this.generateMockStores(50);
    this.mockData.set('stores', stores);
  }

  private generateMockTransactions(count: number): any[] {
    const regions = ['NCR', 'CALABARZON', 'Central Luzon', 'Western Visayas', 'Central Visayas'];
    const categories = ['personal_care', 'beverages', 'snacks', 'food', 'household'];
    const brands = ['Safeguard', 'Coca-Cola', 'Jack n Jill', 'Lucky Me', 'Surf', 'Nescafe'];
    const paymentMethods = ['cash', 'gcash', 'maya', 'credit'];
    const genders = ['male', 'female'];
    const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55+'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: `mock_txn_${i + 1}`,
      store_id: `store_${Math.floor(Math.random() * 50) + 1}`,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      time_of_day: ['morning', 'afternoon', 'evening', 'night'][Math.floor(Math.random() * 4)],
      barangay: `Barangay ${Math.floor(Math.random() * 100) + 1}`,
      city: ['Makati', 'Quezon City', 'Manila', 'Pasig', 'Marikina'][Math.floor(Math.random() * 5)],
      province: 'Metro Manila',
      region: regions[Math.floor(Math.random() * regions.length)],
      product_category: categories[Math.floor(Math.random() * categories.length)],
      brand_name: brands[Math.floor(Math.random() * brands.length)],
      sku: `SKU_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      units_per_transaction: Math.floor(Math.random() * 5) + 1,
      peso_value: Math.round((Math.random() * 500 + 25) * 100) / 100,
      basket_size: Math.floor(Math.random() * 8) + 1,
      combo_basket: JSON.stringify([`Item_${i}`, `Item_${i + 1}`]),
      request_mode: ['verbal', 'pointing', 'indirect'][Math.floor(Math.random() * 3)],
      request_type: ['branded', 'unbranded', 'indirect', 'point'][Math.floor(Math.random() * 4)],
      suggestion_accepted: Math.random() > 0.5 ? 1 : 0,
      gender: genders[Math.floor(Math.random() * genders.length)],
      age_bracket: ageGroups[Math.floor(Math.random() * ageGroups.length)],
      substitution_occurred: Math.random() > 0.8 ? 1 : 0,
      substitution_from: Math.random() > 0.8 ? 'Original Product' : '',
      substitution_to: Math.random() > 0.8 ? 'Substitute Product' : '',
      substitution_reason: Math.random() > 0.8 ? 'out of stock' : '',
      duration_seconds: Math.floor(Math.random() * 300) + 30,
      campaign_influenced: Math.random() > 0.7 ? 1 : 0,
      handshake_score: Math.round(Math.random() * 100) / 100,
      is_tbwa_client: Math.random() > 0.5 ? 1 : 0,
      payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      customer_type: ['new', 'regular', 'occasional'][Math.floor(Math.random() * 3)],
      store_type: ['urban_high', 'urban_medium', 'residential', 'rural'][Math.floor(Math.random() * 4)],
      economic_class: ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)]
    }));
  }

  private generateMockStores(count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `store_${i + 1}`,
      store_name: `Scout Store ${i + 1}`,
      region: ['NCR', 'CALABARZON', 'Central Luzon'][Math.floor(Math.random() * 3)],
      barangay: `Barangay ${Math.floor(Math.random() * 100) + 1}`,
      city: ['Makati', 'Quezon City', 'Manila', 'Pasig', 'Marikina'][Math.floor(Math.random() * 5)],
      latitude: 14.5995 + (Math.random() - 0.5) * 0.1,
      longitude: 120.9842 + (Math.random() - 0.5) * 0.1,
      store_type: ['urban_high', 'urban_medium', 'residential', 'rural'][Math.floor(Math.random() * 4)]
    }));
  }

  private queryTransactions<T>(sql: string, params?: any[]): T[] {
    let transactions = this.mockData.get('transactions') || [];
    
    // Basic filtering simulation
    const sqlLower = sql.toLowerCase();
    
    if (sqlLower.includes('where')) {
      // Simulate basic WHERE filtering
      if (params && params.length > 0) {
        // Filter by first parameter as region (simplified)
        transactions = transactions.filter((t: any) => 
          t.region === params[0] || t.category === params[0]
        );
      }
    }
    
    if (sqlLower.includes('limit')) {
      const limitMatch = sql.match(/limit\s+(\d+)/i);
      if (limitMatch) {
        transactions = transactions.slice(0, parseInt(limitMatch[1]));
      }
    }
    
    return transactions as T[];
  }

  private queryStores<T>(sql: string, params?: any[]): T[] {
    let stores = this.mockData.get('stores') || [];
    
    if (sql.toLowerCase().includes('limit')) {
      const limitMatch = sql.match(/limit\s+(\d+)/i);
      if (limitMatch) {
        stores = stores.slice(0, parseInt(limitMatch[1]));
      }
    }
    
    return stores as T[];
  }

  private queryMetadata<T>(sql: string): T[] {
    if (sql.toLowerCase().includes('sqlite_master')) {
      return [
        { type: 'table', name: 'transactions', tbl_name: 'transactions' },
        { type: 'table', name: 'stores', tbl_name: 'stores' }
      ] as T[];
    }
    
    return [] as T[];
  }

  // Mock-specific methods
  setMockLatency(ms: number): void {
    this.mockLatency = ms;
  }

  addMockData(table: string, data: any[]): void {
    this.mockData.set(table, data);
  }

  getMockDataSize(): number {
    let total = 0;
    this.mockData.forEach(data => {
      total += data.length;
    });
    return total;
  }

  getMetadata(): Record<string, any> {
    const baseMetadata = super.getMetadata();
    
    baseMetadata.mock = {
      latency: this.mockLatency,
      dataSize: this.getMockDataSize(),
      tables: Array.from(this.mockData.keys())
    };

    return baseMetadata;
  }
}