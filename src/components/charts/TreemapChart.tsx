import React from 'react';
import { motion } from 'framer-motion';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartDataPoint } from '../../types';
import { formatCurrencyCompact } from '../../utils/formatters';

interface TreemapChartProps {
  data: ChartDataPoint[];
  title?: string;
  height?: number;
  showHierarchy?: boolean;
}

const TreemapChart: React.FC<TreemapChartProps> = ({
  data,
  title = "Product Hierarchy",
  height = 400,
  showHierarchy = true
}) => {
  const COLORS = [
    '#3B82F6', '#14B8A6', '#F97316', '#8B5CF6', 
    '#EF4444', '#06B6D4', '#84CC16', '#F59E0B'
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-primary-600">
            Value: {formatCurrencyCompact(data.value)}
          </p>
          {data.category && (
            <p className="text-sm text-gray-600">
              Category: {data.category}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Click to drill down
          </p>
        </div>
      );
    }
    return null;
  };

  // Smart text truncation based on available space
  const truncateText = (text: string, width: number) => {
    if (width < 60) return '';
    if (width < 80) return text.substring(0, 4) + '...';
    if (width < 100) return text.substring(0, 8) + '...';
    if (width < 120) return text.substring(0, 12) + '...';
    return text.length > 15 ? text.substring(0, 15) + '...' : text;
  };

  const CustomContent = (props: any) => {
    const { depth, x, y, width, height, index, name, value } = props;
    
    // Don't render anything for root node or invalid data
    if (depth === 0 || !name || !value || width < 30 || height < 30) {
      return null;
    }

    // Get color based on index
    const fillColor = COLORS[index % COLORS.length];
    
    // Determine text visibility based on size
    const showMainText = width > 50 && height > 35;
    const showValueText = width > 70 && height > 50;
    
    // Smart text sizing
    const fontSize = width < 80 ? 10 : width < 120 ? 11 : 12;
    const valueFontSize = fontSize - 1;
    
    // Truncate text intelligently
    const displayName = truncateText(name, width);

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fillColor}
          stroke="#ffffff"
          strokeWidth={2}
          opacity={0.9}
          className="cursor-pointer hover:opacity-75 transition-opacity"
          rx={4}
        />
        
        {/* Main label with better positioning */}
        {showMainText && displayName && (
          <text
            x={x + width / 2}
            y={y + height / 2 - (showValueText ? 6 : 0)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={fontSize}
            fontWeight="600"
            style={{ 
              textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
              pointerEvents: 'none'
            }}
          >
            {displayName}
          </text>
        )}
        
        {/* Value text with better spacing */}
        {showValueText && (
          <text
            x={x + width / 2}
            y={y + height / 2 + (showMainText ? 8 : 0)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={valueFontSize}
            fontWeight="500"
            style={{ 
              textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
              pointerEvents: 'none'
            }}
          >
            {formatCurrencyCompact(value)}
          </text>
        )}
        
        {/* Subtle border highlight on hover */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="transparent"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1}
          className="opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
          rx={4}
        />
      </g>
    );
  };

  return (
    <motion.div
      className="chart-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="text-sm text-gray-600">
          Size: Sales Volume | Color: Category
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <Treemap
          data={data}
          dataKey="value"
          aspectRatio={4/3}
          stroke="#ffffff"
          strokeWidth={2}
          content={<CustomContent />}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>

      {/* Enhanced Legend with full names */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
        {data.slice(0, 6).map((item, index) => (
          <div key={item.name} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
            <div 
              className="w-4 h-4 rounded-sm flex-shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-gray-900 block truncate">{item.name}</span>
              <span className="text-xs text-gray-600">{formatCurrencyCompact(item.value)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Summary */}
      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">📊 Category Performance</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-blue-600">Top Category:</span>
            <p className="font-medium">{data[0]?.name}</p>
          </div>
          <div>
            <span className="text-blue-600">Total Sales:</span>
            <p className="font-medium">{formatCurrencyCompact(data.reduce((sum, item) => sum + item.value, 0))}</p>
          </div>
          <div>
            <span className="text-blue-600">Categories:</span>
            <p className="font-medium">{data.length} active</p>
          </div>
          <div>
            <span className="text-blue-600">Market Share:</span>
            <p className="font-medium">{((data[0]?.value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-3 text-center text-sm text-gray-600">
        Hover over segments for details • Larger segments represent higher sales volume
      </div>
    </motion.div>
  );
};

export default TreemapChart;