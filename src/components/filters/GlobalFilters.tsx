import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFilterStore } from '../../stores/filterStore';
import { X, Filter, RotateCcw } from 'lucide-react';

const GlobalFilters: React.FC = () => {
  const {
    // Geographic filters
    region, city_municipality, barangay,
    // Organizational filters  
    client, category, brand, sku,
    // Temporal filters
    year, month,
    // State and actions
    filterOptions,
    totalCombinations,
    isLoading,
    setFilter,
    clearFilters,
    loadFilterOptions,
    getTotalCombinations
  } = useFilterStore();

  useEffect(() => {
    // Load initial filter options
    loadFilterOptions('region');
    loadFilterOptions('client');
    loadFilterOptions('category');
    loadFilterOptions('year');
    getTotalCombinations();
  }, []);

  const hasActiveFilters = Boolean(
    region || city_municipality || barangay ||
    client || category || brand || sku ||
    year || month
  );

  const FilterSelect = ({ 
    value, 
    onChange, 
    options, 
    placeholder, 
    disabled = false 
  }: {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string; count: number }>;
    placeholder: string;
    disabled?: boolean;
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || isLoading}
      className="filter-button min-w-0 text-ellipsis disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label} ({option.count.toLocaleString()})
        </option>
      ))}
    </select>
  );

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">Global Filters</h3>
          {totalCombinations > 0 && (
            <span className="text-sm text-gray-600 bg-white/60 px-2 py-1 rounded">
              {totalCombinations.toLocaleString()} combinations
            </span>
          )}
        </div>
        
        {hasActiveFilters && (
          <motion.button
            onClick={clearFilters}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 bg-white/60 hover:bg-white/80 px-3 py-1 rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear All</span>
          </motion.button>
        )}
      </div>

      {/* Geographic Filters */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 w-20">📍 Location</span>
          <div className="flex space-x-2 flex-1 min-w-0 overflow-x-auto">
            <FilterSelect
              value={region}
              onChange={(value) => {
                setFilter('region', value);
                if (value) loadFilterOptions('city_municipality', { region: value });
              }}
              options={filterOptions.region || []}
              placeholder="All Regions"
            />
            
            <FilterSelect
              value={city_municipality}
              onChange={(value) => {
                setFilter('city_municipality', value);
                if (value) loadFilterOptions('barangay', { region, city_municipality: value });
              }}
              options={filterOptions.city_municipality || []}
              placeholder="All Cities"
              disabled={!region}
            />
            
            <FilterSelect
              value={barangay}
              onChange={(value) => setFilter('barangay', value)}
              options={filterOptions.barangay || []}
              placeholder="All Barangays"
              disabled={!city_municipality}
            />
          </div>
        </div>
      </div>

      {/* Organizational Filters */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 w-20">🏢 Business</span>
          <div className="flex space-x-2 flex-1 min-w-0 overflow-x-auto">
            <FilterSelect
              value={client}
              onChange={(value) => {
                setFilter('client', value);
                if (value) loadFilterOptions('category', { client: value });
              }}
              options={filterOptions.client || []}
              placeholder="All Clients"
            />
            
            <FilterSelect
              value={category}
              onChange={(value) => {
                setFilter('category', value);
                if (value) loadFilterOptions('brand', { client, category: value });
              }}
              options={filterOptions.category || []}
              placeholder="All Categories"
              disabled={!client}
            />
            
            <FilterSelect
              value={brand}
              onChange={(value) => {
                setFilter('brand', value);
                if (value) loadFilterOptions('sku', { client, category, brand: value });
              }}
              options={filterOptions.brand || []}
              placeholder="All Brands"
              disabled={!category}
            />
            
            <FilterSelect
              value={sku}
              onChange={(value) => setFilter('sku', value)}
              options={filterOptions.sku || []}
              placeholder="All SKUs"
              disabled={!brand}
            />
          </div>
        </div>
      </div>

      {/* Temporal Filters */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 w-20">📅 Time</span>
          <div className="flex space-x-2 flex-1">
            <FilterSelect
              value={year}
              onChange={(value) => {
                setFilter('year', value);
                if (value) loadFilterOptions('month', { year: value });
              }}
              options={filterOptions.year || []}
              placeholder="All Years"
            />
            
            <FilterSelect
              value={month}
              onChange={(value) => setFilter('month', value)}
              options={filterOptions.month || []}
              placeholder="All Months"
              disabled={!year}
            />
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <motion.div
          className="flex flex-wrap gap-2 pt-2 border-t border-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {region && (
            <span className="inline-flex items-center space-x-1 bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs">
              <span>📍 {region}</span>
              <button onClick={() => setFilter('region', '')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {city_municipality && (
            <span className="inline-flex items-center space-x-1 bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs">
              <span>🏘️ {city_municipality}</span>
              <button onClick={() => setFilter('city_municipality', '')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {client && (
            <span className="inline-flex items-center space-x-1 bg-secondary-100 text-secondary-800 px-2 py-1 rounded-full text-xs">
              <span>🏢 {client}</span>
              <button onClick={() => setFilter('client', '')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {category && (
            <span className="inline-flex items-center space-x-1 bg-secondary-100 text-secondary-800 px-2 py-1 rounded-full text-xs">
              <span>📦 {category}</span>
              <button onClick={() => setFilter('category', '')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {year && (
            <span className="inline-flex items-center space-x-1 bg-accent-100 text-accent-800 px-2 py-1 rounded-full text-xs">
              <span>📅 {year}</span>
              <button onClick={() => setFilter('year', '')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default GlobalFilters;