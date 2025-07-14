/**
 * Scout Dash 2.0 - Filter Manager
 * Manages global filters and cross-chart interactions
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Filter, X, ChevronDown, Calendar, Search } from 'lucide-react';
import { GlobalFilterConfig, FilterOption, FilterChangeEvent } from '../types';
import { Button } from '../../components/UI/Button';
import { Select } from '../../components/UI/Select';
import { Input } from '../../components/UI/Input';
import { Badge } from '../../components/UI/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';

export interface FilterManagerProps {
  filters: GlobalFilterConfig[];
  values: Record<string, any>;
  onFilterChange: (filterId: string, value: any) => void;
  onFilterRemove?: (filterId: string) => void;
  className?: string;
  position?: 'top' | 'left' | 'right' | 'floating';
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export interface FilterState {
  values: Record<string, any>;
  activeFilters: string[];
}

export const FilterManager: React.FC<FilterManagerProps> = ({
  filters,
  values,
  onFilterChange,
  onFilterRemove,
  className = '',
  position = 'top',
  collapsed = false,
  onCollapsedChange
}) => {
  const [filterState, setFilterState] = useState<FilterState>({
    values,
    activeFilters: Object.keys(values).filter(key => values[key] != null)
  });

  // Update local state when props change
  useEffect(() => {
    setFilterState({
      values,
      activeFilters: Object.keys(values).filter(key => values[key] != null)
    });
  }, [values]);

  const handleFilterChange = useCallback((filterId: string, value: any) => {
    // Update local state
    setFilterState(prev => ({
      values: { ...prev.values, [filterId]: value },
      activeFilters: value != null 
        ? [...prev.activeFilters.filter(id => id !== filterId), filterId]
        : prev.activeFilters.filter(id => id !== filterId)
    }));

    // Notify parent
    onFilterChange(filterId, value);
  }, [onFilterChange]);

  const handleFilterClear = useCallback((filterId: string) => {
    handleFilterChange(filterId, null);
  }, [handleFilterChange]);

  const handleClearAll = useCallback(() => {
    filters.forEach(filter => {
      if (!filter.required) {
        handleFilterChange(filter.id, null);
      }
    });
  }, [filters, handleFilterChange]);

  const renderFilter = (filter: GlobalFilterConfig) => {
    const value = filterState.values[filter.id];
    const isActive = value != null;

    switch (filter.type) {
      case 'select':
        return (
          <div key={filter.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {filter.name}
              {filter.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Select
              value={value || ''}
              onValueChange={(newValue) => handleFilterChange(filter.id, newValue || null)}
              options={[
                { value: '', label: 'All' },
                ...(filter.options || []).map(option => ({
                  value: option.value.toString(),
                  label: option.label
                }))
              ]}
            />
          </div>
        );

      case 'multiselect':
        return (
          <div key={filter.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {filter.name}
              {filter.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-1">
              {(filter.options || []).map(option => (
                <label key={option.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={(value || []).includes(option.value)}
                    onChange={(e) => {
                      const currentValues = value || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v: any) => v !== option.value);
                      handleFilterChange(filter.id, newValues.length > 0 ? newValues : null);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'range':
        const [min, max] = value || [null, null];
        return (
          <div key={filter.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {filter.name}
              {filter.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={min || ''}
                onChange={(e) => {
                  const newMin = e.target.value ? parseFloat(e.target.value) : null;
                  handleFilterChange(filter.id, [newMin, max]);
                }}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Max"
                value={max || ''}
                onChange={(e) => {
                  const newMax = e.target.value ? parseFloat(e.target.value) : null;
                  handleFilterChange(filter.id, [min, newMax]);
                }}
                className="flex-1"
              />
            </div>
          </div>
        );

      case 'date':
        return (
          <div key={filter.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {filter.name}
              {filter.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <Input
                type="date"
                value={value || ''}
                onChange={(e) => handleFilterChange(filter.id, e.target.value || null)}
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        );

      case 'text':
        return (
          <div key={filter.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {filter.name}
              {filter.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder={`Search ${filter.name.toLowerCase()}...`}
                value={value || ''}
                onChange={(e) => handleFilterChange(filter.id, e.target.value || null)}
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'left':
        return 'fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-800 border-r shadow-lg z-40';
      case 'right':
        return 'fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 border-l shadow-lg z-40';
      case 'floating':
        return 'fixed top-4 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border z-40';
      case 'top':
      default:
        return 'w-full bg-white dark:bg-gray-800 border-b';
    }
  };

  if (filters.length === 0) {
    return null;
  }

  return (
    <div className={`${getPositionClasses()} ${className}`}>
      <Card className="h-full border-0 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <Filter className="w-5 h-5 mr-2" />
              Filters
              {filterState.activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filterState.activeFilters.length}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              {filterState.activeFilters.length > 0 && (
                <Button
                  onClick={handleClearAll}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  Clear All
                </Button>
              )}
              {onCollapsedChange && (
                <Button
                  onClick={() => onCollapsedChange(!collapsed)}
                  variant="ghost"
                  size="sm"
                >
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} 
                  />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {!collapsed && (
          <CardContent className={position === 'top' ? 'pb-4' : 'h-full overflow-auto'}>
            <div className={`space-y-4 ${position === 'top' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : ''}`}>
              {filters.map(renderFilter)}
            </div>

            {/* Active Filters Summary */}
            {filterState.activeFilters.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Active Filters:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {filterState.activeFilters.map(filterId => {
                    const filter = filters.find(f => f.id === filterId);
                    const value = filterState.values[filterId];
                    if (!filter) return null;

                    let displayValue = value;
                    if (Array.isArray(value)) {
                      displayValue = `${value.length} selected`;
                    } else if (filter.options) {
                      const option = filter.options.find(opt => opt.value === value);
                      displayValue = option?.label || value;
                    }

                    return (
                      <Badge
                        key={filterId}
                        variant="secondary"
                        className="flex items-center space-x-1"
                      >
                        <span>{filter.name}: {displayValue}</span>
                        {!filter.required && (
                          <button
                            onClick={() => handleFilterClear(filterId)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default FilterManager;