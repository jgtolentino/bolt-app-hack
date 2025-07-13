import React from 'react';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { format, startOfWeek, addDays } from 'date-fns';

interface TransactionHeatmapProps {
  transactions: Array<{
    timestamp: Date;
    transaction_value: number;
  }>;
  metric?: 'count' | 'value' | 'average';
}

const TransactionHeatmap: React.FC<TransactionHeatmapProps> = ({ 
  transactions, 
  metric = 'count' 
}) => {
  const heatmapData = React.useMemo(() => {
    // Initialize data structure
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hourKeys = Array.from({ length: 24 }, (_, i) => i.toString());
    
    // Create initial structure with all days and hours
    const dataMap = new Map<string, Map<number, { count: number; value: number }>>();
    dayNames.forEach(day => {
      const hourMap = new Map<number, { count: number; value: number }>();
      for (let hour = 0; hour < 24; hour++) {
        hourMap.set(hour, { count: 0, value: 0 });
      }
      dataMap.set(day, hourMap);
    });

    // Populate with transaction data
    transactions.forEach(transaction => {
      const dayName = format(transaction.timestamp, 'EEEE');
      const hour = transaction.timestamp.getHours();
      
      const dayData = dataMap.get(dayName);
      if (dayData) {
        const hourData = dayData.get(hour) || { count: 0, value: 0 };
        hourData.count += 1;
        hourData.value += transaction.transaction_value;
        dayData.set(hour, hourData);
      }
    });

    // Convert to Nivo format
    return dayNames.map(day => {
      const dayData = dataMap.get(day)!;
      const row: any = { day };
      
      hourKeys.forEach(hourKey => {
        const hour = parseInt(hourKey);
        const hourData = dayData.get(hour) || { count: 0, value: 0 };
        
        if (metric === 'count') {
          row[hourKey] = hourData.count;
        } else if (metric === 'value') {
          row[hourKey] = hourData.value;
        } else { // average
          row[hourKey] = hourData.count > 0 ? hourData.value / hourData.count : 0;
        }
      });
      
      return row;
    });
  }, [transactions, metric]);

  // Calculate max value for color scale
  const maxValue = React.useMemo(() => {
    let max = 0;
    heatmapData.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key !== 'day' && row[key] > max) {
          max = row[key];
        }
      });
    });
    return max;
  }, [heatmapData]);

  const metricLabels = {
    count: 'Number of Transactions',
    value: 'Total Transaction Value (₱)',
    average: 'Average Transaction Value (₱)'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Transaction Density Heatmap
        </h3>
        <div className="text-sm text-gray-600">
          {metricLabels[metric]}
        </div>
      </div>

      <div style={{ height: '400px' }}>
        <ResponsiveHeatMap
          data={heatmapData}
          keys={Array.from({ length: 24 }, (_, i) => i.toString())}
          indexBy="day"
          margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
          forceSquare={true}
          axisTop={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: '',
            legendOffset: 46,
            format: (value) => {
              const hour = parseInt(value);
              if (hour % 3 === 0) {
                return hour === 0 ? '12AM' : 
                       hour === 12 ? '12PM' : 
                       hour < 12 ? `${hour}AM` : `${hour-12}PM`;
              }
              return '';
            }
          }}
          axisRight={null}
          axisBottom={null}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: '',
            legendOffset: -40
          }}
          cellOpacity={1}
          cellBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.8]] }}
          tooltip={({ xKey, yKey, value, color }) => {
            const hour = parseInt(xKey);
            const hourLabel = hour === 0 ? '12:00 AM' : 
                            hour === 12 ? '12:00 PM' : 
                            hour < 12 ? `${hour}:00 AM` : `${hour-12}:00 PM`;
            
            return (
              <div className="bg-white shadow-lg rounded px-3 py-2 text-sm">
                <div className="font-semibold">{yKey} at {hourLabel}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: color }}
                  />
                  <span>
                    {metric === 'count' ? `${value} transactions` :
                     metric === 'value' ? `₱${value.toFixed(2)}` :
                     `₱${value.toFixed(2)} avg`}
                  </span>
                </div>
              </div>
            );
          }}
          colors={{
            type: 'sequential',
            scheme: 'blues',
            minValue: 0,
            maxValue: maxValue
          }}
          emptyColor="#f3f4f6"
          legends={[
            {
              anchor: 'bottom',
              translateX: 0,
              translateY: 30,
              length: 400,
              thickness: 8,
              direction: 'row',
              tickPosition: 'after',
              tickSize: 3,
              tickSpacing: 4,
              tickOverlap: false,
              title: metric === 'count' ? 'Transactions →' : 
                     metric === 'value' ? 'Value (₱) →' : 'Avg Value (₱) →',
              titleAlign: 'start',
              titleOffset: 4
            }
          ]}
        />
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Peak Hours:</strong> The heatmap shows transaction patterns across days and hours.
          Darker colors indicate higher {metric === 'count' ? 'transaction volume' : 
                                        metric === 'value' ? 'total sales' : 'average transaction values'}.
          Look for patterns in customer behavior throughout the week.
        </p>
      </div>
    </div>
  );
};

export default TransactionHeatmap;