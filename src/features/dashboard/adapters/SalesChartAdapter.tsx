import React from 'react';
import { LineChart01 } from '../../../template_sync/charts/LineChart01';
import { useOptimizedData } from '../../transactions/hooks/useOptimizedData';

interface SalesChartAdapterProps {
  dateRange?: string;
  height?: number;
  width?: number;
}

export function SalesChartAdapter({ dateRange = 'last7Days', height = 350, width = 595 }: SalesChartAdapterProps) {
  const { data, isLoading } = useOptimizedData.useSalesTrend({ dateRange });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Transform Scout data to Cruip chart format
  const chartData = {
    labels: data?.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) || [],
    datasets: [
      {
        label: 'Sales',
        data: data?.map(d => d.sales) || [],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.08)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: '#4f46e5',
        pointHoverBackgroundColor: '#4f46e5',
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        clip: 20,
      },
    ],
  };

  return <LineChart01 data={chartData} width={width} height={height} />;
}