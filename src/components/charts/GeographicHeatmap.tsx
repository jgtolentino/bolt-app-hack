import React from 'react';

interface RegionData {
  id: string;
  name: string;
  value: number;
  transactions?: number;
  customers?: number;
  avgBasketSize?: number;
}

interface GeographicHeatmapProps {
  regionData: RegionData[];
  geoJson?: any; // GeoJSON FeatureCollection
  metric?: 'value' | 'transactions' | 'customers' | 'avgBasketSize';
  mapboxToken?: string;
}

const GeographicHeatmap: React.FC<GeographicHeatmapProps> = ({ 
  regionData, 
  metric = 'value'
}) => {
  const metricLabels = {
    value: 'Total Sales (₱)',
    transactions: 'Transaction Count',
    customers: 'Customer Count',
    avgBasketSize: 'Avg Basket Size (₱)'
  };

  const formatValue = (value: number) => {
    switch (metric) {
      case 'value':
      case 'avgBasketSize':
        return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Geographic Distribution
        </h3>
        <div className="text-sm text-gray-600">
          {metricLabels[metric]}
        </div>
      </div>

      <div className="relative" style={{ height: '500px' }}>
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Interactive Map</h4>
            <p className="text-gray-600 max-w-sm">
              Geographic visualization coming soon. Configure Mapbox token to enable interactive regional mapping.
            </p>
          </div>
        </div>
      </div>

      {/* Top Regions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Top Performing Regions</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {regionData
              .sort((a, b) => {
                const aVal = metric === 'transactions' ? (a.transactions || 0) :
                           metric === 'customers' ? (a.customers || 0) :
                           metric === 'avgBasketSize' ? (a.avgBasketSize || 0) :
                           a.value;
                const bVal = metric === 'transactions' ? (b.transactions || 0) :
                           metric === 'customers' ? (b.customers || 0) :
                           metric === 'avgBasketSize' ? (b.avgBasketSize || 0) :
                           b.value;
                return bVal - aVal;
              })
              .slice(0, 5)
              .map((region, index) => {
                const val = metric === 'transactions' ? (region.transactions || 0) :
                          metric === 'customers' ? (region.customers || 0) :
                          metric === 'avgBasketSize' ? (region.avgBasketSize || 0) :
                          region.value;
                return (
                  <li key={region.id} className="flex justify-between">
                    <span>{index + 1}. {region.name}</span>
                    <span className="font-medium">{formatValue(val)}</span>
                  </li>
                );
              })}
          </ul>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Regional Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Regions:</span>
              <span className="font-medium">{regionData.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total {metricLabels[metric]}:</span>
              <span className="font-medium">
                {formatValue(regionData.reduce((sum, region) => {
                  const val = metric === 'transactions' ? (region.transactions || 0) :
                            metric === 'customers' ? (region.customers || 0) :
                            metric === 'avgBasketSize' ? (region.avgBasketSize || 0) :
                            region.value;
                  return sum + val;
                }, 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average per Region:</span>
              <span className="font-medium">
                {formatValue(regionData.reduce((sum, region) => {
                  const val = metric === 'transactions' ? (region.transactions || 0) :
                            metric === 'customers' ? (region.customers || 0) :
                            metric === 'avgBasketSize' ? (region.avgBasketSize || 0) :
                            region.value;
                  return sum + val;
                }, 0) / regionData.length)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeographicHeatmap;