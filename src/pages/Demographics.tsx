import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Users, MapPin, BarChart3 } from 'lucide-react';

const Demographics: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">Customer Demographics</h1>
        <p className="text-gray-600">Visualize who buys what, and where</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demographic Tree */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Demographic Distribution</span>
          </h3>
          <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Gender × Age Bracket Tree (Coming Soon)</p>
          </div>
        </motion.div>

        {/* Heatmap Layer */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Demographics by Location</span>
          </h3>
          <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Age/Gender Heatmap by Barangay (Coming Soon)</p>
          </div>
        </motion.div>

        {/* Basket Value by Demographic */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Average Basket Value by Demographic</span>
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="font-medium text-gray-900">Male 25-34</span>
              <span className="text-blue-600 font-bold">₱152.30</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
              <span className="font-medium text-gray-900">Female 25-34</span>
              <span className="text-pink-600 font-bold">₱168.50</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="font-medium text-gray-900">Male 35-44</span>
              <span className="text-purple-600 font-bold">₱198.20</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="font-medium text-gray-900">Female 35-44</span>
              <span className="text-green-600 font-bold">₱215.80</span>
            </div>
          </div>
        </motion.div>

        {/* Category Preferences */}
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <UserCheck className="w-5 h-5" />
            <span>Category Preferences by Group</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Demographic</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Top Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">% of Spend</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Young Adults (18-24)</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">Beverages</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">42%</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Working Adults (25-34)</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">Personal Care</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">38%</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Families (35-44)</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">Household</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">45%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Highest Value Segment</h3>
          <p className="text-2xl font-bold text-gray-900">Female 35-44</p>
          <p className="text-sm text-gray-500 mt-1">₱215.80 avg basket</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Most Frequent Shoppers</h3>
          <p className="text-2xl font-bold text-gray-900">Female 25-34</p>
          <p className="text-sm text-gray-500 mt-1">3.2 visits/week</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Fastest Growing Segment</h3>
          <p className="text-2xl font-bold text-gray-900">Male 18-24</p>
          <p className="text-sm text-gray-500 mt-1">+28% YoY</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Demographics;