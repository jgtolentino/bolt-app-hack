import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, TrendingDown, AlertCircle, Target } from 'lucide-react';
import { RadialDonutChart } from '../components/charts/RadialDonutChart';

const BrandSwitching: React.FC = () => {
  // Mock data for substitution acceptance
  const acceptanceData = [
    { name: 'Accepted', value: 68, color: '#10b981' },
    { name: 'Rejected', value: 32, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">Brand Switching & Substitution</h1>
        <p className="text-gray-600">Monitor missed opportunities and fallback logic</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sankey Diagram placeholder */}
        <motion.div
          className="chart-container lg:col-span-2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <ArrowLeftRight className="w-5 h-5" />
            <span>Brand Switching Flow</span>
          </h3>
          <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Sankey Diagram: Brand A → Brand B Flow (Coming Soon)</p>
          </div>
        </motion.div>

        {/* Substitution Rate by Category */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <TrendingDown className="w-5 h-5" />
            <span>Substitution Rate by Category</span>
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="font-medium text-gray-900">Beverages</span>
              <span className="text-red-600 font-bold">15.2%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="font-medium text-gray-900">Snacks</span>
              <span className="text-orange-600 font-bold">12.8%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="font-medium text-gray-900">Personal Care</span>
              <span className="text-yellow-600 font-bold">8.5%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="font-medium text-gray-900">Household</span>
              <span className="text-green-600 font-bold">5.3%</span>
            </div>
          </div>
        </motion.div>

        {/* Suggestion Acceptance Donut */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Substitution Acceptance Rate</span>
          </h3>
          <RadialDonutChart 
            data={acceptanceData}
            height={300}
            innerRadius={60}
            outerRadius={100}
            showPercentage
          />
        </motion.div>

        {/* Top Substituted SKUs */}
        <motion.div
          className="chart-container lg:col-span-2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>Top Substituted SKUs</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Substituted With</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue Impact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Location</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">COKE-1.5L</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">PEPSI-1.5L</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">234 times</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">-₱12,340</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Region III</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">MILO-300ML</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">OVALTINE-300ML</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">189 times</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">-₱8,450</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Region VII</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">TIDE-1KG</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">ARIEL-1KG</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">156 times</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+₱3,120</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">NCR</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Map Overlay placeholder */}
        <motion.div
          className="chart-container lg:col-span-2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Locations with Highest Switching</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Geographic Heatmap (Coming Soon)</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BrandSwitching;