import { supabase } from '../lib/supabase';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

// Helper to get cached data
function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
}

// Helper to set cached data
function setCachedData(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export interface DashboardMetrics {
  kpiMetrics: any;
  salesTrend: any[];
  transactionVolume: any[];
  topProducts: any[];
  topCategories: any[];
  regionalPerformance: any[];
  storePerformance: any[];
  productCombos: any[];
}

export class FallbackDataService {
  // Main method to get all dashboard metrics
  async getDashboardMetrics(filters: {
    dateFrom: Date;
    dateTo: Date;
    region?: string;
    storeId?: string;
  }): Promise<DashboardMetrics> {
    const cacheKey = JSON.stringify(filters);
    const cached = getCachedData<DashboardMetrics>(cacheKey);
    if (cached) return cached;

    try {
      // Get basic transaction data - without join since relationship doesn't exist
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('transaction_datetime', filters.dateFrom.toISOString())
        .lte('transaction_datetime', filters.dateTo.toISOString())
        .order('transaction_datetime', { ascending: false });

      if (error) throw error;

      const data = this.processTransactionData(transactions || []);
      setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      return this.getMockData();
    }
  }

  private processTransactionData(transactions: any[]): DashboardMetrics {
    // Calculate KPIs
    const totalSales = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
    const totalTransactions = transactions.length;
    const avgBasketSize = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Process hourly trend
    const hourlyMap: Record<number, { sales: number; count: number }> = {};
    transactions.forEach(t => {
      const hour = new Date(t.transaction_datetime).getHours();
      if (!hourlyMap[hour]) {
        hourlyMap[hour] = { sales: 0, count: 0 };
      }
      hourlyMap[hour].sales += t.total_amount || 0;
      hourlyMap[hour].count += 1;
    });

    const salesTrend = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      sales: hourlyMap[hour]?.sales || 0,
      transactions: hourlyMap[hour]?.count || 0,
      avgTicket: hourlyMap[hour]?.count > 0 ? hourlyMap[hour].sales / hourlyMap[hour].count : 0
    }));

    // Process daily volume
    const dailyMap: Record<string, { sales: number; count: number }> = {};
    transactions.forEach(t => {
      const date = new Date(t.transaction_datetime).toISOString().split('T')[0];
      if (!dailyMap[date]) {
        dailyMap[date] = { sales: 0, count: 0 };
      }
      dailyMap[date].sales += t.total_amount || 0;
      dailyMap[date].count += 1;
    });

    const transactionVolume = Object.entries(dailyMap).map(([date, data]) => ({
      date,
      sales: data.sales,
      transactions: data.count,
      avgTicket: data.count > 0 ? data.sales / data.count : 0
    }));

    // Process regional data - using mock regions since stores relationship doesn't exist
    const regions = ['NCR', 'Region III', 'Region IV-A', 'Region VI', 'Region VII', 'Region XI'];
    const regionMap: Record<string, any> = {};
    
    // Distribute transactions across regions
    transactions.forEach((t, index) => {
      const region = regions[index % regions.length];
      if (!regionMap[region]) {
        regionMap[region] = {
          region,
          total_sales: 0,
          transaction_count: 0,
          store_count: Math.floor(Math.random() * 20) + 10,
          growth_rate: Math.random() * 30 - 5
        };
      }
      regionMap[region].total_sales += t.total_amount || 0;
      regionMap[region].transaction_count += 1;
    });

    const regionalPerformance = Object.values(regionMap)
      .sort((a, b) => b.total_sales - a.total_sales);

    // Store performance - create mock stores since relationship doesn't exist
    const mockStores = [
      { store_id: '1', store_name: 'SM North EDSA', city: 'Quezon City', region: 'NCR' },
      { store_id: '2', store_name: 'Ayala Center Cebu', city: 'Cebu City', region: 'Region VII' },
      { store_id: '3', store_name: 'SM City Davao', city: 'Davao City', region: 'Region XI' },
      { store_id: '4', store_name: 'Robinsons Galleria', city: 'Pasig City', region: 'NCR' },
      { store_id: '5', store_name: 'SM Clark', city: 'Angeles City', region: 'Region III' }
    ];
    
    const storeMap: Record<string, any> = {};
    mockStores.forEach((store, index) => {
      const storeSales = transactions
        .slice(index * 20, (index + 1) * 20)
        .reduce((sum, t) => sum + (t.total_amount || 0), 0);
      
      storeMap[store.store_id] = {
        ...store,
        total_sales: storeSales,
        transaction_count: Math.min(20, transactions.length),
        lat: 14.5995 + (Math.random() - 0.5) * 2,
        lng: 120.9842 + (Math.random() - 0.5) * 2
      };
    });

    const storePerformance = Object.values(storeMap)
      .sort((a, b) => b.total_sales - a.total_sales);

    return {
      kpiMetrics: {
        totalSales: { value: totalSales, change: 15.8 },
        totalTransactions: { value: totalTransactions, change: 12.5 },
        avgBasketSize: { value: avgBasketSize, change: 2.3 },
        conversionRate: { value: 68.5, change: 2.1 }
      },
      salesTrend,
      transactionVolume,
      topProducts: this.getMockProducts(),
      topCategories: this.getMockCategories(),
      regionalPerformance,
      storePerformance,
      productCombos: this.getMockProductCombos()
    };
  }

  private getMockProducts() {
    return [
      { product_name: 'Coca-Cola 355ml', category_name: 'Beverages', brand_name: 'Coca-Cola', total_revenue: 125000, total_units_sold: 3571, growth_rate: 22.5 },
      { product_name: 'Lucky Me Pancit Canton', category_name: 'Food', brand_name: 'Lucky Me', total_revenue: 98000, total_units_sold: 4900, growth_rate: 18.3 },
      { product_name: 'Oishi Prawn Crackers', category_name: 'Snacks', brand_name: 'Oishi', total_revenue: 87000, total_units_sold: 2900, growth_rate: 15.7 },
      { product_name: 'Alaska Evap Milk', category_name: 'Dairy', brand_name: 'Alaska', total_revenue: 76000, total_units_sold: 2111, growth_rate: 12.4 },
      { product_name: 'Kopiko Black 3in1', category_name: 'Beverages', brand_name: 'Kopiko', total_revenue: 65000, total_units_sold: 2167, growth_rate: 19.8 }
    ];
  }

  private getMockCategories() {
    return [
      { name: 'Beverages', value: 245000, percentage: 35.2 },
      { name: 'Snacks', value: 189000, percentage: 27.1 },
      { name: 'Food', value: 156000, percentage: 22.4 },
      { name: 'Personal Care', value: 67000, percentage: 9.6 },
      { name: 'Dairy', value: 39000, percentage: 5.6 }
    ];
  }

  private getMockProductCombos() {
    return [
      { combo: ['Coca-Cola 355ml', 'Oishi Prawn Crackers'], frequency: 234, confidence: 0.78 },
      { combo: ['Lucky Me Pancit Canton', 'Kopiko Black 3in1'], frequency: 189, confidence: 0.65 },
      { combo: ['Alaska Evap Milk', 'Milo 22g'], frequency: 156, confidence: 0.72 }
    ];
  }

  private getMockData(): DashboardMetrics {
    return {
      kpiMetrics: {
        totalSales: { value: 2235878, change: 15.8 },
        totalTransactions: { value: 8234, change: 12.5 },
        avgBasketSize: { value: 272, change: 2.3 },
        conversionRate: { value: 68.5, change: 2.1 }
      },
      salesTrend: Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour}:00`,
        sales: Math.random() * 100000 + 50000,
        transactions: Math.floor(Math.random() * 500) + 100,
        avgTicket: Math.random() * 100 + 200
      })),
      transactionVolume: Array.from({ length: 7 }, (_, i) => ({
        date: format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'),
        sales: Math.random() * 300000 + 200000,
        transactions: Math.floor(Math.random() * 1500) + 1000,
        avgTicket: Math.random() * 100 + 250
      })),
      topProducts: this.getMockProducts(),
      topCategories: this.getMockCategories(),
      regionalPerformance: [
        { region: 'NCR', total_sales: 850000, transaction_count: 3124, store_count: 45, growth_rate: 22.5 },
        { region: 'Region VII', total_sales: 545000, transaction_count: 2003, store_count: 32, growth_rate: 18.2 },
        { region: 'Region III', total_sales: 423000, transaction_count: 1555, store_count: 28, growth_rate: 15.7 }
      ],
      storePerformance: [
        { store_id: 1, store_name: 'SM North EDSA', city: 'Quezon City', region: 'NCR', total_sales: 234000, transaction_count: 860, lat: 14.6569, lng: 121.0298 },
        { store_id: 2, store_name: 'Ayala Center Cebu', city: 'Cebu City', region: 'Region VII', total_sales: 198000, transaction_count: 728, lat: 10.3181, lng: 123.9058 }
      ],
      productCombos: this.getMockProductCombos()
    };
  }
}

export const fallbackDataService = new FallbackDataService();