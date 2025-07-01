import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Play, Filter } from 'lucide-react';
import { useFilters } from '@hooks/useFilters';
import { widgetRegistry, getWidgetComponent } from '@features/charts';
import { supabase } from '@services/supabaseClient';

// Mock catalog data until we implement the RPC
const mockCatalog = {
  metrics: [
    { id: 'revenue', label: 'Revenue', description: 'Gross sales value', agg: 'sum' },
    { id: 'units', label: 'Units Sold', description: 'Quantity sold', agg: 'sum' },
    { id: 'customers', label: 'Customers', description: 'Distinct customers', agg: 'count' },
    { id: 'avg_basket', label: 'Avg Basket Size', description: 'Average order value', agg: 'avg' },
    { id: 'conversion', label: 'Conversion Rate', description: 'Purchase conversion %', agg: 'pct' },
  ],
  dimensions: [
    { id: 'brand_code', label: 'Brand', description: 'Product brand' },
    { id: 'region_code', label: 'Region', description: 'Sales region' },
    { id: 'category', label: 'Category', description: 'Product category' },
    { id: 'store_name', label: 'Store', description: 'Store location' },
    { id: 'date', label: 'Date', description: 'Transaction date' },
  ],
};

export default function CommandCenter() {
  const { advanced } = useFilters();
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chartType, setChartType] = useState<string>('auto');

  // Toggle metric selection
  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  // Toggle dimension selection
  const toggleDimension = (dimId: string) => {
    setSelectedDimensions(prev =>
      prev.includes(dimId)
        ? prev.filter(id => id !== dimId)
        : [...prev, dimId]
    );
  };

  // Run query
  const runQuery = async () => {
    if (selectedMetrics.length === 0 || selectedDimensions.length === 0) {
      alert('Please select at least one metric and one dimension');
      return;
    }

    setIsLoading(true);
    try {
      // Build dynamic query
      const metrics = selectedMetrics.map(m => {
        const metric = mockCatalog.metrics.find(cat => cat.id === m);
        return metric?.agg === 'count' 
          ? `COUNT(DISTINCT ${m}) as ${m}`
          : `${metric?.agg?.toUpperCase() || 'SUM'}(${m}) as ${m}`;
      });
      
      const dimensions = selectedDimensions.join(', ');
      const groupBy = selectedDimensions.join(', ');
      
      // Mock query - in real implementation, call the RPC
      const query = `
        SELECT ${dimensions}, ${metrics.join(', ')}
        FROM transactions
        GROUP BY ${groupBy}
        ORDER BY ${selectedMetrics[0]} DESC
        LIMIT 20
      `;
      
      console.log('Query:', query);
      
      // Mock result for demo
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        [selectedDimensions[0]]: `Item ${i + 1}`,
        ...(selectedDimensions[1] && { [selectedDimensions[1]]: `Category ${Math.floor(i / 3) + 1}` }),
        [selectedMetrics[0]]: Math.floor(Math.random() * 100000),
        ...(selectedMetrics[1] && { [selectedMetrics[1]]: Math.floor(Math.random() * 1000) }),
      }));
      
      setQueryResult({
        data: mockData,
        query,
        metrics: selectedMetrics,
        dimensions: selectedDimensions,
      });
    } catch (error) {
      console.error('Query error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-select chart type based on data
  const suggestedChartType = useMemo(() => {
    if (!queryResult) return null;
    
    const { metrics, dimensions } = queryResult;
    
    if (dimensions.length === 1 && metrics.length === 1) {
      return dimensions[0] === 'date' ? 'salesTrendChart' : 'barChart';
    }
    if (dimensions.length === 2) {
      return 'categoryPerformanceHeatmap';
    }
    if (metrics.length > 2) {
      return 'regionalPerformanceTable';
    }
    
    return 'barChart';
  }, [queryResult]);

  const ChartComponent = chartType === 'auto' 
    ? (suggestedChartType ? getWidgetComponent(suggestedChartType) : null)
    : getWidgetComponent(chartType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Command Center
          </h1>
          <p className="text-gray-600">
            Self-service query builder for Scout Analytics
          </p>
        </motion.div>

        {/* Main Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Metric & Dimension Selector */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-3 space-y-6"
          >
            {/* Dimensions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Dimensions
              </h3>
              <div className="space-y-2">
                {mockCatalog.dimensions.map(dim => (
                  <label
                    key={dim.id}
                    className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDimensions.includes(dim.id)}
                      onChange={() => toggleDimension(dim.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{dim.label}</div>
                      <div className="text-sm text-gray-500">{dim.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Metrics
              </h3>
              <div className="space-y-2">
                {mockCatalog.metrics.map(metric => (
                  <label
                    key={metric.id}
                    className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric.id)}
                      onChange={() => toggleMetric(metric.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{metric.label}</div>
                      <div className="text-sm text-gray-500">{metric.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Aggregation: {metric.agg.toUpperCase()}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={runQuery}
              disabled={isLoading || selectedMetrics.length === 0 || selectedDimensions.length === 0}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Run Query
            </button>
          </motion.div>

          {/* Right: Results & Visualization */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-9"
          >
            <div className="bg-white rounded-lg shadow-sm p-6 min-h-[600px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
              ) : queryResult ? (
                <div className="space-y-6">
                  {/* Chart Type Selector */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Query Results
                    </h3>
                    <div className="flex items-center gap-4">
                      <select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="auto">Auto-select chart</option>
                        <option value="barChart">Bar Chart</option>
                        <option value="salesTrendChart">Line Chart</option>
                        <option value="categoryPerformanceHeatmap">Heatmap</option>
                        <option value="regionalPerformanceTable">Table</option>
                      </select>
                      
                      {/* Export Buttons */}
                      <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export CSV
                      </button>
                      <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export PNG
                      </button>
                    </div>
                  </div>

                  {/* Chart Display */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    {ChartComponent ? (
                      <ChartComponent data={queryResult.data} />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {[...queryResult.dimensions, ...queryResult.metrics].map(col => (
                                <th
                                  key={col}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {queryResult.data.map((row: any, idx: number) => (
                              <tr key={idx}>
                                {[...queryResult.dimensions, ...queryResult.metrics].map(col => (
                                  <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {typeof row[col] === 'number' ? row[col].toLocaleString() : row[col]}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Query Display */}
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                      View Generated Query
                    </summary>
                    <pre className="mt-2 p-4 bg-gray-50 rounded-lg overflow-x-auto">
                      {queryResult.query}
                    </pre>
                  </details>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Search className="w-16 h-16 mb-4" />
                  <p className="text-lg">Select dimensions and metrics to start</p>
                  <p className="text-sm mt-2">Run a query to see results here</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}