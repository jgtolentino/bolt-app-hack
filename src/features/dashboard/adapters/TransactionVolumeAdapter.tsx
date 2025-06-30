import React from 'react';
import BarChart01 from '../../../template_sync/charts/BarChart01';
import { useDashboardData } from '../../transactions/hooks/useOptimizedData';

interface TransactionVolumeAdapterProps {
  dateRange?: string;
  height?: number;
  width?: number;
}

export function TransactionVolumeAdapter({ dateRange = 'last7Days', height = 350, width = 595 }: TransactionVolumeAdapterProps) {
  const { data, isLoading } = useDashboardData({ dateRange });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Transform Scout data to Cruip chart format
  const hourlyData = data?.hourlyTransactions || [];
  const chartData = {
    labels: hourlyData.map(d => {
      const hour = parseInt(d.hour);
      return hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
    }),
    datasets: [
      {
        label: 'Transactions',
        data: hourlyData.map(d => d.count),
        backgroundColor: '#6366f1',
        hoverBackgroundColor: '#4f46e5',
        barPercentage: 0.7,
        categoryPercentage: 0.7,
        borderRadius: 4,
      },
    ],
  };

  return <BarChart01 data={chartData} width={width} height={height} />;
}