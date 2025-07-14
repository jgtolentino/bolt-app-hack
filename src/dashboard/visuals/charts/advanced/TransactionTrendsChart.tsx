/**
 * Scout Dash 2.0 - Transaction Trends Chart
 * Advanced time series analysis with dual metrics and peak detection
 * Inspired by retail-insights-dashboard-ph
 */

import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush
} from 'recharts';
import { BaseVisual } from '../BaseVisual';
import { VisualBlueprint } from '../../../types';

export interface TransactionTrendsChartProps {
  blueprint: VisualBlueprint;
  data: any[];
  width?: number;
  height?: number;
  onSelectionChange?: (selection: any) => void;
  showBrush?: boolean;
  showPeakDetection?: boolean;
}

interface TrendDataPoint {
  date: string;
  timestamp: Date;
  transactionCount: number;
  totalAmount: number;
  averageAmount: number;
  peakPeriod?: boolean;
  originalData: any;
}

interface TrendStats {
  totalTransactions: number;
  totalAmount: number;
  averageTransaction: number;
  peakHour: string;
  peakValue: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export const TransactionTrendsChart: React.FC<TransactionTrendsChartProps> = ({
  blueprint,
  data,
  width,
  height = 400,
  onSelectionChange,
  showBrush = true,
  showPeakDetection = true
}) => {
  const { trendData, stats } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        trendData: [],
        stats: {
          totalTransactions: 0,
          totalAmount: 0,
          averageTransaction: 0,
          peakHour: 'N/A',
          peakValue: 0,
          trend: 'stable' as const,
          trendPercentage: 0
        }
      };
    }

    const dateField = blueprint.encoding.x?.field || 'date';
    const countField = blueprint.encoding.y?.field || 'count';
    const amountField = blueprint.encoding.color?.field || 'amount';

    // Process and sort data by date
    const processedData = data
      .filter(item => item[dateField] && (item[countField] || item[amountField]))
      .map(item => {
        const date = new Date(item[dateField]);
        const count = parseFloat(item[countField]) || 0;
        const amount = parseFloat(item[amountField]) || 0;
        
        return {
          date: date.toISOString().split('T')[0], // YYYY-MM-DD format
          timestamp: date,
          transactionCount: count,
          totalAmount: amount,
          averageAmount: count > 0 ? amount / count : 0,
          originalData: item
        };
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Peak detection (simple approach - values above 75th percentile)
    if (showPeakDetection && processedData.length > 0) {
      const values = processedData.map(d => d.transactionCount);
      const sortedValues = [...values].sort((a, b) => a - b);
      const threshold = sortedValues[Math.floor(sortedValues.length * 0.75)];
      
      processedData.forEach(point => {
        point.peakPeriod = point.transactionCount >= threshold;
      });
    }

    // Calculate statistics
    const totalTransactions = processedData.reduce((sum, d) => sum + d.transactionCount, 0);
    const totalAmount = processedData.reduce((sum, d) => sum + d.totalAmount, 0);
    const averageTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    // Find peak hour
    const peakPoint = processedData.reduce((max, current) => 
      current.transactionCount > max.transactionCount ? current : max, 
      processedData[0] || { transactionCount: 0, date: 'N/A' }
    );

    // Calculate trend (comparing first half vs second half)
    const midPoint = Math.floor(processedData.length / 2);
    const firstHalf = processedData.slice(0, midPoint);
    const secondHalf = processedData.slice(midPoint);
    
    const firstHalfAvg = firstHalf.length > 0 
      ? firstHalf.reduce((sum, d) => sum + d.transactionCount, 0) / firstHalf.length 
      : 0;
    const secondHalfAvg = secondHalf.length > 0 
      ? secondHalf.reduce((sum, d) => sum + d.transactionCount, 0) / secondHalf.length 
      : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    let trendPercentage = 0;

    if (firstHalfAvg > 0) {
      trendPercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
      if (Math.abs(trendPercentage) > 5) {
        trend = trendPercentage > 0 ? 'up' : 'down';
      }
    }

    const stats: TrendStats = {
      totalTransactions,
      totalAmount,
      averageTransaction,
      peakHour: peakPoint.date,
      peakValue: peakPoint.transactionCount,
      trend,
      trendPercentage: Math.abs(trendPercentage)
    };

    return { trendData: processedData, stats };
  }, [data, blueprint.encoding, showPeakDetection]);

  const formatValue = (value: number, type: 'currency' | 'number' = 'number'): string => {
    if (type === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    }
    return new Intl.NumberFormat().format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
          {formatDate(label)}
        </p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Transactions:</span>
            <span className="font-medium text-blue-600">
              {formatValue(data.transactionCount)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount:</span>
            <span className="font-medium text-green-600">
              {formatValue(data.totalAmount, 'currency')}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Avg Amount:</span>
            <span className="font-medium text-purple-600">
              {formatValue(data.averageAmount, 'currency')}
            </span>
          </div>
          {data.peakPeriod && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <span className="text-xs font-medium text-orange-600 bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded">
                Peak Period
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleDataClick = (data: any) => {
    if (onSelectionChange) {
      onSelectionChange({
        type: 'trend-point',
        date: data.date,
        transactionCount: data.transactionCount,
        totalAmount: data.totalAmount,
        averageAmount: data.averageAmount,
        isPeak: data.peakPeriod,
        originalData: data.originalData
      });
    }
  };

  if (!trendData || trendData.length === 0) {
    return (
      <BaseVisual blueprint={blueprint} width={width} height={height}>
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-lg font-medium">No Trend Data Available</div>
            <div className="text-sm">Unable to generate transaction trends</div>
          </div>
        </div>
      </BaseVisual>
    );
  }

  return (
    <BaseVisual blueprint={blueprint} width={width} height={height}>
      <div className="space-y-4">
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatValue(stats.totalTransactions)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Transactions
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatValue(stats.totalAmount, 'currency')}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Amount
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatValue(stats.averageTransaction, 'currency')}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Avg Transaction
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {formatDate(stats.peakHour)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Peak Date
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart
              data={trendData}
              margin={{ top: 20, right: 30, left: 20, bottom: showBrush ? 80 : 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis
                yAxisId="left"
                stroke="#3b82f6"
                fontSize={12}
                tickFormatter={(value) => formatValue(value)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#10b981"
                fontSize={12}
                tickFormatter={(value) => formatValue(value, 'currency')}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Peak periods background */}
              {showPeakDetection && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="peakPeriod"
                  stroke="none"
                  fill="#fef3c7"
                  fillOpacity={0.3}
                  dot={false}
                  activeDot={false}
                />
              )}

              {/* Transaction count bars */}
              <Bar
                yAxisId="left"
                dataKey="transactionCount"
                name="Transaction Count"
                fill="#3b82f6"
                fillOpacity={0.7}
                onClick={handleDataClick}
                style={{ cursor: 'pointer' }}
              />

              {/* Total amount line */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="totalAmount"
                name="Total Amount"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />

              {/* Average amount line */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="averageAmount"
                name="Average Amount"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#8b5cf6', strokeWidth: 2 }}
              />

              {/* Brush for zooming */}
              {showBrush && (
                <Brush
                  dataKey="date"
                  height={30}
                  stroke="#3b82f6"
                  tickFormatter={formatDate}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Analysis */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Trend Analysis
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {stats.trend === 'up' && (
                  <span className="text-green-600">
                    ↗ Trending up by {stats.trendPercentage.toFixed(1)}%
                  </span>
                )}
                {stats.trend === 'down' && (
                  <span className="text-red-600">
                    ↘ Trending down by {stats.trendPercentage.toFixed(1)}%
                  </span>
                )}
                {stats.trend === 'stable' && (
                  <span className="text-gray-600">
                    → Stable trend (±{stats.trendPercentage.toFixed(1)}%)
                  </span>
                )}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-orange-600">
                {formatValue(stats.peakValue)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Peak Value
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseVisual>
  );
};

export default TransactionTrendsChart;