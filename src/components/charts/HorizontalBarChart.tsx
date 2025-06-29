import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartDataPoint } from '../../types';
import { formatCurrencyCompact, formatNumber } from '../../utils/formatters';

interface HorizontalBarChartProps {
  data: ChartDataPoint[];
  title?: string;
  height?: number;
  showComparison?: boolean;
  sortDescending?: boolean;
  isCurrency?: boolean;
}

const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  data,
  title = "Performance Analysis",
  height = 400,
  showComparison = false,
  sortDescending = true,
  isCurrency = true
}) => {
  const COLORS = [
    '#3B82F6', '#14B8A6', '#F97316', '#8B5CF6', 
    '#EF4444', '#06B6D4', '#84CC16', '#F59E0B'
  ];

  // Sort data if needed
  const sortedData = sortDescending 
    ? [...data].sort((a, b) => b.value - a.value)
    : data;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-primary-600">
            {isCurrency ? 'Sales: ' : 'Value: '}
            {isCurrency 
              ? formatCurrencyCompact(payload[0].value) 
              : formatNumber(payload[0].value)
            }
          </p>
          {payload[0].payload.category && (
            <p className="text-sm text-gray-600">
              Category: {payload[0].payload.category}
            </p>
          )}
          {payload[0].payload.growth && (
            <p className="text-sm text-green-600">
              Growth: +{payload[0].payload.growth}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      className="chart-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="text-sm text-gray-600">
          {sortedData.length} items • Sorted by value
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <BarChart 
          data={sortedData} 
          layout="horizontal"
          margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
          
          <XAxis 
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            tickFormatter={isCurrency ? formatCurrencyCompact : formatNumber}
          />
          
          <YAxis 
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 11 }}
            width={90}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Bar 
            dataKey="value" 
            radius={[0, 4, 4, 0]}
            cursor="pointer"
          >
            {sortedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Performance Insights */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Top Performer:</span>
            <p className="font-medium">{sortedData[0]?.name}</p>
          </div>
          <div>
            <span className="text-gray-600">Total Value:</span>
            <p className="font-medium">
              {isCurrency 
                ? formatCurrencyCompact(sortedData.reduce((sum, item) => sum + item.value, 0))
                : formatNumber(sortedData.reduce((sum, item) => sum + item.value, 0))
              }
            </p>
          </div>
          <div>
            <span className="text-gray-600">Average:</span>
            <p className="font-medium">
              {isCurrency
                ? formatCurrencyCompact(sortedData.reduce((sum, item) => sum + item.value, 0) / sortedData.length)
                : formatNumber(sortedData.reduce((sum, item) => sum + item.value, 0) / sortedData.length)
              }
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HorizontalBarChart;