import React from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TransactionVolumeData {
  hour: string;
  today: number;
  average: number;
  isPeak?: boolean;
}

interface TransactionVolumeChartProps {
  data?: TransactionVolumeData[];
  height?: number;
}

const TransactionVolumeChart: React.FC<TransactionVolumeChartProps> = ({ 
  data, 
  height = 256 
}) => {
  // Generate mock data if not provided
  const chartData = data || Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    today: Math.floor(Math.random() * 20) + 5,
    average: Math.floor(Math.random() * 15) + 8,
    isPeak: i >= 15 && i <= 17 // 3-5 PM peak hours
  }));

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          padding: 16,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context: TooltipItem<'bar'>) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y + ' transactions';
            }
            return label;
          },
          afterLabel: function(context: TooltipItem<'bar'>) {
            const dataIndex = context.dataIndex;
            const isPeak = chartData[dataIndex].isPeak;
            if (isPeak) {
              return '🔥 Peak Hour';
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          callback: function(value: any, index: number) {
            // Show every 3rd hour
            return index % 3 === 0 ? chartData[index].hour : '';
          },
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };

  const formattedData = {
    labels: chartData.map(d => d.hour),
    datasets: [
      {
        label: 'Today',
        data: chartData.map(d => d.today),
        backgroundColor: chartData.map(d => 
          d.isPeak ? 'rgba(251, 146, 60, 0.8)' : 'rgba(99, 102, 241, 0.8)'
        ),
        borderColor: chartData.map(d => 
          d.isPeak ? 'rgba(251, 146, 60, 1)' : 'rgba(99, 102, 241, 1)'
        ),
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.8
      },
      {
        label: 'Average',
        data: chartData.map(d => d.average),
        backgroundColor: 'rgba(156, 163, 175, 0.3)',
        borderColor: 'rgba(156, 163, 175, 0.8)',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.8
      }
    ]
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={{ height }}
      className="w-full"
    >
      <Bar options={options} data={formattedData} />
    </motion.div>
  );
};

export default TransactionVolumeChart;