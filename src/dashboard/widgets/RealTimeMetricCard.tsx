/**
 * Scout Dash 2.0 - Real-Time Metric Card
 * Live updating metric display with streaming data support
 * Inspired by retail-insights-dashboard-ph
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  AlertCircle,
  Zap,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';

export interface RealTimeMetricCardProps {
  title: string;
  metric: string;
  value: number;
  target?: number;
  unit?: string;
  format?: 'number' | 'currency' | 'percentage';
  precision?: number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  trendPeriod?: string;
  isLive?: boolean;
  updateInterval?: number; // milliseconds
  onDataUpdate?: () => Promise<number>;
  sparklineData?: number[];
  status?: 'normal' | 'warning' | 'critical' | 'success';
  threshold?: {
    warning: number;
    critical: number;
  };
  className?: string;
}

interface HistoryPoint {
  value: number;
  timestamp: Date;
}

export const RealTimeMetricCard: React.FC<RealTimeMetricCardProps> = ({
  title,
  metric,
  value,
  target,
  unit = '',
  format = 'number',
  precision = 0,
  trend,
  trendValue,
  trendPeriod = '24h',
  isLive = false,
  updateInterval = 5000,
  onDataUpdate,
  sparklineData = [],
  status = 'normal',
  threshold,
  className = ''
}) => {
  const [currentValue, setCurrentValue] = useState(value);
  const [isConnected, setIsConnected] = useState(isLive);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousValueRef = useRef(value);

  // Auto-update logic for live data
  useEffect(() => {
    if (isLive && onDataUpdate) {
      const startUpdates = () => {
        intervalRef.current = setInterval(async () => {
          try {
            const newValue = await onDataUpdate();
            if (newValue !== currentValue) {
              previousValueRef.current = currentValue;
              setCurrentValue(newValue);
              setLastUpdated(new Date());
              setIsAnimating(true);
              
              // Add to history
              setHistory(prev => [...prev.slice(-19), { 
                value: newValue, 
                timestamp: new Date() 
              }]);

              // Reset animation
              setTimeout(() => setIsAnimating(false), 500);
            }
            setIsConnected(true);
          } catch (error) {
            console.error('Failed to update metric:', error);
            setIsConnected(false);
          }
        }, updateInterval);
      };

      startUpdates();

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isLive, onDataUpdate, updateInterval, currentValue]);

  // Update current value when prop changes
  useEffect(() => {
    if (!isLive) {
      setCurrentValue(value);
    }
  }, [value, isLive]);

  // Determine status based on thresholds
  const getStatus = () => {
    if (threshold) {
      if (currentValue >= threshold.critical) return 'critical';
      if (currentValue >= threshold.warning) return 'warning';
      return 'normal';
    }
    return status;
  };

  const formatValue = (val: number): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: precision,
          maximumFractionDigits: precision
        }).format(val);
      case 'percentage':
        return `${val.toFixed(precision)}%`;
      default:
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: precision,
          maximumFractionDigits: precision
        }).format(val);
    }
  };

  const getStatusColors = () => {
    const currentStatus = getStatus();
    switch (currentStatus) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-950',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-700 dark:text-red-300',
          accent: 'text-red-600 dark:text-red-400'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-700 dark:text-yellow-300',
          accent: 'text-yellow-600 dark:text-yellow-400'
        };
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-950',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-700 dark:text-green-300',
          accent: 'text-green-600 dark:text-green-400'
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-700 dark:text-blue-300',
          accent: 'text-blue-600 dark:text-blue-400'
        };
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTargetProgress = () => {
    if (!target) return null;
    
    const progress = (currentValue / target) * 100;
    const isOnTarget = progress >= 95 && progress <= 105;
    const isOverTarget = progress > 105;
    
    return {
      progress: Math.min(progress, 100),
      color: isOverTarget ? 'bg-green-500' : 
             isOnTarget ? 'bg-blue-500' : 
             progress > 70 ? 'bg-yellow-500' : 'bg-red-500',
      status: isOverTarget ? 'Exceeded' : 
              isOnTarget ? 'On Target' : 
              progress > 70 ? 'Close' : 'Below Target'
    };
  };

  const renderSparkline = () => {
    const data = sparklineData.length > 0 ? sparklineData : 
                 history.length > 0 ? history.map(h => h.value) : [];
    
    if (data.length < 2) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="mt-3">
        <svg className="w-full h-8" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            points={points}
            className="opacity-70"
          />
        </svg>
      </div>
    );
  };

  const colors = getStatusColors();
  const targetProgress = getTargetProgress();

  return (
    <Card className={`${className} ${colors.bg} ${colors.border} transition-all duration-300 ${
      isAnimating ? 'scale-105 shadow-lg' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-lg ${colors.text}`}>
            {title}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {isLive && (
              <Badge 
                variant={isConnected ? 'success' : 'destructive'}
                className="text-xs"
              >
                {isConnected ? (
                  <>
                    <Wifi className="w-3 h-3 mr-1" />
                    Live
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 mr-1" />
                    Offline
                  </>
                )}
              </Badge>
            )}
            {getStatus() === 'critical' && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Main Value */}
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline space-x-2">
              <span className={`text-3xl font-bold ${colors.accent} transition-all duration-300 ${
                isAnimating ? 'scale-110' : ''
              }`}>
                {formatValue(currentValue)}
              </span>
              {unit && (
                <span className={`text-sm ${colors.text} opacity-70`}>
                  {unit}
                </span>
              )}
            </div>
            {getTrendIcon()}
          </div>

          {/* Trend Information */}
          {(trend && trendValue !== undefined) && (
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trend === 'up' ? '+' : ''}
                {formatValue(trendValue)}
              </span>
              <span className="text-xs text-gray-500">
                vs {trendPeriod}
              </span>
            </div>
          )}

          {/* Target Progress */}
          {target && targetProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1">
                  <Target className="w-3 h-3" />
                  <span>Target: {formatValue(target)}</span>
                </div>
                <span className={`font-medium ${colors.accent}`}>
                  {targetProgress.status}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${targetProgress.color}`}
                  style={{ width: `${targetProgress.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Sparkline */}
          {renderSparkline()}

          {/* Last Updated */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
            {isLive && (
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>Auto-refresh</span>
              </div>
            )}
          </div>

          {/* Additional Metrics */}
          {history.length > 0 && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">24h High</div>
                <div className="font-medium text-sm">
                  {formatValue(Math.max(...history.map(h => h.value)))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">24h Low</div>
                <div className="font-medium text-sm">
                  {formatValue(Math.min(...history.map(h => h.value)))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeMetricCard;