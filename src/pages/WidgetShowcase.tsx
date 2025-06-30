import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Grid3x3, Package, TrendingUp, BarChart3, Lightbulb, Map, Search, Star, Layers } from 'lucide-react';
import {
  SalesHeatmap,
  BrandKpiCard,
  SalesTrendChart,
  PricingVolatilityChart,
  InsightsFeed,
  RegionalPerformanceTable,
  ProductScreener,
  TopProductsTicker,
  CategoryPerformanceHeatmap
} from '../features/charts';

const WidgetShowcase: React.FC = () => {
  const [activeWidget, setActiveWidget] = useState('all');
  const [dateRange, setDateRange] = useState('last7Days');

  const widgets = [
    {
      id: 'salesHeatmap',
      name: 'Sales Heatmap',
      icon: Grid3x3,
      description: 'Category performance visualization',
      component: <SalesHeatmap dateRange={dateRange} />
    },
    {
      id: 'brandKpiCard',
      name: 'Brand KPIs',
      icon: Package,
      description: 'Comprehensive brand metrics',
      component: <BrandKpiCard dateRange={dateRange} />
    },
    {
      id: 'salesTrendChart',
      name: 'Sales Trend',
      icon: TrendingUp,
      description: 'Time series with moving averages',
      component: <SalesTrendChart dateRange={dateRange} showVolume={true} />
    },
    {
      id: 'pricingVolatility',
      name: 'Price Volatility',
      icon: BarChart3,
      description: 'Price variation analysis',
      component: <PricingVolatilityChart dateRange={dateRange} />
    },
    {
      id: 'insightsFeed',
      name: 'AI Insights',
      icon: Lightbulb,
      description: 'AI-generated recommendations',
      component: <InsightsFeed dateRange={dateRange} limit={5} />
    },
    {
      id: 'regionalTable',
      name: 'Regional Performance',
      icon: Map,
      description: 'Geographic performance metrics',
      component: <RegionalPerformanceTable dateRange={dateRange} />
    },
    {
      id: 'productScreener',
      name: 'Product Screener',
      icon: Search,
      description: 'Advanced product filtering',
      component: <ProductScreener dateRange={dateRange} />
    },
    {
      id: 'topProductsTicker',
      name: 'Top Products',
      icon: Star,
      description: 'Auto-scrolling product ticker',
      component: <TopProductsTicker dateRange={dateRange} />
    },
    {
      id: 'categoryHeatmap',
      name: 'Category Heatmap',
      icon: Layers,
      description: 'Hierarchical performance view',
      component: <CategoryPerformanceHeatmap dateRange={dateRange} />
    }
  ];

  const filteredWidgets = activeWidget === 'all' 
    ? widgets 
    : widgets.filter(w => w.id === activeWidget);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            StockBot Widget Showcase
          </h1>
          <p className="text-gray-600">
            TradingView-inspired widgets adapted for Scout retail analytics
          </p>
        </motion.div>

        {/* Controls */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          {/* Widget Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveWidget('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeWidget === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Widgets
            </button>
            {widgets.map(widget => (
              <button
                key={widget.id}
                onClick={() => setActiveWidget(widget.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeWidget === widget.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <widget.icon className="w-4 h-4" />
                {widget.name}
              </button>
            ))}
          </div>

          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="ml-auto px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="last7Days">Last 7 Days</option>
            <option value="last30Days">Last 30 Days</option>
            <option value="last90Days">Last 90 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="thisQuarter">This Quarter</option>
          </select>
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-1 gap-6">
          {filteredWidgets.map((widget, index) => (
            <motion.div
              key={widget.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              {/* Widget Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <widget.icon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {widget.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {widget.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Live Data
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      StockBot Adapter
                    </span>
                  </div>
                </div>
              </div>

              {/* Widget Content */}
              <div className="p-6">
                {widget.component}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-sm text-gray-500"
        >
          <p>
            These widgets demonstrate the adapter pattern for integrating StockBot's TradingView components
            with Scout Analytics data. Each widget maintains the visual design language while using
            Supabase retail data instead of stock market feeds.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default WidgetShowcase;