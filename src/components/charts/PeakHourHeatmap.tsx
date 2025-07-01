import React from 'react';
import { motion } from 'framer-motion';

interface HeatmapData {
  hour: number;
  dayOfWeek: string;
  value: number;
  transactions?: number;
}

interface PeakHourHeatmapProps {
  data: HeatmapData[];
  title?: string;
  metric?: 'revenue' | 'transactions' | 'units';
  showStaffingRecommendations?: boolean;
}

const PeakHourHeatmap: React.FC<PeakHourHeatmapProps> = ({
  data,
  title = "Peak Hours Analysis",
  metric = 'revenue',
  showStaffingRecommendations = true
}) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Find max value for color scaling
  const maxValue = Math.max(...data.map(d => d.value));
  
  // Get value for specific hour and day
  const getValue = (hour: number, day: string) => {
    const item = data.find(d => d.hour === hour && d.dayOfWeek === day);
    return item?.value || 0;
  };

  // Calculate color intensity
  const getColor = (value: number) => {
    const intensity = value / maxValue;
    if (intensity === 0) return 'bg-gray-50';
    if (intensity < 0.2) return 'bg-blue-100';
    if (intensity < 0.4) return 'bg-blue-200';
    if (intensity < 0.6) return 'bg-blue-300';
    if (intensity < 0.8) return 'bg-blue-400';
    return 'bg-blue-500';
  };

  // Calculate recommended staffing levels
  const getStaffingLevel = (value: number) => {
    const percentage = (value / maxValue) * 100;
    if (percentage >= 80) return { level: 'High', staff: 4 };
    if (percentage >= 60) return { level: 'Medium-High', staff: 3 };
    if (percentage >= 40) return { level: 'Medium', staff: 2 };
    if (percentage >= 20) return { level: 'Low-Medium', staff: 1 };
    return { level: 'Low', staff: 1 };
  };

  // Find peak hours
  const peakHours = data
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Hour labels */}
          <div className="flex mb-2">
            <div className="w-24"></div>
            {hours.map(hour => (
              <div key={hour} className="flex-1 text-center text-xs text-gray-600">
                {hour === 0 ? '12AM' : hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`}
              </div>
            ))}
          </div>

          {/* Days and cells */}
          {days.map(day => (
            <div key={day} className="flex mb-1">
              <div className="w-24 pr-2 text-sm font-medium text-gray-700 flex items-center">
                {day.slice(0, 3)}
              </div>
              {hours.map(hour => {
                const value = getValue(hour, day);
                const staffing = getStaffingLevel(value);
                
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`flex-1 h-8 ${getColor(value)} border border-gray-200 relative group cursor-pointer transition-all hover:scale-110 hover:z-10`}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                        <div className="font-semibold">{day} {hour}:00</div>
                        <div>Value: ₱{value.toLocaleString()}</div>
                        {showStaffingRecommendations && (
                          <div className="text-yellow-300">Staff: {staffing.staff} ({staffing.level})</div>
                        )}
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-xs text-gray-600">Low</span>
          <div className="flex space-x-1">
            {['bg-gray-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400', 'bg-blue-500'].map(color => (
              <div key={color} className={`w-4 h-4 ${color} border border-gray-300`}></div>
            ))}
          </div>
          <span className="text-xs text-gray-600">High</span>
        </div>
        <span className="text-xs text-gray-500">
          Metric: {metric === 'revenue' ? 'Revenue (₱)' : metric === 'transactions' ? 'Transaction Count' : 'Units Sold'}
        </span>
      </div>

      {/* Peak Hours Summary */}
      <div className="mt-6 border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Top 5 Peak Hours</h4>
        <div className="grid grid-cols-5 gap-2">
          {peakHours.map((peak, index) => (
            <div key={index} className="text-center p-2 bg-gray-50 rounded">
              <div className="text-xs font-medium text-gray-900">
                {peak.dayOfWeek.slice(0, 3)} {peak.hour}:00
              </div>
              <div className="text-xs text-gray-600">
                ₱{peak.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staffing Recommendations */}
      {showStaffingRecommendations && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Staffing Recommendations</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-blue-700">Peak Hours (4 staff):</span>
              <span className="ml-2 text-blue-900">6-8 PM on Fri-Sat</span>
            </div>
            <div>
              <span className="text-blue-700">Low Hours (1 staff):</span>
              <span className="ml-2 text-blue-900">2-4 AM daily</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PeakHourHeatmap;