/**
 * Scout Dash 2.0 - Pareto Chart
 * Advanced chart showing 80/20 rule visualization with dual axes
 * Inspired by retail-insights-dashboard-ph
 */

import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { BaseVisual } from '../BaseVisual';
import { VisualBlueprint } from '../../../types';

export interface ParetoChartProps {
  blueprint: VisualBlueprint;
  data: any[];
  width?: number;
  height?: number;
  onSelectionChange?: (selection: any) => void;
  threshold?: number; // Pareto threshold (default 80%)
}

interface ParetoDataPoint {
  name: string;
  value: number;
  cumulative: number;
  cumulativePercent: number;
  isThresholdContributor: boolean;
}

export const ParetoChart: React.FC<ParetoChartProps> = ({
  blueprint,
  data,
  width,
  height,
  onSelectionChange,
  threshold = 80
}) => {
  // Process data for Pareto analysis
  const paretoData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const valueField = blueprint.encoding.y?.field || 'value';
    const nameField = blueprint.encoding.x?.field || 'name';

    // Sort data by value descending
    const sortedData = [...data]
      .filter(item => item[valueField] != null)
      .sort((a, b) => (b[valueField] || 0) - (a[valueField] || 0));

    const total = sortedData.reduce((sum, item) => sum + (item[valueField] || 0), 0);
    
    if (total === 0) return [];

    let cumulative = 0;
    return sortedData.map((item, index) => {
      cumulative += item[valueField] || 0;
      const cumulativePercent = (cumulative / total) * 100;
      
      return {
        name: item[nameField] || `Item ${index + 1}`,
        value: item[valueField] || 0,
        cumulative,
        cumulativePercent,
        isThresholdContributor: cumulativePercent <= threshold,
        originalData: item
      };
    });
  }, [data, blueprint.encoding, threshold]);

  const formatValue = (value: number): string => {
    const format = blueprint.encoding.y?.format;
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    }
    if (format === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    return new Intl.NumberFormat().format(value);
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
          {label}
        </p>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Value:</span>
            <span className="font-medium text-blue-600">
              {formatValue(data.value)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Cumulative:</span>
            <span className="font-medium text-green-600">
              {formatPercent(data.cumulativePercent)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
            <span className={`text-sm font-medium ${
              data.isThresholdContributor ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {data.isThresholdContributor ? 'Key Contributor' : 'Minor Contributor'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const handleBarClick = (data: any) => {
    if (onSelectionChange) {
      onSelectionChange({
        type: 'pareto-selection',
        item: data.originalData,
        name: data.name,
        value: data.value,
        cumulativePercent: data.cumulativePercent,
        isThresholdContributor: data.isThresholdContributor
      });
    }
  };

  if (!paretoData || paretoData.length === 0) {
    return (
      <BaseVisual blueprint={blueprint} width={width} height={height}>
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-lg font-medium">No Data Available</div>
            <div className="text-sm">Unable to generate Pareto analysis</div>
          </div>
        </div>
      </BaseVisual>
    );
  }

  // Calculate key statistics
  const thresholdContributors = paretoData.filter(d => d.isThresholdContributor);
  const contributorPercent = (thresholdContributors.length / paretoData.length) * 100;

  return (
    <BaseVisual blueprint={blueprint} width={width} height={height}>
      <div className="space-y-4">
        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {thresholdContributors.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Key Contributors
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatPercent(contributorPercent)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              of Total Items
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatPercent(threshold)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Threshold
            </div>
          </div>
        </div>

        {/* Pareto Chart */}
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={paretoData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
                stroke="#64748b"
              />
              <YAxis
                yAxisId="left"
                stroke="#3b82f6"
                fontSize={12}
                tickFormatter={formatValue}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#10b981"
                fontSize={12}
                tickFormatter={formatPercent}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Threshold reference line */}
              <ReferenceLine
                yAxisId="right"
                y={threshold}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{ value: `${threshold}% Threshold`, position: "insideTopRight" }}
              />
              
              {/* Value bars */}
              <Bar
                yAxisId="left"
                dataKey="value"
                name="Value"
                onClick={handleBarClick}
                style={{ cursor: 'pointer' }}
              >
                {paretoData.map((entry, index) => (
                  <Bar
                    key={`bar-${index}`}
                    fill={entry.isThresholdContributor ? '#3b82f6' : '#94a3b8'}
                  />
                ))}
              </Bar>
              
              {/* Cumulative percentage line */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulativePercent"
                name="Cumulative %"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Pareto Analysis Insights
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {formatPercent(contributorPercent)} of items ({thresholdContributors.length} out of {paretoData.length}) 
            contribute to {formatPercent(threshold)} of the total value. 
            Focus on these key contributors for maximum impact.
          </p>
        </div>
      </div>
    </BaseVisual>
  );
};

export default ParetoChart;