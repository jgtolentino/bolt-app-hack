/**
 * Scout Dash 2.0 - Pie Chart Component
 * Pie and donut charts for part-to-whole relationships
 */

import React, { useMemo } from 'react';
import { VisualComponentProps } from '../VisualRegistry';

interface PieChartProps extends VisualComponentProps {
  variant?: 'pie' | 'donut';
  showLabels?: boolean;
  showPercentages?: boolean;
}

interface PieSlice {
  label: string;
  value: number;
  percentage: number;
  startAngle: number;
  endAngle: number;
  color: string;
  originalData: any;
}

export const PieChart: React.FC<PieChartProps> = ({
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
  variant = 'pie',
  showLabels = true,
  showPercentages = true
}) => {
  const { chartData, centerX, centerY, radius, innerRadius } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], centerX: 0, centerY: 0, radius: 0, innerRadius: 0 };
    
    const colorField = blueprint.encoding.color?.field;
    const valueField = blueprint.encoding.angle?.field;
    
    if (!colorField || !valueField) return { chartData: [], centerX: 0, centerY: 0, radius: 0, innerRadius: 0 };

    // Aggregate data by color field
    const grouped = new Map<string, number>();
    
    data.forEach(row => {
      const label = String(row[colorField]);
      const value = Number(row[valueField]) || 0;
      
      if (blueprint.encoding.angle?.aggregate === 'sum') {
        grouped.set(label, (grouped.get(label) || 0) + value);
      } else if (blueprint.encoding.angle?.aggregate === 'count') {
        grouped.set(label, (grouped.get(label) || 0) + 1);
      } else {
        grouped.set(label, value);
      }
    });

    const totalValue = Array.from(grouped.values()).reduce((sum, val) => sum + val, 0);
    
    // Generate colors
    const defaultColors = theme?.colors.primary || [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];
    
    const colors = Array.isArray(defaultColors) ? defaultColors : [defaultColors];
    
    // Create slices
    let currentAngle = -90; // Start at top
    const slices: PieSlice[] = Array.from(grouped.entries()).map(([label, value], index) => {
      const percentage = (value / totalValue) * 100;
      const angleSize = (value / totalValue) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSize;
      
      currentAngle = endAngle;
      
      return {
        label,
        value,
        percentage,
        startAngle,
        endAngle,
        color: colors[index % colors.length],
        originalData: data.find(row => String(row[colorField]) === label)
      };
    });

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    const innerRadius = variant === 'donut' ? radius * 0.5 : 0;

    return { chartData: slices, centerX, centerY, radius, innerRadius };
  }, [data, blueprint.encoding, theme, width, height, variant]);

  const createArcPath = (slice: PieSlice, outerRadius: number, innerRadius: number) => {
    const startAngleRad = (slice.startAngle * Math.PI) / 180;
    const endAngleRad = (slice.endAngle * Math.PI) / 180;
    
    const x1 = centerX + outerRadius * Math.cos(startAngleRad);
    const y1 = centerY + outerRadius * Math.sin(startAngleRad);
    const x2 = centerX + outerRadius * Math.cos(endAngleRad);
    const y2 = centerY + outerRadius * Math.sin(endAngleRad);
    
    const largeArcFlag = slice.endAngle - slice.startAngle > 180 ? 1 : 0;
    
    if (innerRadius === 0) {
      // Simple pie slice
      return `M ${centerX} ${centerY} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    } else {
      // Donut slice
      const x3 = centerX + innerRadius * Math.cos(endAngleRad);
      const y3 = centerY + innerRadius * Math.sin(endAngleRad);
      const x4 = centerX + innerRadius * Math.cos(startAngleRad);
      const y4 = centerY + innerRadius * Math.sin(startAngleRad);
      
      return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
    }
  };

  const getLabelPosition = (slice: PieSlice, labelRadius: number) => {
    const midAngle = ((slice.startAngle + slice.endAngle) / 2 * Math.PI) / 180;
    return {
      x: centerX + labelRadius * Math.cos(midAngle),
      y: centerY + labelRadius * Math.sin(midAngle)
    };
  };

  const handleSliceClick = (slice: PieSlice) => {
    if (!interactive) return;
    
    const field = blueprint.encoding.color?.field || '';
    const selected = selectedData.includes(slice.originalData) ? 
      selectedData.filter(d => d !== slice.originalData) :
      [...selectedData, slice.originalData];
      
    onSelection?.(field, selected);
  };

  const handleSliceHover = (slice: PieSlice) => {
    if (!interactive) return;
    onHover?.(slice.originalData);
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
        {/* Pie/donut slices */}
        {chartData.map((slice, index) => {
          const isSelected = selectedData.some(d => d === slice.originalData);
          const isHovered = hoveredData === slice.originalData;
          const sliceRadius = isHovered ? radius + 5 : radius;
          
          return (
            <g key={slice.label}>
              {/* Slice */}
              <path
                d={createArcPath(slice, sliceRadius, innerRadius)}
                fill={slice.color}
                opacity={isHovered ? 0.9 : isSelected ? 1 : 0.8}
                stroke={isSelected ? theme?.colors.background || '#ffffff' : 'none'}
                strokeWidth={isSelected ? 3 : 0}
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleSliceClick(slice)}
                onMouseEnter={() => handleSliceHover(slice)}
                onMouseLeave={() => onHover?.(null)}
              />
              
              {/* Labels */}
              {showLabels && slice.percentage > 5 && (
                <g>
                  {/* Label line for small slices */}
                  {slice.percentage < 15 && (
                    <line
                      x1={getLabelPosition(slice, radius * 0.8).x}
                      y1={getLabelPosition(slice, radius * 0.8).y}
                      x2={getLabelPosition(slice, radius * 1.2).x}
                      y2={getLabelPosition(slice, radius * 1.2).y}
                      stroke={theme?.colors.text || '#1e293b'}
                      strokeWidth="1"
                      opacity="0.6"
                    />
                  )}
                  
                  {/* Label text */}
                  <text
                    x={getLabelPosition(slice, slice.percentage < 15 ? radius * 1.3 : radius * 0.7).x}
                    y={getLabelPosition(slice, slice.percentage < 15 ? radius * 1.3 : radius * 0.7).y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={slice.percentage < 15 ? "10" : "12"}
                    fontWeight={isSelected ? "bold" : "normal"}
                    fill={slice.percentage < 15 ? theme?.colors.text || '#1e293b' : theme?.colors.background || '#ffffff'}
                    className="pointer-events-none"
                  >
                    {slice.label.length > 10 ? slice.label.substring(0, 10) + '...' : slice.label}
                  </text>
                  
                  {/* Percentage text */}
                  {showPercentages && slice.percentage >= 10 && (
                    <text
                      x={getLabelPosition(slice, radius * 0.7).x}
                      y={getLabelPosition(slice, radius * 0.7).y + 15}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="10"
                      fill={theme?.colors.background || '#ffffff'}
                      className="pointer-events-none"
                    >
                      {slice.percentage.toFixed(1)}%
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* Center label for donut charts */}
        {variant === 'donut' && (
          <g>
            <text
              x={centerX}
              y={centerY - 5}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="16"
              fontWeight="bold"
              fill={theme?.colors.text || '#1e293b'}
            >
              Total
            </text>
            <text
              x={centerX}
              y={centerY + 15}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="14"
              fill={theme?.colors.text || '#1e293b'}
            >
              {chartData.reduce((sum, slice) => sum + slice.value, 0).toLocaleString()}
            </text>
          </g>
        )}

        {/* Legend */}
        {blueprint.style?.chartStyle?.showLegend && (
          <g transform={`translate(${width - 120}, 20)`}>
            <rect
              width="110"
              height={chartData.length * 20 + 10}
              fill={theme?.colors.background || '#ffffff'}
              stroke={theme?.colors.border || '#e2e8f0'}
              strokeWidth="1"
              rx="4"
              opacity="0.95"
            />
            {chartData.map((slice, index) => (
              <g key={slice.label} transform={`translate(10, ${20 + index * 20})`}>
                <rect
                  x="0"
                  y="-8"
                  width="12"
                  height="12"
                  fill={slice.color}
                  rx="2"
                />
                <text
                  x="18"
                  y="0"
                  fontSize="10"
                  fill={theme?.colors.text || '#1e293b'}
                  dominantBaseline="middle"
                >
                  {slice.label.length > 12 ? slice.label.substring(0, 12) + '...' : slice.label}
                </text>
              </g>
            ))}
          </g>
        )}

        {/* Tooltip */}
        {hoveredData && (
          <g transform={`translate(${width - 150}, ${height - 80})`}>
            <rect
              width="140"
              height="70"
              fill={theme?.colors.background || '#ffffff'}
              stroke={theme?.colors.border || '#e2e8f0'}
              strokeWidth="1"
              rx="4"
              className="drop-shadow-lg"
            />
            <text x="10" y="18" fontSize="12" fontWeight="bold" fill={theme?.colors.text || '#1e293b'}>
              {hoveredData[blueprint.encoding.color?.field || '']}
            </text>
            <text x="10" y="38" fontSize="11" fill={theme?.colors.text || '#1e293b'}>
              Value: {Number(hoveredData[blueprint.encoding.angle?.field || ''])?.toLocaleString()}
            </text>
            <text x="10" y="55" fontSize="10" fill={theme?.colors.text || '#1e293b'}>
              {chartData.find(s => s.originalData === hoveredData)?.percentage.toFixed(1)}% of total
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default PieChart;