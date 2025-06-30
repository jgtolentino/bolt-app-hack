import React, { memo } from 'react';
import { useDashboardData } from '../../features/transactions/hooks/useOptimizedData';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { TrendingUp, TrendingDown, Package, Users, DollarSign, Activity } from 'lucide-react';

interface BrandKpiCardProps {
  brandId?: string;
  dateRange?: string;
  className?: string;
}

interface KpiMetric {
  label: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
}

export function BrandKpiCard({ brandId, dateRange = 'last7Days', className = '' }: BrandKpiCardProps) {
  const { data, isLoading } = useDashboardData({ dateRange });

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Transform Scout data to brand KPI format
  const brandName = brandId || 'All Brands';
  const topBrand = data?.topProducts?.[0];
  
  const kpiMetrics: KpiMetric[] = [
    {
      label: 'Revenue',
      value: formatCurrency(topBrand?.value || 0),
      change: 12.5,
      icon: DollarSign,
      color: 'text-blue-600'
    },
    {
      label: 'Units Sold',
      value: formatNumber(Math.floor((topBrand?.value || 0) / 150)), // Mock calculation
      change: 8.2,
      icon: Package,
      color: 'text-green-600'
    },
    {
      label: 'Active Customers',
      value: formatNumber(data?.totalCustomers || 0),
      change: -2.1,
      icon: Users,
      color: 'text-purple-600'
    },
    {
      label: 'Avg Order Value',
      value: formatCurrency(data?.avgOrderValue || 0),
      change: 5.7,
      icon: Activity,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{brandName}</h3>
        <p className="text-sm text-gray-500">Key performance indicators</p>
      </div>

      <div className="space-y-4">
        {kpiMetrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gray-50 ${metric.color}`}>
                <metric.icon className="w-4 h-4" />
              </div>
              <span className="text-sm text-gray-600">{metric.label}</span>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">{metric.value}</div>
              <div className={`flex items-center justify-end gap-1 text-sm ${
                metric.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{Math.abs(metric.change)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Market Share</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                style={{ width: '35%' }}
              />
            </div>
            <span className="font-medium text-gray-700">35%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(BrandKpiCard);