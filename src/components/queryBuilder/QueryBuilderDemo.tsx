import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Play, Code, Download, AlertCircle } from 'lucide-react';
import { useQueryBuilder } from '../../features/queryBuilder/useQueryBuilder';
import { DIMENSIONS, HIERARCHIES } from '../../constants/registry';
import type { QueryFilter } from '../../constants/registry';

const AVAILABLE_METRICS = [
  { id: 'revenue', label: 'Total Revenue', description: 'Sum of transaction amounts' },
  { id: 'transactions', label: 'Transaction Count', description: 'Number of transactions' },
  { id: 'units_sold', label: 'Units Sold', description: 'Total quantity sold' },
  { id: 'avg_basket_size', label: 'Avg Basket Size', description: 'Average items per transaction' },
  { id: 'unique_products', label: 'Unique Products', description: 'Distinct products sold' },
  { id: 'unique_stores', label: 'Store Coverage', description: 'Number of stores' }
];

const QueryBuilderDemo: React.FC = () => {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue', 'transactions']);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(['region']);
  const [filters, setFilters] = useState<QueryFilter[]>([]);
  const [showSQL, setShowSQL] = useState(false);
  
  const { executeDynamicMetrics, isLoading, error, lastQuery, lastResult } = useQueryBuilder();

  const handleRunQuery = async () => {
    await executeDynamicMetrics(selectedMetrics, selectedDimensions, filters);
  };

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(m => m !== metricId)
        : [...prev, metricId]
    );
  };

  const handleDimensionToggle = (dimensionId: string) => {
    setSelectedDimensions(prev => 
      prev.includes(dimensionId) 
        ? prev.filter(d => d !== dimensionId)
        : [...prev, dimensionId]
    );
  };

  const handleExportCSV = () => {
    if (!lastResult || lastResult.length === 0) return;
    
    // Convert to CSV
    const headers = Object.keys(lastResult[0]);
    const csvContent = [
      headers.join(','),
      ...lastResult.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Query Builder</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSQL(!showSQL)}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Code className="w-4 h-4" />
            <span>{showSQL ? 'Hide' : 'Show'} SQL</span>
          </button>
          {lastResult && lastResult.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Select Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {AVAILABLE_METRICS.map(metric => (
            <label
              key={metric.id}
              className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedMetrics.includes(metric.id)
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedMetrics.includes(metric.id)}
                onChange={() => handleMetricToggle(metric.id)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{metric.label}</div>
                <div className="text-xs text-gray-500 truncate">{metric.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Dimensions Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Group By Dimensions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {DIMENSIONS.filter(dim => ['region', 'city', 'category', 'brand', 'client', 'year', 'month'].includes(dim.id)).map(dimension => (
            <label
              key={dimension.id}
              className={`flex items-center space-x-2 p-2 rounded-lg border-2 cursor-pointer transition-all ${
                selectedDimensions.includes(dimension.id)
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedDimensions.includes(dimension.id)}
                onChange={() => handleDimensionToggle(dimension.id)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm">
                {dimension.icon} {dimension.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Run Query Button */}
      <div className="mb-6">
        <button
          onClick={handleRunQuery}
          disabled={isLoading || selectedMetrics.length === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 transition-colors"
        >
          <Play className="w-4 h-4" />
          <span>{isLoading ? 'Running...' : 'Run Query'}</span>
        </button>
      </div>

      {/* SQL Preview */}
      {showSQL && lastQuery && (
        <motion.div
          className="mb-6 p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <pre className="text-xs font-mono whitespace-pre-wrap">{lastQuery}</pre>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-red-900">Query Error</div>
            <div className="text-sm text-red-700">{error.message}</div>
          </div>
        </motion.div>
      )}

      {/* Results Table */}
      {lastResult && lastResult.length > 0 && (
        <motion.div
          className="overflow-x-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {Object.keys(lastResult[0]).map(key => (
                  <th
                    key={key}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {key.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lastResult.slice(0, 20).map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {Object.values(row).map((value: any, cellIdx) => (
                    <td key={cellIdx} className="px-4 py-3 text-sm text-gray-900">
                      {typeof value === 'number' 
                        ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                        : value || '-'
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {lastResult.length > 20 && (
            <div className="text-center py-3 text-sm text-gray-500">
              Showing first 20 of {lastResult.length} results
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default QueryBuilderDemo;