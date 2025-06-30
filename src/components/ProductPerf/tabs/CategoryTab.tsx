import React, { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import useCatPerf from '../../../hooks/useCatPerf';
import EmptyState from '../../EmptyState';
import { exportCSV } from '../../../utils/exportCSV';
import { formatCurrencyCompact } from '../../../utils/formatters';

export default function CategoryTab() {
  const { data, isLoading } = useCatPerf();

  useEffect(() => {
    const handleExport = () => {
      if (data && data.length > 0) {
        exportCSV(data, 'category_performance.csv');
      }
    };
    
    window.addEventListener('pp-export', handleExport);
    return () => window.removeEventListener('pp-export', handleExport);
  }, [data]);

  if (isLoading) return <EmptyState msg="Loading..." />;
  if (!data || data.length === 0) return <EmptyState />;

  // Format data for display
  const chartData = data.map(item => ({
    ...item,
    sales: Number(item.sales) || 0,
    profit: Number(item.profit) || 0,
    units: Number(item.units) || 0,
    margin: Number(item.avg_margin) * 100 || 0
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-blue-600">
            Sales: {formatCurrencyCompact(payload[0].value)}
          </p>
          <p className="text-sm text-green-600">
            Profit: {formatCurrencyCompact(payload[1].value)}
          </p>
          <p className="text-sm text-gray-600">
            Units: {payload[0].payload.units.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            Margin: {payload[0].payload.margin.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Category Performance</h3>
        <div className="text-sm text-gray-500">
          Total Categories: {data.length}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
          <XAxis 
            dataKey="category" 
            angle={-45}
            textAnchor="end"
            height={120}
            tick={{ fontSize: 11 }}
            interval={0}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={formatCurrencyCompact}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={36}
            wrapperStyle={{ paddingBottom: '10px' }}
          />
          <Bar 
            dataKey="sales" 
            name="Sales ₱" 
            fill="#3B82F6"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="profit" 
            name="Profit ₱" 
            fill="#10B981"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 pt-4 border-t">
        <div>
          <p className="text-sm text-gray-600">Total Sales</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrencyCompact(chartData.reduce((sum, item) => sum + item.sales, 0))}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Profit</p>
          <p className="text-lg font-semibold text-green-600">
            {formatCurrencyCompact(chartData.reduce((sum, item) => sum + item.profit, 0))}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Units</p>
          <p className="text-lg font-semibold text-gray-900">
            {chartData.reduce((sum, item) => sum + item.units, 0).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Avg Margin</p>
          <p className="text-lg font-semibold text-gray-900">
            {(chartData.reduce((sum, item) => sum + item.margin, 0) / chartData.length).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}