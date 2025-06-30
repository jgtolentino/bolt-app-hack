import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface LocationData {
  location: string;
  revenue: number;
  growth: number;
  transactions?: number;
  coordinates?: { lat: number; lng: number };
}

interface LocationHeatmapProps {
  data?: LocationData[];
  view?: 'list' | 'map';
}

const LocationHeatmap: React.FC<LocationHeatmapProps> = ({ 
  data,
  view = 'list'
}) => {
  // Default data if not provided
  const locations = data || [
    { location: 'Barangay Poblacion', revenue: 15500, growth: 18, transactions: 89 },
    { location: 'Barangay San Jose', revenue: 12200, growth: 12, transactions: 76 },
    { location: 'Barangay Bagong Silang', revenue: 10900, growth: -3, transactions: 68 },
    { location: 'Barangay Sta. Cruz', revenue: 9600, growth: 8, transactions: 54 },
    { location: 'Barangay Del Pilar', revenue: 8800, growth: 15, transactions: 48 },
    { location: 'Barangay San Antonio', revenue: 7200, growth: -5, transactions: 42 }
  ];

  // Calculate max revenue for heat intensity
  const maxRevenue = Math.max(...locations.map(l => l.revenue)) || 1; // Prevent division by zero

  const getHeatColor = (revenue: number) => {
    const intensity = revenue / maxRevenue;
    if (intensity > 0.8) return 'bg-red-500';
    if (intensity > 0.6) return 'bg-orange-500';
    if (intensity > 0.4) return 'bg-yellow-500';
    if (intensity > 0.2) return 'bg-green-400';
    return 'bg-green-300';
  };

  const getHeatColorRgb = (revenue: number) => {
    const intensity = revenue / maxRevenue;
    if (intensity > 0.8) return 'rgb(239, 68, 68)';
    if (intensity > 0.6) return 'rgb(249, 115, 22)';
    if (intensity > 0.4) return 'rgb(245, 158, 11)';
    if (intensity > 0.2) return 'rgb(74, 222, 128)';
    return 'rgb(134, 239, 172)';
  };

  if (view === 'map') {
    // Simple grid-based heatmap visualization
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative h-64 bg-gray-50 rounded-lg p-4"
      >
        <div className="grid grid-cols-3 gap-2 h-full">
          {locations.map((location, index) => {
            const heatColor = getHeatColorRgb(location.revenue);
            return (
              <motion.div
                key={location.location}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative group cursor-pointer"
                style={{
                  backgroundColor: heatColor,
                  opacity: 0.7
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 transition-opacity">
                  <div className="text-white text-center p-2">
                    <p className="text-xs font-semibold">{location.location}</p>
                    <p className="text-xs">{formatCurrency(location.revenue)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Heat scale legend */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2 bg-white rounded px-2 py-1 shadow-sm">
          <span className="text-xs text-gray-600">Low</span>
          <div className="flex h-2">
            <div className="w-4 bg-green-300" />
            <div className="w-4 bg-green-400" />
            <div className="w-4 bg-yellow-500" />
            <div className="w-4 bg-orange-500" />
            <div className="w-4 bg-red-500" />
          </div>
          <span className="text-xs text-gray-600">High</span>
        </div>
      </motion.div>
    );
  }

  // List view with heat indicators
  return (
    <div className="space-y-2">
      {locations.map((location, index) => (
        <motion.div
          key={location.location}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-10 h-10 rounded-lg ${getHeatColor(location.revenue)} opacity-20`} />
              <MapPin className="absolute inset-0 m-auto w-5 h-5 text-gray-700" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{location.location}</p>
              <p className="text-xs text-gray-500">{location.transactions || 0} transactions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-gray-900">{formatCurrency(location.revenue)}</p>
              <div className={`flex items-center gap-1 text-xs ${
                location.growth > 0 ? 'text-success-600' : 'text-error-600'
              }`}>
                {location.growth > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{Math.abs(location.growth)}%</span>
              </div>
            </div>
            
            {/* Heat indicator bar */}
            <div className="w-1 h-10 rounded-full bg-gray-200 overflow-hidden">
              <motion.div
                className={getHeatColor(location.revenue)}
                initial={{ height: 0 }}
                animate={{ height: `${(location.revenue / maxRevenue) * 100}%` }}
                transition={{ delay: index * 0.05 + 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default LocationHeatmap;