import React from 'react';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { format } from 'date-fns';

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
    
    // Create hour keys for the heatmap
    const hours = Array.from({ length: 24 }, (_, i) => ({
      id: i.toString(),
      data: [] as Array<{ x: string; y: number }>
    }));
    
    // Initialize data with zeros
    dayNames.forEach((day) => {
      hours.forEach((hour) => {
        hour.data.push({ 
          x: day, 
          y: 0 
        });
      });
    });

    // Populate with transaction data
    transactions.forEach(transaction => {
      const dayName = format(transaction.timestamp, 'EEEE');
      const hour = transaction.timestamp.getHours();
      const dayIndex = dayNames.indexOf(dayName);
      
      if (dayIndex !== -1 && hours[hour]) {
        const dataPoint = hours[hour].data[dayIndex];
        if (metric === 'count') {
          dataPoint.y += 1;
        } else if (metric === 'value') {
          dataPoint.y += transaction.transaction_value;
        } else { // average - we'll need to track count separately
          // For simplicity, we'll accumulate and divide later
          dataPoint.y += transaction.transaction_value;
        }
      }
    });

    // If metric is average, we need to divide by count
    if (metric === 'average') {
      const countMap = new Map<string, number>();
      
      // First pass: count transactions
      transactions.forEach(transaction => {
        const dayName = format(transaction.timestamp, 'EEEE');
        const hour = transaction.timestamp.getHours();
        const key = `${dayName}-${hour}`;
        countMap.set(key, (countMap.get(key) || 0) + 1);
      });
      
      // Second pass: convert sums to averages
      hours.forEach((hour, hourIndex) => {
        hour.data.forEach((dataPoint, dayIndex) => {
          const key = `${dayNames[dayIndex]}-${hourIndex}`;
          const count = countMap.get(key) || 0;
          if (count > 0) {
            dataPoint.y = dataPoint.y / count;
          }
        });
      });
    }

    return hours;
  }, [transactions, metric]);

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
          margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
          valueFormat={(value) => {
            if (metric === 'count') return `${value}`;
            return `₱${value.toFixed(2)}`;
          }}
          axisTop={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: 'Day of Week',
            legendOffset: -40
          }}
          axisRight={null}
          axisBottom={null}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Hour of Day',
            legendOffset: -70,
            format: (value) => {
              const hour = parseInt(value);
              if (hour === 0) return '12AM';
              if (hour === 12) return '12PM';
              if (hour < 12) return `${hour}AM`;
              return `${hour - 12}PM`;
            }
          }}
          cellOpacity={1}
          cellBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.8]] }}
          colors={{
            type: 'sequential',
            scheme: 'blues'
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