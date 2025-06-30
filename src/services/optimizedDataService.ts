import { supabase, hasValidSupabaseConfig } from '../lib/supabase';
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

// Batch query helper for parallel execution
async function executeBatchQueries<T extends Record<string, any>>(
  queries: Record<string, () => Promise<any>>
): Promise<T> {
  const entries = Object.entries(queries);
  const results = await Promise.allSettled(
    entries.map(([key, query]) => query())
  );

  const data: any = {};
  entries.forEach(([key], index) => {
    const result = results[index];
    if (result.status === 'fulfilled') {
      data[key] = result.value;
    } else {
      console.error(`Query ${key} failed:`, result.reason);
      data[key] = null;
    }
  });

  return data as T;
}

export interface DashboardMetrics {
  kpiMetrics: any;
  salesTrend: any[];
  transactionVolume: any[];
  topProducts: any[];
  topCategories: any[];
  regionPerformance: any[];
  recentTransactions: any[];
}

export class OptimizedDataService {
  // Get all dashboard metrics in parallel
  async getDashboardMetrics(filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    region?: string;
    storeId?: string;
  }): Promise<DashboardMetrics> {
    const cacheKey = `dashboard-${JSON.stringify(filters || {})}`;
    const cached = getCachedData<DashboardMetrics>(cacheKey);
    if (cached) return cached;

    if (!hasValidSupabaseConfig()) {
      return this.getMockDashboardMetrics();
    }

    const dateFrom = filters?.dateFrom || subDays(new Date(), 30);
    const dateTo = filters?.dateTo || new Date();

    const queries = {
      kpiMetrics: () => this.getKPIMetrics(dateFrom, dateTo, filters),
      salesTrend: () => this.getSalesTrend(dateFrom, dateTo, filters),
      transactionVolume: () => this.getTransactionVolume(dateFrom, dateTo, filters),
      topProducts: () => this.getTopProducts(dateFrom, dateTo, filters),
      topCategories: () => this.getTopCategories(dateFrom, dateTo, filters),
      regionPerformance: () => this.getRegionPerformance(dateFrom, dateTo),
      recentTransactions: () => this.getRecentTransactions(10)
    };

    const data = await executeBatchQueries<DashboardMetrics>(queries);
    setCachedData(cacheKey, data);
    return data;
  }

  // Optimized KPI metrics query
  private async getKPIMetrics(dateFrom: Date, dateTo: Date, filters?: any) {
    const { data: current, error: currentError } = await supabase
      .rpc('get_kpi_metrics', {
        date_from: format(dateFrom, 'yyyy-MM-dd'),
        date_to: format(dateTo, 'yyyy-MM-dd'),
        region_filter: filters?.region || null,
        store_filter: filters?.storeId || null
      });

    if (currentError) throw currentError;

    // Get previous period data for comparison
    const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
    const prevDateFrom = subDays(dateFrom, daysDiff);
    const prevDateTo = subDays(dateTo, daysDiff);

    const { data: previous } = await supabase
      .rpc('get_kpi_metrics', {
        date_from: format(prevDateFrom, 'yyyy-MM-dd'),
        date_to: format(prevDateTo, 'yyyy-MM-dd'),
        region_filter: filters?.region || null,
        store_filter: filters?.storeId || null
      });

    return this.calculateKPIChanges(current, previous);
  }

  // Calculate KPI changes
  private calculateKPIChanges(current: any, previous: any) {
    if (!current || !previous) return current;

    return {
      totalSales: {
        value: current.total_sales || 0,
        change: this.calculatePercentChange(current.total_sales, previous.total_sales),
        trend: current.total_sales > previous.total_sales ? 'up' : 'down'
      },
      totalTransactions: {
        value: current.total_transactions || 0,
        change: this.calculatePercentChange(current.total_transactions, previous.total_transactions),
        trend: current.total_transactions > previous.total_transactions ? 'up' : 'down'
      },
      avgBasketSize: {
        value: current.avg_basket_size || 0,
        change: this.calculatePercentChange(current.avg_basket_size, previous.avg_basket_size),
        trend: current.avg_basket_size > previous.avg_basket_size ? 'up' : 'down'
      },
      uniqueCustomers: {
        value: current.unique_customers || 0,
        change: this.calculatePercentChange(current.unique_customers, previous.unique_customers),
        trend: current.unique_customers > previous.unique_customers ? 'up' : 'down'
      },
      activeStores: {
        value: current.active_stores || 0,
        change: this.calculatePercentChange(current.active_stores, previous.active_stores),
        trend: current.active_stores > previous.active_stores ? 'up' : 'down'
      }
    };
  }

  private calculatePercentChange(current: number, previous: number): number {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  // Get sales trend with optimized query
  private async getSalesTrend(dateFrom: Date, dateTo: Date, filters?: any) {
    const { data, error } = await supabase
      .from('mv_daily_sales')
      .select('transaction_date, net_sales, transaction_count')
      .gte('transaction_date', format(dateFrom, 'yyyy-MM-dd'))
      .lte('transaction_date', format(dateTo, 'yyyy-MM-dd'))
      .order('transaction_date');

    if (error) throw error;
    return data || [];
  }

  // Get transaction volume by hour
  private async getTransactionVolume(dateFrom: Date, dateTo: Date, filters?: any) {
    const { data, error } = await supabase
      .from('mv_hourly_patterns')
      .select('hour_of_day, avg_transactions, avg_sales')
      .order('hour_of_day');

    if (error) throw error;
    return data || [];
  }

  // Get top products with limit
  private async getTopProducts(dateFrom: Date, dateTo: Date, filters?: any, limit = 10) {
    const { data, error } = await supabase
      .from('mv_product_performance')
      .select('product_name, category_name, brand_name, total_revenue, total_units_sold')
      .order('total_revenue', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Get top categories
  private async getTopCategories(dateFrom: Date, dateTo: Date, filters?: any) {
    const { data, error } = await supabase
      .from('mv_product_mix')
      .select('category_name, total_revenue, transaction_count')
      .order('total_revenue', { ascending: false })
      .limit(5);

    if (error) throw error;
    return data || [];
  }

  // Get region performance
  private async getRegionPerformance(dateFrom: Date, dateTo: Date) {
    const { data, error } = await supabase
      .from('mv_transaction_patterns')
      .select('region, sum(total_sales) as total_sales, sum(transaction_count) as transactions')
      .group('region')
      .order('total_sales', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get recent transactions
  private async getRecentTransactions(limit = 10) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        receipt_number,
        transaction_datetime,
        total_amount,
        items_count,
        payment_method,
        stores (store_name, city, region)
      `)
      .order('transaction_datetime', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Clear cache
  clearCache() {
    cache.clear();
  }

  // Get mock data for fallback
  private getMockDashboardMetrics(): DashboardMetrics {
    return {
      kpiMetrics: {
        totalSales: { value: 1234567, change: 12.5, trend: 'up' },
        totalTransactions: { value: 8234, change: 8.3, trend: 'up' },
        avgBasketSize: { value: 150, change: -2.1, trend: 'down' },
        uniqueCustomers: { value: 3421, change: 15.2, trend: 'up' },
        activeStores: { value: 234, change: 5.7, trend: 'up' }
      },
      salesTrend: Array.from({ length: 30 }, (_, i) => ({
        transaction_date: format(subDays(new Date(), 30 - i), 'yyyy-MM-dd'),
        net_sales: Math.floor(Math.random() * 50000) + 30000,
        transaction_count: Math.floor(Math.random() * 300) + 200
      })),
      transactionVolume: Array.from({ length: 24 }, (_, i) => ({
        hour_of_day: i,
        avg_transactions: Math.floor(Math.random() * 50) + 10,
        avg_sales: Math.floor(Math.random() * 5000) + 1000
      })),
      topProducts: [
        { product_name: 'Coca-Cola 355ml', category_name: 'Beverages', brand_name: 'Coca-Cola', total_revenue: 180000, total_units_sold: 3200 },
        { product_name: 'Oishi Prawn Crackers', category_name: 'Snacks', brand_name: 'Oishi', total_revenue: 145000, total_units_sold: 2800 },
        { product_name: 'Alaska Evap Milk', category_name: 'Dairy', brand_name: 'Alaska', total_revenue: 125000, total_units_sold: 2100 },
        { product_name: 'Lucky Me Pancit Canton', category_name: 'Food', brand_name: 'Lucky Me', total_revenue: 110000, total_units_sold: 1900 },
        { product_name: 'Safeguard White', category_name: 'Personal Care', brand_name: 'Safeguard', total_revenue: 95000, total_units_sold: 1600 }
      ],
      topCategories: [
        { category_name: 'Beverages', total_revenue: 450000, transaction_count: 2100 },
        { category_name: 'Snacks', total_revenue: 380000, transaction_count: 1800 },
        { category_name: 'Food', total_revenue: 320000, transaction_count: 1500 },
        { category_name: 'Personal Care', total_revenue: 280000, transaction_count: 1300 },
        { category_name: 'Dairy', total_revenue: 220000, transaction_count: 1000 }
      ],
      regionPerformance: [
        { region: 'NCR', total_sales: 850000, transactions: 3200 },
        { region: 'Region VII', total_sales: 380000, transactions: 1400 },
        { region: 'Region III', total_sales: 320000, transactions: 1200 },
        { region: 'Region IV-A', total_sales: 290000, transactions: 1100 },
        { region: 'Region VI', total_sales: 220000, transactions: 800 }
      ],
      recentTransactions: []
    };
  }
}

// Export singleton instance
export const optimizedDataService = new OptimizedDataService();