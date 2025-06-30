import React, { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import useBrandPerf from '../../../hooks/useBrandPerf';
import EmptyState from '../../EmptyState';
import { exportCSV } from '../../../utils/exportCSV';
import { formatCurrencyCompact } from '../../../utils/formatters';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function BrandTab() {
  const { data, isLoading } = useBrandPerf();

  useEffect(() => {
    const handleExport = () => {
      if (data && data.length > 0) {
        exportCSV(data, 'brand_performance.csv');
      }
    };
    
    window.addEventListener('pp-export', handleExport);
    return () => window.removeEventListener('pp-export', handleExport);
  }, [data]);

  if (isLoading) return <EmptyState msg="Loading..." />;
  if (!data || data.length === 0) return <EmptyState />;

  // Take top 10 brands and format data
  const chartData = data.slice(0, 10).map(item => ({
    ...item,
    sales: Number(item.sales) || 0,
    units: Number(item.units) || 0
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-blue-600">
            Sales: {formatCurrencyCompact(payload[0].value)}
          </p>
          <p className="text-sm text-gray-600">
            Units: {payload[0].payload.units.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Top 10 Brands by Sales</h3>
        <div className="text-sm text-gray-500">
          Total Brands: {data.length}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 120 }}>
          <XAxis 
            dataKey="brand" 
            angle={-45}
            textAnchor="end"
            height={140}
            tick={{ fontSize: 11 }}
            interval={0}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={formatCurrencyCompact}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="sales" name="Sales ₱" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Brand list table */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">All Brands</h4>
        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Units
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((brand, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {brand.brand}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrencyCompact(brand.sales)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {Number(brand.units).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}