import { create } from 'zustand';
import { supabase, hasValidSupabaseConfig } from '../lib/supabase';
import { dataService } from '../services/dataService';
import { retailAnalyticsService } from '../services/retailAnalyticsService';
import { subDays } from 'date-fns';

interface KPIMetric {
  id: string;
  title: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
}

interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

interface DataStore {
  // Connection state
  isConnected: boolean;
  connectionError: string | null;
  
  // Data mode
  useRealData: boolean;
  setUseRealData: (useReal: boolean) => void;
  
  // Loading states
  isLoadingKPIs: boolean;
  isLoadingCharts: boolean;
  isLoadingGeographic: boolean;
  
  // Data
  kpiMetrics: KPIMetric[];
  salesTrendData: ChartDataPoint[];
  geographicData: any[];
  productPerformanceData: ChartDataPoint[];
  categoryPerformance: any[];
  customerSegments: any[];
  transactionPatterns: any;
  substitutionPatternsData: any[];
  
  // Retail Analytics Data
  consumerBehavior: any[];
  productCombinations: any[];
  paymentMethodDistribution: any[];
  consumerDemographics: any;
  storeInterventionMetrics: any;
  
  // Actions
  loadKPIMetrics: () => Promise<void>;
  loadChartData: () => Promise<void>;
  loadGeographicData: () => Promise<void>;
  loadProductPerformance: () => Promise<void>;
  loadCategoryPerformance: () => Promise<void>;
  loadCustomerSegments: () => Promise<void>;
  loadTransactionPatterns: () => Promise<void>;
  loadSubstitutionPatterns: () => Promise<void>;
  loadConsumerAnalytics: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  checkConnection: () => Promise<void>;
}

// Mock data fallbacks
const mockKPIMetrics: KPIMetric[] = [
  { id: 'total_sales', title: 'Total Sales', value: 1234567, change: 12.5, trend: 'up', icon: 'DollarSign', color: 'primary' },
  { id: 'transactions', title: 'Transactions', value: 8234, change: 8.3, trend: 'up', icon: 'ShoppingCart', color: 'secondary' },
  { id: 'avg_basket', title: 'Avg Basket Size', value: 150, change: -2.1, trend: 'down', icon: 'TrendingUp', color: 'success' },
  { id: 'active_outlets', title: 'Active Outlets', value: 234, change: 5.7, trend: 'up', icon: 'MapPin', color: 'warning' },
  { id: 'active_skus', title: 'Active SKUs', value: 1876, change: 3.2, trend: 'up', icon: 'Package', color: 'info' }
];

const mockSalesTrendData: ChartDataPoint[] = Array.from({ length: 24 }, (_, i) => ({
  name: `${i}:00`,
  value: Math.floor(Math.random() * 5000) + 1000,
  transactions: Math.floor(Math.random() * 50) + 10
}));

const mockGeographicData = [
  { region: 'NCR', value: 450000, growth: 15.2 },
  { region: 'Region VII', value: 320000, growth: 12.8 },
  { region: 'Region III', value: 280000, growth: 18.5 },
  { region: 'Region IV-A', value: 220000, growth: 8.9 },
  { region: 'Region VI', value: 180000, growth: 22.1 }
];

const mockProductPerformanceData: ChartDataPoint[] = [
  { name: 'Coca-Cola 355ml', sales: 180000, units: 3200, category: 'Beverages' },
  { name: 'Oishi Prawn Crackers', sales: 145000, units: 2800, category: 'Snacks' },
  { name: 'Alaska Evap Milk', sales: 125000, units: 2100, category: 'Dairy' },
  { name: 'Lucky Me Pancit Canton', sales: 110000, units: 1900, category: 'Food' },
  { name: 'Safeguard White', sales: 95000, units: 1600, category: 'Personal Care' }
];

export const useDataStore = create<DataStore>((set, get) => ({
  // Connection state
  isConnected: false,
  connectionError: null,
  
  // Data mode
  useRealData: hasValidSupabaseConfig(),
  setUseRealData: (useReal) => {
    set({ useRealData: useReal });
    // Reload all data with new mode
    get().refreshAllData();
  },
  
  // Loading states
  isLoadingKPIs: false,
  isLoadingCharts: false,
  isLoadingGeographic: false,
  
  // Data
  kpiMetrics: mockKPIMetrics,
  salesTrendData: mockSalesTrendData,
  geographicData: mockGeographicData,
  productPerformanceData: mockProductPerformanceData,
  categoryPerformance: [],
  customerSegments: [],
  transactionPatterns: {},
  substitutionPatternsData: [],
  
  // Retail Analytics Data
  consumerBehavior: [],
  productCombinations: [],
  paymentMethodDistribution: [],
  consumerDemographics: {},
  storeInterventionMetrics: {},
  
  // Actions
  checkConnection: async () => {
    try {
      if (!hasValidSupabaseConfig()) {
        set({ isConnected: false, connectionError: 'Missing Supabase configuration' });
        return;
      }
      
      // Test connection with a simple query
      const { error } = await supabase.from('stores').select('count', { count: 'exact', head: true });
      
      if (error) {
        set({ isConnected: false, connectionError: error.message });
      } else {
        set({ isConnected: true, connectionError: null });
      }
    } catch (error) {
      set({ isConnected: false, connectionError: 'Failed to connect to database' });
    }
  },
  
  loadKPIMetrics: async () => {
    const { useRealData } = get();
    set({ isLoadingKPIs: true });
    
    try {
      if (useRealData && hasValidSupabaseConfig()) {
        const dateRange = {
          start: subDays(new Date(), 30),
          end: new Date()
        };
        const metricsData = await dataService.getKPIMetrics(dateRange);
        // Map the data to match the expected KPIMetric interface
        const metrics = metricsData.map(m => ({
          id: m.id,
          title: m.title,
          value: m.value,
          change: m.change,
          changeType: m.trend === 'up' ? 'increase' : m.trend === 'down' ? 'decrease' : 'neutral' as 'increase' | 'decrease' | 'neutral',
          format: m.id.includes('sales') || m.id.includes('basket') ? 'currency' : m.id.includes('percent') ? 'percentage' : 'number' as 'currency' | 'number' | 'percentage',
          icon: m.icon || 'TrendingUp',
          trend: undefined // We don't have historical trend data yet
        }));
        set({ kpiMetrics: metrics, isConnected: true });
      } else {
        // Use mock data
        set({ kpiMetrics: mockKPIMetrics });
      }
    } catch (error) {
      console.error('Error loading KPI metrics:', error);
      set({ kpiMetrics: mockKPIMetrics, connectionError: error.message });
    } finally {
      set({ isLoadingKPIs: false });
    }
  },
  
  loadChartData: async () => {
    const { useRealData } = get();
    set({ isLoadingCharts: true });
    
    try {
      if (useRealData && hasValidSupabaseConfig()) {
        const [salesTrend, productPerformance] = await Promise.all([
          dataService.getSalesTrendData('hourly', 1),
          dataService.getProductPerformanceData(10)
        ]);
        
        set({ 
          salesTrendData: salesTrend,
          productPerformanceData: productPerformance,
          isConnected: true 
        });
      } else {
        // Use mock data
        set({ 
          salesTrendData: mockSalesTrendData,
          productPerformanceData: mockProductPerformanceData
        });
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
      set({ 
        salesTrendData: mockSalesTrendData,
        productPerformanceData: mockProductPerformanceData,
        connectionError: error.message 
      });
    } finally {
      set({ isLoadingCharts: false });
    }
  },
  
  loadGeographicData: async () => {
    const { useRealData } = get();
    set({ isLoadingGeographic: true });
    
    try {
      if (useRealData && hasValidSupabaseConfig()) {
        const data = await dataService.getGeographicData();
        set({ geographicData: data, isConnected: true });
      } else {
        set({ geographicData: mockGeographicData });
      }
    } catch (error) {
      console.error('Error loading geographic data:', error);
      set({ geographicData: mockGeographicData, connectionError: error.message });
    } finally {
      set({ isLoadingGeographic: false });
    }
  },
  
  loadProductPerformance: async () => {
    const { useRealData } = get();
    
    try {
      if (useRealData && hasValidSupabaseConfig()) {
        const data = await dataService.getProductPerformanceData(20);
        set({ productPerformanceData: data });
      }
    } catch (error) {
      console.error('Error loading product performance:', error);
    }
  },
  
  loadCategoryPerformance: async () => {
    const { useRealData } = get();
    
    try {
      if (useRealData && hasValidSupabaseConfig()) {
        const data = await dataService.getCategoryPerformance();
        set({ categoryPerformance: data });
      }
    } catch (error) {
      console.error('Error loading category performance:', error);
    }
  },
  
  loadCustomerSegments: async () => {
    const { useRealData } = get();
    
    try {
      if (useRealData && hasValidSupabaseConfig()) {
        const data = await dataService.getCustomerSegments();
        set({ customerSegments: data });
      }
    } catch (error) {
      console.error('Error loading customer segments:', error);
    }
  },
  
  loadTransactionPatterns: async () => {
    const { useRealData } = get();
    
    try {
      if (useRealData && hasValidSupabaseConfig()) {
        const dateRange = {
          start: subDays(new Date(), 30),
          end: new Date()
        };
        const data = await dataService.getTransactionPatterns(dateRange);
        set({ transactionPatterns: data });
      }
    } catch (error) {
      console.error('Error loading transaction patterns:', error);
    }
  },
  
  loadSubstitutionPatterns: async () => {
    const { useRealData } = get();
    
    try {
      if (useRealData && hasValidSupabaseConfig()) {
        const data = await retailAnalyticsService.getSubstitutionPatterns();
        set({ substitutionPatternsData: data });
      } else {
        // Use mock substitution data
        set({ substitutionPatternsData: [
          { source: 'Coca-Cola 355ml', target: 'Pepsi 355ml', value: 450, percentage: 65 },
          { source: 'Coca-Cola 355ml', target: 'Royal 355ml', value: 120, percentage: 18 },
          { source: 'Oishi Prawn Crackers', target: 'Piattos', value: 320, percentage: 48 },
          { source: 'Alaska Evap Milk', target: 'Bear Brand Milk', value: 280, percentage: 42 }
        ]});
      }
    } catch (error) {
      console.error('Error loading substitution patterns:', error);
    }
  },
  
  loadConsumerAnalytics: async () => {
    const { useRealData } = get();
    
    try {
      if (useRealData && hasValidSupabaseConfig()) {
        const [
          consumerBehavior,
          productCombinations,
          paymentMethods,
          demographics,
          interventions
        ] = await Promise.all([
          retailAnalyticsService.getConsumerBehavior(),
          retailAnalyticsService.getProductCombinations(),
          retailAnalyticsService.getPaymentMethodDistribution({ 
            start: subDays(new Date(), 30), 
            end: new Date() 
          }),
          retailAnalyticsService.getConsumerDemographics(),
          retailAnalyticsService.getStoreInterventionMetrics()
        ]);
        
        set({
          consumerBehavior,
          productCombinations,
          paymentMethodDistribution: paymentMethods,
          consumerDemographics: demographics,
          storeInterventionMetrics: interventions
        });
      }
    } catch (error) {
      console.error('Error loading consumer analytics:', error);
    }
  },
  
  refreshAllData: async () => {
    const actions = get();
    
    // Check connection first
    await actions.checkConnection();
    
    // Load all data in parallel
    await Promise.all([
      actions.loadKPIMetrics(),
      actions.loadChartData(),
      actions.loadGeographicData(),
      actions.loadProductPerformance(),
      actions.loadCategoryPerformance(),
      actions.loadCustomerSegments(),
      actions.loadTransactionPatterns(),
      actions.loadSubstitutionPatterns(),
      actions.loadConsumerAnalytics()
    ]);
    
    // Refresh materialized views if connected
    if (get().isConnected && get().useRealData) {
      try {
        await dataService.refreshMaterializedViews();
      } catch (error) {
        console.error('Error refreshing materialized views:', error);
      }
    }
  }
}))