import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../stores/dataStore';
import { useFilterStore } from '../features/filters/filterStore';
import KPICard from '../components/charts/KPICard';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import ProductPerformanceChart from '../components/charts/ProductPerformanceChart';
import GeographicMap from '../components/maps/GeographicMap';
import ZoomableContainer from '../components/ui/ZoomableContainer';
import MobileZoomableContainer from '../components/ui/MobileZoomableContainer';
import { AIInsightsPanel } from '../components/ai/AIInsightsPanel';
import { TrendingUp, Users, MapPin, Bot, FileText, BarChart3, Database, Wifi, WifiOff } from 'lucide-react';

const Overview: React.FC = () => {
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
    useRealData,
    setUseRealData
  } = useDataStore();
  
  const { totalCombinations, filters } = useFilterStore();

  useEffect(() => {
    // Load initial data
    loadKPIMetrics();
    loadChartData();
    loadGeographicData();
  }, []);

  const topRegions = [
    { name: 'NCR', sales: 850000, growth: 15.2, rank: 1 },
    { name: 'Region VII', sales: 380000, growth: 12.8, rank: 2 },
    { name: 'Region III', sales: 320000, growth: 18.5, rank: 3 },
    { name: 'Region IV-A', sales: 290000, growth: 8.9, rank: 4 },
    { name: 'Region VI', sales: 220000, growth: 22.1, rank: 5 }
  ];

  // Detect if mobile device
  const isMobile = window.innerWidth < 768;

  const DashboardContent = () => (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Overview</h1>
          <div className="flex items-center space-x-3">
            <p className="text-gray-600">
              Real-time insights across {totalCombinations.toLocaleString()} data combinations
            </p>
            
            {/* Data Mode Indicator */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setUseRealData(!useRealData)}
                className={`flex items-center space-x-1 px-3 py-1 text-xs rounded-full transition-colors ${
                  useRealData 
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                    : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                }`}
                title={useRealData ? 'Switch to Mock Data' : 'Switch to Real Data'}
              >
                {useRealData ? (
                  <>
                    <Database className="w-3 h-3" />
                    <span>Real Data</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    <span>Mock Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/ai-assistant')}
            className="filter-button flex items-center space-x-2"
          >
            <Bot className="w-4 h-4" />
            <span>AI Assistant</span>
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="filter-button flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </motion.div>

      {/* Data Mode Banner */}
      {!useRealData && (
        <motion.div
          className="bg-orange-50 border border-orange-200 rounded-lg p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-2">
            <WifiOff className="w-5 h-5 text-orange-600" />
            <div>
              <h3 className="font-medium text-orange-800">Demo Mode Active</h3>
              <p className="text-sm text-orange-700">
                Currently showing mock data. Click "Real Data" in the header to switch to live Supabase data.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {isLoadingKPIs ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="metric-card">
              <div className="loading-shimmer h-20 rounded-lg"></div>
            </div>
          ))
        ) : (
          kpiMetrics.map((metric, index) => (
            <KPICard
              key={metric.id}
              metric={metric}
              index={index}
              onClick={() => {
                // Navigate based on metric type
                if (metric.id === 'total_sales' || metric.id === 'transactions') {
                  navigate('/transactions');
                } else if (metric.id === 'active_outlets') {
                  navigate('/geography');
                } else {
                  navigate('/consumers');
                }
              }}
            />
          ))
        )}
      </div>

      {/* Main Content Grid with AI Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Geographic Map */}
        <motion.div
          className="xl:col-span-1"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GeographicMap data={geographicData} height={400} />
        </motion.div>

        {/* Sales Trends */}
        <motion.div
          className="xl:col-span-1"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <SalesTrendChart data={salesTrendData} height={400} />
        </motion.div>

        {/* AI Insights Panel */}
        <motion.div
          className="xl:col-span-1"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <AIInsightsPanel 
            context="overview" 
            data={{ kpiMetrics, salesTrendData, geographicData }}
            filters={filters}
            className="h-full"
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="xl:col-span-1"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="chart-container h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <button
                onClick={() => navigate('/ai-assistant')}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                AI Chat →
              </button>
            </div>
            
            <div className="space-y-3 h-80 overflow-y-auto">
              <motion.div
                className="p-3 bg-white/50 rounded-lg border border-white/30 hover:bg-white/70 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate('/transactions')}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Transaction Analysis</h4>
                    <p className="text-sm text-gray-600 mb-2">Deep dive into sales patterns</p>
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                      Analyze Trends
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="p-3 bg-white/50 rounded-lg border border-white/30 hover:bg-white/70 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate('/products')}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Product Performance</h4>
                    <p className="text-sm text-gray-600 mb-2">Category and brand analysis</p>
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                      View Products
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="p-3 bg-white/50 rounded-lg border border-white/30 hover:bg-white/70 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate('/geography')}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Geographic Insights</h4>
                    <p className="text-sm text-gray-600 mb-2">Regional performance analysis</p>
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                      Explore Regions
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/20">
              <button
                onClick={() => navigate('/ai-assistant')}
                className="w-full py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-colors"
              >
                <Bot className="w-4 h-4 inline mr-2" />
                Open AI Assistant
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Secondary Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <ProductPerformanceChart 
            data={productPerformanceData} 
            title="Top Performing Products"
            height={350}
          />
        </motion.div>

        {/* Regional Performance */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Regional Performance</h3>
            <button
              onClick={() => navigate('/geography')}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              View Details →
            </button>
          </div>
          
          <div className="space-y-3 h-72 overflow-y-auto">
            {topRegions.map((region, index) => (
              <motion.div
                key={region.name}
                className="flex items-center justify-between p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-colors cursor-pointer"
                whileHover={{ scale: 1.01 }}
                onClick={() => navigate('/geography')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {region.rank}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{region.name}</h4>
                    <p className="text-sm text-gray-600">₱{region.sales.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    region.growth > 15 ? 'text-success-600' : 
                    region.growth > 10 ? 'text-warning-600' : 'text-gray-600'
                  }`}>
                    +{region.growth}%
                  </div>
                  <div className="text-xs text-gray-500">Growth</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        className="flex flex-wrap gap-3 justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <button
          onClick={() => navigate('/transactions')}
          className="filter-button flex items-center space-x-2"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Deep Analytics</span>
        </button>
        <button
          onClick={() => navigate('/products')}
          className="filter-button flex items-center space-x-2"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Product Analysis</span>
        </button>
        <button
          onClick={() => navigate('/consumers')}
          className="filter-button flex items-center space-x-2"
        >
          <Users className="w-4 h-4" />
          <span>Consumer Insights</span>
        </button>
        <button
          onClick={() => navigate('/geography')}
          className="filter-button flex items-center space-x-2"
        >
          <MapPin className="w-4 h-4" />
          <span>Geographic Analysis</span>
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="h-full">
      {isMobile ? (
        <MobileZoomableContainer className="h-full">
          <DashboardContent />
        </MobileZoomableContainer>
      ) : (
        <ZoomableContainer className="h-full" enablePan={true}>
          <DashboardContent />
        </ZoomableContainer>
      )}
    </div>
  );
};

export default Overview;