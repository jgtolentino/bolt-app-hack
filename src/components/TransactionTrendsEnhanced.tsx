import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfDay, isWeekend } from 'date-fns';
import { TrendingUp, Clock, DollarSign, Package, BarChart3, Grid3x3 as HeatmapIcon, BoxIcon } from 'lucide-react';
import { Transaction } from '../utils/mockDataGenerator';

// Import new chart components
import DayToggle from './charts/DayToggle';
import BoxPlot from './charts/BoxPlot';
import TransactionHeatmap from './charts/TransactionHeatmap';

interface TransactionTrendsEnhancedProps {
  transactions: Transaction[];
  filters: {
    timeOfDay?: string;
    region?: string;
    barangay?: string;
    weekVsWeekend?: 'week' | 'weekend' | 'all';
    category?: string;
  };
}

const TransactionTrendsEnhanced: React.FC<TransactionTrendsEnhancedProps> = ({ transactions, filters }) => {
  const [dayFilter, setDayFilter] = useState<'all' | 'weekdays' | 'weekends'>('all');
  const [activeView, setActiveView] = useState<'trends' | 'distribution' | 'heatmap'>('trends');
  const [heatmapMetric, setHeatmapMetric] = useState<'count' | 'value' | 'average'>('count');

  // Apply filters including the new day filter
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(t => {
      if (filters.region && t.region !== filters.region) return false;
      if (filters.barangay && t.barangay !== filters.barangay) return false;
      if (filters.category && !t.items.some(item => item.category === filters.category)) return false;
      
      // Apply day filter
      if (dayFilter !== 'all') {
        const isWeekendDay = isWeekend(t.timestamp);
        if (dayFilter === 'weekdays' && isWeekendDay) return false;
        if (dayFilter === 'weekends' && !isWeekendDay) return false;
      }
      
      return true;
    });
  }, [transactions, filters, dayFilter]);

  // Calculate KPIs
  const kpis = React.useMemo(() => {
    const totalTransactions = filteredTransactions.length;
    const totalValue = filteredTransactions.reduce((sum, t) => sum + t.transaction_value, 0);
    const avgValue = totalTransactions > 0 ? totalValue / totalTransactions : 0;
    const avgDuration = filteredTransactions.reduce((sum, t) => sum + t.duration_seconds, 0) / totalTransactions || 0;
    const totalUnits = filteredTransactions.reduce((sum, t) => sum + t.units, 0);

    // Calculate trends
    const now = new Date();
    const last7Days = filteredTransactions.filter(t => 
      t.timestamp >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    );
    const prev7Days = filteredTransactions.filter(t => 
      t.timestamp >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) &&
      t.timestamp < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    );

    const volumeTrend = prev7Days.length > 0 ? 
      ((last7Days.length - prev7Days.length) / prev7Days.length) * 100 : 0;

    return {
      totalTransactions,
      totalValue,
      avgValue,
      avgDuration,
      totalUnits,
      volumeTrend
    };
  }, [filteredTransactions]);

  // Prepare time series data
  const timeSeriesData = React.useMemo(() => {
    const dailyData = new Map<string, { date: string; volume: number; value: number; units: number }>();
    
    filteredTransactions.forEach(t => {
      const dateKey = format(startOfDay(t.timestamp), 'yyyy-MM-dd');
      const existing = dailyData.get(dateKey) || { date: dateKey, volume: 0, value: 0, units: 0 };
      
      dailyData.set(dateKey, {
        date: dateKey,
        volume: existing.volume + 1,
        value: existing.value + t.transaction_value,
        units: existing.units + t.units
      });
    });

    return Array.from(dailyData.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        ...d,
        date: format(new Date(d.date), 'MMM dd'),
        avgValue: d.volume > 0 ? d.value / d.volume : 0
      }));
  }, [filteredTransactions]);

  // Prepare data for box plot
  const transactionValues = React.useMemo(() => {
    return filteredTransactions.map(t => t.transaction_value);
  }, [filteredTransactions]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.totalTransactions.toLocaleString()}</p>
              {kpis.volumeTrend !== 0 && (
                <p className={`text-sm ${kpis.volumeTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpis.volumeTrend > 0 ? '+' : ''}{kpis.volumeTrend.toFixed(1)}% vs last week
                </p>
              )}
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">₱{kpis.totalValue.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Avg: ₱{kpis.avgValue.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(kpis.avgDuration)}s</p>
              <p className="text-sm text-gray-500">{(kpis.avgDuration / 60).toFixed(1)} minutes</p>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Units Sold</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.totalUnits.toLocaleString()}</p>
              <p className="text-sm text-gray-500">
                {kpis.totalTransactions > 0 ? (kpis.totalUnits / kpis.totalTransactions).toFixed(1) : '0'} per transaction
              </p>
            </div>
            <Package className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Day Filter Toggle */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filter by Day Type</h3>
          <DayToggle filter={dayFilter} setFilter={setDayFilter} />
        </div>
      </div>

      {/* View Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView('trends')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeView === 'trends' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Trends
        </button>
        <button
          onClick={() => setActiveView('distribution')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeView === 'distribution' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <BoxIcon className="h-4 w-4" />
          Distribution
        </button>
        <button
          onClick={() => setActiveView('heatmap')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeView === 'heatmap' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <HeatmapIcon className="h-4 w-4" />
          Heatmap
        </button>
      </div>

      {/* Main Visualization Area */}
      {activeView === 'trends' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Transaction Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
              <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="volume" 
                stroke="#3B82F6" 
                name="Transactions"
                strokeWidth={2}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avgValue" 
                stroke="#10B981" 
                name="Avg Value (₱)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeView === 'distribution' && (
        <BoxPlot
          data={transactionValues}
          title="Transaction Value Distribution"
          yAxisLabel="Transaction Value"
          color="#3B82F6"
        />
      )}

      {activeView === 'heatmap' && (
        <>
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Heatmap Metric:</span>
              <select
                value={heatmapMetric}
                onChange={(e) => setHeatmapMetric(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="count">Transaction Count</option>
                <option value="value">Total Value</option>
                <option value="average">Average Value</option>
              </select>
            </div>
          </div>
          <TransactionHeatmap
            transactions={filteredTransactions}
            metric={heatmapMetric}
          />
        </>
      )}

      {/* AI Insight */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Insight</h3>
        <p className="text-gray-700">
          {dayFilter === 'weekdays' && 'Weekday transactions show consistent patterns with peaks during commute hours. '}
          {dayFilter === 'weekends' && 'Weekend transactions have later morning peaks and more distributed patterns. '}
          {activeView === 'distribution' && transactionValues.length > 0 && 
            `The median transaction value is ₱${transactionValues.sort((a, b) => a - b)[Math.floor(transactionValues.length / 2)].toFixed(2)}. `
          }
          {kpis.volumeTrend > 0 
            ? `Transaction volume is trending up ${kpis.volumeTrend.toFixed(1)}% week-over-week.`
            : kpis.volumeTrend < 0 
            ? `Transaction volume has decreased ${Math.abs(kpis.volumeTrend).toFixed(1)}% from last week.`
            : 'Transaction volume remains stable week-over-week.'
          }
        </p>
      </div>
    </div>
  );
};

export default TransactionTrendsEnhanced;