import React from 'react';
import { DashboardCard01 } from '../../../template_sync/partials/dashboard/DashboardCard01';
import { DashboardCard02 } from '../../../template_sync/partials/dashboard/DashboardCard02';
import { DashboardCard03 } from '../../../template_sync/partials/dashboard/DashboardCard03';
import { useDashboardData } from '../../transactions/hooks/useOptimizedData';
import { formatCurrency, formatNumber } from '../../../utils/formatters';

interface KpiCardsAdapterProps {
  dateRange?: string;
}

export function KpiCardsAdapter({ dateRange = 'last7Days' }: KpiCardsAdapterProps) {
  const { data, isLoading } = useDashboardData({ dateRange });

  if (isLoading) {
    return (
      <div className="grid grid-cols-12 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="col-span-3 animate-pulse">
            <div className="bg-gray-200 rounded-lg h-32"></div>
          </div>
        ))}
      </div>
    );
  }

  const kpiData = data?.kpiMetrics || {};

  // Transform Scout KPI data for Cruip cards
  const salesData = {
    labels: ['Sales'],
    datasets: [
      {
        label: 'Current',
        data: [kpiData.totalSales?.value || 0],
        backgroundColor: '#4f46e5',
        hoverBackgroundColor: '#6366f1',
        barPercentage: 0.7,
        categoryPercentage: 0.7,
      },
      {
        label: 'Previous',
        data: [kpiData.totalSales?.value * 0.85 || 0], // Mock previous period
        backgroundColor: '#e5e7eb',
        hoverBackgroundColor: '#d1d5db',
        barPercentage: 0.7,
        categoryPercentage: 0.7,
      },
    ],
  };

  const transactionData = {
    labels: ['Transactions'],
    datasets: [
      {
        label: 'Current',
        data: [kpiData.totalTransactions?.value || 0],
        backgroundColor: '#10b981',
        hoverBackgroundColor: '#34d399',
        barPercentage: 0.7,
        categoryPercentage: 0.7,
      },
      {
        label: 'Previous',
        data: [kpiData.totalTransactions?.value * 0.9 || 0],
        backgroundColor: '#e5e7eb',
        hoverBackgroundColor: '#d1d5db',
        barPercentage: 0.7,
        categoryPercentage: 0.7,
      },
    ],
  };

  return (
    <>
      {/* Total Sales */}
      <DashboardCard01 
        title="Total Sales"
        value={formatCurrency(kpiData.totalSales?.value || 0)}
        change={kpiData.totalSales?.change}
        chartData={salesData}
      />

      {/* Total Transactions */}
      <DashboardCard02
        title="Total Transactions"
        value={formatNumber(kpiData.totalTransactions?.value || 0)}
        change={kpiData.totalTransactions?.change}
        chartData={transactionData}
      />

      {/* Average Basket Size */}
      <DashboardCard03
        title="Avg Basket Size"
        value={formatCurrency(kpiData.avgBasketSize?.value || 0)}
        change={kpiData.avgBasketSize?.change}
      />

      {/* Conversion Rate */}
      <DashboardCard01
        title="Conversion Rate"
        value={`${kpiData.conversionRate?.value || 0}%`}
        change={kpiData.conversionRate?.change}
        chartData={salesData}
      />
    </>
  );
}