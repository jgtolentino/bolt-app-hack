import React, { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import useMixPerf from '../../../hooks/useMixPerf';
import EmptyState from '../../EmptyState';
import { exportCSV } from '../../../utils/exportCSV';
import { formatCurrencyCompact } from '../../../utils/formatters';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function MixTab() {
  const { data, isLoading } = useMixPerf();

  useEffect(() => {
    const handleExport = () => {
      if (data && data.length > 0) {
        exportCSV(data, 'product_mix.csv');
      }
    };
    
    window.addEventListener('pp-export', handleExport);
    return () => window.removeEventListener('pp-export', handleExport);
  }, [data]);

  if (isLoading) return <EmptyState msg="Loading..." />;
  if (!data || data.length === 0) return <EmptyState />;

  // Format data for chart
  const chartData = data.map(item => ({
    name: item.category,
    value: Number(item.sales) || 0,
    share: Number(item.share) * 100 || 0
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{payload[0].payload.name}</p>
          <p className="text-sm text-blue-600">
            Sales: {formatCurrencyCompact(payload[0].payload.value)}
          </p>
          <p className="text-sm text-gray-600">
            Share: {payload[0].value.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Product Mix by Category</h3>
        <div className="text-sm text-gray-500">
          Total Sales: {formatCurrencyCompact(chartData.reduce((sum, item) => sum + item.value, 0))}
        </div>
      </div>

      <div className="space-y-6">
        {/* Horizontal Bar Chart for Share */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Market Share by Category</h4>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart 
              data={chartData} 
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
            >
              <XAxis 
                type="number" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="share" name="Share %" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown table */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Category Breakdown</h4>
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Share %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        {item.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrencyCompact(item.sales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-full max-w-[100px] bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full" 
                            style={{ 
                              width: `${Number(item.share) * 100}%`,
                              backgroundColor: COLORS[idx % COLORS.length]
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {(Number(item.share) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}