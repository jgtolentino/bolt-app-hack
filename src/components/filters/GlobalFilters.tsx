import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFilterStore } from '../../features/filters/filterStore';
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
    loadFilterOptions('year');
    getTotalCombinations();
  }, []);

  // Load dependent filters when parent filters change
  useEffect(() => {
    if (region) {
      loadFilterOptions('city_municipality', { region });
    }
  }, [region]);

  useEffect(() => {
    if (region && city_municipality) {
      loadFilterOptions('barangay', { region, city_municipality });
    }
  }, [region, city_municipality]);

  useEffect(() => {
    if (client) {
      loadFilterOptions('category', { client });
    }
  }, [client]);

  useEffect(() => {
    if (client && category) {
      loadFilterOptions('brand', { client, category });
    }
  }, [client, category]);

  useEffect(() => {
    if (client && category && brand) {
      loadFilterOptions('sku', { client, category, brand });
    }
  }, [client, category, brand]);

  useEffect(() => {
    if (year) {
      loadFilterOptions('month', { year });
    }
  }, [year]);

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
      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
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
      className="flex items-center justify-between gap-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Filter Icon & Title */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        <Filter className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Filters</span>
      </div>

      {/* All Filters in Horizontal Layout */}
      <div className="flex items-center gap-3 flex-1 overflow-x-auto">
        {/* Geographic Filters */}
        <div className="flex items-center gap-2">
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

        <div className="w-px h-6 bg-gray-300" />

        {/* Organizational Filters */}
        <div className="flex items-center gap-2">
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

        <div className="w-px h-6 bg-gray-300" />

        {/* Temporal Filters */}
        <div className="flex items-center gap-2">
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

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {totalCombinations > 0 && (
          <span className="text-xs text-gray-500">
            {totalCombinations.toLocaleString()} results
          </span>
        )}
        
        {hasActiveFilters && (
          <motion.button
            onClick={clearFilters}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear</span>
          </motion.button>
        )}
      </div>

    </motion.div>
  );
};

export default GlobalFilters;