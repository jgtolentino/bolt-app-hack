/**
 * Scout Dash 2.0 - Table Chart Component
 * Interactive data tables with sorting, filtering, and selection
 */

import React, { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, Search, Filter, Download } from 'lucide-react';
import { VisualComponentProps } from '../VisualRegistry';

interface TableChartProps extends VisualComponentProps {
  variant?: 'basic' | 'pivot';
  showPagination?: boolean;
  showSearch?: boolean;
  pageSize?: number;
  allowSelection?: boolean;
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface ColumnConfig {
  field: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  width?: number;
  format?: string;
  sortable?: boolean;
  filterable?: boolean;
}

export const TableChart: React.FC<TableChartProps> = ({
  data,
  width,
  height,
  blueprint,
  theme,
  onSelection,
  onHover,
  selectedData = [],
  hoveredData,
  interactive = true,
  variant = 'basic',
  showPagination = true,
  showSearch = true,
  pageSize = 10,
  allowSelection = true
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const columns: ColumnConfig[] = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Auto-detect columns from data
    const sampleRow = data[0];
    return Object.keys(sampleRow).map(field => {
      const value = sampleRow[field];
      let type: ColumnConfig['type'] = 'string';
      
      if (typeof value === 'number') {
        type = 'number';
      } else if (typeof value === 'boolean') {
        type = 'boolean';
      } else if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
        type = 'date';
      }

      return {
        field,
        label: field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' '),
        type,
        sortable: true,
        filterable: type !== 'boolean'
      };
    });
  }, [data]);

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    let filtered = [...data];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([field, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter(row =>
          String(row[field]).toLowerCase().includes(filterValue.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.field];
        const bVal = b[sortConfig.field];
        
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        
        let comparison = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime();
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }
        
        return sortConfig.direction === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, filters, sortConfig]);

  const paginatedData = useMemo(() => {
    if (!showPagination) return processedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return processedData.slice(startIndex, endIndex);
  }, [processedData, currentPage, pageSize, showPagination]);

  const totalPages = Math.ceil(processedData.length / pageSize);

  const formatCellValue = (value: any, column: ColumnConfig): string => {
    if (value == null) return '';
    
    switch (column.type) {
      case 'number':
        if (column.format === 'currency') {
          return new Intl.NumberFormat('en-PH', { 
            style: 'currency', 
            currency: 'PHP' 
          }).format(Number(value));
        } else if (column.format === 'percent') {
          return new Intl.NumberFormat('en-US', { 
            style: 'percent' 
          }).format(Number(value));
        }
        return Number(value).toLocaleString();
      
      case 'date':
        const date = value instanceof Date ? value : new Date(value);
        return date.toLocaleDateString();
      
      case 'boolean':
        return value ? 'Yes' : 'No';
      
      default:
        return String(value);
    }
  };

  const handleSort = (field: string) => {
    setSortConfig(current => {
      if (current?.field === field) {
        return {
          field,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { field, direction: 'asc' };
    });
  };

  const handleRowClick = (row: any, index: number) => {
    if (!interactive || !allowSelection) return;
    
    const isSelected = selectedData.includes(row);
    const newSelection = isSelected 
      ? selectedData.filter(item => item !== row)
      : [...selectedData, row];
      
    onSelection?.('row', newSelection);
  };

  const handleRowHover = (row: any) => {
    if (!interactive) return;
    onHover?.(row);
  };

  const exportToCSV = () => {
    const headers = columns.map(col => col.label).join(',');
    const rows = processedData.map(row => 
      columns.map(col => {
        const value = formatCellValue(row[col.field], col);
        return value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${blueprint.title || 'table'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No data to display
      </div>
    );
  }

  const isDark = theme?.colors.background === '#1e293b';

  return (
    <div 
      className={`relative w-full h-full flex flex-col ${
        isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
      }`}
      style={{ width, height }}
    >
      {/* Header controls */}
      <div className={`flex items-center justify-between p-3 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center space-x-3">
          {/* Search */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-8 pr-3 py-2 text-sm border rounded-md w-48 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          )}
          
          {/* Results count */}
          <span className="text-sm text-gray-500">
            {processedData.length} rows
          </span>
        </div>

        {/* Export button */}
        <button
          onClick={exportToCSV}
          className={`flex items-center space-x-1 px-3 py-2 text-sm border rounded-md hover:bg-opacity-10 hover:bg-gray-500 ${
            isDark 
              ? 'border-gray-600 text-gray-300' 
              : 'border-gray-300 text-gray-600'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className={`sticky top-0 ${
            isDark ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.field}
                  className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b cursor-pointer hover:bg-opacity-10 hover:bg-gray-500 ${
                    isDark ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-500'
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.field)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp 
                          className={`w-3 h-3 ${
                            sortConfig?.field === column.field && sortConfig.direction === 'asc'
                              ? 'text-blue-500' : 'text-gray-400'
                          }`} 
                        />
                        <ChevronDown 
                          className={`w-3 h-3 -mt-1 ${
                            sortConfig?.field === column.field && sortConfig.direction === 'desc'
                              ? 'text-blue-500' : 'text-gray-400'
                          }`} 
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {paginatedData.map((row, rowIndex) => {
              const isSelected = selectedData.includes(row);
              const isHovered = hoveredData === row;
              
              return (
                <tr
                  key={rowIndex}
                  className={`border-b transition-colors duration-150 ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  } ${
                    allowSelection ? 'cursor-pointer' : ''
                  } ${
                    isSelected 
                      ? isDark ? 'bg-blue-900/30' : 'bg-blue-50'
                      : isHovered 
                        ? isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                        : isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleRowClick(row, rowIndex)}
                  onMouseEnter={() => handleRowHover(row)}
                  onMouseLeave={() => onHover?.(null)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.field}
                      className={`px-4 py-3 text-sm ${
                        column.type === 'number' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {formatCellValue(row[column.field], column)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty state */}
        {paginatedData.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500">
            No matching records found
          </div>
        )}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className={`flex items-center justify-between px-4 py-3 border-t ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} results
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-2 text-sm border rounded-md ${
                currentPage === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-opacity-10 hover:bg-gray-500'
              } ${
                isDark 
                  ? 'border-gray-600 text-gray-300' 
                  : 'border-gray-300 text-gray-600'
              }`}
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 text-sm border rounded-md ${
                currentPage === totalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-opacity-10 hover:bg-gray-500'
              } ${
                isDark 
                  ? 'border-gray-600 text-gray-300' 
                  : 'border-gray-300 text-gray-600'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableChart;