/**
 * Scout Dash 2.0 - Base Visual Component
 * Base class for all visual components with common functionality
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertCircle, RefreshCw, Download, Settings } from 'lucide-react';
import { VisualBlueprint } from '../types';
import { VisualComponentProps } from './VisualRegistry';

export interface BaseVisualState {
  isLoading: boolean;
  error?: string;
  selectedData: any[];
  hoveredData?: any;
}

export interface BaseVisualProps extends VisualComponentProps {
  showToolbar?: boolean;
  showTitle?: boolean;
  interactive?: boolean;
}

export const BaseVisual: React.FC<BaseVisualProps> = ({
  blueprint,
  data,
  width,
  height,
  onSelection,
  onFilter,
  isSelected = false,
  theme = 'light',
  showToolbar = true,
  showTitle = true,
  interactive = true,
  children
}) => {
  const [state, setState] = useState<BaseVisualState>({
    isLoading: false,
    error: undefined,
    selectedData: []
  });

  // Calculate dimensions for the actual chart area
  const toolbarHeight = showToolbar ? 40 : 0;
  const titleHeight = showTitle ? 32 : 0;
  const padding = 16;
  
  const chartWidth = width - (padding * 2);
  const chartHeight = height - titleHeight - toolbarHeight - (padding * 2);

  // Theme configuration
  const themeConfig = useMemo(() => ({
    colors: {
      primary: theme === 'dark' ? '#3b82f6' : '#2563eb',
      secondary: theme === 'dark' ? '#64748b' : '#475569',
      background: theme === 'dark' ? '#1e293b' : '#ffffff',
      text: theme === 'dark' ? '#f1f5f9' : '#1e293b',
      border: theme === 'dark' ? '#334155' : '#e2e8f0',
      grid: theme === 'dark' ? '#374151' : '#f1f5f9'
    },
    fonts: {
      title: 'font-semibold text-sm',
      label: 'font-normal text-xs',
      axis: 'font-normal text-xs'
    }
  }), [theme]);

  // Data processing and validation
  const processedData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    try {
      // Apply data transformations based on blueprint encoding
      return data.map(row => {
        const processedRow = { ...row };
        
        // Format values based on encoding format strings
        Object.entries(blueprint.encoding).forEach(([channel, encoding]) => {
          if (encoding && encoding.field && encoding.format) {
            const value = row[encoding.field];
            if (value !== null && value !== undefined) {
              processedRow[encoding.field] = formatValue(value, encoding.format);
            }
          }
        });

        return processedRow;
      });
    } catch (error) {
      console.error('Error processing visual data:', error);
      setState(prev => ({ ...prev, error: 'Data processing failed' }));
      return [];
    }
  }, [data, blueprint.encoding]);

  // Selection handling
  const handleSelection = useCallback((field: string, values: any[]) => {
    if (!interactive) return;

    setState(prev => ({ ...prev, selectedData: values }));
    onSelection?.(field, values);
  }, [interactive, onSelection]);

  // Hover handling
  const handleHover = useCallback((item: any) => {
    if (!interactive) return;

    setState(prev => ({ ...prev, hoveredData: item }));
  }, [interactive]);

  // Filter handling
  const handleFilter = useCallback((field: string, value: any, operator: string = 'eq') => {
    if (!interactive) return;

    onFilter?.(field, value, operator);
  }, [interactive, onFilter]);

  // Export functionality
  const handleExport = useCallback((format: 'csv' | 'png' | 'svg' = 'csv') => {
    try {
      if (format === 'csv') {
        exportToCSV(processedData, `${blueprint.title || 'chart'}.csv`);
      } else if (format === 'png') {
        exportToPNG(`visual-${blueprint.id}`, `${blueprint.title || 'chart'}.png`);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [processedData, blueprint]);

  // Error boundary
  useEffect(() => {
    if (state.error) {
      console.error(`Visual error in ${blueprint.title}:`, state.error);
    }
  }, [state.error, blueprint.title]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!interactive || !isSelected) return;

      switch (event.key) {
        case 'Escape':
          handleSelection('', []);
          break;
        case 'Enter':
          if (state.hoveredData) {
            // Trigger selection on hovered item
            const field = Object.keys(blueprint.encoding)[0] || '';
            handleSelection(field, [state.hoveredData]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [interactive, isSelected, state.hoveredData, blueprint.encoding, handleSelection]);

  if (state.error) {
    return (
      <div 
        className={`flex flex-col items-center justify-center p-4 border rounded-lg ${
          theme === 'dark' ? 'bg-red-900/20 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-700'
        }`}
        style={{ width, height }}
      >
        <AlertCircle className="w-8 h-8 mb-2" />
        <div className="text-sm font-medium">Visualization Error</div>
        <div className="text-xs opacity-75 mt-1 text-center">{state.error}</div>
      </div>
    );
  }

  if (processedData.length === 0) {
    return (
      <div 
        className={`flex flex-col items-center justify-center p-4 border rounded-lg ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
        }`}
        style={{ width, height }}
      >
        <div className="text-sm font-medium">No Data Available</div>
        <div className="text-xs opacity-75 mt-1">This visualization has no data to display</div>
      </div>
    );
  }

  return (
    <div 
      className={`relative border rounded-lg overflow-hidden ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
      style={{ width, height }}
      role="img"
      aria-label={`${blueprint.type} chart: ${blueprint.title}`}
      tabIndex={interactive ? 0 : -1}
    >
      {/* Title */}
      {showTitle && blueprint.title && (
        <div className={`px-4 py-2 border-b ${
          theme === 'dark' ? 'border-gray-700 text-gray-200' : 'border-gray-200 text-gray-800'
        }`}>
          <h3 className="text-sm font-semibold truncate">{blueprint.title}</h3>
          {blueprint.description && (
            <p className="text-xs opacity-75 truncate">{blueprint.description}</p>
          )}
        </div>
      )}

      {/* Toolbar */}
      {showToolbar && (
        <div className={`absolute top-2 right-2 flex space-x-1 z-10 ${
          theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'
        } rounded px-2 py-1 backdrop-blur-sm`}>
          <button
            onClick={() => handleExport('csv')}
            className={`p-1 rounded hover:bg-opacity-10 hover:bg-gray-500 ${
              theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
            }`}
            title="Export to CSV"
          >
            <Download className="w-3 h-3" />
          </button>
          <button
            onClick={() => window.location.reload()}
            className={`p-1 rounded hover:bg-opacity-10 hover:bg-gray-500 ${
              theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
            }`}
            title="Refresh"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Chart Content */}
      <div className="p-4" style={{ height: chartHeight + padding * 2 }}>
        {React.cloneElement(children as React.ReactElement, {
          data: processedData,
          width: chartWidth,
          height: chartHeight,
          blueprint,
          theme: themeConfig,
          onSelection: handleSelection,
          onHover: handleHover,
          onFilter: handleFilter,
          selectedData: state.selectedData,
          hoveredData: state.hoveredData,
          interactive
        })}
      </div>

      {/* Loading overlay */}
      {state.isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Utility functions

function formatValue(value: any, format: string): string {
  if (value === null || value === undefined) return '';

  try {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-PH', { 
          style: 'currency', 
          currency: 'PHP' 
        }).format(Number(value));
      
      case 'percent':
        return new Intl.NumberFormat('en-US', { 
          style: 'percent' 
        }).format(Number(value));
      
      case 'number':
        return new Intl.NumberFormat('en-US').format(Number(value));
      
      case 'date':
        return new Date(value).toLocaleDateString();
      
      case 'datetime':
        return new Date(value).toLocaleString();
      
      case 'time':
        return new Date(value).toLocaleTimeString();
      
      default:
        // Custom format patterns
        if (format.includes('d')) {
          return new Intl.NumberFormat('en-US', { 
            minimumFractionDigits: (format.match(/d/g) || []).length 
          }).format(Number(value));
        }
        return String(value);
    }
  } catch (error) {
    console.warn('Format error:', error);
    return String(value);
  }
}

function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportToPNG(elementId: string, filename: string): void {
  // This would require html2canvas or similar library
  console.log('PNG export not implemented yet');
}

export default BaseVisual;