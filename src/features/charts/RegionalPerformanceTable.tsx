import React, { memo, useState } from 'react';
import { useDashboardData } from '../transactions/hooks/useOptimizedData';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { ChevronUp, ChevronDown, MapPin, TrendingUp, TrendingDown } from 'lucide-react';

interface RegionalPerformanceTableProps {
  dateRange?: string;
  sortBy?: 'revenue' | 'growth' | 'transactions' | 'aov';
}

interface RegionData {
  id: string;
  name: string;
  revenue: number;
  transactions: number;
  aov: number;
  growth: number;
  marketShare: number;
  topStore: string;
}

export function RegionalPerformanceTable({ 
  dateRange = 'last7Days',
  sortBy = 'revenue' 
}: RegionalPerformanceTableProps) {
  const { data, isLoading } = useDashboardData({ dateRange });
  const [sortField, setSortField] = useState(sortBy);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Transform Scout data to regional performance format
  // Mock regional data based on available data
  const regions: RegionData[] = [
    {
      id: '1',
      name: 'NCR - National Capital Region',
      revenue: (data?.totalRevenue || 0) * 0.35,
      transactions: Math.floor((data?.totalTransactions || 0) * 0.35),
      aov: ((data?.totalRevenue || 0) * 0.35) / Math.floor((data?.totalTransactions || 0) * 0.35) || 0,
      growth: 12.5,
      marketShare: 35,
      topStore: 'SM Megamall'
    },
    {
      id: '2',
      name: 'Region IV-A - CALABARZON',
      revenue: (data?.totalRevenue || 0) * 0.18,
      transactions: Math.floor((data?.totalTransactions || 0) * 0.20),
      aov: ((data?.totalRevenue || 0) * 0.18) / Math.floor((data?.totalTransactions || 0) * 0.20) || 0,
      growth: 8.3,
      marketShare: 18,
      topStore: 'Ayala Malls Solenad'
    },
    {
      id: '3',
      name: 'Region III - Central Luzon',
      revenue: (data?.totalRevenue || 0) * 0.15,
      transactions: Math.floor((data?.totalTransactions || 0) * 0.15),
      aov: ((data?.totalRevenue || 0) * 0.15) / Math.floor((data?.totalTransactions || 0) * 0.15) || 0,
      growth: -2.1,
      marketShare: 15,
      topStore: 'SM City Clark'
    },
    {
      id: '4',
      name: 'Region VII - Central Visayas',
      revenue: (data?.totalRevenue || 0) * 0.12,
      transactions: Math.floor((data?.totalTransactions || 0) * 0.10),
      aov: ((data?.totalRevenue || 0) * 0.12) / Math.floor((data?.totalTransactions || 0) * 0.10) || 0,
      growth: 15.7,
      marketShare: 12,
      topStore: 'Ayala Center Cebu'
    },
    {
      id: '5',
      name: 'Region XI - Davao Region',
      revenue: (data?.totalRevenue || 0) * 0.08,
      transactions: Math.floor((data?.totalTransactions || 0) * 0.08),
      aov: ((data?.totalRevenue || 0) * 0.08) / Math.floor((data?.totalTransactions || 0) * 0.08) || 0,
      growth: 22.3,
      marketShare: 8,
      topStore: 'Abreeza Mall'
    }
  ];

  // Sort regions
  const sortedRegions = [...regions].sort((a, b) => {
    const aValue = a[sortField as keyof RegionData] as number;
    const bValue = b[sortField as keyof RegionData] as number;
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (field !== sortField) return null;
    return sortDirection === 'desc' ? 
      <ChevronDown className="w-4 h-4" /> : 
      <ChevronUp className="w-4 h-4" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-500" />
            Regional Performance
          </h3>
          <span className="text-sm text-gray-500">
            {regions.length} regions • {dateRange.replace(/([A-Z])/g, ' $1').trim()}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Region
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('revenue')}
              >
                <div className="flex items-center justify-end gap-1">
                  Revenue
                  <SortIcon field="revenue" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('transactions')}
              >
                <div className="flex items-center justify-end gap-1">
                  Transactions
                  <SortIcon field="transactions" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('aov')}
              >
                <div className="flex items-center justify-end gap-1">
                  AOV
                  <SortIcon field="aov" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('growth')}
              >
                <div className="flex items-center justify-end gap-1">
                  Growth
                  <SortIcon field="growth" />
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Market Share
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Top Store
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedRegions.map((region, index) => (
              <tr key={region.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {region.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      Rank #{index + 1}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(region.revenue)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-900">
                    {formatNumber(region.transactions)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-900">
                    {formatCurrency(region.aov)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`flex items-center justify-end gap-1 text-sm font-medium ${
                    region.growth > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {region.growth > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {Math.abs(region.growth).toFixed(1)}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${region.marketShare}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-10 text-right">
                      {region.marketShare}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {region.topStore}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div className="text-gray-500">Total Revenue</div>
            <div className="font-semibold">{formatCurrency(data?.totalRevenue || 0)}</div>
          </div>
          <div>
            <div className="text-gray-500">Total Transactions</div>
            <div className="font-semibold">{formatNumber(data?.totalTransactions || 0)}</div>
          </div>
          <div>
            <div className="text-gray-500">Avg. Growth</div>
            <div className="font-semibold text-green-600">+10.5%</div>
          </div>
          <div>
            <div className="text-gray-500">Coverage</div>
            <div className="font-semibold">5 of 18 regions</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(RegionalPerformanceTable);