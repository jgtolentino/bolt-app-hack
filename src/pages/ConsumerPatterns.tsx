import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Users, MessageSquare, Target } from 'lucide-react';
import { RadialDonutChart } from '../components/charts/RadialDonutChart';
import AIInsightPanel from '../components/insights/AIInsightPanel';
import { useFilterStore } from '../features/filters/filterStore';

const ConsumerPatterns: React.FC = () => {
  const filters = useFilterStore();
  
  // Mock data for request patterns
  const requestPatternData = [
    { name: 'Verbal', value: 45, color: '#3b82f6' },
    { name: 'Pointing', value: 35, color: '#8b5cf6' },
    { name: 'Indirect', value: 20, color: '#10b981' }
  ];

  const suggestionAcceptanceData = [
    { name: 'Accepted', value: 78, color: '#10b981' },
    { name: 'Rejected', value: 22, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">Consumer Request Patterns</h1>
        <p className="text-gray-600">Decode how buyers initiate transactions</p>
      </motion.div>

      {/* AI Insight for Consumer Behavior */}
      <div className="mb-6">
        <AIInsightPanel
          templateId="basketComposition"
          filters={filters}
          dataSummary={{
            avgBasketSize: 3.2,
            topCategory: 'Beverages',
            crossSellRate: 45
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radial Donut: Request Types */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Request Types Distribution</span>
          </h3>
          <RadialDonutChart 
            data={requestPatternData}
            height={300}
            innerRadius={60}
            outerRadius={100}
          />
        </motion.div>

        {/* Suggestion Acceptance Donut */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Suggestion Acceptance Rate</span>
          </h3>
          <RadialDonutChart 
            data={suggestionAcceptanceData}
            height={300}
            innerRadius={60}
            outerRadius={100}
            showPercentage
          />
        </motion.div>

        {/* Funnel Flow: Branded → Unbranded → Purchase */}
        <motion.div
          className="chart-container lg:col-span-2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Purchase Decision Flow</span>
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Branded → Unbranded → Purchase Funnel (Coming Soon)</p>
          </div>
        </motion.div>

        {/* Request Types per Category */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Types by Category</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Stacked Bar Chart (Coming Soon)</p>
          </div>
        </motion.div>

        {/* Duration by Request Type */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Duration Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="font-medium text-blue-900">Verbal Requests</span>
              <span className="text-blue-700">Avg: 1.8 min</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="font-medium text-purple-900">Pointing</span>
              <span className="text-purple-700">Avg: 1.2 min</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="font-medium text-green-900">Indirect</span>
              <span className="text-green-700">Avg: 2.5 min</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Suggestion Influence Table */}
      <motion.div
        className="chart-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Staff Suggestion Influence</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suggestions Made</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accepted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue Impact</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Beverages</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1,234</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">965</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">78.2%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">+₱45,230</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Snacks</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">892</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">623</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">69.8%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">+₱28,450</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default ConsumerPatterns;