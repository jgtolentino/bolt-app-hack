import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Package, AlertTriangle, Target, ChevronRight } from 'lucide-react';

const ForecastingDashboard: React.FC = () => {
  const [forecastPeriod, setForecastPeriod] = useState<'7days' | '30days' | '90days'>('30days');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cigarettes' | 'beverages'>('cigarettes');

  // Mock forecast data
  const demandForecast = {
    '7days': {
      totalRevenue: 485000,
      growth: 3.2,
      confidence: 92,
      topSKUs: [
        { name: 'Winston Red', units: 2450, revenue: 98000, stockRisk: false },
        { name: 'Marlboro Gold', units: 2100, revenue: 84000, stockRisk: true },
        { name: 'Fortune Red', units: 1800, revenue: 54000, stockRisk: false }
      ]
    },
    '30days': {
      totalRevenue: 2100000,
      growth: 5.8,
      confidence: 85,
      topSKUs: [
        { name: 'Winston Red', units: 10500, revenue: 420000, stockRisk: false },
        { name: 'Marlboro Gold', units: 9000, revenue: 360000, stockRisk: true },
        { name: 'Fortune Red', units: 7500, revenue: 225000, stockRisk: true }
      ]
    },
    '90days': {
      totalRevenue: 6300000,
      growth: 8.2,
      confidence: 72,
      topSKUs: [
        { name: 'Winston Red', units: 31500, revenue: 1260000, stockRisk: true },
        { name: 'Marlboro Gold', units: 27000, revenue: 1080000, stockRisk: true },
        { name: 'Fortune Red', units: 22500, revenue: 675000, stockRisk: false }
      ]
    }
  };

  const currentForecast = demandForecast[forecastPeriod];

  const shipmentRecommendations = [
    {
      region: 'NCR',
      currentFrequency: 'Daily',
      recommendedFrequency: 'Twice Daily',
      reason: 'Peak season approaching, 15% volume increase expected',
      priority: 'high'
    },
    {
      region: 'Region IV-A',
      currentFrequency: 'Every 2 days',
      recommendedFrequency: 'Daily',
      reason: 'Growing demand, competitor stockouts detected',
      priority: 'medium'
    },
    {
      region: 'Mindanao',
      currentFrequency: 'Weekly',
      recommendedFrequency: 'Every 3 days',
      reason: 'New stores opening, market expansion opportunity',
      priority: 'medium'
    }
  ];

  const churnRiskSKUs = [
    {
      sku: 'FORT-MEN-100',
      name: 'Fortune Menthol 100s',
      currentSubstitutionRate: 35,
      projectedChurn: 12,
      alternativeProduct: 'Winston Menthol',
      action: 'Increase availability or phase out'
    },
    {
      sku: 'MIGH-LIG-20',
      name: 'Mighty Light 20s',
      currentSubstitutionRate: 28,
      projectedChurn: 8,
      alternativeProduct: 'JTI Light',
      action: 'Bundle promotion recommended'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">Demand Forecasting & Planning</h1>
        <p className="text-gray-600">AI-powered predictions and inventory optimization</p>
      </motion.div>

      {/* Forecast Period Selector */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['7days', '30days', '90days'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setForecastPeriod(period)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              forecastPeriod === period
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {period === '7days' ? '7 Days' : period === '30days' ? '30 Days' : '90 Days'}
          </button>
        ))}
      </div>

      {/* Main Forecast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium opacity-90">Forecasted Revenue</h3>
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-3xl font-bold">₱{currentForecast.totalRevenue.toLocaleString()}</p>
          <div className="mt-2 flex items-center space-x-2 text-sm">
            <span className="text-green-200">+{currentForecast.growth}%</span>
            <span className="opacity-75">vs current period</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">Forecast Confidence</h3>
            <Target className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-3xl font-bold text-gray-900">{currentForecast.confidence}%</div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    currentForecast.confidence >= 80 ? 'bg-green-500' : 
                    currentForecast.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${currentForecast.confidence}%` }}
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Based on historical patterns and seasonality</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">Stock Alerts</h3>
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {currentForecast.topSKUs.filter(s => s.stockRisk).length}
          </div>
          <p className="text-sm text-gray-600">SKUs at risk in forecast period</p>
        </motion.div>
      </div>

      {/* Top SKUs Forecast */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top SKU Demand Forecast</h3>
        <div className="space-y-3">
          {currentForecast.topSKUs.map((sku, index) => (
            <div key={sku.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                <div>
                  <p className="font-medium text-gray-900">{sku.name}</p>
                  <p className="text-sm text-gray-600">{sku.units.toLocaleString()} units</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">₱{sku.revenue.toLocaleString()}</p>
                {sku.stockRisk && (
                  <span className="text-xs text-red-600 flex items-center justify-end space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Stock Risk</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Shipment Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipment Frequency Optimization</h3>
        <div className="space-y-3">
          {shipmentRecommendations.map((rec) => (
            <div
              key={rec.region}
              className={`border rounded-lg p-4 ${
                rec.priority === 'high' ? 'border-red-200 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{rec.region}</h4>
                  <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    <span className="text-gray-500">Current: {rec.currentFrequency}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-blue-600">Recommended: {rec.recommendedFrequency}</span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  rec.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {rec.priority} priority
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Churn Risk Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SKU Churn Risk Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="pb-3">SKU</th>
                <th className="pb-3">Substitution Rate</th>
                <th className="pb-3">Projected Churn</th>
                <th className="pb-3">Alternative</th>
                <th className="pb-3">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {churnRiskSKUs.map((item) => (
                <tr key={item.sku}>
                  <td className="py-3">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.sku}</p>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`font-medium ${
                      item.currentSubstitutionRate > 30 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {item.currentSubstitutionRate}%
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="text-gray-900">{item.projectedChurn}%</span>
                  </td>
                  <td className="py-3 text-sm text-gray-600">{item.alternativeProduct}</td>
                  <td className="py-3">
                    <span className="text-sm text-blue-600">{item.action}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default ForecastingDashboard;