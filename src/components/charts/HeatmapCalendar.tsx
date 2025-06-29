import React from 'react';
import { motion } from 'framer-motion';

interface HeatmapCalendarProps {
  data: Array<{
    date: string;
    value: number;
    day: string;
    hour: number;
  }>;
  title?: string;
  height?: number;
}

const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({
  data,
  title = "Sales Heatmap",
  height = 300
}) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Get max value for color scaling
  const maxValue = Math.max(...data.map(d => d.value));

  // Create data matrix
  const dataMatrix = days.map(day => 
    hours.map(hour => {
      const dataPoint = data.find(d => d.day === day && d.hour === hour);
      return {
        day,
        hour,
        value: dataPoint?.value || 0,
        intensity: dataPoint ? (dataPoint.value / maxValue) : 0
      };
    })
  );

  const getColor = (intensity: number) => {
    if (intensity === 0) return '#f3f4f6';
    if (intensity < 0.2) return '#dbeafe';
    if (intensity < 0.4) return '#93c5fd';
    if (intensity < 0.6) return '#60a5fa';
    if (intensity < 0.8) return '#3b82f6';
    return '#1d4ed8';
  };

  const formatCurrency = (value: number) => `₱${(value / 1000).toFixed(0)}K`;

  return (
    <motion.div
      className="chart-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="text-sm text-gray-600">
          Peak: {formatCurrency(maxValue)}
        </div>
      </div>

      <div className="bg-white rounded-lg p-4">
        {/* Hour labels */}
        <div className="flex mb-2">
          <div className="w-12"></div>
          {hours.filter((_, i) => i % 4 === 0).map(hour => (
            <div key={hour} className="flex-1 text-center text-xs text-gray-500">
              {hour}:00
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="space-y-1">
          {dataMatrix.map((dayData, dayIndex) => (
            <div key={days[dayIndex]} className="flex items-center">
              <div className="w-12 text-xs text-gray-600 font-medium">
                {days[dayIndex]}
              </div>
              <div className="flex space-x-1 flex-1">
                {dayData.map((cell, hourIndex) => (
                  <div
                    key={`${dayIndex}-${hourIndex}`}
                    className="flex-1 h-4 rounded-sm cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: getColor(cell.intensity) }}
                    title={`${cell.day} ${cell.hour}:00 - ${formatCurrency(cell.value)}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
          <span>Less</span>
          <div className="flex space-x-1">
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map(intensity => (
              <div
                key={intensity}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: getColor(intensity) }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">📊 Pattern Insights</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Peak sales typically occur during lunch (12-2 PM) and dinner (6-8 PM) hours</p>
          <p>• Weekend patterns show higher afternoon activity</p>
          <p>• Early morning (6-8 AM) shows consistent commuter traffic</p>
        </div>
      </div>
    </motion.div>
  );
};

export default HeatmapCalendar;