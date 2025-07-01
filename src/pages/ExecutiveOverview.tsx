import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../stores/dataStore';
import { useFilterStore } from '../features/filters/filterStore';
import KPICard from '../components/charts/KPICard';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import { ParetoChart } from '../components/charts/ParetoChart';
import GeographicMap from '../components/maps/GeographicMap';
import AIInsightPanel from '../components/insights/AIInsightPanel';
import { TrendingUp, Store, ShoppingCart, ArrowLeftRight, Target, DollarSign } from 'lucide-react';
import { drillDown, KPI_DRILL_PATHS } from '../utils/navigationUtils';

const ExecutiveOverview: React.FC = () => {
  const navigate = useNavigate();
  const { 
    kpiMetrics, 
    salesTrendData, 
    geographicData, 
    productPerformanceData,
    isLoadingKPIs, 
    isLoadingCharts,
    loadKPIMetrics,
    loadChartData,
    loadGeographicData,
  } = useDataStore();

  const { totalCombinations, ...filters } = useFilterStore();

  useEffect(() => {
    // Load initial data
    loadKPIMetrics();
    loadChartData();
    loadGeographicData();
  }, []);

  // Handle KPI drill-down navigation
  const handleKPIDrillDown = (kpiId: string, value: any) => {
    const drillPath = KPI_DRILL_PATHS[kpiId];
    if (drillPath) {
      drillDown(navigate, drillPath.path, {
        metric: kpiId,
        value,
        filters: { ...filters, ...drillPath.defaultFilters }
      });
    }
  };

  // Enhanced KPI metrics with substitution and suggestion rates
  const enhancedKPIs = [
    {
      id: 'total_sales',
      title: 'Total Sales',
      value: kpiMetrics.find(m => m.id === 'total_sales')?.value || 0,
      change: kpiMetrics.find(m => m.id === 'total_sales')?.change || 0,
      trend: kpiMetrics.find(m => m.id === 'total_sales')?.trend || 'up',
      format: 'currency',
      icon: DollarSign,
      color: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
      onClick: () => handleKPIDrillDown('total_sales', kpiMetrics.find(m => m.id === 'total_sales')?.value)
    },
    {
      id: 'active_stores',
      title: 'Active Stores',
      value: kpiMetrics.find(m => m.id === 'active_outlets')?.value || 0,
      change: kpiMetrics.find(m => m.id === 'active_outlets')?.change || 0,
      trend: kpiMetrics.find(m => m.id === 'active_outlets')?.trend || 'up',
      format: 'number',
      icon: Store,
      color: 'bg-gradient-to-br from-blue-400 to-blue-600',
      onClick: () => handleKPIDrillDown('active_stores', kpiMetrics.find(m => m.id === 'active_outlets')?.value)
    },
    {
      id: 'avg_basket',
      title: 'Avg Basket Size',
      value: kpiMetrics.find(m => m.id === 'avg_basket')?.value || 0,
      change: kpiMetrics.find(m => m.id === 'avg_basket')?.change || 0,
      trend: kpiMetrics.find(m => m.id === 'avg_basket')?.trend || 'up',
      format: 'currency',
      icon: ShoppingCart,
      color: 'bg-gradient-to-br from-purple-400 to-purple-600',
      onClick: () => handleKPIDrillDown('avg_basket', kpiMetrics.find(m => m.id === 'avg_basket')?.value)
    },
    {
      id: 'substitution_rate',
      title: 'Substitution Rate',
      value: 12.5, // Mock value
      change: -2.3,
      trend: 'down',
      format: 'percentage',
      icon: ArrowLeftRight,
      color: 'bg-gradient-to-br from-orange-400 to-orange-600',
      onClick: () => handleKPIDrillDown('substitution_rate', 12.5)
    },
    {
      id: 'suggestion_conversion',
      title: 'Suggestion Conversion',
      value: 78.2, // Mock value
      change: 5.1,
      trend: 'up',
      format: 'percentage',
      icon: Target,
      color: 'bg-gradient-to-br from-teal-400 to-teal-600',
      onClick: () => handleKPIDrillDown('suggestion_conversion', 78.2)
    }
  ];

  // Prepare data for Pareto chart (Top 20% SKUs)
  const paretoData = productPerformanceData
    .sort((a, b) => b.sales - a.sales)
    .slice(0, Math.ceil(productPerformanceData.length * 0.2))
    .map((product, index) => ({
      name: product.name,
      sales: product.sales,
      cumulative: productPerformanceData
        .slice(0, index + 1)
        .reduce((sum, p) => sum + p.sales, 0)
    }));

  const totalSales = productPerformanceData.reduce((sum, p) => sum + p.sales, 0);
  const paretoDataWithPercentage = paretoData.map(item => ({
    ...item,
    percentage: (item.cumulative / totalSales) * 100
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Overview</h1>
          <p className="text-gray-600">
            Retail system health across {totalCombinations.toLocaleString()} data points
          </p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {isLoadingKPIs ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="metric-card">
              <div className="loading-shimmer h-20 rounded-lg"></div>
            </div>
          ))
        ) : (
          enhancedKPIs.map((metric, index) => (
            <motion.div
              key={metric.id}
              className={`relative overflow-hidden rounded-xl shadow-lg ${metric.color} p-6 text-white cursor-pointer transition-transform hover:scale-105`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={metric.onClick}
              title={`Click to drill down to ${metric.title} details`}
            >
              <div className="flex justify-between items-start mb-4">
                <metric.icon className="w-8 h-8 opacity-80" />
                <div className={`flex items-center space-x-1 text-sm ${
                  metric.trend === 'up' ? 'text-green-200' : 'text-red-200'
                }`}>
                  <TrendingUp className={`w-4 h-4 ${metric.trend === 'down' ? 'rotate-180' : ''}`} />
                  <span>{Math.abs(metric.change)}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium opacity-90">{metric.title}</h3>
                <p className="text-2xl font-bold">
                  {metric.format === 'currency' 
                    ? `₱${metric.value.toLocaleString()}`
                    : metric.format === 'percentage'
                    ? `${metric.value}%`
                    : metric.value.toLocaleString()
                  }
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* AI Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <AIInsightPanel
          templateId="priceSensitivity"
          filters={filters}
          dataSummary={{
            avgPrice: kpiMetrics.find(m => m.id === 'avg_basket')?.value || 0,
            totalSales: kpiMetrics.find(m => m.id === 'total_sales')?.value || 0
          }}
        />
        <AIInsightPanel
          templateId="peakHourAnalysis"
          filters={filters}
          dataSummary={{
            peakHour: '6PM',
            peakVolume: 32
          }}
        />
        <AIInsightPanel
          templateId="substitutionMap"
          filters={filters}
          dataSummary={{
            topSubstitution: { from: 'Coke', to: 'Pepsi', rate: 15 }
          }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Trend Line: Rolling 7-day revenue */}
        <motion.div
          className="xl:col-span-2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <SalesTrendChart 
            data={salesTrendData} 
            title="Rolling 7-Day Revenue"
            height={350}
          />
        </motion.div>

        {/* Heatmap: Value by region */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <GeographicMap 
            data={geographicData} 
            height={350}
            title="Revenue by Region"
          />
        </motion.div>

        {/* Pareto Bar: Top 20% SKUs */}
        <motion.div
          className="xl:col-span-3"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <ParetoChart 
            data={paretoDataWithPercentage}
            title="Top 20% SKUs Driving Sales"
            height={400}
          />
        </motion.div>
      </div>

      {/* Quick Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Peak Transaction Hour</h3>
          <p className="text-2xl font-bold text-gray-900">6:00 PM</p>
          <p className="text-sm text-gray-500 mt-1">+23% vs avg hour</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Top Payment Method</h3>
          <p className="text-2xl font-bold text-gray-900">Cash (59.4%)</p>
          <p className="text-sm text-gray-500 mt-1">GCash growing +12% MoM</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Category Leader</h3>
          <p className="text-2xl font-bold text-gray-900">Beverages</p>
          <p className="text-sm text-gray-500 mt-1">₱2.3M sales this month</p>
        </div>
      </motion.div>
    </div>
  );
};

export default ExecutiveOverview;