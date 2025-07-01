import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFilterStore } from '../features/filters/filterStore';
import { KpiCard, ChartPanel, RankedList, InsightCard } from '../components/widgets';
import { AIInsightsPanel } from '../components/ai/AIInsightsPanel';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Area, AreaChart, ScatterChart, Scatter, Cell
} from 'recharts';
import { 
  Clock, Calendar, TrendingUp, DollarSign, Users, CreditCard,
  ShoppingCart, Activity, Receipt, Target, AlertCircle
} from 'lucide-react';
import EnhancedDonutChart from '../components/charts/EnhancedDonutChart';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';
import { fmt } from '../utils/formatters';

const TransactionAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const filters = useFilterStore();
  const [activeTab, setActiveTab] = useState('time-patterns');
  const [timeRange, setTimeRange] = useState('last-30-days');
  const [loading, setLoading] = useState(false);
  const [lastUpdate] = useState(new Date());

  // Mock data - replace with API calls
  const transactionData = {
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
  };

  // KPI Cards
  const kpiCards = useMemo(() => [
    {
      id: 'total-transactions',
      label: 'Total Transactions',
      value: 8234,
      delta: 12.5,
      icon: Receipt,
      valueFormat: 'number' as const
    },
    {
      id: 'total-value',
      label: 'Transaction Value',
      value: 2235878,
      delta: 15.8,
      icon: DollarSign,
      valueFormat: 'currency' as const
    },
    {
      id: 'avg-transaction',
      label: 'Avg Transaction',
      value: 272,
      delta: 2.3,
      icon: ShoppingCart,
      valueFormat: 'currency' as const
    },
    {
      id: 'peak-hour',
      label: 'Peak Hour Trans',
      value: 687,
      delta: 8.7,
      icon: Clock,
      valueFormat: 'number' as const
    }
  ], []);

  const secondaryKpis = useMemo(() => [
    {
      id: 'conversion-rate',
      label: 'Conversion Rate',
      value: 68.5,
      delta: 3.2,
      icon: Target,
      valueFormat: 'percentage' as const
    },
    {
      id: 'cash-percentage',
      label: 'Cash Payments',
      value: 52.8,
      delta: -5.3,
      icon: CreditCard,
      valueFormat: 'percentage' as const
    },
    {
      id: 'repeat-customers',
      label: 'Repeat Customers',
      value: 65.4,
      delta: 4.1,
      icon: Users,
      valueFormat: 'percentage' as const
    },
    {
      id: 'busy-hours',
      label: 'Busy Hours/Day',
      value: 8,
      delta: 0,
      icon: Activity,
      valueFormat: 'number' as const
    }
  ], []);

  // Transform data for ranked lists
  const topTimeSlots = useMemo(() => {
    return [...transactionData.timePatterns]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(slot => ({
        id: slot.hour,
        label: slot.hour,
        value: slot.value,
        delta: 0,
        metadata: { transactions: slot.transactions }
      }));
  }, []);

  const paymentMethodsRanked = useMemo(() => {
    return transactionData.paymentMethods.map(method => ({
      id: method.name,
      label: method.name,
      value: method.value,
      delta: 0,
      metadata: { 
        count: method.count,
        percentage: method.percentage 
      }
    }));
  }, []);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('value') || entry.name.includes('Value') ? 
                fmt.currencyCompact(entry.value) : fmt.number(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const tabs = [
    { id: 'time-patterns', label: 'Time Patterns', icon: Clock },
    { id: 'value-distribution', label: 'Value Distribution', icon: DollarSign },
    { id: 'peak-analysis', label: 'Peak Analysis', icon: TrendingUp },
    { id: 'flow-analysis', label: 'Transaction Flow', icon: Users }
  ];

  // Chart components for each tab
  const renderTimePatterns = () => (
    <>
      {/* Hourly Transaction Pattern */}
      <ChartPanel
        title="Hourly Transaction Pattern"
        subtitle="Transaction volume and value throughout the day"
        className="col-span-12"
        height={300}
        loading={loading}
        updatedAt={lastUpdate}
        chart={
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={transactionData.timePatterns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.25} />
              <XAxis dataKey="hour" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              
              <Bar yAxisId="left" dataKey="transactions" fill="#3B82F6" opacity={0.7} radius={[4, 4, 0, 0]} />
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
        }
      />

      {/* Daily Pattern */}
      <ChartPanel
        title="Daily Transaction Trends"
        subtitle="Week-over-week comparison"
        className="col-span-6 md:col-span-12"
        height={260}
        loading={loading}
        updatedAt={lastUpdate}
        chart={
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={transactionData.dailyPatterns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.25} />
              <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]}>
                {transactionData.dailyPatterns.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.growth > 20 ? '#10B981' : '#8B5CF6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        }
      />

      {/* Top Time Slots */}
      <RankedList
        title="Busiest Time Slots"
        subtitle="Peak transaction periods"
        items={topTimeSlots}
        type="generic"
        valueFormat="currency"
        maxItems={5}
        loading={loading}
        className="col-span-6 md:col-span-12"
        updatedAt={lastUpdate}
      />
    </>
  );

  const renderValueDistribution = () => (
    <>
      {/* Transaction Value Distribution */}
      <ChartPanel
        title="Transaction Value Distribution"
        subtitle="Breakdown by price ranges"
        className="col-span-8 md:col-span-12"
        height={300}
        loading={loading}
        updatedAt={lastUpdate}
        chart={
          <div className="flex items-center justify-center h-full">
            <EnhancedDonutChart
              data={transactionData.valueDistribution.map(item => ({
                name: item.range,
                value: item.count,
                percentage: item.percentage
              }))}
              title="Value Ranges"
              showPercentage={true}
              colors={['#3B82F6', '#14B8A6', '#F97316', '#8B5CF6', '#EF4444', '#06B6D4']}
            />
          </div>
        }
      />

      {/* Payment Methods */}
      <RankedList
        title="Payment Methods"
        subtitle="Transaction value by payment type"
        items={paymentMethodsRanked}
        type="generic"
        valueFormat="currency"
        maxItems={5}
        loading={loading}
        className="col-span-4 md:col-span-12"
        updatedAt={lastUpdate}
      />

      {/* Transaction Size Analysis */}
      <ChartPanel
        title="Transaction Size Analysis"
        subtitle="Average basket size over time"
        className="col-span-12"
        height={260}
        loading={loading}
        updatedAt={lastUpdate}
        chart={
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={transactionData.timePatterns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.25} />
              <XAxis dataKey="hour" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="avg_size" 
                stroke="#F97316" 
                fill="#F97316" 
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        }
      />
    </>
  );

  // AI Insights
  const insights = [
    {
      title: 'Peak Hour Optimization',
      body: 'Transactions spike at 2PM with 687 orders. Consider adding staff during 12PM-3PM to handle the 58% increase in volume.',
      type: 'recommendation' as const,
      impact: 'high' as const,
      confidence: 92,
      tags: ['Operations', 'Staffing']
    },
    {
      title: 'Digital Payment Growth',
      body: 'GCash usage increased 18.9% this month. Promote cashless payments to reduce cash handling time.',
      type: 'trend' as const,
      impact: 'medium' as const,
      tags: ['Payments', 'Digital']
    }
  ];

  return (
    <div className="space-y-phi-lg">
      {/* Page Header */}
      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-xl-phi font-bold text-gray-900">Transaction Analysis</h1>
          <p className="text-sm-phi text-gray-600">Deep dive into transaction patterns and behaviors</p>
        </div>
        <div className="flex items-center space-x-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="last-7-days">Last 7 Days</option>
            <option value="last-30-days">Last 30 Days</option>
            <option value="last-90-days">Last 90 Days</option>
          </select>
        </div>
      </motion.div>

      {/* KPI Cards Row 1 */}
      <section className="grid grid-cols-12 gap-phi">
        {kpiCards.map((kpi) => (
          <KpiCard
            key={kpi.id}
            icon={kpi.icon}
            label={kpi.label}
            value={kpi.value}
            delta={kpi.delta}
            valueFormat={kpi.valueFormat}
            loading={loading}
            className="col-span-3 md:col-span-6 sm:col-span-12"
            updatedAt={lastUpdate}
          />
        ))}
      </section>

      {/* KPI Cards Row 2 */}
      <section className="grid grid-cols-12 gap-phi">
        {secondaryKpis.map((kpi) => (
          <KpiCard
            key={kpi.id}
            icon={kpi.icon}
            label={kpi.label}
            value={kpi.value}
            delta={kpi.delta}
            valueFormat={kpi.valueFormat}
            loading={loading}
            className="col-span-3 md:col-span-6 sm:col-span-12"
            updatedAt={lastUpdate}
          />
        ))}
      </section>

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
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Main Content with AI Insights */}
      <div className="grid grid-cols-12 gap-phi-md">
        {/* Tab Content */}
        <motion.div
          key={activeTab}
          className="col-span-8 xl:col-span-9"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-12 gap-phi-md">
            {activeTab === 'time-patterns' && renderTimePatterns()}
            {activeTab === 'value-distribution' && renderValueDistribution()}
            {/* Add other tab content as needed */}
          </div>
        </motion.div>

        {/* AI Insights Panel */}
        <motion.div
          className="col-span-4 xl:col-span-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="sticky top-4 space-y-phi">
            <h3 className="text-lg-phi font-semibold text-gray-900">AI Insights</h3>
            {insights.map((insight, index) => (
              <InsightCard
                key={index}
                title={insight.title}
                body={insight.body}
                type={insight.type}
                impact={insight.impact}
                confidence={insight.confidence}
                tags={insight.tags}
                updatedAt={lastUpdate}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TransactionAnalysis;