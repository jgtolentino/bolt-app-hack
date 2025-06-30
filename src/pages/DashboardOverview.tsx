import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  ShoppingCart, 
  Receipt, 
  Package,
  MapPin,
  Network,
  Brain,
  BarChart3,
  Map,
  Users,
  ShoppingBag,
  UserCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import KPICard from '../components/charts/KPICard';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import TransactionVolumeChart from '../components/charts/TransactionVolumeChart';
import LocationHeatmap from '../components/charts/LocationHeatmap';
import ProductCombosNetwork from '../components/charts/ProductCombosNetwork';
import { KPIMetric } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useDataStore } from '../stores/dataStore';

// Time range options
const timeRanges = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this-week', label: 'This Week' },
  { value: 'last-week', label: 'Last Week' }
];

const DashboardOverview: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  const [selectedLocation, setSelectedLocation] = useState('all');
  
  // Get data from store
  const {
    kpiMetrics,
    salesTrendData: storeSalesData,
    productCombinations,
    geographicData,
    transactionPatterns,
    isLoadingKPIs,
    isLoadingCharts,
    useRealData,
    setUseRealData,
    refreshAllData,
    isConnected,
    connectionError
  } = useDataStore();

  // Load data on mount
  useEffect(() => {
    refreshAllData();
  }, []);

  // Use real KPI data from store or fallback to mock
  const displayKpiMetrics: KPIMetric[] = useMemo(() => {
    if (useRealData && kpiMetrics.length > 0) {
      return kpiMetrics;
    }
    // Fallback mock data
    return [
    {
      id: 'daily-sales',
      title: 'Daily Sales',
      value: 24580,
      change: 12,
      changeType: 'increase',
      format: 'currency',
      icon: 'Banknote',
      trend: [18000, 20000, 19500, 22000, 24580]
    },
    {
      id: 'transactions',
      title: 'Transactions',
      value: 156,
      change: 5,
      changeType: 'increase',
      format: 'number',
      icon: 'Receipt',
      trend: [120, 130, 145, 148, 156]
    },
    {
      id: 'avg-basket',
      title: 'Avg Basket',
      value: 157.56,
      change: 2,
      changeType: 'decrease',
      format: 'currency',
      icon: 'ShoppingCart',
      trend: [165, 160, 158, 161, 157.56]
    },
    {
      id: 'top-category',
      title: 'Top Category: Haircare',
      value: 32,
      change: 8,
      changeType: 'increase',
      format: 'percentage',
      icon: 'TrendingUp',
      trend: [28, 30, 29, 31, 32]
    }
    ];
  }, [useRealData, kpiMetrics]);

  // Use real hourly transaction data from store
  const hourlyData = useMemo(() => {
    if (useRealData && transactionPatterns?.hourlyPatterns) {
      return transactionPatterns.hourlyPatterns.map(pattern => ({
        hour: pattern.hour,
        today: pattern.transactions,
        average: pattern.avg_size || pattern.transactions
      }));
    }
    // Fallback mock data
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map(hour => ({
      hour: `${hour}:00`,
      today: Math.floor(Math.random() * 20) + 5,
      average: Math.floor(Math.random() * 15) + 8
    }));
  }, [useRealData, transactionPatterns]);

  // Use real sales trend data from store
  const salesTrendData = useMemo(() => {
    if (useRealData && storeSalesData && storeSalesData.length > 0) {
      return storeSalesData;
    }
    // Fallback mock data
    const now = new Date();
    const currentHour = now.getHours();
    
    // Generate data for the last 24 hours
    return Array.from({ length: 24 }, (_, i) => {
      const hour = (currentHour - 23 + i + 24) % 24;
      const isToday = i >= (24 - currentHour);
      
      return {
        name: `${hour}:00`,
        value: Math.floor(Math.random() * 5000) + 1000 + (hour >= 14 && hour <= 17 ? 2000 : 0), // Peak hours boost
        transactions: Math.floor(Math.random() * 20) + 5
      };
    });
  }, [useRealData, storeSalesData]);

  // Use real location data from store
  const locationData = useMemo(() => {
    if (useRealData && geographicData && geographicData.length > 0) {
      return geographicData.slice(0, 5).map(loc => ({
        location: loc.region || loc.city || 'Unknown',
        revenue: loc.value || 0,
        growth: loc.growth || 0
      }));
    }
    // Fallback mock data
    return [
      { location: 'Barangay 1', revenue: 12500, growth: 15 },
      { location: 'Barangay 2', revenue: 10200, growth: 8 },
      { location: 'Barangay 3', revenue: 8900, growth: -3 },
      { location: 'Barangay 4', revenue: 7600, growth: 12 },
      { location: 'Barangay 5', revenue: 6800, growth: 5 }
    ];
  }, [useRealData, geographicData]);

  // Use real product combinations from store
  const productCombos = useMemo(() => {
    if (useRealData && productCombinations && productCombinations.length > 0) {
      return productCombinations.slice(0, 4).map(combo => ({
        combo: [combo.product1_name, combo.product2_name],
        frequency: combo.co_occurrence_count,
        value: Math.floor(combo.confidence_percent * 1.5) // Estimate value
      }));
    }
    // Fallback mock data
    return [
      { combo: ['Marlboro', 'Coke'], frequency: 67, value: 125 },
      { combo: ['Palmolive', 'Safeguard'], frequency: 45, value: 89 },
      { combo: ['Kopiko', 'Sky Flakes'], frequency: 38, value: 45 },
      { combo: ['Chippy', 'C2'], frequency: 32, value: 55 }
    ];
  }, [useRealData, productCombinations]);

  // AI Insights
  const aiInsights = [
    { icon: Clock, text: 'Peak hour: 3-5 PM shows 23% higher sales', type: 'info' },
    { icon: AlertCircle, text: 'Substitution alert: Palmolive→Pantene up 15% this week', type: 'warning' },
    { icon: Package, text: 'Inventory suggestion: Stock more Yelo for afternoon rush', type: 'success' },
    { icon: ShoppingCart, text: 'Cross-sell opportunity: 67% of cigarette buyers buy drinks', type: 'opportunity' }
  ];

  // Navigation sections
  const navigationSections = [
    { id: 'trends', title: 'TRENDS', icon: BarChart3, description: 'View detailed transaction patterns' },
    { id: 'products', title: 'PRODUCTS', icon: ShoppingBag, description: 'Analyze SKU performance & inventory' },
    { id: 'behavior', title: 'BEHAVIOR', icon: Users, description: 'Purchase patterns & preferences' },
    { id: 'profiles', title: 'PROFILES', icon: UserCircle, description: 'Customer demographics & segments' }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : connectionError || 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Time Range Filter */}
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>

          {/* Location Filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Locations</option>
            <option value="barangay1">Barangay 1</option>
            <option value="barangay2">Barangay 2</option>
            <option value="barangay3">Barangay 3</option>
          </select>

          {/* Data Source Toggle */}
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg">
            <button
              onClick={() => setUseRealData(true)}
              className={`px-3 py-1 rounded text-sm ${useRealData ? 'bg-primary-500 text-white' : 'text-gray-600'}`}
              disabled={!isConnected}
            >
              Real Data
            </button>
            <button
              onClick={() => setUseRealData(false)}
              className={`px-3 py-1 rounded text-sm ${!useRealData ? 'bg-primary-500 text-white' : 'text-gray-600'}`}
            >
              Mock Data
            </button>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={refreshAllData}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoadingKPIs || isLoadingCharts}
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${(isLoadingKPIs || isLoadingCharts) ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingKPIs ? (
          // Loading skeleton
          Array(4).fill(0).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))
        ) : (
          displayKpiMetrics.map((metric, index) => (
            <KPICard key={metric.id} metric={metric} index={index} />
          ))
        )}
      </div>

      {/* Real-Time Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">📈 Sales Trend (24hr)</h3>
            <span className="text-sm text-gray-500">Today vs Yesterday</span>
          </div>
          <SalesTrendChart data={salesTrendData} />
        </motion.div>

        {/* Transaction Volume by Hour */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">🕐 Transaction Volume by Hour</h3>
            <span className="text-sm text-gray-500">Peak hours highlighted</span>
          </div>
          <TransactionVolumeChart data={hourlyData} />
        </motion.div>
      </div>

      {/* Geographic & Behavioral Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Locations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Locations</h3>
          </div>
          <LocationHeatmap data={locationData} view="list" />
        </motion.div>

        {/* Popular Product Combos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Network className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900">Popular Product Combos</h3>
          </div>
          <ProductCombosNetwork 
            data={productCombos.map(combo => ({
              products: combo.combo,
              frequency: combo.frequency,
              value: combo.value
            }))} 
            width={400}
            height={300}
            isLoading={isLoadingCharts}
          />
        </motion.div>
      </div>

      {/* AI Insights & Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl shadow-sm border border-primary-200 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-6 h-6 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI INSIGHTS & RECOMMENDATIONS</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiInsights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div key={index} className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  insight.type === 'warning' ? 'bg-warning-100' :
                  insight.type === 'success' ? 'bg-success-100' :
                  insight.type === 'opportunity' ? 'bg-accent-100' :
                  'bg-primary-100'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    insight.type === 'warning' ? 'text-warning-600' :
                    insight.type === 'success' ? 'text-success-600' :
                    insight.type === 'opportunity' ? 'text-accent-600' :
                    'text-primary-600'
                  }`} />
                </div>
                <p className="text-sm text-gray-700 flex-1">{insight.text}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {navigationSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer group hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg group-hover:from-primary-200 group-hover:to-primary-300 transition-colors">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{section.title}</h4>
              <p className="text-sm text-gray-600">{section.description}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardOverview;