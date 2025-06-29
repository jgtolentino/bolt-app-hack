import { create } from 'zustand';
import { supabase, fetchAllRecords } from '../lib/supabase';
import { KPIMetric, TransactionData, GeographyData, OrganizationData, ChartDataPoint } from '../types';

interface DataStore {
  // Data mode
  useRealData: boolean;
  setUseRealData: (useReal: boolean) => void;
  
  // KPI Metrics
  kpiMetrics: KPIMetric[];
  
  // Chart Data
  salesTrendData: ChartDataPoint[];
  geographicData: GeographyData[];
  productPerformanceData: ChartDataPoint[];
  
  // Raw Data
  transactions: TransactionData[];
  geography: GeographyData[];
  organizations: OrganizationData[];
  
  // Loading states
  isLoadingKPIs: boolean;
  isLoadingCharts: boolean;
  isLoadingData: boolean;
  
  // Actions
  loadKPIMetrics: () => Promise<void>;
  loadChartData: () => Promise<void>;
  loadGeographicData: () => Promise<void>;
  refreshAllData: () => Promise<void>;
}

export const useDataStore = create<DataStore>((set, get) => ({
  useRealData: true,
  setUseRealData: (useReal) => {
    set({ useRealData: useReal });
    // Refresh all data when switching modes
    get().refreshAllData();
  },
  
  kpiMetrics: [],
  salesTrendData: [],
  geographicData: [],
  productPerformanceData: [],
  transactions: [],
  geography: [],
  organizations: [],
  isLoadingKPIs: false,
  isLoadingCharts: false,
  isLoadingData: false,

  loadKPIMetrics: async () => {
    try {
      set({ isLoadingKPIs: true });
      const { useRealData } = get();
      
      if (useRealData) {
        // Try to load real data from Supabase
        try {
          // Use pagination to get all transactions from the last 30 days
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          const query = supabase
            .from('transactions')
            .select('total_amount, quantity, datetime')
            .gte('datetime', thirtyDaysAgo)
            .order('id', { ascending: true });
          
          const transactions = await fetchAllRecords(query);

          if (transactions && transactions.length > 0) {
            const totalSales = transactions.reduce((sum, t) => sum + t.total_amount, 0);
            const totalTransactions = transactions.length;
            const avgBasket = totalSales / totalTransactions;
            
            // Calculate growth (mock calculation for demo)
            const realKPIs: KPIMetric[] = [
              {
                id: 'total_sales',
                title: 'Total Sales',
                value: totalSales,
                change: 15.2,
                changeType: 'increase',
                format: 'currency',
                icon: 'Banknote',
                trend: [totalSales * 0.8, totalSales * 0.85, totalSales * 0.9, totalSales * 0.95, totalSales]
              },
              {
                id: 'transactions',
                title: 'Transactions',
                value: totalTransactions,
                change: 8.7,
                changeType: 'increase',
                format: 'number',
                icon: 'Receipt',
                trend: [totalTransactions * 0.8, totalTransactions * 0.85, totalTransactions * 0.9, totalTransactions * 0.95, totalTransactions]
              },
              {
                id: 'avg_basket',
                title: 'Avg Basket',
                value: Math.round(avgBasket),
                change: 6.1,
                changeType: 'increase',
                format: 'currency',
                icon: 'ShoppingCart',
                trend: [avgBasket * 0.9, avgBasket * 0.93, avgBasket * 0.96, avgBasket * 0.98, avgBasket]
              },
              {
                id: 'growth_rate',
                title: 'Growth Rate',
                value: 14.7,
                change: 2.3,
                changeType: 'increase',
                format: 'percentage',
                icon: 'TrendingUp',
                trend: [12.1, 12.8, 13.5, 14.2, 14.7]
              },
              {
                id: 'active_outlets',
                title: 'Active Outlets',
                value: 27, // Based on our seed data
                change: 5.8,
                changeType: 'increase',
                format: 'number',
                icon: 'Store',
                trend: [23, 24, 25, 26, 27]
              }
            ];

            set({ kpiMetrics: realKPIs, isLoadingKPIs: false });
            return;
          }
        } catch (error) {
          console.warn('Failed to load real data, falling back to mock data:', error);
        }
      }
      
      // Fallback to mock data
      const mockKPIs: KPIMetric[] = [
        {
          id: 'total_sales',
          title: 'Total Sales',
          value: 2450000,
          change: 15.2,
          changeType: 'increase',
          format: 'currency',
          icon: 'Banknote',
          trend: [2100000, 2200000, 2350000, 2400000, 2450000]
        },
        {
          id: 'transactions',
          title: 'Transactions',
          value: 8547,
          change: 8.7,
          changeType: 'increase',
          format: 'number',
          icon: 'Receipt',
          trend: [7800, 7900, 8100, 8300, 8547]
        },
        {
          id: 'avg_basket',
          title: 'Avg Basket',
          value: 287,
          change: 6.1,
          changeType: 'increase',
          format: 'currency',
          icon: 'ShoppingCart',
          trend: [265, 270, 275, 282, 287]
        },
        {
          id: 'growth_rate',
          title: 'Growth Rate',
          value: 14.7,
          change: 2.3,
          changeType: 'increase',
          format: 'percentage',
          icon: 'TrendingUp',
          trend: [12.1, 12.8, 13.5, 14.2, 14.7]
        },
        {
          id: 'active_outlets',
          title: 'Active Outlets',
          value: 127,
          change: 5.8,
          changeType: 'increase',
          format: 'number',
          icon: 'Store',
          trend: [115, 118, 122, 124, 127]
        }
      ];

      set({ kpiMetrics: mockKPIs, isLoadingKPIs: false });
    } catch (error) {
      console.error('Failed to load KPI metrics:', error);
      set({ isLoadingKPIs: false });
    }
  },

  loadChartData: async () => {
    try {
      set({ isLoadingCharts: true });
      const { useRealData } = get();
      
      if (useRealData) {
        try {
          // Load real sales trend data
          const { data: salesData, error: salesError } = await supabase
            .rpc('get_seasonal_trends', { year_filter: 2024 });

          // Load real product performance data
          const query = supabase
            .from('v_product_performance')
            .select('sku, total_sales, category')
            .order('total_sales', { ascending: false });
          
          const productData = await fetchAllRecords(query, 1000, 8);

          if (!salesError && salesData && salesData.length > 0) {
            const realSalesTrend: ChartDataPoint[] = salesData.map((item: any) => ({
              name: item.month_name,
              value: item.total_sales || 0,
              transactions: item.transaction_count || 0
            }));

            const realProductPerformance: ChartDataPoint[] = productData?.map((item: any) => ({
              name: item.sku,
              value: item.total_sales || 0,
              category: item.category
            })) || [];

            set({
              salesTrendData: realSalesTrend,
              productPerformanceData: realProductPerformance,
              isLoadingCharts: false
            });
            return;
          }
        } catch (error) {
          console.warn('Failed to load real chart data, falling back to mock data:', error);
        }
      }
      
      // Fallback to mock data
      const mockSalesTrend: ChartDataPoint[] = [
        { name: 'Jan', value: 2100000, transactions: 7200 },
        { name: 'Feb', value: 2200000, transactions: 7500 },
        { name: 'Mar', value: 2350000, transactions: 8100 },
        { name: 'Apr', value: 2400000, transactions: 8300 },
        { name: 'May', value: 2450000, transactions: 8547 },
      ];

      const mockProductPerformance: ChartDataPoint[] = [
        { name: 'Coca-Cola 355ml', value: 180000, category: 'Beverages' },
        { name: 'Oishi Prawn Crackers', value: 145000, category: 'Snacks' },
        { name: 'Alaska Evap Milk', value: 125000, category: 'Dairy' },
        { name: 'Powerade 500ml', value: 110000, category: 'Beverages' },
        { name: 'Bear Brand Milk', value: 95000, category: 'Dairy' },
        { name: 'Del Monte Juice', value: 88000, category: 'Beverages' },
        { name: 'Oishi Pillows', value: 82000, category: 'Snacks' },
        { name: 'Surf Powder', value: 75000, category: 'Home Care' },
      ];

      set({
        salesTrendData: mockSalesTrend,
        productPerformanceData: mockProductPerformance,
        isLoadingCharts: false
      });
    } catch (error) {
      console.error('Failed to load chart data:', error);
      set({ isLoadingCharts: false });
    }
  },

  loadGeographicData: async () => {
    try {
      set({ isLoadingData: true });
      const { useRealData } = get();
      
      if (useRealData) {
        try {
          const query = supabase
            .from('v_geographic_performance')
            .select('*')
            .order('total_sales', { ascending: false });
          
          const geoData = await fetchAllRecords(query);

          if (geoData && geoData.length > 0) {
            const realGeographicData: GeographyData[] = geoData.map((item: any) => ({
              id: item.region + '-' + item.city_municipality,
              region: item.region,
              city_municipality: item.city_municipality,
              barangay: 'Multiple',
              store_name: `${item.city_municipality} Stores`,
              latitude: getRegionCoordinates(item.region).lat,
              longitude: getRegionCoordinates(item.region).lng,
              population: 0,
              total_sales: item.total_sales || 0,
              transaction_count: item.total_transactions || 0,
              avg_transaction_value: item.avg_transaction_value || 0
            }));

            set({ geographicData: realGeographicData, isLoadingData: false });
            return;
          }
        } catch (error) {
          console.warn('Failed to load real geographic data, falling back to mock data:', error);
        }
      }
      
      // Fallback to mock data
      const mockGeographicData: GeographyData[] = [
        {
          id: '1',
          region: 'NCR',
          city_municipality: 'Manila',
          barangay: 'Tondo',
          store_name: 'Tondo Market Sari-Sari',
          latitude: 14.6042,
          longitude: 120.9822,
          population: 628903,
          total_sales: 850000,
          transaction_count: 3200,
          avg_transaction_value: 265
        },
        {
          id: '2',
          region: 'NCR',
          city_municipality: 'Quezon City',
          barangay: 'Bagumbayan',
          store_name: 'Bagumbayan MiniMart',
          latitude: 14.6760,
          longitude: 121.0437,
          population: 45312,
          total_sales: 420000,
          transaction_count: 1680,
          avg_transaction_value: 250
        },
        {
          id: '3',
          region: 'Region VII',
          city_municipality: 'Cebu City',
          barangay: 'Lahug',
          store_name: 'Lahug Sari-Sari',
          latitude: 10.3312,
          longitude: 123.9078,
          population: 89123,
          total_sales: 380000,
          transaction_count: 1520,
          avg_transaction_value: 250
        },
      ];

      set({ geographicData: mockGeographicData, isLoadingData: false });
    } catch (error) {
      console.error('Failed to load geographic data:', error);
      set({ isLoadingData: false });
    }
  },

  refreshAllData: async () => {
    const { loadKPIMetrics, loadChartData, loadGeographicData } = get();
    await Promise.all([
      loadKPIMetrics(),
      loadChartData(),
      loadGeographicData()
    ]);
  },
}));

// Helper function to get region coordinates
function getRegionCoordinates(region: string): { lat: number; lng: number } {
  const coordinates: { [key: string]: { lat: number; lng: number } } = {
    'NCR': { lat: 14.6042, lng: 120.9822 },
    'Region III': { lat: 15.1605, lng: 120.5897 },
    'Region IV-A': { lat: 14.5878, lng: 121.1854 },
    'Region VI': { lat: 10.7323, lng: 122.5621 },
    'Region VII': { lat: 10.3312, lng: 123.9078 },
    'Region XI': { lat: 7.0731, lng: 125.6128 }
  };
  
  return coordinates[region] || { lat: 12.8797, lng: 121.7740 }; // Philippines center as fallback
}