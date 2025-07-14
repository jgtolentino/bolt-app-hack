/**
 * Scout Dash 2.0 - Geospatial Heatmap
 * Interactive map with heatmap overlay using Leaflet
 * Inspired by retail-insights-dashboard-ph
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BaseVisual } from '../BaseVisual';
import { VisualBlueprint } from '../../../types';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface GeospatialHeatmapProps {
  blueprint: VisualBlueprint;
  data: any[];
  width?: number;
  height?: number;
  onSelectionChange?: (selection: any) => void;
  center?: [number, number];
  zoom?: number;
}

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
  name?: string;
  value?: number;
  originalData?: any;
}

export const GeospatialHeatmap: React.FC<GeospatialHeatmapProps> = ({
  blueprint,
  data,
  width,
  height = 400,
  onSelectionChange,
  center = [14.5995, 120.9842], // Philippines center
  zoom = 6
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const heatmapLayerRef = useRef<any>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Process data for heatmap
  const processHeatmapData = (): HeatmapPoint[] => {
    if (!data || data.length === 0) return [];

    const latField = blueprint.encoding.latitude?.field || 'lat' || 'latitude';
    const lngField = blueprint.encoding.longitude?.field || 'lng' || 'longitude';
    const intensityField = blueprint.encoding.size?.field || blueprint.encoding.color?.field || 'value';
    const nameField = blueprint.encoding.text?.field || 'name';

    return data
      .filter(item => 
        item[latField] != null && 
        item[lngField] != null && 
        !isNaN(parseFloat(item[latField])) && 
        !isNaN(parseFloat(item[lngField]))
      )
      .map(item => ({
        lat: parseFloat(item[latField]),
        lng: parseFloat(item[lngField]),
        intensity: parseFloat(item[intensityField]) || 1,
        name: item[nameField] || 'Unknown',
        value: parseFloat(item[intensityField]) || 0,
        originalData: item
      }));
  };

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        // Clean up existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        // Create new map
        const map = L.map(mapRef.current, {
          center,
          zoom,
          scrollWheelZoom: true,
          zoomControl: true
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(map);

        mapInstanceRef.current = map;

        // Process heatmap data
        const heatmapData = processHeatmapData();

        if (heatmapData.length > 0) {
          // Add markers layer
          const markersLayer = L.layerGroup().addTo(map);
          markersRef.current = markersLayer;

          // Create color scale based on intensity values
          const intensities = heatmapData.map(point => point.intensity);
          const minIntensity = Math.min(...intensities);
          const maxIntensity = Math.max(...intensities);

          const getColor = (intensity: number): string => {
            const normalizedIntensity = (intensity - minIntensity) / (maxIntensity - minIntensity);
            if (normalizedIntensity <= 0.25) return '#3b82f6'; // Blue
            if (normalizedIntensity <= 0.5) return '#10b981';  // Green
            if (normalizedIntensity <= 0.75) return '#f59e0b'; // Yellow
            return '#ef4444'; // Red
          };

          const getRadius = (intensity: number): number => {
            const normalizedIntensity = (intensity - minIntensity) / (maxIntensity - minIntensity);
            return Math.max(5, Math.min(20, 5 + normalizedIntensity * 15));
          };

          // Add circle markers
          heatmapData.forEach(point => {
            const marker = L.circleMarker([point.lat, point.lng], {
              radius: getRadius(point.intensity),
              fillColor: getColor(point.intensity),
              color: 'white',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.7
            });

            // Add popup
            const popupContent = `
              <div class="p-2">
                <h3 class="font-bold text-gray-900">${point.name}</h3>
                <p class="text-sm text-gray-600">Value: ${point.value.toLocaleString()}</p>
                <p class="text-sm text-gray-600">Location: ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}</p>
              </div>
            `;

            marker.bindPopup(popupContent);

            // Add click handler
            marker.on('click', () => {
              if (onSelectionChange) {
                onSelectionChange({
                  type: 'geospatial-point',
                  point: {
                    lat: point.lat,
                    lng: point.lng,
                    name: point.name,
                    value: point.value
                  },
                  originalData: point.originalData
                });
              }
            });

            markersLayer.addLayer(marker);
          });

          // Fit map bounds to data
          const group = new L.featureGroup(markersLayer.getLayers());
          map.fitBounds(group.getBounds().pad(0.1));

          // Add legend
          const legend = L.control({ position: 'bottomright' });
          legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'info legend');
            div.style.backgroundColor = 'white';
            div.style.padding = '10px';
            div.style.border = '1px solid #ccc';
            div.style.borderRadius = '5px';
            div.style.fontSize = '12px';

            const ranges = [
              { min: 0, max: 0.25, color: '#3b82f6', label: 'Low' },
              { min: 0.25, max: 0.5, color: '#10b981', label: 'Medium' },
              { min: 0.5, max: 0.75, color: '#f59e0b', label: 'High' },
              { min: 0.75, max: 1, color: '#ef4444', label: 'Very High' }
            ];

            let legendHTML = '<strong>Intensity</strong><br>';
            ranges.forEach(range => {
              legendHTML += `
                <div style="display: flex; align-items: center; margin: 2px 0;">
                  <div style="width: 12px; height: 12px; background-color: ${range.color}; margin-right: 5px; border: 1px solid #ccc;"></div>
                  ${range.label}
                </div>
              `;
            });

            div.innerHTML = legendHTML;
            return div;
          };
          legend.addTo(map);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize map');
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [data, blueprint.encoding, center, zoom, onSelectionChange]);

  const heatmapData = processHeatmapData();

  if (error) {
    return (
      <BaseVisual blueprint={blueprint} width={width} height={height}>
        <div className="flex items-center justify-center h-full text-red-500">
          <div className="text-center">
            <div className="text-lg font-medium">Map Error</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      </BaseVisual>
    );
  }

  if (heatmapData.length === 0) {
    return (
      <BaseVisual blueprint={blueprint} width={width} height={height}>
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-lg font-medium">No Geographic Data</div>
            <div className="text-sm">No valid latitude/longitude coordinates found</div>
          </div>
        </div>
      </BaseVisual>
    );
  }

  return (
    <BaseVisual blueprint={blueprint} width={width} height={height}>
      <div className="space-y-4">
        {/* Summary Statistics */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {heatmapData.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Data Points
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.min(...heatmapData.map(p => p.value)).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Min Value
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {Math.max(...heatmapData.map(p => p.value)).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Max Value
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {(heatmapData.reduce((sum, p) => sum + p.value, 0) / heatmapData.length).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Average
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {isLoading && (
            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Loading map...
                </div>
              </div>
            </div>
          )}
          <div
            ref={mapRef}
            style={{ height: `${height}px`, width: '100%' }}
            className="z-0"
          />
        </div>

        {/* Map Controls */}
        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (mapInstanceRef.current && markersRef.current) {
                  const group = new L.featureGroup(markersRef.current.getLayers());
                  mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
                }
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
            >
              Fit to Data
            </button>
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView(center, zoom);
                }
              }}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
            >
              Reset View
            </button>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Click markers for details • Zoom with scroll wheel
          </div>
        </div>
      </div>
    </BaseVisual>
  );
};

export default GeospatialHeatmap;