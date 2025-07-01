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
        .select('total_amount, customer_id')
        .gte('datetime', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('datetime', format(dateRange.end, 'yyyy-MM-dd'))
        .eq('status', 'completed');

      if (error) throw error;

      const totalSales = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const totalTransactions = transactions?.length || 0;
      const avgBasketSize = totalTransactions > 0 ? totalSales / totalTransactions : 0;
      const totalItems = transactions?.length || 0; // Count transactions as items for now
      const uniqueCustomers = new Set(transactions?.map(t => t.customer_id).filter(Boolean)).size;

      // Calculate growth (compare with previous period)
      const previousStart = subDays(dateRange.start, 30);
      const previousEnd = subDays(dateRange.end, 30);
      
      const { data: previousTransactions } = await supabase
        .from('transactions')
        .select('total_amount')
        .gte('transaction_date', format(previousStart, 'yyyy-MM-dd'))
        .lte('transaction_date', format(previousEnd, 'yyyy-MM-dd'))
        .eq('status', 'completed');

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
          .from('mv_hourly_patterns')
          .select('*')
          .order('hour_of_day', { ascending: true });

        if (error) throw error;

        return data?.map(item => ({
          name: `${item.hour_of_day}:00`,
          value: item.total_sales,
          transactions: item.transaction_count
        })) || [];
      } else {
        const { data, error } = await supabase
          .from('mv_daily_sales')
          .select('*')
          .gte('transaction_date', format(subDays(new Date(), days), 'yyyy-MM-dd'))
          .order('transaction_date', { ascending: true });

        if (error) throw error;

        return data?.map(item => ({
          name: format(new Date(item.transaction_date), 'MMM dd'),
          value: item.net_sales,
          transactions: item.transaction_count
        })) || [];
      }
    } catch (error) {
      console.error('Error fetching sales trend:', error);
      throw error;
    }
  }

  // Geographic Data
  async getGeographicData() {
    try {
      const { data, error } = await supabase
        .from('mv_daily_sales')
        .select('region, city, SUM(net_sales) as total_sales, SUM(transaction_count) as total_transactions')
        .gte('transaction_date', format(subDays(new Date(), 30), 'yyyy-MM-dd'));

      if (error) throw error;

      // Group by region
      const regionData = data?.reduce((acc: any[], item: any) => {
        const existing = acc.find(r => r.region === item.region);
        if (existing) {
          existing.value += item.total_sales;
          existing.transactions += item.total_transactions;
        } else {
          acc.push({
            region: item.region,
            value: item.total_sales,
            transactions: item.total_transactions,
            cities: []
          });
        }
        return acc;
      }, []) || [];

      return regionData;
    } catch (error) {
      console.error('Error fetching geographic data:', error);
      throw error;
    }
  }

  // Product Performance Data
  async getProductPerformanceData(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('mv_product_performance')
        .select('*')
        .order('total_revenue', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(item => ({
        name: item.product_name,
        sales: item.total_revenue,
        units: item.total_quantity_sold,
        category: item.category_name,
        brand: item.brand_name
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
        .from('transaction_items')
        .select(`
          products!inner(
            category:product_categories(category_name)
          ),
          line_total,
          quantity
        `)
        .gte('created_at', format(subDays(new Date(), 30), 'yyyy-MM-dd'));

      if (error) throw error;

      // Group by category
      const categoryData = data?.reduce((acc: any, item: any) => {
        const categoryName = item.products?.category?.category_name || 'Unknown';
        if (!acc[categoryName]) {
          acc[categoryName] = {
            category: categoryName,
            sales: 0,
            units: 0,
            transactions: 0
          };
        }
        acc[categoryName].sales += item.line_total || 0;
        acc[categoryName].units += item.quantity || 0;
        acc[categoryName].transactions += 1;
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
        .from('customers')
        .select(`
          customer_type,
          transactions(total_amount, items_count)
        `)
        .not('customer_type', 'is', null);

      if (error) throw error;

      // Group by customer type
      const segmentData = data?.reduce((acc: any, customer: any) => {
        const type = customer.customer_type || 'Unknown';
        if (!acc[type]) {
          acc[type] = {
            segment: type,
            count: 0,
            totalSpend: 0,
            avgSpend: 0,
            transactions: 0
          };
        }
        acc[type].count += 1;
        
        if (customer.transactions && customer.transactions.length > 0) {
          acc[type].transactions += customer.transactions.length;
          acc[type].totalSpend += customer.transactions.reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0);
        }
        
        return acc;
      }, {});

      // Calculate averages
      Object.values(segmentData || {}).forEach((segment: any) => {
        segment.avgSpend = segment.count > 0 ? segment.totalSpend / segment.count : 0;
        segment.percentage = 0; // Calculate based on total
      });

      return Object.values(segmentData || {});
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
        .from('transactions')
        .select('transaction_time, total_amount, items_count')
        .gte('transaction_date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('transaction_date', format(dateRange.end, 'yyyy-MM-dd'))
        .eq('status', 'completed');

      if (hourlyError) throw hourlyError;

      // Process hourly data
      const hourlyPatterns = Array.from({ length: 24 }, (_, hour) => {
        const hourTransactions = hourlyData?.filter(t => {
          const transactionHour = new Date(`2000-01-01 ${t.transaction_time}`).getHours();
          return transactionHour === hour;
        }) || [];

        return {
          hour: `${hour}:00`,
          transactions: hourTransactions.length,
          value: hourTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0),
          avg_size: hourTransactions.length > 0 
            ? hourTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0) / hourTransactions.length 
            : 0
        };
      });

      // Daily patterns
      const { data: dailyData, error: dailyError } = await supabase
        .from('mv_daily_sales')
        .select('*')
        .gte('transaction_date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('transaction_date', format(dateRange.end, 'yyyy-MM-dd'))
        .order('transaction_date', { ascending: true });

      if (dailyError) throw dailyError;

      const dailyPatterns = dailyData?.map(day => ({
        day: format(new Date(day.transaction_date), 'EEEE'),
        transactions: day.transaction_count,
        value: day.net_sales,
        growth: 0 // Calculate if needed
      })) || [];

      // Payment methods
      const { data: paymentData, error: paymentError } = await supabase
        .from('transactions')
        .select('payment_method, total_amount')
        .gte('transaction_date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('transaction_date', format(dateRange.end, 'yyyy-MM-dd'))
        .eq('status', 'completed');

      if (paymentError) throw paymentError;

      const paymentMethods = paymentData?.reduce((acc: any, t: any) => {
        const method = t.payment_method || 'Unknown';
        if (!acc[method]) {
          acc[method] = {
            name: method,
            value: 0,
            count: 0,
            percentage: 0
          };
        }
        acc[method].value += t.total_amount || 0;
        acc[method].count += 1;
        return acc;
      }, {});

      // Calculate percentages
      const totalPaymentValue = Object.values(paymentMethods || {}).reduce((sum: number, m: any) => sum + m.value, 0);
      Object.values(paymentMethods || {}).forEach((method: any) => {
        method.percentage = totalPaymentValue > 0 ? (method.value / totalPaymentValue) * 100 : 0;
      });

      return {
        hourlyPatterns,
        dailyPatterns,
        paymentMethods: Object.values(paymentMethods || {})
      };
    } catch (error) {
      console.error('Error fetching transaction patterns:', error);
      throw error;
    }
  }

  // Product Substitution Patterns
  async getSubstitutionPatterns() {
    try {
      // This would require a more complex query analyzing purchase patterns
      // For now, return mock data structure
      return [
        {
          source: 'Coca-Cola 355ml',
          target: 'Pepsi 355ml',
          value: 450,
          percentage: 65
        },
        {
          source: 'Oishi Prawn Crackers',
          target: 'Piattos',
          value: 320,
          percentage: 48
        }
      ];
    } catch (error) {
      console.error('Error fetching substitution patterns:', error);
      throw error;
    }
  }

  // Refresh materialized views
  async refreshMaterializedViews() {
    try {
      await supabase.rpc('refresh_materialized_views');
      return { success: true };
    } catch (error) {
      console.error('Error refreshing materialized views:', error);
      throw error;
    }
  }
}

export const dataService = new DataService();