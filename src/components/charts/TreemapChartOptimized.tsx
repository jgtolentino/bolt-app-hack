import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartDataPoint } from '../../types';
import { formatCurrencyCompact } from '../../utils/formatters';
import { Package, TrendingUp, AlertCircle } from 'lucide-react';

interface TreemapChartProps {
  data: ChartDataPoint[];
  title?: string;
  height?: number;
  showHierarchy?: boolean;
  onSegmentClick?: (data: ChartDataPoint) => void;
}

const TreemapChartOptimized: React.FC<TreemapChartProps> = ({
  data,
  title = "Product Mix Visualization",
  height = 500,
  showHierarchy = true,
  onSegmentClick
}) => {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  // Philippine retail category colors
  const CATEGORY_COLORS: Record<string, string> = {
    'Beverages': '#3B82F6',
    'Snacks': '#14B8A6', 
    'Personal Care': '#F97316',
    'Food & Groceries': '#8B5CF6',
    'Dairy': '#EF4444',
    'Household Items': '#06B6D4',
    'Health & Medicine': '#84CC16',
    'Baby Care': '#F59E0B',
    'Frozen Foods': '#EC4899',
    'Canned Goods': '#10B981',
    'Condiments & Sauces': '#6366F1',
    'Bread & Bakery': '#A78BFA',
    'Tobacco & Vape': '#F87171',
    'School & Office': '#60A5FA',
    'Alcoholic Beverages': '#C084FC',
    'Beauty Products': '#F472B6',
    'Cleaning Supplies': '#34D399',
    'Pet Care': '#FBBF24'
  };

  const getColor = (category: string, index: number) => {
    return CATEGORY_COLORS[category] || `hsl(${(index * 137) % 360}, 70%, 50%)`;
  };

  const handleSegmentClick = useCallback((data: any) => {
    setSelectedSegment(data.name);
    if (onSegmentClick) {
      onSegmentClick(data);
    }
  }, [onSegmentClick]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-xl">
          <div className="flex items-start space-x-3">
            <Package className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">{data.name}</p>
              {data.category && (
                <p className="text-sm text-gray-600 mt-1">
                  Category: {data.category}
                </p>
              )}
              <div className="mt-2 space-y-1">
                <p className="text-sm">
                  <span className="text-gray-500">Sales:</span>{' '}
                  <span className="font-medium text-gray-900">
                    {formatCurrencyCompact(data.value)}
                  </span>
                </p>
                {data.units && (
                  <p className="text-sm">
                    <span className="text-gray-500">Units Sold:</span>{' '}
                    <span className="font-medium text-gray-900">
                      {data.units.toLocaleString()}
                    </span>
                  </p>
                )}
                {data.growth && (
                  <p className="text-sm flex items-center">
                    <span className="text-gray-500">Growth:</span>{' '}
                    <span className={`font-medium ml-1 ${data.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.growth > 0 ? '+' : ''}{data.growth}%
                    </span>
                  </p>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-blue-600 font-medium">
                  Click to view details →
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomContent = (props: any) => {
    const { depth, x, y, width, height, index, name, value, category } = props;
    
    // Skip rendering for invalid segments
    if (depth === 0 || !name || !value || width < 40 || height < 40) {
      return null;
    }

    const isSelected = selectedSegment === name;
    const isHovered = hoveredSegment === name;
    const fillColor = getColor(category || name, index);
    
    // Calculate optimal font sizes
    const area = width * height;
    const fontSize = Math.min(
      Math.max(11, Math.sqrt(area) / 15),
      16
    );
    const valueFontSize = fontSize * 0.85;
    
    // Determine what to show based on available space
    const showName = width > 60 && height > 40;
    const showValue = width > 80 && height > 60;
    const showFullName = width > 120 && height > 80;
    
    // Smart text truncation
    const getDisplayName = () => {
      if (!showName) return '';
      if (showFullName) return name;
      if (width < 100) return name.substring(0, 10) + '...';
      return name.length > 20 ? name.substring(0, 20) + '...' : name;
    };

    return (
      <g
        onClick={() => handleSegmentClick({ name, value, category, ...props })}
        onMouseEnter={() => setHoveredSegment(name)}
        onMouseLeave={() => setHoveredSegment(null)}
        style={{ cursor: 'pointer' }}
      >
        {/* Main rectangle */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fillColor}
          stroke="#ffffff"
          strokeWidth={isSelected ? 3 : 2}
          opacity={isSelected ? 1 : isHovered ? 0.85 : 0.9}
          rx={6}
          ry={6}
          className="transition-all duration-200"
        />
        
        {/* Selection highlight */}
        {isSelected && (
          <rect
            x={x + 2}
            y={y + 2}
            width={width - 4}
            height={height - 4}
            fill="none"
            stroke="#1e40af"
            strokeWidth={2}
            strokeDasharray="4 2"
            rx={4}
            ry={4}
            className="animate-pulse"
          />
        )}
        
        {/* Text container with background for better readability */}
        {showName && (
          <g>
            {/* Semi-transparent background for text */}
            <rect
              x={x + 4}
              y={y + 4}
              width={width - 8}
              height={height - 8}
              fill="rgba(0, 0, 0, 0.1)"
              rx={4}
              ry={4}
            />
            
            {/* Product name */}
            <text
              x={x + width / 2}
              y={y + height / 2 - (showValue ? fontSize / 2 : 0)}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize={fontSize}
              fontWeight="600"
              fontFamily="system-ui, -apple-system, sans-serif"
              style={{ 
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                letterSpacing: '0.01em',
                pointerEvents: 'none'
              }}
            >
              {getDisplayName()}
            </text>
            
            {/* Value text */}
            {showValue && (
              <text
                x={x + width / 2}
                y={y + height / 2 + fontSize / 2 + 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize={valueFontSize}
                fontWeight="500"
                fontFamily="system-ui, -apple-system, sans-serif"
                opacity={0.9}
                style={{ 
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  pointerEvents: 'none'
                }}
              >
                {formatCurrencyCompact(value)}
              </text>
            )}
          </g>
        )}
        
        {/* Hover effect overlay */}
        {isHovered && (
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="rgba(255, 255, 255, 0.2)"
            rx={6}
            ry={6}
            style={{ pointerEvents: 'none' }}
          />
        )}
      </g>
    );
  };

  // Calculate totals and insights
  const totalSales = data.reduce((sum, item) => sum + item.value, 0);
  const topItem = data[0];
  const topShare = topItem ? (topItem.value / totalSales * 100).toFixed(1) : 0;

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            Size represents sales volume • Click segments for details
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
            {data.length} Products
          </span>
        </div>
      </div>
      
      {/* Chart */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <Treemap
            data={data}
            dataKey="value"
            aspectRatio={4/3}
            stroke="#ffffff"
            fill="#8884d8"
            content={<CustomContent />}
          >
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ fill: 'transparent' }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>

      {/* Selected Item Details */}
      {selectedSegment && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900">
                Selected: {selectedSegment}
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Click another segment to compare or view details
              </p>
            </div>
            <button
              onClick={() => setSelectedSegment(null)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear Selection
            </button>
          </div>
        </motion.div>
      )}

      {/* Category Legend */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {data.slice(0, 8).map((item, index) => (
          <motion.div
            key={item.name}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => handleSegmentClick(item)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div 
              className="w-4 h-4 rounded flex-shrink-0"
              style={{ backgroundColor: getColor(item.category || item.name, index) }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatCurrencyCompact(item.value)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">Product Mix Insights</h4>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Top Product</p>
                <p className="font-semibold text-gray-900">{topItem?.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Market Share</p>
                <p className="font-semibold text-gray-900">{topShare}%</p>
              </div>
              <div>
                <p className="text-gray-600">Total Sales</p>
                <p className="font-semibold text-gray-900">
                  {formatCurrencyCompact(totalSales)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Avg per Product</p>
                <p className="font-semibold text-gray-900">
                  {formatCurrencyCompact(totalSales / data.length)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Note for Sari-sari stores */}
      <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Sari-sari Store Note:</p>
            <p className="mt-1">
              Product mix typically includes fast-moving consumer goods (FMCG) with high turnover. 
              Focus on popular brands and sachets for affordability.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TreemapChartOptimized;