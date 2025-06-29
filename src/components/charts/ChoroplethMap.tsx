import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ZoomIn, ZoomOut, Layers } from 'lucide-react';
import { GeographyData } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface ChoroplethMapProps {
  data: GeographyData[];
  title?: string;
  height?: number;
  colorScheme?: 'blue' | 'green' | 'orange' | 'purple';
}

const ChoroplethMap: React.FC<ChoroplethMapProps> = ({
  data,
  title = "Geographic Performance",
  height = 400,
  colorScheme = 'blue'
}) => {
  const [selectedRegion, setSelectedRegion] = useState<GeographyData | null>(null);
  const [viewMode, setViewMode] = useState<'sales' | 'growth' | 'density'>('sales');

  const colorSchemes = {
    blue: ['#eff6ff', '#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8'],
    green: ['#f0fdf4', '#dcfce7', '#86efac', '#22c55e', '#15803d'],
    orange: ['#fff7ed', '#fed7aa', '#fb923c', '#f97316', '#c2410c'],
    purple: ['#faf5ff', '#e9d5ff', '#c084fc', '#8b5cf6', '#7c3aed']
  };

  const getColorForValue = (value: number, maxValue: number) => {
    const intensity = value / maxValue;
    const colors = colorSchemes[colorScheme];
    
    if (intensity === 0) return colors[0];
    if (intensity < 0.2) return colors[1];
    if (intensity < 0.4) return colors[2];
    if (intensity < 0.6) return colors[3];
    return colors[4];
  };

  const maxValue = Math.max(...data.map(d => 
    viewMode === 'sales' ? d.total_sales :
    viewMode === 'growth' ? (d.avg_transaction_value || 0) :
    d.transaction_count
  ));

  const formatValue = (value: number) => {
    if (viewMode === 'sales') return formatCurrency(value);
    if (viewMode === 'growth') return `${value.toFixed(1)}%`;
    return formatNumber(value);
  };

  // Mock Philippines regions for demonstration
  const regions = [
    { name: 'NCR', x: 50, y: 60, width: 8, height: 6 },
    { name: 'Region III', x: 45, y: 50, width: 12, height: 8 },
    { name: 'Region IV-A', x: 48, y: 68, width: 10, height: 10 },
    { name: 'Region VI', x: 35, y: 75, width: 8, height: 6 },
    { name: 'Region VII', x: 45, y: 80, width: 10, height: 8 },
    { name: 'Region XI', x: 55, y: 90, width: 8, height: 6 }
  ];

  return (
    <motion.div
      className="chart-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        
        {/* View Mode Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['sales', 'growth', 'density'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  viewMode === mode
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative bg-gray-50 rounded-lg overflow-hidden" style={{ height }}>
        {/* SVG Map */}
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
          {regions.map((region) => {
            const regionData = data.find(d => d.region === region.name);
            const value = regionData ? (
              viewMode === 'sales' ? regionData.total_sales :
              viewMode === 'growth' ? (regionData.avg_transaction_value || 0) :
              regionData.transaction_count
            ) : 0;
            
            return (
              <rect
                key={region.name}
                x={region.x}
                y={region.y}
                width={region.width}
                height={region.height}
                fill={getColorForValue(value, maxValue)}
                stroke="white"
                strokeWidth="0.5"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedRegion(regionData || null)}
              />
            );
          })}
          
          {/* Region Labels */}
          {regions.map((region) => (
            <text
              key={`label-${region.name}`}
              x={region.x + region.width / 2}
              y={region.y + region.height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="2"
              fill="white"
              fontWeight="bold"
            >
              {region.name}
            </text>
          ))}
        </svg>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button className="p-2 bg-white/90 rounded shadow hover:bg-white transition-colors">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button className="p-2 bg-white/90 rounded shadow hover:bg-white transition-colors">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button className="p-2 bg-white/90 rounded shadow hover:bg-white transition-colors">
            <Layers className="w-4 h-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg p-3 shadow">
          <p className="text-xs font-medium text-gray-700 mb-2">
            {viewMode === 'sales' ? 'Sales Volume' :
             viewMode === 'growth' ? 'Growth Rate' : 'Transaction Density'}
          </p>
          <div className="flex items-center space-x-2 text-xs">
            <span>Low</span>
            <div className="flex space-x-1">
              {colorSchemes[colorScheme].map((color, index) => (
                <div
                  key={index}
                  className="w-4 h-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span>High</span>
          </div>
        </div>
      </div>

      {/* Selected Region Details */}
      {selectedRegion && (
        <motion.div
          className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-primary-900">{selectedRegion.region}</h4>
              <p className="text-primary-700">{selectedRegion.city_municipality}</p>
              <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                <div>
                  <span className="text-primary-600">Sales:</span>
                  <p className="font-medium">{formatCurrency(selectedRegion.total_sales)}</p>
                </div>
                <div>
                  <span className="text-primary-600">Transactions:</span>
                  <p className="font-medium">{formatNumber(selectedRegion.transaction_count)}</p>
                </div>
                <div>
                  <span className="text-primary-600">Avg Value:</span>
                  <p className="font-medium">{formatCurrency(selectedRegion.avg_transaction_value)}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedRegion(null)}
              className="text-primary-600 hover:text-primary-800"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ChoroplethMap;