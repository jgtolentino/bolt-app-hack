import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  delta?: number;
  valueFormat?: 'currency' | 'number' | 'percentage' | 'raw';
  loading?: boolean;
  error?: Error;
  className?: string;
  testId?: string;
  updatedAt?: Date;
  onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({
  icon: Icon,
  label,
  value,
  delta,
  valueFormat = 'number',
  loading = false,
  error,
  className = '',
  testId,
  updatedAt,
  onClick
}) => {
  // Format value based on type
  const formatValue = () => {
    if (typeof value === 'string') return value;
    
    switch (valueFormat) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      case 'number':
        return formatNumber(value);
      case 'raw':
      default:
        return value.toString();
    }
  };

  // Determine trend color and icon
  const getTrendDetails = () => {
    if (!delta || delta === 0) return null;
    
    const isPositive = delta > 0;
    const color = isPositive ? 'text-emerald-600' : 'text-red-600';
    const bgColor = isPositive ? 'bg-emerald-50' : 'bg-red-50';
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const symbol = isPositive ? '▲' : '▼';
    
    return { color, bgColor, Icon, symbol };
  };

  const trend = getTrendDetails();

  // Loading state
  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
        <div className="animate-pulse">
          <div className="w-10 h-10 bg-gray-200 rounded-lg mb-4" />
          <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-8 w-32 bg-gray-300 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`p-6 bg-white rounded-xl shadow-sm border border-red-200 ${className}`}>
        <div className="text-red-600">
          <Icon className="w-5 h-5 mb-2" />
          <p className="text-sm font-medium">Error loading data</p>
          <p className="text-xs text-red-500 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`p-phi-md bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      data-testid={testId}
      onClick={onClick}
      whileHover={onClick ? { y: -2 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
    >
      {/* Icon and Label - Rule #3: 2-level hierarchy */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-600">{label}</h3>
        </div>
      </div>

      {/* Value - Rule #2: Right-aligned numbers */}
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-semibold text-gray-900 tabular-nums">
          {formatValue()}
        </p>
        
        {/* Delta with color and symbol - Rule #10 */}
        {trend && delta !== undefined && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${trend.bgColor}`}>
            <span className={`text-xs font-medium ${trend.color}`}>
              {trend.symbol} {Math.abs(delta).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Last updated timestamp - Rule #17 */}
      {updatedAt && (
        <p className="text-xs text-gray-500 mt-3">
          Updated {updatedAt.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'Asia/Manila'
          })} PHT
        </p>
      )}
    </motion.div>
  );
};

export default KpiCard;