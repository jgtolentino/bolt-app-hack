/**
 * SQLite Dashboard Service for Scout v4.0
 * Connects to local SQLite database with 50k synthetic transactions
 */

import type { Transaction, TransactionItem, Store, Product, Customer } from '../lib/supabase';

export interface DashboardFilters {
  timeOfDay?: string;
  region?: string;
  barangay?: string;
  weekVsWeekend?: 'week' | 'weekend' | 'all' | 'weekdays' | 'weekends';
  category?: string;
  brand?: string;
  gender?: string;
  ageGroup?: string;
  startDate?: string;
  endDate?: string;
}

export interface TransactionWithDetails extends Transaction {
  items: TransactionItem[];
  store: Store;
  customer: Customer;
  products: Product[];
}

export interface SubstitutionData {
  originalProduct: string;
  substitutedProduct: string;
  count: number;
  originalBrand: string;
  substitutedBrand: string;
}

export interface RegionData {
  id: string;
  name: string;
  value: number;
  transactions: number;
  customers: number;
  avgBasketSize: number;
  latitude?: number;
  longitude?: number;
}

// Mock data for development - replace with actual SQLite queries
const MOCK_REGIONS = [
  'NCR', 'Region I', 'Region II', 'Region III', 'Region IV-A', 'Region IV-B',
  'Region V', 'Region VI', 'Region VII', 'Region VIII', 'Region IX', 'Region X',
  'Region XI', 'Region XII', 'Region XIII', 'CAR', 'ARMM', 'BARMM'
];

const MOCK_CATEGORIES = [
  'beverages', 'snacks', 'household', 'personal_care', 'tobacco', 'confectionery',
  'dairy', 'canned_goods', 'condiments', 'instant_foods'
];

const MOCK_BRANDS = [
  'Coca-Cola', 'Pepsi', 'Nestle', 'Unilever', 'P&G', 'Mondelez', 'URC',
  'San Miguel', 'Del Monte', 'Century', 'Lucky Me', 'Maggi', 'Knorr', 'Joy'
];

class SQLiteDashboardService {
  // private dbPath = '/Users/tbwa/Documents/GitHub/mcp-sqlite-server/data/scout_v4.sqlite';
  
  // Helper method to execute SQLite queries via MCP
  private async executeQuery(sql: string, params: any[] = []): Promise<any[]> {
    try {
      // For now, return mock data. In production, this would use MCP server
      console.log('SQLite Query:', sql, params);
      
      // Return mock data based on query type
      if (sql.includes('v_transaction_details') || sql.includes('transactions')) {
        return this.generateMockTransactions(100);
      } else if (sql.includes('substitution') || sql.includes('was_substituted')) {
        return this.generateMockSubstitutions();
      } else if (sql.includes('regional') || sql.includes('region')) {
        return this.generateMockRegionalData();
      } else if (sql.includes('hourly') || sql.includes('hour')) {
        return this.generateMockHourlyData();
      }
      
      return [];
    } catch (error) {
      console.error('SQLite query error:', error);
      throw error;
    }
  }

  // Generate mock transaction data
  private generateMockTransactions(count: number = 100): any[] {
    const transactions = [];
    
    for (let i = 0; i < count; i++) {
      const region = MOCK_REGIONS[Math.floor(Math.random() * MOCK_REGIONS.length)];
      const category = MOCK_CATEGORIES[Math.floor(Math.random() * MOCK_CATEGORIES.length)];
      const brand = MOCK_BRANDS[Math.floor(Math.random() * MOCK_BRANDS.length)];
      
      transactions.push({
        transaction_id: `TX${i.toString().padStart(8, '0')}`,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        store_id: `ST${Math.floor(Math.random() * 100).toString().padStart(6, '0')}`,
        customer_id: `C_${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`,
        transaction_value: Math.round((Math.random() * 500 + 20) * 100) / 100,
        discount_amount: Math.round(Math.random() * 20 * 100) / 100,
        final_amount: Math.round((Math.random() * 500 + 20) * 100) / 100,
        payment_method: Math.random() > 0.8 ? 'digital' : 'cash',
        duration_seconds: Math.floor(Math.random() * 300 + 60),
        units_total: Math.floor(Math.random() * 10 + 1),
        day_of_week: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][Math.floor(Math.random() * 7)],
        hour_of_day: Math.floor(Math.random() * 24),
        weather: ['sunny', 'cloudy', 'rainy', 'stormy'][Math.floor(Math.random() * 4)],
        is_payday: Math.random() > 0.7,
        influenced_by_campaign: Math.random() > 0.6,
        handshake_detected: Math.random() > 0.5,
        
        // Store data
        stores: {
          store_name: `Store ${i + 1}`,
          store_type: Math.random() > 0.6 ? 'sari-sari' : 'convenience',
          region,
          barangay: `Barangay ${Math.floor(Math.random() * 50) + 1}`,
          city_municipality: `City ${Math.floor(Math.random() * 20) + 1}`,
          province: `Province ${Math.floor(Math.random() * 10) + 1}`,
          latitude: 14.5995 + (Math.random() - 0.5) * 2,
          longitude: 120.9842 + (Math.random() - 0.5) * 2,
          economic_class: ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)]
        },
        
        // Customer data
        customers: {
          gender: Math.random() > 0.5 ? 'male' : 'female',
          age_bracket: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'][Math.floor(Math.random() * 6)],
          customer_type: Math.random() > 0.7 ? 'loyal' : 'regular',
          loyalty_status: Math.random() > 0.6 ? 'member' : 'non-member'
        },
        
        // Transaction items
        transaction_items: [{
          sku_id: `SKU${Math.floor(Math.random() * 1000).toString().padStart(6, '0')}`,
          quantity: Math.floor(Math.random() * 5 + 1),
          unit_price: Math.round((Math.random() * 100 + 10) * 100) / 100,
          was_substituted: Math.random() > 0.8,
          original_brand: Math.random() > 0.8 ? MOCK_BRANDS[Math.floor(Math.random() * MOCK_BRANDS.length)] : null,
          
          products: {
            product_name: `${brand} Product ${Math.floor(Math.random() * 100)}`,
            product_category: category,
            brands: {
              brand_name: brand
            }
          }
        }]
      });
    }
    
    return transactions;
  }

  // Generate mock substitution data
  private generateMockSubstitutions(): SubstitutionData[] {
    const substitutions: SubstitutionData[] = [];
    
    for (let i = 0; i < 20; i++) {
      const originalBrand = MOCK_BRANDS[Math.floor(Math.random() * MOCK_BRANDS.length)];
      const substitutedBrand = MOCK_BRANDS[Math.floor(Math.random() * MOCK_BRANDS.length)];
      
      if (originalBrand !== substitutedBrand) {
        substitutions.push({
          originalProduct: `${originalBrand} Product A`,
          substitutedProduct: `${substitutedBrand} Product B`,
          originalBrand,
          substitutedBrand,
          count: Math.floor(Math.random() * 50 + 5)
        });
      }
    }
    
    return substitutions;
  }

  // Generate mock regional data
  private generateMockRegionalData(): RegionData[] {
    return MOCK_REGIONS.map(region => ({
      id: region,
      name: region,
      value: Math.round((Math.random() * 1000000 + 100000) * 100) / 100,
      transactions: Math.floor(Math.random() * 5000 + 500),
      customers: Math.floor(Math.random() * 1000 + 100),
      avgBasketSize: Math.round((Math.random() * 200 + 50) * 100) / 100,
      latitude: 14.5995 + (Math.random() - 0.5) * 10,
      longitude: 120.9842 + (Math.random() - 0.5) * 10
    }));
  }

  // Generate mock hourly data
  private generateMockHourlyData(): any[] {
    const data = [];
    const today = new Date();
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const date = new Date(today);
        date.setDate(date.getDate() - day);
        
        data.push({
          date: date.toISOString().split('T')[0],
          hour_of_day: hour,
          day_of_week: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()],
          transaction_count: Math.floor(Math.random() * 50 + 5),
          total_value: Math.round((Math.random() * 5000 + 500) * 100) / 100,
          avg_value: Math.round((Math.random() * 150 + 30) * 100) / 100,
          total_units: Math.floor(Math.random() * 200 + 20),
          avg_duration: Math.floor(Math.random() * 300 + 60)
        });
      }
    }
    
    return data;
  }

  // Get transaction trends with filters
  async getTransactionTrends(filters: DashboardFilters = {}) {
    const sql = `
      SELECT * FROM v_transaction_details 
      WHERE 1=1
      ${filters.region ? 'AND region = ?' : ''}
      ${filters.barangay ? 'AND barangay = ?' : ''}
      ${filters.category ? 'AND transaction_items.products.product_category = ?' : ''}
      ORDER BY timestamp DESC
      LIMIT 1000
    `;
    
    const params = [];
    if (filters.region) params.push(filters.region);
    if (filters.barangay) params.push(filters.barangay);
    if (filters.category) params.push(filters.category);
    
    const data = await this.executeQuery(sql, params);
    
    // Apply weekend/weekday filter if specified
    if (filters.weekVsWeekend && filters.weekVsWeekend !== 'all') {
      const weekendDays = ['Saturday', 'Sunday'];
      return data.filter(item => {
        const isWeekend = weekendDays.includes(item.day_of_week);
        return filters.weekVsWeekend === 'weekends' ? isWeekend : !isWeekend;
      });
    }
    
    return data;
  }

  // Get substitution data for Sankey diagram
  async getSubstitutionData(filters: DashboardFilters = {}): Promise<SubstitutionData[]> {
    const sql = `
      SELECT 
        original_brand,
        p.product_name as substituted_product,
        op.product_name as original_product,
        b.brand_name as substituted_brand,
        SUM(ti.quantity) as count
      FROM transaction_items ti
      JOIN products p ON ti.sku_id = p.sku_id
      LEFT JOIN products op ON ti.original_sku_id = op.sku_id
      JOIN brands b ON p.brand_id = b.brand_id
      WHERE ti.was_substituted = 1
      GROUP BY original_brand, p.product_name, op.product_name, b.brand_name
      ORDER BY count DESC
      LIMIT 50
    `;
    
    return await this.executeQuery(sql);
  }

  // Get geographic data for heatmap
  async getGeographicData(filters: DashboardFilters = {}): Promise<RegionData[]> {
    const sql = `
      SELECT 
        region,
        COUNT(*) as transaction_count,
        COUNT(DISTINCT customer_id) as unique_customers,
        SUM(final_amount) as total_revenue,
        AVG(final_amount) as avg_transaction_value,
        AVG(units_total) as avg_basket_size,
        AVG(latitude) as latitude,
        AVG(longitude) as longitude
      FROM v_transaction_details
      WHERE 1=1
      ${filters.region ? 'AND region = ?' : ''}
      GROUP BY region
    `;
    
    const params = filters.region ? [filters.region] : [];
    const data = await this.executeQuery(sql, params);
    
    return data.map(row => ({
      id: row.region,
      name: row.region,
      value: row.total_revenue || 0,
      transactions: row.transaction_count || 0,
      customers: row.unique_customers || 0,
      avgBasketSize: row.avg_transaction_value || 0,
      latitude: row.latitude,
      longitude: row.longitude
    }));
  }

  // Get hourly patterns
  async getHourlyPatterns(filters: DashboardFilters = {}) {
    const sql = `
      SELECT 
        DATE(timestamp) as date,
        hour_of_day,
        day_of_week,
        COUNT(*) as transaction_count,
        SUM(final_amount) as total_value,
        AVG(final_amount) as avg_value,
        SUM(units_total) as total_units,
        AVG(duration_seconds) as avg_duration
      FROM v_transaction_details
      WHERE 1=1
      ${filters.region ? 'AND region = ?' : ''}
      GROUP BY DATE(timestamp), hour_of_day, day_of_week
      ORDER BY date DESC, hour_of_day
      LIMIT 500
    `;
    
    const params = filters.region ? [filters.region] : [];
    return await this.executeQuery(sql, params);
  }

  // Get filter options
  async getFilterOptions() {
    return {
      regions: MOCK_REGIONS,
      barangays: Array.from({length: 50}, (_, i) => `Barangay ${i + 1}`),
      categories: MOCK_CATEGORIES,
      brands: MOCK_BRANDS
    };
  }
}

export const sqliteDashboardService = new SQLiteDashboardService();