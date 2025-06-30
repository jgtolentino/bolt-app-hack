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

  // Optimized KPI metrics query using direct table queries
  private async getKPIMetrics(dateFrom: Date, dateTo: Date, filters?: any) {
    // Build the base query
    let currentQuery = supabase
      .from('transactions')
      .select(`
        total_amount,
        customer_id,
        store_id,
        stores!inner(region)
      `)
      .gte('transaction_date', format(dateFrom, 'yyyy-MM-dd'))
      .lte('transaction_date', format(dateTo, 'yyyy-MM-dd'))
      .eq('status', 'completed');

    // Apply filters
    if (filters?.region) {
      currentQuery = currentQuery.eq('stores.region', filters.region);
    }
    if (filters?.storeId) {
      currentQuery = currentQuery.eq('store_id', filters.storeId);
    }

    const { data: currentTransactions, error: currentError } = await currentQuery;
    if (currentError) throw currentError;

    // Calculate current period metrics
    const current = {
      total_sales: currentTransactions?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0,
      total_transactions: currentTransactions?.length || 0,
      avg_basket_size: currentTransactions?.length 
        ? (currentTransactions.reduce((sum, t) => sum + Number(t.total_amount), 0) / currentTransactions.length)
        : 0,
      unique_customers: new Set(currentTransactions?.filter(t => t.customer_id).map(t => t.customer_id)).size,
      active_stores: new Set(currentTransactions?.map(t => t.store_id)).size
    };

    // Get previous period data for comparison
    const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
    const prevDateFrom = subDays(dateFrom, daysDiff);
    const prevDateTo = subDays(dateTo, daysDiff);

    let previousQuery = supabase
      .from('transactions')
      .select(`
        total_amount,
        customer_id,
        store_id,
        stores!inner(region)
      `)
      .gte('transaction_date', format(prevDateFrom, 'yyyy-MM-dd'))
      .lte('transaction_date', format(prevDateTo, 'yyyy-MM-dd'))
      .eq('status', 'completed');

    // Apply filters
    if (filters?.region) {
      previousQuery = previousQuery.eq('stores.region', filters.region);
    }
    if (filters?.storeId) {
      previousQuery = previousQuery.eq('store_id', filters.storeId);
    }

    const { data: previousTransactions } = await previousQuery;

    // Calculate previous period metrics
    const previous = {
      total_sales: previousTransactions?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0,
      total_transactions: previousTransactions?.length || 0,
      avg_basket_size: previousTransactions?.length 
        ? (previousTransactions.reduce((sum, t) => sum + Number(t.total_amount), 0) / previousTransactions.length)
        : 0,
      unique_customers: new Set(previousTransactions?.filter(t => t.customer_id).map(t => t.customer_id)).size,
      active_stores: new Set(previousTransactions?.map(t => t.store_id)).size
    };

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

  // Get sales trend with direct transaction queries
  private async getSalesTrend(dateFrom: Date, dateTo: Date, filters?: any) {
    // Build the base query
    let query = supabase
      .from('transactions')
      .select(`
        transaction_date,
        total_amount,
        store_id,
        stores!inner(region)
      `)
      .gte('transaction_date', format(dateFrom, 'yyyy-MM-dd'))
      .lte('transaction_date', format(dateTo, 'yyyy-MM-dd'))
      .eq('status', 'completed');

    // Apply filters
    if (filters?.region) {
      query = query.eq('stores.region', filters.region);
    }
    if (filters?.storeId) {
      query = query.eq('store_id', filters.storeId);
    }

    const { data: transactions, error } = await query;
    if (error) throw error;

    // Group by date and calculate daily metrics
    const dailySales = transactions?.reduce((acc: any, transaction) => {
      const date = transaction.transaction_date;
      if (!acc[date]) {
        acc[date] = {
          transaction_date: date,
          net_sales: 0,
          transaction_count: 0
        };
      }
      acc[date].net_sales += Number(transaction.total_amount);
      acc[date].transaction_count += 1;
      return acc;
    }, {}) || {};

    // Convert to array and sort by date
    return Object.values(dailySales).sort((a: any, b: any) => 
      new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );
  }

  // Get transaction volume by hour
  private async getTransactionVolume(dateFrom: Date, dateTo: Date, filters?: any) {
    // Build the base query
    let query = supabase
      .from('transactions')
      .select(`
        transaction_time,
        total_amount,
        store_id,
        stores!inner(region)
      `)
      .gte('transaction_date', format(dateFrom, 'yyyy-MM-dd'))
      .lte('transaction_date', format(dateTo, 'yyyy-MM-dd'))
      .eq('status', 'completed');

    // Apply filters
    if (filters?.region) {
      query = query.eq('stores.region', filters.region);
    }
    if (filters?.storeId) {
      query = query.eq('store_id', filters.storeId);
    }

    const { data: transactions, error } = await query;
    if (error) throw error;

    // Group by hour and calculate hourly patterns
    const hourlyData = transactions?.reduce((acc: any, transaction) => {
      // Extract hour from transaction_time (HH:MM:SS format)
      const hour = parseInt(transaction.transaction_time.split(':')[0]);
      if (!acc[hour]) {
        acc[hour] = {
          hour_of_day: hour,
          total_transactions: 0,
          total_sales: 0
        };
      }
      acc[hour].total_transactions += 1;
      acc[hour].total_sales += Number(transaction.total_amount);
      return acc;
    }, {}) || {};

    // Calculate averages based on number of days
    const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    
    // Convert to array with averages and ensure all hours are represented
    const result = [];
    for (let hour = 0; hour < 24; hour++) {
      const data = hourlyData[hour] || { hour_of_day: hour, total_transactions: 0, total_sales: 0 };
      result.push({
        hour_of_day: hour,
        avg_transactions: data.total_transactions / daysDiff,
        avg_sales: data.total_sales / daysDiff
      });
    }

    return result;
  }

  // Get top products with limit
  private async getTopProducts(dateFrom: Date, dateTo: Date, filters?: any, limit = 10) {
    // First get transactions in the date range with filters
    let transactionQuery = supabase
      .from('transactions')
      .select(`
        id,
        store_id,
        stores!inner(region)
      `)
      .gte('transaction_date', format(dateFrom, 'yyyy-MM-dd'))
      .lte('transaction_date', format(dateTo, 'yyyy-MM-dd'))
      .eq('status', 'completed');

    // Apply filters
    if (filters?.region) {
      transactionQuery = transactionQuery.eq('stores.region', filters.region);
    }
    if (filters?.storeId) {
      transactionQuery = transactionQuery.eq('store_id', filters.storeId);
    }

    const { data: transactions, error: transError } = await transactionQuery;
    if (transError) throw transError;

    if (!transactions || transactions.length === 0) return [];

    // Get transaction IDs
    const transactionIds = transactions.map(t => t.id);

    // Get transaction items for these transactions with product details
    const { data: items, error } = await supabase
      .from('transaction_items')
      .select(`
        product_id,
        product_name,
        quantity,
        line_total,
        products!inner(
          category_id,
          brand_id,
          product_categories!inner(category_name),
          brands!inner(brand_name)
        )
      `)
      .in('transaction_id', transactionIds)
      .eq('is_voided', false);

    if (error) throw error;

    // Group by product and calculate totals
    const productSales = items?.reduce((acc: any, item) => {
      const productId = item.product_id;
      if (!acc[productId]) {
        acc[productId] = {
          product_name: item.product_name,
          category_name: item.products?.product_categories?.category_name || 'Uncategorized',
          brand_name: item.products?.brands?.brand_name || 'Generic',
          total_revenue: 0,
          total_units_sold: 0
        };
      }
      acc[productId].total_revenue += Number(item.line_total);
      acc[productId].total_units_sold += Number(item.quantity);
      return acc;
    }, {}) || {};

    // Convert to array, sort by revenue, and take top N
    return Object.values(productSales)
      .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
      .slice(0, limit);
  }

  // Get top categories
  private async getTopCategories(dateFrom: Date, dateTo: Date, filters?: any) {
    // First get transactions in the date range with filters
    let transactionQuery = supabase
      .from('transactions')
      .select(`
        id,
        store_id,
        stores!inner(region)
      `)
      .gte('transaction_date', format(dateFrom, 'yyyy-MM-dd'))
      .lte('transaction_date', format(dateTo, 'yyyy-MM-dd'))
      .eq('status', 'completed');

    // Apply filters
    if (filters?.region) {
      transactionQuery = transactionQuery.eq('stores.region', filters.region);
    }
    if (filters?.storeId) {
      transactionQuery = transactionQuery.eq('store_id', filters.storeId);
    }

    const { data: transactions, error: transError } = await transactionQuery;
    if (transError) throw transError;

    if (!transactions || transactions.length === 0) return [];

    // Get transaction IDs
    const transactionIds = transactions.map(t => t.id);

    // Get transaction items with category details
    const { data: items, error } = await supabase
      .from('transaction_items')
      .select(`
        transaction_id,
        line_total,
        products!inner(
          category_id,
          product_categories!inner(category_name)
        )
      `)
      .in('transaction_id', transactionIds)
      .eq('is_voided', false);

    if (error) throw error;

    // Group by category and calculate totals
    const categorySales = items?.reduce((acc: any, item) => {
      const categoryName = item.products?.product_categories?.category_name || 'Uncategorized';
      if (!acc[categoryName]) {
        acc[categoryName] = {
          category_name: categoryName,
          total_revenue: 0,
          transaction_count: new Set()
        };
      }
      acc[categoryName].total_revenue += Number(item.line_total);
      acc[categoryName].transaction_count.add(item.transaction_id);
      return acc;
    }, {}) || {};

    // Convert to array, calculate transaction counts, sort by revenue, and take top 5
    return Object.values(categorySales)
      .map((cat: any) => ({
        category_name: cat.category_name,
        total_revenue: cat.total_revenue,
        transaction_count: cat.transaction_count.size
      }))
      .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
      .slice(0, 5);
  }

  // Get region performance
  private async getRegionPerformance(dateFrom: Date, dateTo: Date) {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        total_amount,
        store_id,
        stores!inner(region)
      `)
      .gte('transaction_date', format(dateFrom, 'yyyy-MM-dd'))
      .lte('transaction_date', format(dateTo, 'yyyy-MM-dd'))
      .eq('status', 'completed');

    if (error) throw error;

    // Group by region and calculate totals
    const regionData = transactions?.reduce((acc: any, transaction) => {
      const region = transaction.stores?.region || 'Unknown';
      if (!acc[region]) {
        acc[region] = {
          region: region,
          total_sales: 0,
          transactions: 0
        };
      }
      acc[region].total_sales += Number(transaction.total_amount);
      acc[region].transactions += 1;
      return acc;
    }, {}) || {};

    // Convert to array and sort by total sales
    return Object.values(regionData)
      .sort((a: any, b: any) => b.total_sales - a.total_sales);
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