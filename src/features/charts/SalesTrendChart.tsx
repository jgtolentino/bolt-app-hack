import React, { useEffect, useRef, memo } from 'react';
import { useDashboardData } from '../transactions/hooks/useOptimizedData';
import { formatCurrency } from '../../utils/formatters';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SalesTrendChartProps {
  dateRange?: string;
  storeId?: string;
  categoryId?: string;
  height?: number;
  showVolume?: boolean;
}

export function SalesTrendChart({ 
  dateRange = 'last30Days', 
  storeId,
  categoryId,
  height = 400,
  showVolume = false 
}: SalesTrendChartProps) {
  const { data, isLoading } = useDashboardData({ dateRange, store: storeId });

  if (isLoading) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Transform Scout data to chart format
  const salesByDay = data?.salesByDate || [];
  const labels = salesByDay.map(d => new Date(d.date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  }));
  
  const salesData = salesByDay.map(d => d.sales);
  const volumeData = salesByDay.map(d => d.transactions || 0);

  // Calculate moving average
  const movingAverage = salesData.map((_, index) => {
    const start = Math.max(0, index - 6);
    const subset = salesData.slice(start, index + 1);
    return subset.reduce((a, b) => a + b, 0) / subset.length;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Daily Sales',
        data: salesData,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.1,
        fill: true
      },
      {
        label: '7-Day Moving Avg',
        data: movingAverage,
        borderColor: '#10b981',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0.3,
        fill: false
      }
    ]
  };

  if (showVolume) {
    chartData.datasets.push({
      label: 'Transaction Volume',
      data: volumeData,
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      borderWidth: 2,
      pointRadius: 3,
      yAxisID: 'y1',
      fill: true
    } as any);
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 16,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label.includes('Sales') || label.includes('Avg')) {
              return `${label}: ${formatCurrency(value)}`;
            }
            return `${label}: ${value.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          drawBorder: false,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          maxTicksLimit: 10,
          font: {
            size: 11
          }
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          display: true,
          drawBorder: false,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value, true);
          },
          font: {
            size: 11
          }
        }
      },
      ...(showVolume && {
        y1: {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            font: {
              size: 11
            }
          }
        }
      })
    }
  };

  return (
    <div style={{ height, position: 'relative' }}>
      <Line data={chartData} options={options} />
      
      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-gray-500">Period Total</div>
          <div className="font-semibold text-lg">
            {formatCurrency(salesData.reduce((a, b) => a + b, 0))}
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-gray-500">Daily Average</div>
          <div className="font-semibold text-lg">
            {formatCurrency(salesData.reduce((a, b) => a + b, 0) / salesData.length)}
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-gray-500">Peak Day</div>
          <div className="font-semibold text-lg">
            {formatCurrency(Math.max(...salesData))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(SalesTrendChart);