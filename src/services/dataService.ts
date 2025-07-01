import { supabase } from '../lib/supabase';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

// Types matching the new database schema
export interface Store {
  id: string;
  store_code: string;
  store_name: string;
  region: string;
  province?: string;
  city: string;
  barangay?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  store_type?: string;
  status: string;
}

export interface Product {
  id: string;
  barcode: string;
  sku: string;
  product_name: string;
  description?: string;
  category: ProductCategory;
  brand: Brand;
  current_price: number;
  cost_price: number;
  unit_of_measure?: string;
  pack_size?: string;
}

export interface Transaction {
  id: string;
  receipt_number: string;
  transaction_date: string;
  transaction_time: string;
  transaction_datetime: string;
  store: Store;
  cashier?: any;
  customer?: any;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_method: string;
  items_count: number;
  status: string;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product: Product;
  barcode: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  line_total: number;
  profit_amount?: number;
}

export interface ProductCategory {
  id: string;
  category_code: string;
  category_name: string;
}

export interface Brand {
  id: string;
  brand_code: string;
  brand_name: string;
}

export interface DailySales {
  transaction_date: string;
  store_id: string;
  store_name: string;
  region: string;
  city: string;
  transaction_count: number;
  unique_customers: number;
  total_items_sold: number;
  gross_sales: number;
  total_discounts: number;
  total_tax: number;
  net_sales: number;
  avg_transaction_value: number;
  cash_transactions: number;
  digital_transactions: number;
}

export interface ProductPerformance {
  product_id: string;
  barcode: string;
  sku: string;
  product_name: string;
  category_name: string;
  brand_name: string;
  transaction_count: number;
  total_quantity_sold: number;
  total_revenue: number;
  total_profit: number;
  avg_selling_price: number;
  avg_discount_percent: number;
}

export interface HourlyPattern {
  hour_of_day: number;
  day_of_week: number;
  transaction_count: number;
  total_sales: number;
  avg_transaction_value: number;
  avg_items_per_transaction: number;
}

class DataService {
  // Dashboard Overview Data
  async getKPIMetrics(dateRange: { start: Date; end: Date }) {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('total_amount, customer_type')
        .gte('datetime', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('datetime', format(dateRange.end, 'yyyy-MM-dd'));

      if (error) throw error;

      const totalSales = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const totalTransactions = transactions?.length || 0;
      const avgBasketSize = totalTransactions > 0 ? totalSales / totalTransactions : 0;
      const totalItems = transactions?.length || 0; // Count transactions as items for now
      const uniqueCustomers = new Set(transactions?.map(t => t.customer_type).filter(Boolean)).size;

      // Calculate growth (compare with previous period)
      const previousStart = subDays(dateRange.start, 30);
      const previousEnd = subDays(dateRange.end, 30);
      
      const { data: previousTransactions } = await supabase
        .from('transactions')
        .select('total_amount')
        .gte('datetime', format(previousStart, 'yyyy-MM-dd'))
        .lte('datetime', format(previousEnd, 'yyyy-MM-dd'));

      const previousSales = previousTransactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const salesGrowth = previousSales > 0 ? ((totalSales - previousSales) / previousSales) * 100 : 0;

      return [
        {
          id: 'total_sales',
          title: 'Total Sales',
          value: totalSales,
          change: salesGrowth,
          trend: salesGrowth >= 0 ? 'up' : 'down',
          icon: 'DollarSign',
          color: 'primary'
        },
        {
          id: 'transactions',
          title: 'Transactions',
          value: totalTransactions,
          change: 0, // Calculate if needed
          trend: 'up',
          icon: 'ShoppingCart',
          color: 'secondary'
        },
        {
          id: 'avg_basket',
          title: 'Avg Basket Size',
          value: avgBasketSize,
          change: 0, // Calculate if needed
          trend: 'up',
          icon: 'TrendingUp',
          color: 'success'
        },
        {
          id: 'active_customers',
          title: 'Active Customers',
          value: uniqueCustomers,
          change: 0, // Calculate if needed
          trend: 'up',
          icon: 'Users',
          color: 'warning'
        },
        {
          id: 'items_sold',
          title: 'Items Sold',
          value: totalItems,
          change: 0, // Calculate if needed
          trend: 'up',
          icon: 'Package',
          color: 'info'
        }
      ];
    } catch (error) {
      console.error('Error fetching KPI metrics:', error);
      throw error;
    }
  }

  // Sales Trend Data (24-hour or daily)
  async getSalesTrendData(period: 'hourly' | 'daily' = 'hourly', days: number = 1) {
    try {
      if (period === 'hourly') {
        const { data, error } = await supabase
          .from('v_hourly_patterns')
          .select('*')
          .order('hour_of_day', { ascending: true });

        if (error) throw error;

        return data?.map(item => ({
          name: `${item.hour_of_day}:00`,
          value: item.total_sales,
          transactions: item.transaction_count
        })) || [];
      } else {
        // For daily data, query transactions directly and aggregate
        const { data, error } = await supabase
          .from('transactions')
          .select('datetime, total_amount')
          .gte('datetime', format(subDays(new Date(), days), 'yyyy-MM-dd'))
          .order('datetime', { ascending: true });

        if (error) throw error;

        // Group by date
        const dailyData = data?.reduce((acc: any, transaction: any) => {
          const date = format(new Date(transaction.datetime), 'yyyy-MM-dd');
          if (!acc[date]) {
            acc[date] = {
              date,
              total_sales: 0,
              transaction_count: 0
            };
          }
          acc[date].total_sales += transaction.total_amount || 0;
          acc[date].transaction_count += 1;
          return acc;
        }, {});

        return Object.values(dailyData || {}).map((item: any) => ({
          name: format(new Date(item.date), 'MMM dd'),
          value: item.total_sales,
          transactions: item.transaction_count
        }));
      }
    } catch (error) {
      console.error('Error fetching sales trend:', error);
      throw error;
    }
  }

  // Geographic Data with coordinates for map visualization
  async getGeographicData() {
    try {
      // Get geographic data with coordinates from the geography table
      // and join with transaction data for sales metrics
      const { data, error } = await supabase
        .from('geography')
        .select(`
          id,
          region,
          city_municipality,
          barangay,
          store_name,
          latitude,
          longitude,
          store_type
        `);

      if (error) throw error;

      // Get transaction data for the last 30 days
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('geography_id, total_amount')
        .gte('datetime', format(subDays(new Date(), 30), 'yyyy-MM-dd'));

      if (transactionError) throw transactionError;

      // Aggregate transaction data by geography
      const salesByGeography = transactionData?.reduce((acc: any, transaction: any) => {
        const geoId = transaction.geography_id;
        if (!acc[geoId]) {
          acc[geoId] = {
            total_sales: 0,
            transaction_count: 0
          };
        }
        acc[geoId].total_sales += transaction.total_amount || 0;
        acc[geoId].transaction_count += 1;
        return acc;
      }, {}) || {};

      // Combine geographic data with sales data
      const combinedData = data?.map(geo => ({
        id: geo.id,
        region: geo.region,
        city: geo.city_municipality,
        barangay: geo.barangay,
        store_name: geo.store_name,
        latitude: geo.latitude,
        longitude: geo.longitude,
        store_type: geo.store_type,
        total_sales: salesByGeography[geo.id]?.total_sales || 0,
        transaction_count: salesByGeography[geo.id]?.transaction_count || 0,
        lng: geo.longitude, // Add lng property for map compatibility
        lat: geo.latitude   // Add lat property for map compatibility
      })) || [];

      // Group by region for summary data
      const regionData = combinedData.reduce((acc: any[], item: any) => {
        const existing = acc.find(r => r.region === item.region);
        if (existing) {
          existing.value += item.total_sales;
          existing.transactions += item.transaction_count;
          existing.stores = (existing.stores || 0) + 1;
        } else {
          acc.push({
            region: item.region,
            value: item.total_sales,
            transactions: item.transaction_count,
            stores: 1,
            cities: []
          });
        }
        return acc;
      }, []);

      return {
        regions: regionData,
        stores: combinedData
      };
    } catch (error) {
      console.error('Error fetching geographic data:', error);
      throw error;
    }
  }

  // Product Performance Data
  async getProductPerformanceData(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('v_product_performance')
        .select('*')
        .order('total_sales', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(item => ({
        name: item.sku_description || item.sku,
        sales: item.total_sales,
        units: item.total_quantity_sold,
        category: item.category,
        brand: item.brand
      })) || [];
    } catch (error) {
      console.error('Error fetching product performance:', error);
      throw error;
    }
  }

  // Category Performance
  async getCategoryPerformance() {
    try {
      const { data, error } = await supabase
        .from('v_product_performance')
        .select('category, total_sales, total_quantity_sold, transaction_count');

      if (error) throw error;

      // Group by category
      const categoryData = data?.reduce((acc: any, item: any) => {
        const categoryName = item.category || 'Unknown';
        if (!acc[categoryName]) {
          acc[categoryName] = {
            category: categoryName,
            sales: 0,
            units: 0,
            transactions: 0
          };
        }
        acc[categoryName].sales += item.total_sales || 0;
        acc[categoryName].units += item.total_quantity_sold || 0;
        acc[categoryName].transactions += item.transaction_count || 0;
        return acc;
      }, {});

      return Object.values(categoryData || {});
    } catch (error) {
      console.error('Error fetching category performance:', error);
      throw error;
    }
  }

  // Customer Segments
  async getCustomerSegments() {
    try {
      const { data, error } = await supabase
        .from('v_customer_analysis')
        .select('*');

      if (error) throw error;

      return data?.map(segment => ({
        segment: segment.customer_type,
        count: segment.transaction_count,
        totalSpend: segment.total_sales,
        avgSpend: segment.avg_transaction_value,
        transactions: segment.transaction_count,
        percentage: segment.percentage_of_transactions
      })) || [];
    } catch (error) {
      console.error('Error fetching customer segments:', error);
      throw error;
    }
  }

  // Transaction Patterns
  async getTransactionPatterns(dateRange: { start: Date; end: Date }) {
    try {
      // Hourly patterns
      const { data: hourlyData, error: hourlyError } = await supabase
        .from('v_hourly_patterns')
        .select('*')
        .order('hour_of_day', { ascending: true });

      if (hourlyError) throw hourlyError;

      const hourlyPatterns = hourlyData?.map(item => ({
        hour: `${item.hour_of_day}:00`,
        transactions: item.transaction_count,
        value: item.total_sales,
        avg_size: item.avg_transaction_value
      })) || [];

      // Payment methods
      const { data: paymentData, error: paymentError } = await supabase
        .from('v_payment_method_analysis')
        .select('*');

      if (paymentError) throw paymentError;

      const paymentMethods = paymentData?.map(method => ({
        name: method.payment_method,
        value: method.total_amount,
        count: method.transaction_count,
        percentage: method.percentage_of_sales
      })) || [];

      // Daily patterns - use transaction data directly
      const { data: dailyTransactions, error: dailyError } = await supabase
        .from('transactions')
        .select('datetime, total_amount')
        .gte('datetime', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('datetime', format(dateRange.end, 'yyyy-MM-dd'));

      if (dailyError) throw dailyError;

      // Group by day of week
      const dailyPatterns = Array.from({ length: 7 }, (_, dayIndex) => {
        const dayTransactions = dailyTransactions?.filter(t => {
          const transactionDay = new Date(t.datetime).getDay();
          return transactionDay === dayIndex;
        }) || [];

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        return {
          day: dayNames[dayIndex],
          transactions: dayTransactions.length,
          value: dayTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0),
          growth: 0 // Calculate if needed
        };
      });

      return {
        hourlyPatterns,
        dailyPatterns,
        paymentMethods
      };
    } catch (error) {
      console.error('Error fetching transaction patterns:', error);
      throw error;
    }
  }

  // Product Substitution Patterns
  async getSubstitutionPatterns() {
    try {
      const { data, error } = await supabase
        .from('v_substitution_analysis')
        .select('*')
        .limit(10);

      if (error) throw error;

      return data?.map(item => ({
        source: `${item.original_brand} ${item.original_sku}`,
        target: `${item.substituted_brand} ${item.substituted_sku}`,
        value: item.substitution_count,
        percentage: item.acceptance_rate
      })) || [];
    } catch (error) {
      console.error('Error fetching substitution patterns:', error);
      // Return empty array instead of mock data if there's an error
      return [];
    }
  }

  // Refresh materialized views
  async refreshMaterializedViews() {
    try {
      // Since we're using views instead of materialized views, this is not needed
      // But we can keep it for future use
      return { success: true };
    } catch (error) {
      console.error('Error refreshing materialized views:', error);
      throw error;
    }
  }
}

export const dataService = new DataService();