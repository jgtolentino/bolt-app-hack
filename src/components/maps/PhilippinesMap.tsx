import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ZoomIn, ZoomOut, Layers, RotateCcw, Download, Settings } from 'lucide-react';
import { GeographyData } from '../../types';
import { BoundaryService } from '../../services/boundaryService';

interface PhilippinesMapProps {
  data: GeographyData[];
  height?: number;
  onLocationSelect?: (location: GeographyData) => void;
}

interface BoundaryData {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: {
      REGCODE?: string;
      REGNAME?: string;
      PROVCODE?: string;
      PROVNAME?: string;
      MUNCODE?: string;
      MUNNAME?: string;
      BRGYCODE?: string;
      BRGYNAME?: string;
      [key: string]: any;
    };
    geometry: {
      type: 'Polygon' | 'MultiPolygon';
      coordinates: number[][][] | number[][][][];
    };
  }>;
}

const PhilippinesMap: React.FC<PhilippinesMapProps> = ({ 
  data, 
  height = 500, 
  onLocationSelect 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [boundaryData, setBoundaryData] = useState<BoundaryData | null>(null);
  const [viewMode, setViewMode] = useState<'bubble' | 'choropleth' | 'hybrid'>('bubble');
  const [selectedLocation, setSelectedLocation] = useState<GeographyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [boundaryLevel, setBoundaryLevel] = useState<'region' | 'province' | 'municipality' | 'barangay'>('region');
  const [mapboxLoaded, setMapboxLoaded] = useState(false);

  // Mapbox access token
  const MAPBOX_TOKEN = 'pk.eyJ1Ijoiamd0b2xlbnRpbm8iLCJhIjoiY21jMmNycWRiMDc0ajJqcHZoaDYyeTJ1NiJ9.Dns6WOql16BUQ4l7otaeww';

  // Load Mapbox GL JS dynamically
  useEffect(() => {
    const loadMapbox = async () => {
      if (typeof window === 'undefined') return;

      // Check if Mapbox GL is already loaded
      if ((window as any).mapboxgl) {
        setMapboxLoaded(true);
        return;
      }

      try {
        // Load Mapbox GL CSS
        const link = document.createElement('link');
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Load Mapbox GL JS
        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
        script.onload = () => {
          (window as any).mapboxgl.accessToken = MAPBOX_TOKEN;
          setMapboxLoaded(true);
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Failed to load Mapbox GL:', error);
      }
    };

    loadMapbox();
  }, []);

  // Initialize map when Mapbox is loaded
  useEffect(() => {
    if (mapboxLoaded && mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapboxLoaded]);

  // Load boundary data based on current level
  useEffect(() => {
    if (mapboxLoaded) {
      loadBoundaryData();
    }
  }, [boundaryLevel, mapboxLoaded]);

  const initializeMap = () => {
    if (!mapRef.current || !(window as any).mapboxgl) return;

    try {
      const mapboxgl = (window as any).mapboxgl;
      
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [121.0, 14.6], // Philippines center
        zoom: 6,
        attributionControl: false
      });

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      mapInstanceRef.current = map;

      // Load boundary data once map is ready
      map.on('load', () => {
        loadBoundaryData();
      });

    } catch (error) {
      console.error('Failed to initialize Mapbox map:', error);
    }
  };

  const loadBoundaryData = async () => {
    if (!mapInstanceRef.current) return;

    setLoading(true);
    try {
      let boundaryData;
      
      switch (boundaryLevel) {
        case 'region':
          boundaryData = await loadRegionBoundaries();
          break;
        case 'province':
          boundaryData = await loadProvinceBoundaries();
          break;
        case 'municipality':
          boundaryData = await loadMunicipalityBoundaries();
          break;
        case 'barangay':
          boundaryData = await loadBarangayBoundaries();
          break;
        default:
          boundaryData = await loadRegionBoundaries();
      }

      setBoundaryData(boundaryData);
      
      if (mapInstanceRef.current && boundaryData) {
        renderBoundaries(boundaryData);
      }
    } catch (error) {
      console.error('Failed to load boundary data:', error);
      // Use mock data as fallback
      const mockData = getMockBoundaryData();
      setBoundaryData(mockData);
      if (mapInstanceRef.current) {
        renderBoundaries(mockData);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRegionBoundaries = async (): Promise<BoundaryData> => {
    try {
      const data = await BoundaryService.loadRegionBoundaries();
      return data;
    } catch (error) {
      console.warn('Failed to load region boundaries:', error);
      return getMockBoundaryData();
    }
  };

  const loadProvinceBoundaries = async (): Promise<BoundaryData> => {
    try {
      const data = await BoundaryService.loadProvinceBoundaries();
      return data;
    } catch (error) {
      console.warn('Failed to load province boundaries:', error);
      return getMockBoundaryData();
    }
  };

  const loadMunicipalityBoundaries = async (): Promise<BoundaryData> => {
    try {
      const data = await BoundaryService.loadMunicipalityBoundaries();
      return data;
    } catch (error) {
      console.warn('Failed to load municipality boundaries:', error);
      return getMockBoundaryData();
    }
  };

  const loadBarangayBoundaries = async (): Promise<BoundaryData> => {
    try {
      // Try PSA ArcGIS REST service
      const response = await fetch(
        'https://portal.georisk.gov.ph/arcgis/rest/services/PSA/Barangay/MapServer/0/query?where=1%3D1&outFields=*&f=geojson&resultRecordCount=1000'
      );
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.warn('PSA barangay service failed, trying GitHub source:', error);
    }

    try {
      // Try GitHub repository
      const response = await fetch('https://raw.githubusercontent.com/altcoder/philippines-psgc-shapefiles/main/Barangay/Barangay.psgc.geojson');
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.warn('GitHub barangay data failed, using mock data:', error);
    }
    
    return getMockBoundaryData();
  };

  const transformGADMData = (gadmData: any, level: string): BoundaryData => {
    return {
      type: 'FeatureCollection',
      features: gadmData.features.map((feature: any) => ({
        ...feature,
        properties: {
          ...feature.properties,
          REGCODE: feature.properties.HASC_1?.split('.')[1] || '',
          REGNAME: feature.properties.NAME_1 || '',
          PROVCODE: feature.properties.HASC_2?.split('.')[2] || '',
          PROVNAME: feature.properties.NAME_2 || '',
          MUNCODE: feature.properties.HASC_3?.split('.')[3] || '',
          MUNNAME: feature.properties.NAME_3 || ''
        }
      }))
    };
  };

  const getMockBoundaryData = (): BoundaryData => {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            REGCODE: '13',
            REGNAME: 'NCR'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [120.9, 14.5],
              [121.1, 14.5],
              [121.1, 14.7],
              [120.9, 14.7],
              [120.9, 14.5]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            REGCODE: '07',
            REGNAME: 'Region VII'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [123.8, 10.2],
              [124.0, 10.2],
              [124.0, 10.4],
              [123.8, 10.4],
              [123.8, 10.2]
            ]]
          }
        }
      ]
    };
  };

  const renderBoundaries = (geoJsonData: BoundaryData) => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Wait for map style to load if not ready
    if (!map.isStyleLoaded()) {
      map.once('style.load', () => {
        renderBoundaries(geoJsonData);
      });
      return;
    }

    try {
      // Remove existing sources and layers safely
      ['boundary-fills', 'boundary-borders', 'data-points'].forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      });

      ['boundaries', 'data-points'].forEach(sourceId => {
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      });

      // Add boundary source
      map.addSource('boundaries', {
        type: 'geojson',
        data: geoJsonData
      });

    // Add choropleth layer if enabled
    if (viewMode === 'choropleth' || viewMode === 'hybrid') {
      map.addLayer({
        id: 'boundary-fills',
        type: 'fill',
        source: 'boundaries',
        paint: {
          'fill-color': [
            'case',
            ['!=', ['get', 'sales'], null],
            [
              'interpolate',
              ['linear'],
              ['get', 'sales'],
              0, '#f7f7f7',
              50000, '#cccccc',
              100000, '#969696',
              200000, '#636363',
              500000, '#252525'
            ],
            '#f0f0f0'
          ],
          'fill-opacity': 0.7
        }
      });
    }

    // Add boundary borders
    map.addLayer({
      id: 'boundary-borders',
      type: 'line',
      source: 'boundaries',
      paint: {
        'line-color': '#000000',
        'line-width': 1,
        'line-opacity': 0.8
      }
    });

    // Add data points if bubble mode is enabled and data is available
    if ((viewMode === 'bubble' || viewMode === 'hybrid') && data && data.length > 0) {
      // Ensure all data points have valid coordinates before creating the GeoJSON
      const validData = data.filter(location => 
        location && 
        typeof location.longitude === 'number' && 
        typeof location.latitude === 'number' &&
        !isNaN(location.longitude) && 
        !isNaN(location.latitude)
      );
      
      if (validData.length === 0) {
        console.warn('No valid geographic data points with coordinates found');
        return;
      }
      
      const dataPoints = {
        type: 'FeatureCollection',
        features: validData.map(location => ({
          type: 'Feature',
          properties: {
            ...location,
            sales: location.total_sales
          },
          geometry: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          }
        }))
      };

      map.addSource('data-points', {
        type: 'geojson',
        data: dataPoints
      });

      // Ensure maxSales is at least 1 to prevent interpolation errors
      const maxSales = Math.max(1, ...validData.map(d => d.total_sales));

      map.addLayer({
        id: 'data-points',
        type: 'circle',
        source: 'data-points',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'sales'],
            0, 5,
            maxSales, 30
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'sales'],
            0, '#3B82F6',
            maxSales * 0.5, '#14B8A6',
            maxSales, '#F97316'
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Add click handler for data points
      map.on('click', 'data-points', (e: any) => {
        if (!e.features || e.features.length === 0) return;
        
        const feature = e.features[0];
        const location = feature.properties;
        
        if (onLocationSelect) {
          onLocationSelect(location);
        }
        setSelectedLocation(location);

        // Show popup
        const mapboxgl = (window as any).mapboxgl;
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-2">
              <h4 class="font-semibold">${location.store_name}</h4>
              <p class="text-sm text-gray-600">${location.barangay}, ${location.city_municipality}</p>
              <p>Sales: ₱${location.total_sales.toLocaleString()}</p>
              <p>Transactions: ${location.transaction_count.toLocaleString()}</p>
            </div>
          `)
          .addTo(map);
      });
    }

    // Add click handler for boundaries
    map.on('click', 'boundary-fills', (e: any) => {
      if (!e.features || e.features.length === 0) return;
      
      const feature = e.features[0];
      const properties = feature.properties;
      
      const mapboxgl = (window as any).mapboxgl;
      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
          <div class="p-2">
            <h4 class="font-semibold">${properties.BRGYNAME || properties.MUNNAME || properties.PROVNAME || properties.REGNAME}</h4>
            <p class="text-sm text-gray-600">Code: ${properties.BRGYCODE || properties.MUNCODE || properties.PROVCODE || properties.REGCODE}</p>
          </div>
        `)
        .addTo(map);
    });

    // Fit map to boundaries
    if (geoJsonData.features.length > 0) {
      try {
        const mapboxgl = (window as any).mapboxgl;
        const bounds = new mapboxgl.LngLatBounds();
        let hasValidCoordinates = false;
      
      geoJsonData.features.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates[0].forEach(coord => {
            if (Array.isArray(coord) && coord.length >= 2 && 
                typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
                !isNaN(coord[0]) && !isNaN(coord[1])) {
              // Ensure coordinates are in [lng, lat] format
              const lngLat: [number, number] = [coord[0], coord[1]];
              bounds.extend(lngLat);
              hasValidCoordinates = true;
            }
          });
        } else if (feature.geometry.type === 'MultiPolygon') {
          feature.geometry.coordinates.forEach(polygon => {
            polygon[0].forEach(coord => {
              if (Array.isArray(coord) && coord.length >= 2 && 
                  typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
                  !isNaN(coord[0]) && !isNaN(coord[1])) {
                // Ensure coordinates are in [lng, lat] format
                const lngLat: [number, number] = [coord[0], coord[1]];
                bounds.extend(lngLat);
                hasValidCoordinates = true;
              }
            });
          });
        }
      });
      
      // Only fit bounds if we have valid coordinates
      if (hasValidCoordinates && !bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50 });
      } else {
        // Fallback to Philippines center if no valid bounds
        map.setCenter([121.0, 14.6]);
        map.setZoom(6);
      }
      } catch (error) {
        console.error('Error fitting bounds:', error);
        // Fallback to Philippines center on any error
        map.setCenter([121.0, 14.6]);
        map.setZoom(6);
      }
    }
    } catch (error) {
      console.error('Error rendering boundaries:', error);
      // If there's an error, try again after a short delay
      setTimeout(() => {
        if (mapInstanceRef.current && mapInstanceRef.current.isStyleLoaded()) {
          renderBoundaries(geoJsonData);
        }
      }, 1000);
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [121.0, 14.6],
        zoom: 6
      });
    }
  };

  const downloadBoundaryData = async () => {
    if (!boundaryData) return;
    
    const dataStr = JSON.stringify(boundaryData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `philippines-${boundaryLevel}-boundaries.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
        <h3 className="text-lg font-semibold text-gray-900">Philippines Geographic Analytics</h3>
        
        {/* Controls */}
        <div className="flex items-center space-x-2">
          {/* Boundary Level Selector */}
          <select
            value={boundaryLevel}
            onChange={(e) => setBoundaryLevel(e.target.value as any)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
            disabled={loading}
          >
            <option value="region">Regions</option>
            <option value="province">Provinces</option>
            <option value="municipality">Municipalities</option>
            <option value="barangay">Barangays</option>
          </select>

          {/* View Mode Controls */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['bubble', 'choropleth', 'hybrid'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  viewMode === mode
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Download Button */}
          <button
            onClick={downloadBoundaryData}
            disabled={!boundaryData}
            className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50"
            title="Download boundary data"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200" style={{ height }}>
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Loading boundary data...</span>
            </div>
          </div>
        )}
        
        <div ref={mapRef} className="w-full h-full" />

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-20">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-white transition-colors"
          >
            <ZoomIn className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-white transition-colors"
          >
            <ZoomOut className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={handleResetView}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-white transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md z-20">
          <p className="text-xs font-medium text-gray-700 mb-2">Performance</p>
          <div className="flex items-center space-x-3 text-xs">
            {[
              { color: '#F97316', label: 'High' },
              { color: '#14B8A6', label: 'Good' },
              { color: '#3B82F6', label: 'Average' },
              { color: '#6B7280', label: 'Low' }
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center space-x-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Source Info */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-md z-20">
          <p className="text-xs text-gray-600">
            Boundaries: {boundaryLevel === 'barangay' ? 'PSA/PSGC' : 'GADM'} | Data: {data.length} locations
          </p>
        </div>
      </div>

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
              <p className="text-primary-700">
                {selectedLocation.barangay}, {selectedLocation.city_municipality}, {selectedLocation.region}
              </p>
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
                  <span className="text-primary-600">Avg Value:</span>
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

      {/* Boundary Data Sources Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
        <p className="font-medium mb-1">Boundary Data Sources:</p>
        <ul className="space-y-1">
          <li>• <strong>Regions/Provinces/Municipalities:</strong> GADM v4.1 Global Administrative Areas</li>
          <li>• <strong>Barangays:</strong> PSA ArcGIS REST Service + PSGC GitHub Repository</li>
          <li>• <strong>Mapbox GL JS:</strong> High-performance vector rendering with your token</li>
        </ul>
        <p className="mt-2">
          <strong>Note:</strong> Barangay boundaries are loaded from official PSA sources and may take longer to load.
        </p>
      </div>
    </motion.div>
  );
};

export default PhilippinesMap;