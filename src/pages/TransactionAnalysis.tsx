import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFilterStore } from '../stores/filterStore';
import { AIInsightsPanel } from '../components/ai/AIInsightsPanel';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Area, AreaChart, ScatterChart, Scatter, Cell
} from 'recharts';
import { 
  Clock, Calendar, TrendingUp, DollarSign, Users, Filter,
  Download, Share2, RefreshCcw, Zap, ArrowUp, ArrowDown, BarChart3, MapPin
} from 'lucide-react';
import EnhancedDonutChart from '../components/charts/EnhancedDonutChart';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';

const TransactionAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const { filters } = useFilterStore();
  const [activeTab, setActiveTab] = useState('time-patterns');
  const [timeRange, setTimeRange] = useState('last-30-days');
  const [loading, setLoading] = useState(false);

  // Mock data - replace with API calls
  const [transactionData, setTransactionData] = useState({
    timePatterns: [
      { hour: '6AM', transactions: 45, value: 12500, avg_size: 278 },
      { hour: '7AM', transactions: 123, value: 34200, avg_size: 278 },
      { hour: '8AM', transactions: 189, value: 52650, avg_size: 279 },
      { hour: '9AM', transactions: 234, value: 65180, avg_size: 278 },
      { hour: '10AM', transactions: 312, value: 86880, avg_size: 278 },
      { hour: '11AM', transactions: 445, value: 124025, avg_size: 279 },
      { hour: '12PM', transactions: 598, value: 166644, avg_size: 279 },
      { hour: '1PM', transactions: 634, value: 176686, avg_size: 279 },
      { hour: '2PM', transactions: 687, value: 191466, avg_size: 279 },
      { hour: '3PM', transactions: 623, value: 173621, avg_size: 279 },
      { hour: '4PM', transactions: 556, value: 155112, avg_size: 279 },
      { hour: '5PM', transactions: 489, value: 136431, avg_size: 279 },
      { hour: '6PM', transactions: 634, value: 176686, avg_size: 279 },
      { hour: '7PM', transactions: 578, value: 161282, avg_size: 279 },
      { hour: '8PM', transactions: 445, value: 124025, avg_size: 279 },
      { hour: '9PM', transactions: 234, value: 65180, avg_size: 279 },
      { hour: '10PM', transactions: 123, value: 34290, avg_size: 279 },
      { hour: '11PM', transactions: 78, value: 21762, avg_size: 279 }
    ],
    dailyPatterns: [
      { day: 'Monday', transactions: 1234, value: 344520, growth: 12.5 },
      { day: 'Tuesday', transactions: 1456, value: 406240, growth: 15.2 },
      { day: 'Wednesday', transactions: 1389, value: 387684, growth: 8.9 },
      { day: 'Thursday', transactions: 1523, value: 425636, growth: 18.7 },
      { day: 'Friday', transactions: 1687, value: 471092, growth: 22.1 },
      { day: 'Saturday', transactions: 1834, value: 512302, growth: 25.4 },
      { day: 'Sunday', transactions: 1598, value: 446444, growth: 19.8 }
    ],
    valueDistribution: [
      { range: '₱0-50', count: 2345, percentage: 35.2 },
      { range: '₱51-100', count: 1876, percentage: 28.1 },
      { range: '₱101-200', count: 1234, percentage: 18.5 },
      { range: '₱201-500', count: 894, percentage: 13.4 },
      { range: '₱501-1000', count: 234, percentage: 3.5 },
      { range: '₱1000+', count: 89, percentage: 1.3 }
    ],
    paymentMethods: [
      { name: 'Cash', value: 1180520, count: 4234, percentage: 52.8 },
      { name: 'GCash', value: 423240, count: 1576, percentage: 18.9 },
      { name: 'Credit Card', value: 65340, count: 234, percentage: 2.9 },
      { name: 'Bank Transfer', value: 27342, count: 98, percentage: 1.2 }
    ]
  });

  const tabs = [
    { id: 'time-patterns', label: 'Time Patterns', icon: Clock },
    { id: 'value-distribution', label: 'Value Distribution', icon: DollarSign },
    { id: 'peak-analysis', label: 'Peak Analysis', icon: TrendingUp },
    { id: 'flow-analysis', label: 'Transaction Flow', icon: Users }
  ];

  const timeRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'last-7-days', label: 'Last 7 Days' },
    { value: 'last-30-days', label: 'Last 30 Days' },
    { value: 'last-90-days', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const formatCurrency = (value: number) => `₱${(value / 1000).toFixed(0)}K`;
  const formatNumber = (value: number) => value.toLocaleString();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('value') || entry.name.includes('Value') ? 
                formatCurrency(entry.value) : formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderTimePatterns = () => (
    <div className="space-y-6">
      {/* Hourly Transaction Pattern */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Hourly Transaction Patterns</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Peak: 2-4 PM</span>
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={transactionData.timePatterns}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
            <XAxis dataKey="hour" tick={{ fill: '#6B7280', fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fill: '#6B7280', fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6B7280', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            
            <Bar yAxisId="left" dataKey="transactions" fill="#3B82F6" opacity={0.7} radius={[2, 2, 0, 0]} />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="value" 
              stroke="#14B8A6" 
              strokeWidth={3}
              dot={{ fill: '#14B8A6', strokeWidth: 2, r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Daily Patterns</h3>
            <span className="text-sm text-gray-600">This Week</span>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={transactionData.dailyPatterns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
              <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="transactions" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Growth Trends</h3>
            <span className="text-sm text-gray-600">Week over Week</span>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={transactionData.dailyPatterns}>
              <defs>
                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
              <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="growth"
                stroke="#F97316"
                strokeWidth={3}
                fill="url(#growthGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderValueDistribution = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Value Distribution */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Transaction Value Distribution</h3>
            <span className="text-sm text-gray-600">Current Filters</span>
          </div>
          
          <HorizontalBarChart 
            data={transactionData.valueDistribution.map(item => ({
              name: item.range,
              value: item.count
            }))}
            title=""
            height={300}
          />
        </div>

        {/* Payment Methods */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
            <span className="text-sm text-gray-600">By Volume</span>
          </div>
          
          <EnhancedDonutChart 
            data={transactionData.paymentMethods}
            title=""
            height={300}
            innerRadius={50}
            outerRadius={90}
          />
        </div>
      </div>

      {/* Payment Method Insights */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Payment Method Analysis</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Total: ₱1.7M</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {transactionData.paymentMethods.map((method, index) => (
            <div key={method.name} className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{method.percentage}%</div>
              <div className="text-sm text-blue-700">{method.name}</div>
              <div className="flex items-center text-xs text-blue-600 mt-1">
                <span>{formatCurrency(method.value)}</span>
              </div>
              <div className="text-xs text-blue-500 mt-1">
                {method.count.toLocaleString()} transactions
              </div>
            </div>
          ))}
        </div>

        {/* Payment Method Insights */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">💳 Payment Method Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-600">Cash Dominance:</span>
              <span className="ml-2 font-medium">₱1.18M (52.8%)</span>
            </div>
            <div>
              <span className="text-blue-600">Digital Growth:</span>
              <span className="ml-2 font-medium">GCash +12% monthly</span>
            </div>
            <div>
              <span className="text-blue-600">Credit Adoption:</span>
              <span className="ml-2 font-medium">2.9% in urban areas</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-blue-700">
            <p>• Cash remains dominant in Philippine retail, especially in rural areas</p>
            <p>• GCash showing strong growth trajectory (+12% monthly adoption)</p>
            <p>• Consider implementing more digital payment options for urban stores</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPeakAnalysis = () => (
    <div className="space-y-6">
      {/* Peak Hours Heatmap */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Peak Hours Analysis</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Intensity Scale</span>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-200 rounded"></div>
              <div className="w-3 h-3 bg-blue-400 rounded"></div>
              <div className="w-3 h-3 bg-blue-600 rounded"></div>
              <div className="w-3 h-3 bg-blue-800 rounded"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/50 rounded-lg p-4">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>
          
          <div className="space-y-1">
            {Array.from({ length: 24 }).map((_, hour) => (
              <div key={hour} className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, day) => {
                  const intensity = Math.random();
                  const bgColor = intensity > 0.8 ? 'bg-blue-800' : 
                                 intensity > 0.6 ? 'bg-blue-600' :
                                 intensity > 0.4 ? 'bg-blue-400' : 
                                 intensity > 0.2 ? 'bg-blue-200' : 'bg-gray-100';
                  
                  return (
                    <div
                      key={`${hour}-${day}`}
                      className={`h-4 rounded ${bgColor} cursor-pointer hover:scale-110 transition-transform`}
                      title={`${hour}:00 - ${Math.round(intensity * 1000)} transactions`}
                    />
                  );
                })}
                {hour % 6 === 0 && (
                  <div className="text-xs text-gray-500 absolute -ml-8 mt-1">
                    {hour}:00
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="chart-container">
          <h4 className="font-semibold text-gray-900 mb-3">Top Peak Hours</h4>
          <div className="space-y-3">
            {[
              { time: '2:00 PM - 3:00 PM', transactions: 687, value: 191466, rank: 1 },
              { time: '1:00 PM - 2:00 PM', transactions: 634, value: 176686, rank: 2 },
              { time: '6:00 PM - 7:00 PM', transactions: 634, value: 176686, rank: 3 }
            ].map((peak) => (
              <div key={peak.time} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {peak.rank}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{peak.time}</div>
                    <div className="text-sm text-gray-600">{peak.transactions} transactions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">₱{(peak.value / 1000).toFixed(0)}K</div>
                  <div className="text-sm text-gray-600">Revenue</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-container">
          <h4 className="font-semibold text-gray-900 mb-3">Peak Day Performance</h4>
          <div className="space-y-3">
            {[
              { day: 'Saturday', transactions: 1834, growth: 25.4, color: 'bg-green-500' },
              { day: 'Friday', transactions: 1687, growth: 22.1, color: 'bg-blue-500' },
              { day: 'Sunday', transactions: 1598, growth: 19.8, color: 'bg-purple-500' }
            ].map((day) => (
              <div key={day.day} className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg">
                <div className={`w-4 h-4 ${day.color} rounded-full`}></div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{day.day}</div>
                  <div className="text-sm text-gray-600">{day.transactions} transactions</div>
                </div>
                <div className="text-right">
                  <div className="text-green-600 font-medium">+{day.growth}%</div>
                  <div className="text-xs text-gray-500">Growth</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-container">
          <h4 className="font-semibold text-gray-900 mb-3">Optimization Opportunities</h4>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Staff Optimization</span>
              </div>
              <p className="text-sm text-yellow-700">
                Increase staff by 30% during 2-4 PM peak hours
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Promotional Window</span>
              </div>
              <p className="text-sm text-blue-700">
                Run promotions during low-traffic morning hours
              </p>
            </div>
            
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">Weekend Strategy</span>
              </div>
              <p className="text-sm text-green-700">
                Extend hours on weekends for 25% more revenue
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFlowAnalysis = () => (
    <div className="space-y-6">
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Transaction Flow Patterns</h3>
          <span className="text-sm text-gray-600">Customer Journey</span>
        </div>
        
        <div className="bg-white/50 rounded-lg p-6">
          <div className="text-center text-gray-600">
            <div className="text-4xl mb-4">🔄</div>
            <h4 className="text-lg font-medium mb-2">Transaction Flow Analysis</h4>
            <p className="text-sm">
              Advanced flow analysis showing customer transaction patterns,<br />
              repeat purchase behavior, and journey optimization opportunities.
            </p>
            <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Enable Advanced Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction Analysis</h1>
          <p className="text-gray-600">Deep insights into transaction patterns and behaviors</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="filter-button"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="filter-button flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button className="filter-button flex items-center space-x-2">
            <RefreshCcw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        className="flex space-x-1 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg p-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Main Content with AI Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Tab Content */}
        <motion.div
          key={activeTab}
          className="xl:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'time-patterns' && renderTimePatterns()}
          {activeTab === 'value-distribution' && renderValueDistribution()}
          {activeTab === 'peak-analysis' && renderPeakAnalysis()}
          {activeTab === 'flow-analysis' && renderFlowAnalysis()}
        </motion.div>

        {/* AI Insights Panel */}
        <motion.div
          className="xl:col-span-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <AIInsightsPanel 
            context="transactions" 
            data={transactionData}
            filters={filters}
            className="sticky top-4"
          />
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        className="flex flex-wrap gap-3 justify-center pt-6 border-t border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <button
          onClick={() => navigate('/products')}
          className="filter-button flex items-center space-x-2"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analyze Products</span>
        </button>
        <button
          onClick={() => navigate('/geography')}
          className="filter-button flex items-center space-x-2"
        >
          <MapPin className="w-4 h-4" />
          <span>By Location</span>
        </button>
        <button
          onClick={() => navigate('/consumers')}
          className="filter-button flex items-center space-x-2"
        >
          <Users className="w-4 h-4" />
          <span>Customer Analysis</span>
        </button>
        <button
          onClick={() => navigate('/ai-assistant')}
          className="filter-button flex items-center space-x-2"
        >
          <TrendingUp className="w-4 h-4" />
          <span>AI Insights</span>
        </button>
      </motion.div>
    </div>
  );
};

export default TransactionAnalysis;