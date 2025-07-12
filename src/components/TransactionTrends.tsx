import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfDay, isWeekend } from 'date-fns';
import { TrendingUp, Clock, DollarSign, Package } from 'lucide-react';
import { Transaction } from '../utils/mockDataGenerator';

interface TransactionTrendsProps {
  transactions: Transaction[];
  filters: {
    timeOfDay?: string;
    region?: string;
    barangay?: string;
    weekVsWeekend?: 'week' | 'weekend' | 'all';
    category?: string;
  };
}

const TransactionTrends: React.FC<TransactionTrendsProps> = ({ transactions, filters }) => {
  // Apply filters
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(t => {
      if (filters.region && t.region !== filters.region) return false;
      if (filters.barangay && t.barangay !== filters.barangay) return false;
      if (filters.category && !t.items.some(item => item.category === filters.category)) return false;
      if (filters.weekVsWeekend !== 'all') {
        const isWeekendDay = isWeekend(t.timestamp);
        if (filters.weekVsWeekend === 'week' && isWeekendDay) return false;
        if (filters.weekVsWeekend === 'weekend' && !isWeekendDay) return false;
      }
      return true;
    });
  }, [transactions, filters]);

  // Calculate KPIs
  const kpis = React.useMemo(() => {
    const totalTransactions = filteredTransactions.length;
    const totalValue = filteredTransactions.reduce((sum, t) => sum + t.transaction_value, 0);
    const avgValue = totalTransactions > 0 ? totalValue / totalTransactions : 0;
    const avgDuration = filteredTransactions.reduce((sum, t) => sum + t.duration_seconds, 0) / totalTransactions || 0;
    const totalUnits = filteredTransactions.reduce((sum, t) => sum + t.units, 0);

    // Calculate trends (comparing last 7 days vs previous 7 days)
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

  // Prepare hourly distribution data
  const hourlyData = React.useMemo(() => {
    const hourlyMap = new Map<number, { hour: number; volume: number; value: number }>();
    
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, { hour: i, volume: 0, value: 0 });
    }

    filteredTransactions.forEach(t => {
      const hour = t.timestamp.getHours();
      const existing = hourlyMap.get(hour)!;
      hourlyMap.set(hour, {
        hour,
        volume: existing.volume + 1,
        value: existing.value + t.transaction_value
      });
    });

    return Array.from(hourlyMap.values()).map(d => ({
      hour: `${d.hour}:00`,
      volume: d.volume,
      avgValue: d.volume > 0 ? d.value / d.volume : 0
    }));
  }, [filteredTransactions]);

  // Prepare duration distribution data for box plot
  const durationData = React.useMemo(() => {
    const durations = filteredTransactions.map(t => t.duration_seconds);
    if (durations.length === 0) return [];

    durations.sort((a, b) => a - b);
    
    const q1Index = Math.floor(durations.length * 0.25);
    const medianIndex = Math.floor(durations.length * 0.5);
    const q3Index = Math.floor(durations.length * 0.75);

    return [{
      name: 'Duration',
      min: Math.min(...durations),
      q1: durations[q1Index],
      median: durations[medianIndex],
      q3: durations[q3Index],
      max: Math.max(...durations)
    }];
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

      {/* Time Series Chart */}
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

      {/* Hourly Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Transaction Pattern</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="volume" fill="#3B82F6" name="Transactions" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Duration Distribution Box Plot */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Duration Distribution</h3>
        <div className="flex items-center space-x-8">
          <div className="flex-1">
            <p className="text-sm text-gray-600">Distribution Statistics (seconds)</p>
            {durationData.length > 0 && (
              <div className="mt-2 grid grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500">Min</p>
                  <p className="font-semibold">{durationData[0].min}s</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Q1</p>
                  <p className="font-semibold">{durationData[0].q1}s</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Median</p>
                  <p className="font-semibold">{durationData[0].median}s</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Q3</p>
                  <p className="font-semibold">{durationData[0].q3}s</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Max</p>
                  <p className="font-semibold">{durationData[0].max}s</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Insight</h3>
        <p className="text-gray-700">
          Peak transaction hours are between 6-9 AM and 3-8 PM, aligning with typical commute times. 
          {kpis.volumeTrend > 0 
            ? ` Transaction volume is trending up ${kpis.volumeTrend.toFixed(1)}% week-over-week.`
            : kpis.volumeTrend < 0 
            ? ` Transaction volume has decreased ${Math.abs(kpis.volumeTrend).toFixed(1)}% from last week.`
            : ' Transaction volume remains stable week-over-week.'
          }
          {filters.weekVsWeekend === 'weekend' && ' Weekend patterns show later morning peaks.'}
        </p>
      </div>
    </div>
  );
};

export default TransactionTrends;