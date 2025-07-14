/**
 * Scout Dash 2.0 - Bar Chart Component
 * Vertical and horizontal bar charts with interactive features
 */

import React, { useMemo } from 'react';
import { VisualComponentProps } from '../VisualRegistry';

interface BarChartProps extends VisualComponentProps {
  orientation?: 'vertical' | 'horizontal';
}

export const BarChart: React.FC<BarChartProps> = ({
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
  orientation = 'vertical'
}) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const xField = blueprint.encoding.x?.field;
    const yField = blueprint.encoding.y?.field;
    
    if (!xField || !yField) return [];

    // Group and aggregate data if needed
    const grouped = new Map<string, number>();
    
    data.forEach(row => {
      const xValue = String(row[xField]);
      const yValue = Number(row[yField]) || 0;
      
      if (blueprint.encoding.y?.aggregate === 'sum') {
        grouped.set(xValue, (grouped.get(xValue) || 0) + yValue);
      } else if (blueprint.encoding.y?.aggregate === 'count') {
        grouped.set(xValue, (grouped.get(xValue) || 0) + 1);
      } else {
        grouped.set(xValue, yValue);
      }
    });

    return Array.from(grouped.entries()).map(([label, value]) => ({
      label,
      value,
      originalData: data.find(row => String(row[xField]) === label)
    }));
  }, [data, blueprint.encoding]);

  const { maxValue, barWidth, barHeight } = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.value));
    const padding = 40;
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;
    
    if (orientation === 'vertical') {
      return {
        maxValue: max,
        barWidth: availableWidth / chartData.length * 0.8,
        barHeight: availableHeight
      };
    } else {
      return {
        maxValue: max,
        barWidth: availableWidth,
        barHeight: availableHeight / chartData.length * 0.8
      };
    }
  }, [chartData, width, height, orientation]);

  const handleBarClick = (item: any, index: number) => {
    if (!interactive) return;
    
    const field = blueprint.encoding.x?.field || '';
    const selected = selectedData.includes(item.originalData) ? 
      selectedData.filter(d => d !== item.originalData) :
      [...selectedData, item.originalData];
      
    onSelection?.(field, selected);
  };

  const handleBarHover = (item: any) => {
    if (!interactive) return;
    onHover?.(item.originalData);
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No data to display
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <svg width={width} height={height} className="overflow-visible">
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke={theme?.colors.grid || '#f1f5f9'}
              strokeWidth="1"
              opacity="0.3"
            />
          </pattern>
        </defs>
        
        {blueprint.style?.chartStyle?.showGrid && (
          <rect width={width} height={height} fill="url(#grid)" opacity="0.5" />
        )}

        {/* Chart area */}
        <g transform="translate(40, 20)">
          {orientation === 'vertical' ? (
            // Vertical bars
            <>
              {/* Y-axis */}
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={barHeight}
                stroke={theme?.colors.border || '#e2e8f0'}
                strokeWidth="1"
              />
              
              {/* X-axis */}
              <line
                x1={0}
                y1={barHeight}
                x2={width - 80}
                y2={barHeight}
                stroke={theme?.colors.border || '#e2e8f0'}
                strokeWidth="1"
              />

              {/* Bars */}
              {chartData.map((item, index) => {
                const barX = index * (barWidth / 0.8);
                const barHeightPx = (item.value / maxValue) * (barHeight - 20);
                const barY = barHeight - barHeightPx;
                const isSelected = selectedData.some(d => d === item.originalData);
                const isHovered = hoveredData === item.originalData;
                
                return (
                  <g key={item.label}>
                    {/* Bar */}
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barHeightPx}
                      fill={isSelected ? theme?.colors.primary || '#3b82f6' : theme?.colors.secondary || '#64748b'}
                      opacity={isHovered ? 0.8 : isSelected ? 1 : 0.7}
                      stroke={isSelected ? theme?.colors.primary || '#3b82f6' : 'none'}
                      strokeWidth={isSelected ? 2 : 0}
                      className="cursor-pointer transition-all duration-200"
                      onClick={() => handleBarClick(item, index)}
                      onMouseEnter={() => handleBarHover(item)}
                      onMouseLeave={() => onHover?.(null)}
                    />
                    
                    {/* Value label */}
                    <text
                      x={barX + barWidth / 2}
                      y={barY - 5}
                      textAnchor="middle"
                      fontSize="12"
                      fill={theme?.colors.text || '#1e293b'}
                      className="pointer-events-none"
                    >
                      {item.value.toLocaleString()}
                    </text>
                    
                    {/* Category label */}
                    <text
                      x={barX + barWidth / 2}
                      y={barHeight + 15}
                      textAnchor="middle"
                      fontSize="10"
                      fill={theme?.colors.text || '#1e293b'}
                      className="pointer-events-none"
                    >
                      {item.label.length > 10 ? item.label.substring(0, 10) + '...' : item.label}
                    </text>
                  </g>
                );
              })}
            </>
          ) : (
            // Horizontal bars
            <>
              {/* Y-axis */}
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={height - 40}
                stroke={theme?.colors.border || '#e2e8f0'}
                strokeWidth="1"
              />
              
              {/* X-axis */}
              <line
                x1={0}
                y1={height - 40}
                x2={barWidth}
                y2={height - 40}
                stroke={theme?.colors.border || '#e2e8f0'}
                strokeWidth="1"
              />

              {/* Bars */}
              {chartData.map((item, index) => {
                const barY = index * (barHeight / 0.8);
                const barWidthPx = (item.value / maxValue) * (barWidth - 20);
                const isSelected = selectedData.some(d => d === item.originalData);
                const isHovered = hoveredData === item.originalData;
                
                return (
                  <g key={item.label}>
                    {/* Bar */}
                    <rect
                      x={0}
                      y={barY}
                      width={barWidthPx}
                      height={barHeight}
                      fill={isSelected ? theme?.colors.primary || '#3b82f6' : theme?.colors.secondary || '#64748b'}
                      opacity={isHovered ? 0.8 : isSelected ? 1 : 0.7}
                      stroke={isSelected ? theme?.colors.primary || '#3b82f6' : 'none'}
                      strokeWidth={isSelected ? 2 : 0}
                      className="cursor-pointer transition-all duration-200"
                      onClick={() => handleBarClick(item, index)}
                      onMouseEnter={() => handleBarHover(item)}
                      onMouseLeave={() => onHover?.(null)}
                    />
                    
                    {/* Value label */}
                    <text
                      x={barWidthPx + 5}
                      y={barY + barHeight / 2 + 4}
                      fontSize="12"
                      fill={theme?.colors.text || '#1e293b'}
                      className="pointer-events-none"
                    >
                      {item.value.toLocaleString()}
                    </text>
                    
                    {/* Category label */}
                    <text
                      x={-5}
                      y={barY + barHeight / 2 + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill={theme?.colors.text || '#1e293b'}
                      className="pointer-events-none"
                    >
                      {item.label.length > 15 ? item.label.substring(0, 15) + '...' : item.label}
                    </text>
                  </g>
                );
              })}
            </>
          )}
        </g>

        {/* Tooltip */}
        {hoveredData && (
          <g transform={`translate(${width - 150}, 20)`}>
            <rect
              width="140"
              height="60"
              fill={theme?.colors.background || '#ffffff'}
              stroke={theme?.colors.border || '#e2e8f0'}
              strokeWidth="1"
              rx="4"
              className="drop-shadow-lg"
            />
            <text x="10" y="20" fontSize="12" fontWeight="bold" fill={theme?.colors.text || '#1e293b'}>
              {hoveredData[blueprint.encoding.x?.field || '']}
            </text>
            <text x="10" y="40" fontSize="11" fill={theme?.colors.text || '#1e293b'}>
              Value: {hoveredData[blueprint.encoding.y?.field || '']?.toLocaleString()}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default BarChart;