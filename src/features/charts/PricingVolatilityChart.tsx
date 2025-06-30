import React, { memo } from 'react';
import { useDashboardData } from '../transactions/hooks/useOptimizedData';
import { formatCurrency } from '../../utils/formatters';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PricingVolatilityChartProps {
  productId?: string;
  dateRange?: string;
  height?: number;
}

interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function PricingVolatilityChart({ 
  productId, 
  dateRange = 'last30Days', 
  height = 400 
}: PricingVolatilityChartProps) {
  const { data, isLoading } = useDashboardData({ dateRange });

  if (isLoading) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Transform Scout data to candlestick-like format
  // In real retail, this could be daily price ranges across stores
  const salesByDay = data?.salesByDate || [];
  
  const priceData: PricePoint[] = salesByDay.map((day, index) => {
    // Simulate price volatility based on sales volume
    const avgPrice = day.sales / (day.transactions || 1);
    const volatility = 0.1 + (Math.random() * 0.1); // 10-20% volatility
    
    return {
      date: day.date,
      open: avgPrice * (1 - volatility * 0.5),
      high: avgPrice * (1 + volatility),
      low: avgPrice * (1 - volatility),
      close: avgPrice * (1 + volatility * 0.5),
      volume: day.transactions || 0
    };
  });

  const labels = priceData.map(p => new Date(p.date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  }));

  // Create candlestick-style data
  const candleData = priceData.map(p => ({
    x: p.date,
    y: [p.open, p.high, p.low, p.close]
  }));

  // Calculate price volatility metrics
  const volatilityMetrics = priceData.map(p => {
    const range = p.high - p.low;
    const midpoint = (p.high + p.low) / 2;
    return (range / midpoint) * 100; // Percentage volatility
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Price Range',
        data: priceData.map(p => [p.low, p.high]),
        backgroundColor: priceData.map(p => 
          p.close > p.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'
        ),
        borderColor: priceData.map(p => 
          p.close > p.open ? '#10b981' : '#ef4444'
        ),
        borderWidth: 1,
        barPercentage: 0.8
      },
      {
        label: 'Volatility %',
        data: volatilityMetrics,
        type: 'line' as const,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        pointRadius: 3,
        yAxisID: 'y1',
        fill: true
      }
    ]
  };

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
          padding: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            if (label === 'Price Range') {
              const [low, high] = context.parsed.y;
              const data = priceData[context.dataIndex];
              return [
                `Open: ${formatCurrency(data.open)}`,
                `High: ${formatCurrency(high)}`,
                `Low: ${formatCurrency(low)}`,
                `Close: ${formatCurrency(data.close)}`,
                `Volume: ${data.volume.toLocaleString()}`
              ];
            }
            return `${label}: ${context.parsed.y.toFixed(1)}%`;
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
          maxTicksLimit: 10
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
            return formatCurrency(value);
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value: any) {
            return value.toFixed(0) + '%';
          }
        }
      }
    }
  };

  // Calculate summary statistics
  const avgVolatility = volatilityMetrics.reduce((a, b) => a + b, 0) / volatilityMetrics.length;
  const maxVolatility = Math.max(...volatilityMetrics);
  const minVolatility = Math.min(...volatilityMetrics);

  return (
    <div>
      <div style={{ height, position: 'relative' }}>
        <Bar data={chartData} options={options} />
      </div>
      
      {/* Volatility Summary */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Price Volatility Analysis</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Average</div>
            <div className="font-semibold text-lg text-orange-600">
              {avgVolatility.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-gray-500">Maximum</div>
            <div className="font-semibold text-lg text-red-600">
              {maxVolatility.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-gray-500">Minimum</div>
            <div className="font-semibold text-lg text-green-600">
              {minVolatility.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PricingVolatilityChart);