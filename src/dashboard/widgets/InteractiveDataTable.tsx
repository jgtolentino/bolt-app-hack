/**
 * Scout Dash 2.0 - Interactive Data Table
 * Advanced data table with sorting, filtering, pagination, and export
 * Inspired by retail-insights-dashboard-ph
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { Badge } from '../../components/UI/Badge';
import { DropdownMenu } from '../../components/UI/DropdownMenu';

export interface TableColumn {
  key: string;
  title: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'boolean' | 'badge';
  sortable?: boolean;
  filterable?: boolean;
  visible?: boolean;
  width?: number;
  formatter?: (value: any, row: any) => React.ReactNode;
  filterOptions?: Array<{ label: string; value: any }>;
}

export interface InteractiveDataTableProps {
  title?: string;
  data: any[];
  columns: TableColumn[];
  pageSize?: number;
  searchable?: boolean;
  exportable?: boolean;
  selectable?: boolean;
  className?: string;
  onRowClick?: (row: any, index: number) => void;
  onRowSelect?: (selectedRows: any[]) => void;
  onExport?: (data: any[]) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  [key: string]: any;
}

export const InteractiveDataTable: React.FC<InteractiveDataTableProps> = ({
  title,
  data,
  columns,
  pageSize = 10,
  searchable = true,
  exportable = true,
  selectable = false,
  className = '',
  onRowClick,
  onRowSelect,
  onExport,
  onRefresh,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<FilterConfig>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.filter(col => col.visible !== false).map(col => col.key))
  );

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchLower)
        )
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        result = result.filter(row => {
          const rowValue = row[key];
          if (Array.isArray(value)) {
            return value.includes(rowValue);
          }
          return String(rowValue).toLowerCase().includes(String(value).toLowerCase());
        });
      }
    });

    return result;
  }, [data, searchTerm, filters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = useCallback((key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleFilter = useCallback((key: string, value: any) => {
    setFilters(current => ({
      ...current,
      [key]: value
    }));
    setCurrentPage(1);
  }, []);

  const handleRowSelect = useCallback((index: number) => {
    const globalIndex = (currentPage - 1) * pageSize + index;
    const newSelected = new Set(selectedRows);
    
    if (newSelected.has(globalIndex)) {
      newSelected.delete(globalIndex);
    } else {
      newSelected.add(globalIndex);
    }
    
    setSelectedRows(newSelected);
    
    if (onRowSelect) {
      const selectedData = Array.from(newSelected).map(i => data[i]);
      onRowSelect(selectedData);
    }
  }, [currentPage, pageSize, selectedRows, onRowSelect, data]);

  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === sortedData.length) {
      setSelectedRows(new Set());
      onRowSelect?.([]);
    } else {
      const allIndices = new Set(sortedData.map((_, i) => i));
      setSelectedRows(allIndices);
      onRowSelect?.(sortedData);
    }
  }, [selectedRows.size, sortedData, onRowSelect]);

  const toggleColumnVisibility = useCallback((key: string) => {
    setVisibleColumns(current => {
      const newVisible = new Set(current);
      if (newVisible.has(key)) {
        newVisible.delete(key);
      } else {
        newVisible.add(key);
      }
      return newVisible;
    });
  }, []);

  const formatCellValue = (value: any, column: TableColumn, row: any): React.ReactNode => {
    if (column.formatter) {
      return column.formatter(value, row);
    }

    if (value === null || value === undefined) {
      return <span className="text-gray-400">—</span>;
    }

    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(Number(value));
      
      case 'percentage':
        return `${Number(value).toFixed(1)}%`;
      
      case 'date':
        return new Date(value).toLocaleDateString();
      
      case 'number':
        return new Intl.NumberFormat().format(Number(value));
      
      case 'boolean':
        return (
          <Badge variant={value ? 'success' : 'secondary'}>
            {value ? 'Yes' : 'No'}
          </Badge>
        );
      
      case 'badge':
        return <Badge variant="secondary">{String(value)}</Badge>;
      
      default:
        return String(value);
    }
  };

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(sortedData);
    } else {
      // Default CSV export
      const visibleCols = columns.filter(col => visibleColumns.has(col.key));
      const csvContent = [
        // Header
        visibleCols.map(col => col.title).join(','),
        // Data
        ...sortedData.map(row =>
          visibleCols.map(col => {
            const value = row[col.key];
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'data'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [sortedData, columns, visibleColumns, title, onExport]);

  const visibleCols = columns.filter(col => visibleColumns.has(col.key));

  return (
    <Card className={className}>
      {(title || searchable || exportable || onRefresh) && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            {title && <CardTitle>{title}</CardTitle>}
            <div className="flex items-center space-x-2">
              {searchable && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              )}
              
              {/* Column Visibility */}
              <DropdownMenu
                trigger={
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Columns
                  </Button>
                }
                items={columns.map(col => ({
                  label: (
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(col.key)}
                        onChange={() => toggleColumnVisibility(col.key)}
                        className="rounded"
                      />
                      <span>{col.title}</span>
                    </label>
                  ),
                  customContent: true
                }))}
              />

              {onRefresh && (
                <Button
                  onClick={onRefresh}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              )}

              {exportable && (
                <Button
                  onClick={handleExport}
                  variant="outline"
                  size="sm"
                  disabled={sortedData.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex items-center space-x-2 pt-2">
            {visibleCols.filter(col => col.filterable).map(column => (
              <div key={column.key} className="flex-1 min-w-0">
                {column.filterOptions ? (
                  <Select
                    value={filters[column.key] || ''}
                    onValueChange={(value) => handleFilter(column.key, value)}
                    options={[
                      { value: '', label: `All ${column.title}` },
                      ...column.filterOptions
                    ]}
                  />
                ) : (
                  <Input
                    placeholder={`Filter ${column.title}...`}
                    value={filters[column.key] || ''}
                    onChange={(e) => handleFilter(column.key, e.target.value)}
                    size="sm"
                  />
                )}
              </div>
            ))}
          </div>
        </CardHeader>
      )}

      <CardContent>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {selectable && (
                  <th className="text-left p-3 w-12">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === sortedData.length && sortedData.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                )}
                {visibleCols.map(column => (
                  <th
                    key={column.key}
                    className="text-left p-3 font-medium text-gray-700 dark:text-gray-300"
                    style={{ width: column.width }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.title}</span>
                      {column.sortable && (
                        <button
                          onClick={() => handleSort(column.key)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          {sortConfig?.key === column.key ? (
                            sortConfig.direction === 'asc' ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )
                          ) : (
                            <ArrowUpDown className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={visibleCols.length + (selectable ? 1 : 0)} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.length + (selectable ? 1 : 0)} className="text-center py-8 text-gray-500">
                    No data available
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index;
                  const isSelected = selectedRows.has(globalIndex);
                  
                  return (
                    <tr
                      key={index}
                      className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-950' : ''
                      } ${onRowClick ? 'cursor-pointer' : ''}`}
                      onClick={() => onRowClick?.(row, globalIndex)}
                    >
                      {selectable && (
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleRowSelect(index);
                            }}
                            className="rounded"
                          />
                        </td>
                      )}
                      {visibleCols.map(column => (
                        <td key={column.key} className="p-3 text-sm">
                          {formatCellValue(row[column.key], column, row)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractiveDataTable;