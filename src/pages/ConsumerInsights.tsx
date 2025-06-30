import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFilterStore } from '../stores/filterStore';
import { AIInsightsPanel } from '../components/ai/AIInsightsPanel';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, ComposedChart, Area
} from 'recharts';
import {
  Users, TrendingUp, Clock, ShoppingCart, MapPin, Calendar,
  User, UserCheck, UserX, Target, Zap, Download, RefreshCcw
} from 'lucide-react';
import TransactionFlowWidget from '../components/analytics/TransactionFlowWidget';

const ConsumerInsights: React.FC = () => {
  const navigate = useNavigate();
  const { filters } = useFilterStore();
  const [activeTab, setActiveTab] = useState('behavior-patterns');
  const [loading, setLoading] = useState(false);

  // Mock data - replace with API calls
  const [consumerData, setConsumerData] = useState({
    behaviorPatterns: [
      { time: '6AM-9AM', frequency: 12, avg_basket: 185, customer_type: 'Commuter' },
      { time: '9AM-12PM', frequency: 34, avg_basket: 245, customer_type: 'Regular' },
      { time: '12PM-3PM', frequency: 67, avg_basket: 320, customer_type: 'Lunch Rush' },
      { time: '3PM-6PM', frequency: 45, avg_basket: 275, customer_type: 'Afternoon' },
      { time: '6PM-9PM', frequency: 78, avg_basket: 385, customer_type: 'Dinner Rush' },
      { time: '9PM-12AM', frequency: 23, avg_basket: 195, customer_type: 'Evening' }
    ],
    customerSegments: [
      { segment: 'Regular Customers', count: 2340, percentage: 45.2, avg_spend: 385, frequency: 4.2 },
      { segment: 'Students', count: 1876, percentage: 36.1, avg_spend: 125, frequency: 6.8 },
      { segment: 'Senior Citizens', count: 654, percentage: 12.6, avg_spend: 295, frequency: 2.1 },
      { segment: 'Employees', count: 234, percentage: 4.5, avg_spend: 445, frequency: 3.2 },
      { segment: 'Tourists', count: 89, percentage: 1.6, avg_spend: 675, frequency: 1.0 }
    ],
    geographicPreferences: [
      { region: 'NCR', beverages: 85, snacks: 78, dairy: 65, personal_care: 45, convenience: 92 },
      { region: 'Region VII', beverages: 78, snacks: 85, dairy: 72, personal_care: 38, convenience: 88 },
      { region: 'Region III', beverages: 72, snacks: 68, dairy: 78, personal_care: 42, convenience: 85 },
      { region: 'Region IV-A', beverages: 68, snacks: 72, dairy: 69, personal_care: 48, convenience: 87 },
      { region: 'Region VI', beverages: 65, snacks: 75, dairy: 58, personal_care: 35, convenience: 82 }
    ],
    seasonalTrends: [
      { month: 'Jan', total_customers: 4500, retention_rate: 68.5, satisfaction: 4.2 },
      { month: 'Feb', total_customers: 4680, retention_rate: 71.2, satisfaction: 4.1 },
      { month: 'Mar', total_customers: 4890, retention_rate: 73.8, satisfaction: 4.3 },
      { month: 'Apr', total_customers: 5120, retention_rate: 75.2, satisfaction: 4.2 },
      { month: 'May', total_customers: 5340, retention_rate: 76.8, satisfaction: 4.4 },
      { month: 'Jun', total_customers: 5560, retention_rate: 78.1, satisfaction: 4.3 }
    ],
    loyaltyMetrics: {
      total_customers: 5560,
      active_customers: 4890,
      retention_rate: 78.1,
      churn_rate: 21.9,
      avg_lifetime_value: 2450,
      repeat_purchase_rate: 65.4
    },
    purchaseJourney: [
      { stage: 'Awareness', customers: 10000, conversion: 100 },
      { stage: 'Interest', customers: 7500, conversion: 75 },
      { stage: 'Consideration', customers: 6200, conversion: 62 },
      { stage: 'Purchase', customers: 5560, conversion: 55.6 },
      { stage: 'Retention', customers: 4890, conversion: 48.9 },
      { stage: 'Advocacy', customers: 1200, conversion: 12 }
    ]
  });

  const tabs = [
    { id: 'behavior-patterns', label: 'Behavior Patterns', icon: Users },
    { id: 'geographic-preferences', label: 'Geographic Preferences', icon: MapPin },
    { id: 'seasonal-trends', label: 'Seasonal Trends', icon: Calendar },
    { id: 'customer-segments', label: 'Customer Segments', icon: Target }
  ];

  const formatCurrency = (value: number) => `₱${value.toLocaleString()}`;
  const formatNumber = (value: number) => value.toLocaleString();

  const COLORS = ['#3B82F6', '#14B8A6', '#F97316', '#8B5CF6', '#EF4444', '#06B6D4'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('avg') || entry.name.includes('spend') ? 
                formatCurrency(entry.value) : entry.name.includes('rate') || entry.name.includes('percentage') ? 
                `${entry.value}%` : formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderBehaviorPatterns = () => (
    <div className="space-y-6">
      {/* Customer Behavior Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(consumerData.loyaltyMetrics.total_customers)}
          </div>
          <div className="text-sm text-gray-600">Total Customers</div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-gray-500">Active</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(consumerData.loyaltyMetrics.active_customers)}
          </div>
          <div className="text-sm text-gray-600">Active Customers</div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-gray-500">Rate</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {consumerData.loyaltyMetrics.retention_rate}%
          </div>
          <div className="text-sm text-gray-600">Retention Rate</div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-gray-500">LTV</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(consumerData.loyaltyMetrics.avg_lifetime_value)}
          </div>
          <div className="text-sm text-gray-600">Avg Lifetime Value</div>
        </div>
      </div>

      {/* Behavioral Patterns Chart */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Customer Behavior by Time</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Frequency vs Basket Size</span>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={consumerData.behaviorPatterns}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
            <XAxis dataKey="time" tick={{ fill: '#6B7280', fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: '#6B7280', fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6B7280', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            
            <Bar yAxisId="left" dataKey="frequency" fill="#3B82F6" radius={[4, 4, 0, 0]} opacity={0.7} />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="avg_basket" 
              stroke="#14B8A6" 
              strokeWidth={3}
              dot={{ fill: '#14B8A6', strokeWidth: 2, r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Customer Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Customer Segments</h3>
            <span className="text-sm text-gray-600">By Volume</span>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={consumerData.customerSegments}
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
            >
              <XAxis 
                type="number"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}`}
              />
              <YAxis 
                type="category"
                dataKey="segment"
                tick={{ fontSize: 12 }}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {consumerData.customerSegments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Purchase Journey</h3>
            <span className="text-sm text-gray-600">Conversion Funnel</span>
          </div>
          
          <div className="space-y-3">
            {consumerData.purchaseJourney.map((stage, index) => (
              <div key={stage.stage} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                  <span className="text-sm text-gray-600">{stage.conversion}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stage.conversion}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatNumber(stage.customers)} customers
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Transaction Flow Widget */}
      <TransactionFlowWidget 
        onEnableAdvancedAnalytics={() => {
          console.log('Advanced analytics enabled');
        }}
      />
    </div>
  );

  const renderGeographicPreferences = () => (
    <div className="space-y-6">
      {/* Regional Preference Radar */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Regional Preferences Analysis</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Category Preferences by Region</span>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={consumerData.geographicPreferences}>
            <PolarGrid />
            <PolarAngleAxis dataKey="region" tick={{ fill: '#6B7280', fontSize: 11 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 10 }} />
            <Radar
              name="Beverages"
              dataKey="beverages"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Radar
              name="Snacks"
              dataKey="snacks"
              stroke="#14B8A6"
              fill="#14B8A6"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Radar
              name="Dairy"
              dataKey="dairy"
              stroke="#F97316"
              fill="#F97316"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Radar
              name="Personal Care"
              dataKey="personal_care"
              stroke="#8B5CF6"
              fill="#8B5CF6"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
        
        <div className="flex justify-center space-x-6 mt-4">
          {[
            { name: 'Beverages', color: '#3B82F6' },
            { name: 'Snacks', color: '#14B8A6' },
            { name: 'Dairy', color: '#F97316' },
            { name: 'Personal Care', color: '#8B5CF6' }
          ].map((item) => (
            <div key={item.name} className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Geographic Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="chart-container">
          <h4 className="font-semibold text-gray-900 mb-3">Top Performing Regions</h4>
          <div className="space-y-3">
            {consumerData.geographicPreferences
              .sort((a, b) => b.convenience - a.convenience)
              .slice(0, 3)
              .map((region, index) => (
                <div key={region.region} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{region.region}</div>
                      <div className="text-sm text-gray-600">Convenience: {region.convenience}%</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/geography');
                    }}
                    className="text-primary-600 hover:text-primary-800 text-sm"
                  >
                    Analyze →
                  </button>
                </div>
              ))}
          </div>
        </div>

        <div className="chart-container">
          <h4 className="font-semibold text-gray-900 mb-3">Category Leaders</h4>
          <div className="space-y-3">
            {[
              { category: 'Beverages', region: 'NCR', score: 85, color: 'bg-blue-500' },
              { category: 'Snacks', region: 'Region VII', score: 85, color: 'bg-green-500' },
              { category: 'Dairy', region: 'Region III', score: 78, color: 'bg-orange-500' },
              { category: 'Personal Care', region: 'Region IV-A', score: 48, color: 'bg-purple-500' }
            ].map((item) => (
              <div key={item.category} className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg">
                <div className={`w-4 h-4 ${item.color} rounded-full`}></div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.category}</div>
                  <div className="text-sm text-gray-600">{item.region}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{item.score}%</div>
                  <div className="text-xs text-gray-500">Preference</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-container">
          <h4 className="font-semibold text-gray-900 mb-3">Regional Opportunities</h4>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">NCR Expansion</span>
              </div>
              <p className="text-sm text-yellow-700">
                High beverage preference indicates opportunity for premium products
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Visayas Growth</span>
              </div>
              <p className="text-sm text-blue-700">
                Strong snack preferences suggest regional taste adaptation
              </p>
            </div>
            
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">Central Luzon</span>
              </div>
              <p className="text-sm text-green-700">
                Dairy leadership position - expand product lines
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSeasonalTrends = () => (
    <div className="space-y-6">
      {/* Seasonal Overview */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Customer Trends Over Time</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Growth & Satisfaction Metrics</span>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={consumerData.seasonalTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
            <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fill: '#6B7280', fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6B7280', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="total_customers"
              fill="url(#customerGradient)"
              stroke="#3B82F6"
              strokeWidth={2}
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="retention_rate" 
              stroke="#14B8A6" 
              strokeWidth={3}
              dot={{ fill: '#14B8A6', strokeWidth: 2, r: 4 }}
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="satisfaction" 
              stroke="#F97316" 
              strokeWidth={2}
              dot={{ fill: '#F97316', strokeWidth: 2, r: 3 }}
            />
            
            <defs>
              <linearGradient id="customerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Seasonal Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="chart-container">
          <h4 className="font-semibold text-gray-900 mb-3">Seasonal Patterns</h4>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-blue-800">Q1 Performance</span>
                <span className="text-sm text-blue-600">Jan-Mar</span>
              </div>
              <div className="text-sm text-blue-700">
                Customer growth: +8.7%<br />
                Retention improved to 73.8%
              </div>
            </div>
            
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-green-800">Q2 Trends</span>
                <span className="text-sm text-green-600">Apr-Jun</span>
              </div>
              <div className="text-sm text-green-700">
                Strong growth: +13.8%<br />
                Satisfaction peak: 4.4/5
              </div>
            </div>
          </div>
        </div>

        <div className="chart-container">
          <h4 className="font-semibold text-gray-900 mb-3">Retention Analysis</h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Retention Rate</span>
                <span className="font-medium">78.1%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '78.1%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Churn Rate</span>
                <span className="font-medium">21.9%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '21.9%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Repeat Purchase</span>
                <span className="font-medium">65.4%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65.4%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-container">
          <h4 className="font-semibold text-gray-900 mb-3">Action Items</h4>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <UserCheck className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Loyalty Program</span>
              </div>
              <p className="text-sm text-yellow-700">
                Implement rewards to improve 78% retention rate
              </p>
            </div>
            
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-800">Seasonal Campaign</span>
              </div>
              <p className="text-sm text-purple-700">
                Q2 shows peak satisfaction - replicate strategies
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCustomerSegments = () => (
    <div className="space-y-6">
      {/* Segment Overview */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Customer Segment Analysis</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Value vs Frequency</span>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart data={consumerData.customerSegments}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
            <XAxis 
              dataKey="frequency" 
              tick={{ fill: '#6B7280', fontSize: 11 }}
              label={{ value: 'Purchase Frequency (per month)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              dataKey="avg_spend" 
              tick={{ fill: '#6B7280', fontSize: 11 }}
              label={{ value: 'Average Spend (₱)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg p-3 shadow-lg">
                      <p className="font-medium text-gray-900">{data.segment}</p>
                      <p className="text-sm text-gray-600">Count: {formatNumber(data.count)}</p>
                      <p className="text-sm text-gray-600">Percentage: {data.percentage}%</p>
                      <p className="text-sm text-gray-600">Avg Spend: {formatCurrency(data.avg_spend)}</p>
                      <p className="text-sm text-gray-600">Frequency: {data.frequency}/month</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter dataKey="count" fill="#3B82F6" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Segment Analysis */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Segment Performance Details</h3>
          <button className="text-sm text-primary-600 hover:text-primary-800">
            Export Segment Data →
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Segment</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Count</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Percentage</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Avg Spend</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Frequency</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Strategy</th>
              </tr>
            </thead>
            <tbody>
              {consumerData.customerSegments.map((segment, index) => (
                <tr key={segment.segment} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index] }}></div>
                      <span className="font-medium text-gray-900">{segment.segment}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">{formatNumber(segment.count)}</td>
                  <td className="py-3 px-4 text-right">{segment.percentage}%</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(segment.avg_spend)}</td>
                  <td className="py-3 px-4 text-right">{segment.frequency}/month</td>
                  <td className="py-3 px-4 text-center">
                    <button className="text-primary-600 hover:text-primary-800 text-sm">
                      Optimize
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Segment Strategies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            segment: 'Regular Customers',
            strategy: 'Loyalty Rewards',
            description: 'Implement tiered rewards program to increase frequency',
            priority: 'High',
            color: 'bg-green-50 border-green-200 text-green-800'
          },
          {
            segment: 'Students',
            strategy: 'Value Promotions',
            description: 'Student discounts and bundle deals during peak hours',
            priority: 'Medium',
            color: 'bg-blue-50 border-blue-200 text-blue-800'
          },
          {
            segment: 'Senior Citizens',
            strategy: 'Convenience Focus',
            description: 'Priority service and health-focused product mix',
            priority: 'High',
            color: 'bg-purple-50 border-purple-200 text-purple-800'
          },
          {
            segment: 'Employees',
            strategy: 'Corporate Partnerships',
            description: 'Partner with nearby offices for bulk purchasing',
            priority: 'Medium',
            color: 'bg-orange-50 border-orange-200 text-orange-800'
          },
          {
            segment: 'Tourists',
            strategy: 'Premium Experience',
            description: 'Curated local products and tourist-friendly services',
            priority: 'Low',
            color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }
        ].map((item) => (
          <div key={item.segment} className={`p-4 border rounded-lg ${item.color}`}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold">{item.segment}</h4>
              <span className="text-xs px-2 py-1 bg-white/50 rounded">{item.priority}</span>
            </div>
            <h5 className="font-medium mb-1">{item.strategy}</h5>
            <p className="text-sm opacity-90">{item.description}</p>
          </div>
        ))}
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
          <h1 className="text-2xl font-bold text-gray-900">Consumer Insights</h1>
          <p className="text-gray-600">
            Deep understanding of customer behavior and preferences
          </p>
        </div>
        <div className="flex items-center space-x-3">
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

      {/* Main Content with AI Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Tab Navigation */}
        <div className="xl:col-span-3">
          <motion.div
            className="flex space-x-1 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg p-1 mb-6"
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

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'behavior-patterns' && renderBehaviorPatterns()}
            {activeTab === 'geographic-preferences' && renderGeographicPreferences()}
            {activeTab === 'seasonal-trends' && renderSeasonalTrends()}
            {activeTab === 'customer-segments' && renderCustomerSegments()}
          </motion.div>
        </div>

        {/* AI Insights Panel */}
        <motion.div
          className="xl:col-span-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <AIInsightsPanel 
            context="consumers" 
            data={consumerData}
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
          onClick={() => navigate('/geography')}
          className="filter-button flex items-center space-x-2"
        >
          <MapPin className="w-4 h-4" />
          <span>Geographic Analysis</span>
        </button>
        <button
          onClick={() => navigate('/products')}
          className="filter-button flex items-center space-x-2"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Product Preferences</span>
        </button>
        <button
          onClick={() => navigate('/transactions')}
          className="filter-button flex items-center space-x-2"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Transaction Patterns</span>
        </button>
        <button
          onClick={() => navigate('/ai-assistant')}
          className="filter-button flex items-center space-x-2"
        >
          <Target className="w-4 h-4" />
          <span>AI Recommendations</span>
        </button>
      </motion.div>
    </div>
  );
};

export default ConsumerInsights;