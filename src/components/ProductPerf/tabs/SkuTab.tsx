import React, { useEffect } from 'react';
import useSkuPerf from '../../../hooks/useSkuPerf';
import EmptyState from '../../EmptyState';
import { exportCSV } from '../../../utils/exportCSV';
import { formatCurrencyCompact } from '../../../utils/formatters';

export default function SkuTab() {
  const { data, isLoading } = useSkuPerf();

  useEffect(() => {
    const handleExport = () => {
      if (data && data.length > 0) {
        exportCSV(data, 'sku_performance.csv');
      }
    };
    
    window.addEventListener('pp-export', handleExport);
    return () => window.removeEventListener('pp-export', handleExport);
  }, [data]);

  if (isLoading) return <EmptyState msg="Loading..." />;
  if (!data || data.length === 0) return <EmptyState />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Top 50 SKUs by Sales</h3>
        <div className="text-sm text-gray-500">
          Showing top {data.length} SKUs
        </div>
      </div>

      {/* SKU table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Units
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sales
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Price
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((sku, idx) => {
              const avgPrice = Number(sku.units) > 0 ? Number(sku.sales) / Number(sku.units) : 0;
              return (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {sku.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sku.brand}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${sku.category === 'Beverage' ? 'bg-blue-100 text-blue-800' :
                        sku.category === 'Food' ? 'bg-green-100 text-green-800' :
                        sku.category === 'Personal Care' ? 'bg-purple-100 text-purple-800' :
                        sku.category === 'Tobacco' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {sku.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {Number(sku.units).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                    {formatCurrencyCompact(sku.sales)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ₱{avgPrice.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 pt-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Sales</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrencyCompact(data.reduce((sum, item) => sum + Number(item.sales), 0))}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Units</p>
          <p className="text-lg font-semibold text-gray-900">
            {data.reduce((sum, item) => sum + Number(item.units), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Average Price</p>
          <p className="text-lg font-semibold text-gray-900">
            ₱{(data.reduce((sum, item) => sum + Number(item.sales), 0) / 
               data.reduce((sum, item) => sum + Number(item.units), 0)).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}