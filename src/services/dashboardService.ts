import { supabase } from '../lib/supabase';
import type { Transaction, TransactionItem, Store, Product, Customer } from '../lib/supabase';

export interface DashboardFilters {
  timeOfDay?: string;
  region?: string;
  barangay?: string;
  weekVsWeekend?: 'week' | 'weekend' | 'all';
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

class DashboardService {
  // Get transaction trends with filters
  async getTransactionTrends(filters: DashboardFilters = {}) {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        stores!inner(region, province, city_municipality, barangay),
        customers(gender, age_bracket),
        transaction_items!inner(
          *,
          products!inner(product_category, brands!inner(brand_name))
        )
      `)
      .order('timestamp', { ascending: true });

    // Apply filters
    if (filters.region) {
      query = query.eq('stores.region', filters.region);
    }
    
    if (filters.barangay) {
      query = query.eq('stores.barangay', filters.barangay);
    }

    if (filters.category) {
      query = query.eq('transaction_items.products.product_category', filters.category);
    }

    if (filters.weekVsWeekend && filters.weekVsWeekend !== 'all') {
      const weekendDays = ['Saturday', 'Sunday'];
      if (filters.weekVsWeekend === 'weekend') {
        query = query.in('day_of_week', weekendDays);
      } else {
        query = query.not('day_of_week', 'in', `(${weekendDays.join(',')})`);
      }
    }

    if (filters.startDate) {
      query = query.gte('timestamp', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('timestamp', filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transaction trends:', error);
      throw error;
    }

    return data;
  }

  // Get substitution data for Sankey diagram
  async getSubstitutionData(filters: DashboardFilters = {}): Promise<SubstitutionData[]> {
    let query = supabase
      .from('transaction_items')
      .select(`
        *,
        products!transaction_items_sku_id_fkey(product_name, brands!inner(brand_name)),
        original_products:products!transaction_items_original_sku_id_fkey(product_name, brands!inner(brand_name)),
        transactions!inner(
          timestamp,
          stores!inner(region, barangay)
        )
      `)
      .eq('was_substituted', true)
      .not('original_sku_id', 'is', null);

    // Apply filters
    if (filters.region) {
      query = query.eq('transactions.stores.region', filters.region);
    }

    if (filters.barangay) {
      query = query.eq('transactions.stores.barangay', filters.barangay);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching substitution data:', error);
      throw error;
    }

    // Transform data for Sankey visualization
    const substitutionMap = new Map<string, SubstitutionData>();

    data?.forEach(item => {
      const originalProduct = item.original_products?.product_name || 'Unknown';
      const substitutedProduct = item.products?.product_name || 'Unknown';
      const originalBrand = item.original_products?.brands?.brand_name || 'Unknown';
      const substitutedBrand = item.products?.brands?.brand_name || 'Unknown';
      
      const key = `${originalProduct}->${substitutedProduct}`;
      
      if (substitutionMap.has(key)) {
        substitutionMap.get(key)!.count += item.quantity;
      } else {
        substitutionMap.set(key, {
          originalProduct,
          substitutedProduct,
          originalBrand,
          substitutedBrand,
          count: item.quantity
        });
      }
    });

    return Array.from(substitutionMap.values());
  }

  // Get geographic data for heatmap
  async getGeographicData(filters: DashboardFilters = {}): Promise<RegionData[]> {
    let query = supabase
      .from('mv_regional_performance')
      .select('*');

    // Apply filters if materialized view supports them
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching geographic data:', error);
      // Fallback to direct query if materialized view doesn't exist
      return this.getGeographicDataFallback(filters);
    }

    return data?.map(row => ({
      id: row.region,
      name: row.region,
      value: row.total_revenue || 0,
      transactions: row.transaction_count || 0,
      customers: row.unique_customers || 0,
      avgBasketSize: row.avg_transaction_value || 0
    })) || [];
  }

  // Fallback geographic data query
  private async getGeographicDataFallback(filters: DashboardFilters = {}): Promise<RegionData[]> {
    let query = supabase
      .from('transactions')
      .select(`
        transaction_value,
        customer_id,
        stores!inner(region, latitude, longitude)
      `);

    // Apply filters
    if (filters.region) {
      query = query.eq('stores.region', filters.region);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error in fallback geographic query:', error);
      throw error;
    }

    // Group by region
    const regionMap = new Map<string, {
      value: number;
      transactions: number;
      customers: Set<string>;
      coordinates: { lat: number; lng: number }[];
    }>();

    data?.forEach(transaction => {
      const region = transaction.stores.region;
      
      if (!regionMap.has(region)) {
        regionMap.set(region, {
          value: 0,
          transactions: 0,
          customers: new Set(),
          coordinates: []
        });
      }

      const regionData = regionMap.get(region)!;
      regionData.value += transaction.transaction_value;
      regionData.transactions += 1;
      if (transaction.customer_id) {
        regionData.customers.add(transaction.customer_id);
      }
      if (transaction.stores.latitude && transaction.stores.longitude) {
        regionData.coordinates.push({
          lat: transaction.stores.latitude,
          lng: transaction.stores.longitude
        });
      }
    });

    return Array.from(regionMap.entries()).map(([region, data]) => {
      // Calculate average coordinates for region
      const avgCoords = data.coordinates.length > 0 ? {
        latitude: data.coordinates.reduce((sum, coord) => sum + coord.lat, 0) / data.coordinates.length,
        longitude: data.coordinates.reduce((sum, coord) => sum + coord.lng, 0) / data.coordinates.length
      } : undefined;

      return {
        id: region,
        name: region,
        value: data.value,
        transactions: data.transactions,
        customers: data.customers.size,
        avgBasketSize: data.transactions > 0 ? data.value / data.transactions : 0,
        latitude: avgCoords?.latitude,
        longitude: avgCoords?.longitude
      };
    });
  }

  // Get hourly patterns
  async getHourlyPatterns(filters: DashboardFilters = {}) {
    let query = supabase
      .from('mv_hourly_patterns')
      .select('*')
      .order('date', { ascending: true })
      .order('hour_of_day', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching hourly patterns:', error);
      // Fallback to direct query
      return this.getHourlyPatternsFallback(filters);
    }

    return data;
  }

  private async getHourlyPatternsFallback(filters: DashboardFilters = {}) {
    let query = supabase
      .from('transactions')
      .select(`
        timestamp,
        hour_of_day,
        transaction_value,
        units_total,
        duration_seconds,
        stores!inner(region)
      `);

    if (filters.region) {
      query = query.eq('stores.region', filters.region);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error in fallback hourly patterns:', error);
      throw error;
    }

    // Group by date and hour
    const patterns = new Map<string, {
      date: string;
      hour_of_day: number;
      transaction_count: number;
      total_value: number;
      total_units: number;
      avg_duration: number;
    }>();

    data?.forEach(transaction => {
      const date = transaction.timestamp.split('T')[0];
      const key = `${date}-${transaction.hour_of_day}`;

      if (!patterns.has(key)) {
        patterns.set(key, {
          date,
          hour_of_day: transaction.hour_of_day,
          transaction_count: 0,
          total_value: 0,
          total_units: 0,
          avg_duration: 0
        });
      }

      const pattern = patterns.get(key)!;
      pattern.transaction_count += 1;
      pattern.total_value += transaction.transaction_value;
      pattern.total_units += transaction.units_total;
      pattern.avg_duration += transaction.duration_seconds;
    });

    // Calculate averages
    return Array.from(patterns.values()).map(pattern => ({
      ...pattern,
      avg_value: pattern.total_value / pattern.transaction_count,
      avg_duration: pattern.avg_duration / pattern.transaction_count
    }));
  }

  // Get filter options
  async getFilterOptions() {
    // Get unique regions
    const { data: regions } = await supabase
      .from('stores')
      .select('region')
      .order('region');

    // Get unique barangays
    const { data: barangays } = await supabase
      .from('stores')
      .select('barangay')
      .order('barangay');

    // Get unique categories
    const { data: categories } = await supabase
      .from('products')
      .select('product_category')
      .order('product_category');

    // Get unique brands
    const { data: brands } = await supabase
      .from('brands')
      .select('brand_name')
      .order('brand_name');

    return {
      regions: [...new Set(regions?.map(r => r.region) || [])],
      barangays: [...new Set(barangays?.map(b => b.barangay) || [])],
      categories: [...new Set(categories?.map(c => c.product_category) || [])],
      brands: [...new Set(brands?.map(b => b.brand_name) || [])]
    };
  }
}

export const dashboardService = new DashboardService();