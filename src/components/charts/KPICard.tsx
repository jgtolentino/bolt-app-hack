import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  ShoppingCart, 
  Store,
  ArrowUp,
  ArrowDown,
  Minus,
  Banknote
} from 'lucide-react';
import { KPIMetric } from '../../types';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';

interface KPICardProps {
  metric: KPIMetric;
  index: number;
  onClick?: () => void;
}

const iconMap = {
  TrendingUp,
  Receipt,
  ShoppingCart,
  Store,
  Banknote,
};

const KPICard: React.FC<KPICardProps> = ({ metric, index, onClick }) => {
  const Icon = iconMap[metric.icon as keyof typeof iconMap] || TrendingUp;
  
  const formatValue = (value: string | number, format: string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    switch (format) {
      case 'currency':
        return formatCurrency(numValue);
      case 'percentage':
        return formatPercentage(numValue);
      default:
        return formatNumber(numValue);
    }
  };

  const getChangeIcon = () => {
    if (metric.changeType === 'increase') return ArrowUp;
    if (metric.changeType === 'decrease') return ArrowDown;
    return Minus;
  };

  const getChangeColor = () => {
    if (metric.changeType === 'increase') return 'text-success-600';
    if (metric.changeType === 'decrease') return 'text-error-600';
    return 'text-gray-500';
  };

  const ChangeIcon = getChangeIcon();

  return (
    <motion.div
      className="metric-card cursor-pointer group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{metric.title}</h3>
            <div className={`flex items-center space-x-1 text-sm ${getChangeColor()}`}>
              <ChangeIcon className="w-4 h-4" />
              <span>{Math.abs(metric.change)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Value */}
      <div className="mb-4">
        <div className="text-2xl font-bold text-gray-900">
          {formatValue(metric.value, metric.format)}
        </div>
      </div>

      {/* Trend Sparkline */}
      {metric.trend && Array.isArray(metric.trend) && (
        <div className="h-8 flex items-end space-x-1">
          {metric.trend.map((value, i) => {
            const height = (value / Math.max(...metric.trend!)) * 100;
            return (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-primary-200 to-primary-400 rounded-sm transition-all duration-300 group-hover:from-primary-300 group-hover:to-primary-500"
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
      )}

      {/* Hover effect indicator */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
    </motion.div>
  );
};

export default KPICard;