/**
 * Scout Dash 2.0 - KPI Card Component
 * Key Performance Indicator cards with trends and comparisons
 */

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Target, AlertCircle } from 'lucide-react';
import { VisualComponentProps } from '../VisualRegistry';

interface KPICardProps extends VisualComponentProps {
  variant?: 'card' | 'gauge' | 'trend';
  showTrend?: boolean;
  showComparison?: boolean;
  comparisonPeriod?: string;
}

interface KPIData {
  value: number;
  label: string;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    percentage: number;
    period: string;
  };
  target?: number;
  status?: 'good' | 'warning' | 'critical';
  format?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  data,
  width,
  height,
  blueprint,
  theme,
  onSelection,
  onHover,
  selectedData = [],
  hoveredData,
  interactive = true,
  variant = 'card',
  showTrend = true,
  showComparison = false,
  comparisonPeriod = 'previous'
}) => {
  const kpiData: KPIData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        value: 0,
        label: 'No Data',
        status: 'critical'
      };
    }
    
    const textField = blueprint.encoding.text?.field;
    if (!textField) {
      return {
        value: 0,
        label: 'Invalid Configuration',
        status: 'critical'
      };
    }

    // Calculate main value
    let value = 0;
    if (blueprint.encoding.text?.aggregate === 'sum') {
      value = data.reduce((sum, row) => sum + (Number(row[textField]) || 0), 0);
    } else if (blueprint.encoding.text?.aggregate === 'avg') {
      const validValues = data.filter(row => row[textField] != null).map(row => Number(row[textField]));
      value = validValues.length > 0 ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length : 0;
    } else if (blueprint.encoding.text?.aggregate === 'count') {
      value = data.length;
    } else if (blueprint.encoding.text?.aggregate === 'max') {
      value = Math.max(...data.map(row => Number(row[textField]) || 0));
    } else if (blueprint.encoding.text?.aggregate === 'min') {
      value = Math.min(...data.map(row => Number(row[textField]) || 0));
    } else {
      // Single value
      value = Number(data[0][textField]) || 0;
    }

    // Calculate trend if comparison data is available
    let trend: KPIData['trend'] | undefined;
    if (showTrend && data.length > 1) {
      // Simple trend calculation - compare first half vs second half
      const midpoint = Math.floor(data.length / 2);
      const firstHalf = data.slice(0, midpoint);
      const secondHalf = data.slice(midpoint);
      
      const firstValue = firstHalf.reduce((sum, row) => sum + (Number(row[textField]) || 0), 0) / firstHalf.length;
      const secondValue = secondHalf.reduce((sum, row) => sum + (Number(row[textField]) || 0), 0) / secondHalf.length;
      
      if (firstValue !== 0) {
        const percentage = ((secondValue - firstValue) / firstValue) * 100;
        trend = {
          direction: percentage > 1 ? 'up' : percentage < -1 ? 'down' : 'flat',
          percentage: Math.abs(percentage),
          period: comparisonPeriod
        };
      }
    }

    // Determine status based on trend or thresholds
    let status: KPIData['status'] = 'good';
    if (trend) {
      if (trend.direction === 'down' && trend.percentage > 10) {
        status = 'critical';
      } else if (trend.direction === 'down' && trend.percentage > 5) {
        status = 'warning';
      }
    }

    return {
      value,
      label: blueprint.title || textField,
      trend,
      status,
      format: blueprint.encoding.text?.format || 'number'
    };
  }, [data, blueprint, showTrend, comparisonPeriod]);

  const formatValue = (value: number, format?: string): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-PH', { 
          style: 'currency', 
          currency: 'PHP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      
      case 'percent':
        return new Intl.NumberFormat('en-US', { 
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }).format(value / 100);
      
      case 'number':
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}K`;
        }
        return new Intl.NumberFormat('en-US').format(value);
      
      default:
        return value.toLocaleString();
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'good':
        return theme?.colors.primary || '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'critical':
        return '#ef4444';
      default:
        return theme?.colors.secondary || '#64748b';
    }
  };

  const getTrendIcon = (direction?: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      case 'flat':
        return <Minus className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTrendColor = (direction?: string) => {
    switch (direction) {
      case 'up':
        return '#10b981';
      case 'down':
        return '#ef4444';
      case 'flat':
        return '#64748b';
      default:
        return theme?.colors.text || '#1e293b';
    }
  };

  const handleCardClick = () => {
    if (!interactive) return;
    
    const field = blueprint.encoding.text?.field || '';
    onSelection?.(field, data);
  };

  const handleCardHover = () => {
    if (!interactive) return;
    onHover?.(kpiData);
  };

  if (variant === 'gauge') {
    // Gauge variant (simplified)
    const gaugeValue = kpiData.target ? (kpiData.value / kpiData.target) * 100 : 50;
    const angle = (gaugeValue / 100) * 180 - 90;
    const centerX = width / 2;
    const centerY = height * 0.7;
    const radius = Math.min(width, height) / 3;

    return (
      <div className="relative w-full h-full">
        <svg width={width} height={height} className="overflow-visible">
          {/* Gauge background */}
          <path
            d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
            fill="none"
            stroke={theme?.colors.grid || '#f1f5f9'}
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Gauge foreground */}
          <path
            d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius * Math.cos((angle * Math.PI) / 180)} ${centerY + radius * Math.sin((angle * Math.PI) / 180)}`}
            fill="none"
            stroke={getStatusColor(kpiData.status)}
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Center text */}
          <text
            x={centerX}
            y={centerY - 10}
            textAnchor="middle"
            fontSize="24"
            fontWeight="bold"
            fill={theme?.colors.text || '#1e293b'}
          >
            {formatValue(kpiData.value, kpiData.format)}
          </text>
          
          <text
            x={centerX}
            y={centerY + 15}
            textAnchor="middle"
            fontSize="12"
            fill={theme?.colors.secondary || '#64748b'}
          >
            {kpiData.label}
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full h-full p-4 rounded-lg border transition-all duration-200 ${
        interactive ? 'cursor-pointer hover:shadow-md' : ''
      } ${
        theme?.colors.background === '#1e293b' ? 
          'bg-gray-800 border-gray-700 text-gray-100' : 
          'bg-white border-gray-200 text-gray-900'
      }`}
      style={{ width, height }}
      onClick={handleCardClick}
      onMouseEnter={handleCardHover}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Status indicator */}
      <div 
        className="absolute top-2 right-2 w-3 h-3 rounded-full"
        style={{ backgroundColor: getStatusColor(kpiData.status) }}
      />

      {/* Main content */}
      <div className="flex flex-col justify-center h-full">
        {/* Value */}
        <div className="text-center mb-2">
          <div 
            className="text-3xl font-bold mb-1"
            style={{ color: getStatusColor(kpiData.status) }}
          >
            {formatValue(kpiData.value, kpiData.format)}
          </div>
          
          {/* Label */}
          <div className="text-sm font-medium opacity-75">
            {kpiData.label}
          </div>
        </div>

        {/* Trend */}
        {showTrend && kpiData.trend && (
          <div className="flex items-center justify-center space-x-2 text-sm">
            <span style={{ color: getTrendColor(kpiData.trend.direction) }}>
              {getTrendIcon(kpiData.trend.direction)}
            </span>
            <span style={{ color: getTrendColor(kpiData.trend.direction) }}>
              {kpiData.trend.percentage.toFixed(1)}%
            </span>
            <span className="opacity-60 text-xs">
              vs {kpiData.trend.period}
            </span>
          </div>
        )}

        {/* Target comparison */}
        {kpiData.target && (
          <div className="mt-2 text-center text-xs opacity-60">
            Target: {formatValue(kpiData.target, kpiData.format)}
          </div>
        )}
      </div>

      {/* Trend variant - mini chart */}
      {variant === 'trend' && data.length > 1 && (
        <div className="absolute bottom-2 right-2 w-16 h-8">
          <svg width="64" height="32" className="overflow-visible">
            {data.slice(-10).map((_, index, arr) => {
              if (index === 0) return null;
              
              const x1 = (index - 1) * (64 / (arr.length - 1));
              const x2 = index * (64 / (arr.length - 1));
              const y1 = 24 - (Math.random() * 16); // Simplified trend line
              const y2 = 24 - (Math.random() * 16);
              
              return (
                <line
                  key={index}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={getStatusColor(kpiData.status)}
                  strokeWidth="1.5"
                  opacity="0.6"
                />
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};

export default KPICard;