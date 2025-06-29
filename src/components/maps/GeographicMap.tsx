import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ZoomIn, ZoomOut, Layers, RotateCcw } from 'lucide-react';
import { GeographyData } from '../../types';
import PhilippinesMap from './PhilippinesMap';

interface GeographicMapProps {
  data: GeographyData[];
  height?: number;
}

const GeographicMap: React.FC<GeographicMapProps> = ({ data, height = 400 }) => {
  const [viewMode, setViewMode] = useState<'bubble' | 'choropleth' | 'hybrid'>('bubble');
  const [selectedLocation, setSelectedLocation] = useState<GeographyData | null>(null);

  const handleLocationSelect = (location: GeographyData) => {
    setSelectedLocation(location);
  };

  return (
    <motion.div
      className="chart-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Geographic Performance</h3>
        
        {/* View Mode Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['bubble', 'choropleth', 'hybrid'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
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

      {/* Enhanced Philippines Map */}
      <PhilippinesMap 
        data={data} 
        height={height}
        onLocationSelect={handleLocationSelect}
      />

      {/* Selected Location Details */}
      {selectedLocation && (
        <motion.div
          className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-primary-900">{selectedLocation.store_name}</h4>
              <p className="text-primary-700">{selectedLocation.barangay}, {selectedLocation.city_municipality}, {selectedLocation.region}</p>
              <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                <div>
                  <span className="text-primary-600">Sales:</span>
                  <p className="font-medium">₱{selectedLocation.total_sales.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-primary-600">Transactions:</span>
                  <p className="font-medium">{selectedLocation.transaction_count.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-primary-600">Avg Basket:</span>
                  <p className="font-medium">₱{selectedLocation.avg_transaction_value.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedLocation(null)}
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

export default GeographicMap;