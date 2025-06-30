import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Download, Maximize2, RefreshCcw } from 'lucide-react';

interface ChartPanelProps {
  title: string;
  subtitle?: string;
  chart: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  error?: Error;
  className?: string;
  testId?: string;
  updatedAt?: Date;
  onRefresh?: () => void;
  onExport?: () => void;
  onExpand?: () => void;
  height?: number | string;
}

const ChartPanel: React.FC<ChartPanelProps> = ({
  title,
  subtitle,
  chart,
  footer,
  loading = false,
  error,
  className = '',
  testId,
  updatedAt,
  onRefresh,
  onExport,
  onExpand,
  height = 400
}) => {
  // Loading state with skeleton
  if (loading) {
    return (
      <div className={`p-phi-lg bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-phi-sm" />
          {subtitle && <div className="h-4 w-64 bg-gray-100 rounded mb-phi" />}
          <div className="bg-gray-100 rounded-lg" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
            <div className="flex items-end justify-around h-full p-phi">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-200 rounded"
                  style={{
                    width: '12%',
                    height: `${Math.random() * 60 + 20}%`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`p-phi-lg bg-white rounded-xl shadow-sm border border-red-200 ${className}`}>
        <div className="flex flex-col items-center justify-center" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
          <div className="text-red-600 text-center">
            <RefreshCcw className="w-12 h-12 mx-auto mb-phi-sm opacity-50" />
            <p className="text-lg-phi font-medium mb-phi-xs">Unable to load chart</p>
            <p className="text-sm-phi text-red-500">{error.message}</p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="mt-phi px-phi py-phi-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm-phi font-medium"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`p-phi-lg bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}
      data-testid={testId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }} // Rule #18: ≤400ms ease-out
    >
      {/* Header with title and actions */}
      <div className="flex items-start justify-between mb-phi-lg">
        <div>
          {/* Rule #1: One-glance clarity - explicit title */}
          <h3 className="text-lg-phi font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm-phi text-gray-600 mt-phi-xs">{subtitle}</p>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-phi-sm">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-phi-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Refresh data"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          )}
          {onExpand && (
            <button
              onClick={onExpand}
              className="p-phi-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Expand chart"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="p-phi-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Export data"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chart content */}
      <div style={{ height: typeof height === 'number' ? `${height}px` : height }}>
        {chart}
      </div>

      {/* Footer content */}
      {footer && (
        <div className="mt-phi pt-phi border-t border-gray-100">
          {footer}
        </div>
      )}

      {/* Last updated timestamp - Rule #17 */}
      {updatedAt && (
        <div className="mt-phi pt-phi border-t border-gray-100">
          <p className="text-xs-phi text-gray-500">
            Last updated: {updatedAt.toLocaleTimeString('en-US', { 
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

export default ChartPanel;