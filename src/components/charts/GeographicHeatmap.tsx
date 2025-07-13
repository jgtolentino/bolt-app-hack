import React from 'react';
import Map, { Source, Layer, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  geoJson: any; // GeoJSON FeatureCollection
  metric?: 'value' | 'transactions' | 'customers' | 'avgBasketSize';
  mapboxToken?: string;
}

const GeographicHeatmap: React.FC<GeographicHeatmapProps> = ({ 
  regionData, 
  geoJson,
  metric = 'value',
  mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
}) => {
  const [popupInfo, setPopupInfo] = React.useState<{
    longitude: number;
    latitude: number;
    data: RegionData;
  } | null>(null);

  // Merge region data with GeoJSON
  const enrichedGeoJson = React.useMemo(() => {
    if (!geoJson) return null;

    const dataMap = new Map(regionData.map(r => [r.id, r]));
    
    return {
      ...geoJson,
      features: geoJson.features.map((feature: any) => {
        const regionId = feature.properties.id || feature.properties.name;
        const data = dataMap.get(regionId);
        
        return {
          ...feature,
          properties: {
            ...feature.properties,
            ...(data || { value: 0, transactions: 0, customers: 0, avgBasketSize: 0 })
          }
        };
      })
    };
  }, [geoJson, regionData]);

  // Calculate color scale bounds
  const colorScale = React.useMemo(() => {
    const values = regionData.map(r => {
      switch (metric) {
        case 'transactions': return r.transactions || 0;
        case 'customers': return r.customers || 0;
        case 'avgBasketSize': return r.avgBasketSize || 0;
        default: return r.value;
      }
    });
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { min, max };
  }, [regionData, metric]);

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

  if (!mapboxToken) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Mapbox token not configured. Add NEXT_PUBLIC_MAPBOX_TOKEN to your environment.
          </p>
        </div>
      </div>
    );
  }

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
        <Map
          mapboxAccessToken={mapboxToken}
          initialViewState={{
            longitude: 121.774,
            latitude: 12.8797,
            zoom: 5
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          interactiveLayerIds={['region-fill']}
          onClick={(e: any) => {
            const feature = e.features?.[0];
            if (feature && feature.properties) {
              const coordinates = e.lngLat;
              setPopupInfo({
                longitude: coordinates.lng,
                latitude: coordinates.lat,
                data: {
                  id: feature.properties.id,
                  name: feature.properties.name,
                  value: feature.properties.value,
                  transactions: feature.properties.transactions,
                  customers: feature.properties.customers,
                  avgBasketSize: feature.properties.avgBasketSize
                }
              });
            }
          }}
        >
          {enrichedGeoJson && (
            <Source id="regions" type="geojson" data={enrichedGeoJson}>
              <Layer
                id="region-fill"
                type="fill"
                paint={{
                  'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['get', metric],
                    colorScale.min,
                    '#deebf7',
                    colorScale.min + (colorScale.max - colorScale.min) * 0.25,
                    '#9ecae1',
                    colorScale.min + (colorScale.max - colorScale.min) * 0.5,
                    '#4292c6',
                    colorScale.min + (colorScale.max - colorScale.min) * 0.75,
                    '#2171b5',
                    colorScale.max,
                    '#084594'
                  ],
                  'fill-opacity': 0.7
                }}
              />
              <Layer
                id="region-outline"
                type="line"
                paint={{
                  'line-color': '#000',
                  'line-width': 1
                }}
              />
            </Source>
          )}

          {popupInfo && (
            <Popup
              longitude={popupInfo.longitude}
              latitude={popupInfo.latitude}
              anchor="bottom"
              onClose={() => setPopupInfo(null)}
            >
              <div className="p-2">
                <h4 className="font-semibold text-gray-900">{popupInfo.data.name}</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sales:</span>
                    <span className="font-medium">₱{popupInfo.data.value.toLocaleString()}</span>
                  </div>
                  {popupInfo.data.transactions !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transactions:</span>
                      <span className="font-medium">{popupInfo.data.transactions.toLocaleString()}</span>
                    </div>
                  )}
                  {popupInfo.data.customers !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customers:</span>
                      <span className="font-medium">{popupInfo.data.customers.toLocaleString()}</span>
                    </div>
                  )}
                  {popupInfo.data.avgBasketSize !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Basket:</span>
                      <span className="font-medium">₱{popupInfo.data.avgBasketSize.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          )}
        </Map>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
          <h5 className="text-xs font-semibold text-gray-700 mb-2">
            {metricLabels[metric]}
          </h5>
          <div className="flex items-center space-x-2">
            <div className="w-20 h-3 rounded" style={{
              background: 'linear-gradient(to right, #deebf7, #9ecae1, #4292c6, #2171b5, #084594)'
            }} />
            <div className="flex justify-between w-20 text-xs text-gray-600">
              <span>{formatValue(colorScale.min)}</span>
              <span>{formatValue(colorScale.max)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Regions */}
      <div className="mt-6 grid grid-cols-2 gap-4">
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
              .slice(0, 3)
              .map((region, index) => {
                const val = metric === 'transactions' ? (region.transactions || 0) :
                          metric === 'customers' ? (region.customers || 0) :
                          metric === 'avgBasketSize' ? (region.avgBasketSize || 0) :
                          region.value;
                return (
                  <li key={index}>
                    {index + 1}. {region.name}: {formatValue(val)}
                  </li>
                );
              })}
          </ul>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Geographic Insights</h4>
          <p className="text-sm text-gray-700">
            Click on any region to see detailed metrics. The color intensity 
            represents the {metricLabels[metric].toLowerCase()}. 
            Darker regions indicate higher values.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeographicHeatmap;