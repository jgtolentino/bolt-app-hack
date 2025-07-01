import React from 'react';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

interface ParetoChartProps {
  data: Array<{
    name: string;
    sales: number;
    percentage: number;
  }>;
  title?: string;
  height?: number;
}

export const ParetoChart: React.FC<ParetoChartProps> = ({ data, title, height = 300 }) => {
  return (
    <div className="chart-container">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}K`}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'Sales') {
                return `₱${value.toLocaleString()}`;
              }
              return `${value.toFixed(1)}%`;
            }}
          />
          <Legend />
          <Bar 
            yAxisId="left"
            dataKey="sales" 
            fill="#3b82f6" 
            name="Sales"
            radius={[8, 8, 0, 0]}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="percentage" 
            stroke="#ef4444" 
            strokeWidth={3}
            dot={{ fill: '#ef4444', r: 4 }}
            name="Cumulative %"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Top 20% of SKUs contribute to {data[data.length - 1]?.percentage.toFixed(0)}% of total sales
        </p>
      </div>
    </div>
  );
};