import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Trophy, MapPin, Package } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';

interface RankedItem {
  id: string;
  label: string;
  value: number;
  delta?: number;
  metadata?: Record<string, any>;
  imageUrl?: string;
}

interface RankedListProps {
  title: string;
  subtitle?: string;
  items: RankedItem[];
  type?: 'product' | 'region' | 'customer' | 'generic';
  valueFormat?: 'currency' | 'number' | 'percentage';
  showRankBadge?: boolean;
  maxItems?: number;
  onItemClick?: (item: RankedItem) => void;
  loading?: boolean;
  error?: Error;
  className?: string;
  testId?: string;
  updatedAt?: Date;
}

const RankedList: React.FC<RankedListProps> = ({
  title,
  subtitle,
  items,
  type = 'generic',
  valueFormat = 'number',
  showRankBadge = true,
  maxItems = 5,
  onItemClick,
  loading = false,
  error,
  className = '',
  testId,
  updatedAt
}) => {
  // Get icon based on type
  const getTypeIcon = () => {
    switch (type) {
      case 'product':
        return Package;
      case 'region':
        return MapPin;
      case 'customer':
        return Trophy;
      default:
        return Trophy;
    }
  };

  const TypeIcon = getTypeIcon();

  // Format value based on format type
  const formatValue = (value: number) => {
    switch (valueFormat) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      case 'number':
      default:
        return formatNumber(value);
    }
  };

  // Get trend indicator
  const getTrendIndicator = (delta?: number) => {
    if (!delta || delta === 0) {
      return <Minus className="w-3 h-3 text-gray-400" />;
    }
    
    const isPositive = delta > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'text-emerald-600' : 'text-red-600';
    const symbol = isPositive ? '▲' : '▼';
    
    return (
      <div className={`flex items-center space-x-phi-xs ${color}`}>
        <span className="text-xs-phi font-medium">
          {symbol} {Math.abs(delta).toFixed(1)}%
        </span>
      </div>
    );
  };

  // Get rank badge color
  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white';
      case 2:
        return 'bg-gradient-to-br from-gray-300 to-gray-400 text-white';
      case 3:
        return 'bg-gradient-to-br from-orange-400 to-orange-500 text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`p-phi-lg bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
        <div className="animate-pulse">
          <div className="h-5 w-32 bg-gray-200 rounded mb-phi" />
          {[...Array(maxItems)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-phi-sm border-b border-gray-100 last:border-0">
              <div className="flex items-center space-x-phi-sm">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
              <div className="h-5 w-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`p-phi-lg bg-white rounded-xl shadow-sm border border-red-200 ${className}`}>
        <div className="text-red-600">
          <TypeIcon className="w-5 h-5 mb-phi-sm" />
          <p className="text-sm-phi font-medium">Error loading list</p>
          <p className="text-xs-phi text-red-500 mt-phi-xs">{error.message}</p>
        </div>
      </div>
    );
  }

  // Empty state - Rule #16
  if (items.length === 0) {
    return (
      <div className={`p-phi-lg bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
        <div className="text-center py-phi-xl">
          <TypeIcon className="w-12 h-12 text-gray-300 mx-auto mb-phi-sm" />
          <p className="text-gray-500 text-sm-phi">No data available</p>
        </div>
      </div>
    );
  }

  // Rule #11: Sort by value descending and limit to maxItems
  const sortedItems = [...items]
    .sort((a, b) => b.value - a.value)
    .slice(0, maxItems);

  return (
    <motion.div
      className={`p-phi-lg bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}
      data-testid={testId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Header - Rule #11: Quantify top N */}
      <div className="flex items-center justify-between mb-phi">
        <div>
          <h3 className="text-lg-phi font-semibold text-gray-900">
            {title} {maxItems < items.length && `(Top ${maxItems})`}
          </h3>
          {subtitle && (
            <p className="text-sm-phi text-gray-600 mt-phi-xs">{subtitle}</p>
          )}
        </div>
        <TypeIcon className="w-5 h-5 text-gray-400" />
      </div>

      {/* List items */}
      <div className="space-y-phi-xs">
        {sortedItems.map((item, index) => (
          <motion.div
            key={item.id}
            className={`flex items-center justify-between py-phi-sm px-phi-sm -mx-phi-sm rounded-lg hover:bg-gray-50 transition-colors ${
              onItemClick ? 'cursor-pointer' : ''
            }`}
            onClick={() => onItemClick?.(item)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={onItemClick ? { x: 4 } : {}}
          >
            <div className="flex items-center space-x-phi-sm min-w-0">
              {/* Rank badge */}
              {showRankBadge && (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getRankBadgeColor(
                    index + 1
                  )}`}
                >
                  {index + 1}
                </div>
              )}
              
              {/* Item image if available */}
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.label}
                  className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                />
              )}
              
              {/* Label - Rule #2: Left-aligned text */}
              <span className="text-sm-phi font-medium text-gray-900 truncate">
                {item.label}
              </span>
            </div>

            {/* Value and trend - Rule #2: Right-aligned numbers */}
            <div className="flex items-center space-x-phi-sm flex-shrink-0">
              <span className="text-sm-phi font-semibold text-gray-900 tabular-nums text-right">
                {formatValue(item.value)}
              </span>
              {getTrendIndicator(item.delta)}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Show more indicator */}
      {items.length > maxItems && (
        <div className="mt-phi pt-phi border-t border-gray-100">
          <p className="text-xs-phi text-gray-500 text-center">
            Showing top {maxItems} of {items.length} items
          </p>
        </div>
      )}

      {/* Last updated timestamp - Rule #17 */}
      {updatedAt && (
        <div className="mt-phi pt-phi border-t border-gray-100">
          <p className="text-xs-phi text-gray-500">
            Updated {updatedAt.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              timeZone: 'Asia/Manila'
            })} PHT
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default RankedList;