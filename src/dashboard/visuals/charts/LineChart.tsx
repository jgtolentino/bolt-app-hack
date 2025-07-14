/**
 * Scout Dash 2.0 - Line Chart Component
 * Line and area charts for time series and trend visualization
 */

import React, { useMemo } from 'react';
import { VisualComponentProps } from '../VisualRegistry';

interface LineChartProps extends VisualComponentProps {
  variant?: 'line' | 'area';
}

export const LineChart: React.FC<LineChartProps> = ({
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
  variant = 'line'
}) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const xField = blueprint.encoding.x?.field;
    const yField = blueprint.encoding.y?.field;
    
    if (!xField || !yField) return [];

    // Process and sort data points
    const points = data.map(row => ({
      x: blueprint.encoding.x?.type === 'temporal' ? new Date(row[xField]).getTime() : row[xField],
      y: Number(row[yField]) || 0,
      label: String(row[xField]),
      originalData: row
    }));

    // Sort by x value
    return points.sort((a, b) => {
      if (typeof a.x === 'number' && typeof b.x === 'number') {
        return a.x - b.x;
      }
      return String(a.x).localeCompare(String(b.x));
    });
  }, [data, blueprint.encoding]);

  const { xScale, yScale, pathData } = useMemo(() => {
    if (chartData.length === 0) return { xScale: [], yScale: [], pathData: '' };

    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const xValues = chartData.map(d => d.x);
    const yValues = chartData.map(d => d.y);

    const minX = Math.min(...xValues as number[]);
    const maxX = Math.max(...xValues as number[]);
    const minY = blueprint.encoding.y?.scale?.zero ? 0 : Math.min(...yValues);
    const maxY = Math.max(...yValues);

    // Scale functions
    const scaleX = (value: any) => ((value - minX) / (maxX - minX)) * chartWidth;
    const scaleY = (value: number) => chartHeight - ((value - minY) / (maxY - minY)) * chartHeight;

    // Generate path data
    const pathCommands = chartData.map((point, index) => {
      const x = scaleX(point.x);
      const y = scaleY(point.y);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    });

    const pathData = pathCommands.join(' ');

    return {
      xScale: scaleX,
      yScale: scaleY,
      pathData,
      minX,
      maxX,
      minY,
      maxY,
      chartWidth,
      chartHeight
    };
  }, [chartData, width, height, blueprint.encoding]);

  const handlePointClick = (item: any) => {
    if (!interactive) return;
    
    const field = blueprint.encoding.x?.field || '';
    const selected = selectedData.includes(item.originalData) ? 
      selectedData.filter(d => d !== item.originalData) :
      [...selectedData, item.originalData];
      
    onSelection?.(field, selected);
  };

  const handlePointHover = (item: any) => {
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
          <pattern id="line-grid" width="40" height="30" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 30"
              fill="none"
              stroke={theme?.colors.grid || '#f1f5f9'}
              strokeWidth="0.5"
              opacity="0.3"
            />
          </pattern>
          
          {/* Gradient for area chart */}
          {variant === 'area' && (
            <linearGradient id="area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={theme?.colors.primary || '#3b82f6'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={theme?.colors.primary || '#3b82f6'} stopOpacity="0.05" />
            </linearGradient>
          )}
        </defs>
        
        {blueprint.style?.chartStyle?.showGrid && (
          <rect width={width} height={height} fill="url(#line-grid)" opacity="0.7" />
        )}

        {/* Chart area */}
        <g transform="translate(40, 20)">
          {/* Y-axis */}
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={yScale.chartHeight}
            stroke={theme?.colors.border || '#e2e8f0'}
            strokeWidth="1"
          />
          
          {/* X-axis */}
          <line
            x1={0}
            y1={yScale.chartHeight}
            x2={xScale.chartWidth}
            y2={yScale.chartHeight}
            stroke={theme?.colors.border || '#e2e8f0'}
            strokeWidth="1"
          />

          {/* Y-axis labels */}
          {[0, 25, 50, 75, 100].map(percent => {
            const value = yScale.minY + (yScale.maxY - yScale.minY) * (percent / 100);
            const y = yScale.chartHeight - (percent / 100) * yScale.chartHeight;
            return (
              <g key={percent}>
                <line
                  x1={-5}
                  y1={y}
                  x2={0}
                  y2={y}
                  stroke={theme?.colors.border || '#e2e8f0'}
                  strokeWidth="1"
                />
                <text
                  x={-10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill={theme?.colors.text || '#1e293b'}
                >
                  {value.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {chartData.filter((_, i) => i % Math.max(1, Math.floor(chartData.length / 6)) === 0).map((point, index) => {
            const x = xScale(point.x);
            return (
              <g key={index}>
                <line
                  x1={x}
                  y1={yScale.chartHeight}
                  x2={x}
                  y2={yScale.chartHeight + 5}
                  stroke={theme?.colors.border || '#e2e8f0'}
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={yScale.chartHeight + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fill={theme?.colors.text || '#1e293b'}
                >
                  {blueprint.encoding.x?.type === 'temporal' ? 
                    new Date(point.x).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) :
                    String(point.label).length > 8 ? String(point.label).substring(0, 8) + '...' : point.label
                  }
                </text>
              </g>
            );
          })}

          {/* Area fill for area chart */}
          {variant === 'area' && pathData && (
            <path
              d={`${pathData} L ${xScale(chartData[chartData.length - 1].x)} ${yScale.chartHeight} L ${xScale(chartData[0].x)} ${yScale.chartHeight} Z`}
              fill="url(#area-gradient)"
              stroke="none"
            />
          )}

          {/* Line path */}
          <path
            d={pathData}
            fill="none"
            stroke={theme?.colors.primary || '#3b82f6'}
            strokeWidth={blueprint.style?.chartStyle?.strokeWidth || 2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {chartData.map((point, index) => {
            const x = xScale(point.x);
            const y = yScale(point.y);
            const isSelected = selectedData.some(d => d === point.originalData);
            const isHovered = hoveredData === point.originalData;
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={isHovered ? 6 : isSelected ? 5 : blueprint.style?.chartStyle?.pointSize || 3}
                fill={isSelected ? theme?.colors.primary || '#3b82f6' : theme?.colors.background || '#ffffff'}
                stroke={theme?.colors.primary || '#3b82f6'}
                strokeWidth="2"
                opacity={isHovered ? 1 : isSelected ? 1 : 0.8}
                className="cursor-pointer transition-all duration-200"
                onClick={() => handlePointClick(point)}
                onMouseEnter={() => handlePointHover(point)}
                onMouseLeave={() => onHover?.(null)}
              />
            );
          })}
        </g>

        {/* Tooltip */}
        {hoveredData && (
          <g transform={`translate(${width - 150}, 20)`}>
            <rect
              width="140"
              height="70"
              fill={theme?.colors.background || '#ffffff'}
              stroke={theme?.colors.border || '#e2e8f0'}
              strokeWidth="1"
              rx="4"
              className="drop-shadow-lg"
            />
            <text x="10" y="18" fontSize="11" fontWeight="bold" fill={theme?.colors.text || '#1e293b'}>
              {blueprint.encoding.x?.type === 'temporal' ? 
                new Date(hoveredData[blueprint.encoding.x?.field || '']).toLocaleDateString() :
                hoveredData[blueprint.encoding.x?.field || '']
              }
            </text>
            <text x="10" y="38" fontSize="11" fill={theme?.colors.text || '#1e293b'}>
              Value: {Number(hoveredData[blueprint.encoding.y?.field || ''])?.toLocaleString()}
            </text>
            {blueprint.encoding.color?.field && (
              <text x="10" y="55" fontSize="10" fill={theme?.colors.text || '#1e293b'}>
                {blueprint.encoding.color.field}: {hoveredData[blueprint.encoding.color.field]}
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};

export default LineChart;