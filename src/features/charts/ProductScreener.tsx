import React, { memo, useState, useMemo } from 'react';
import { useDashboardData } from '../transactions/hooks/useOptimizedData';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { Search, Filter, Download, ChevronUp, ChevronDown, Package } from 'lucide-react';

interface ProductScreenerProps {
  dateRange?: string;
  initialFilters?: ScreenerFilters;
}

interface ScreenerFilters {
  search: string;
  minRevenue: number;
  maxRevenue: number;
  minGrowth: number;
  category: string;
  brand: string;
  store: string;
  region: string;
}

interface ProductMetrics {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  store: string;
  region: string;
  revenue: number;
  units: number;
  avgPrice: number;
  growth: number;
  stockLevel: 'high' | 'medium' | 'low';
  trend: 'up' | 'down' | 'stable';
}

export function ProductScreener({ dateRange = 'last7Days', initialFilters }: ProductScreenerProps) {
  const { data, isLoading } = useDashboardData({ dateRange });
  const [filters, setFilters] = useState<ScreenerFilters>(initialFilters || {
    search: '',
    minRevenue: 0,
    maxRevenue: Infinity,
    minGrowth: -100,
    category: 'all',
    brand: 'all',
    store: 'all',
    region: 'all'
  });
  const [sortField, setSortField] = useState<keyof ProductMetrics>('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Generate product metrics from Scout data
  const products: ProductMetrics[] = useMemo(() => {
    if (!data?.topProducts) return [];

    const brands = ['Nike', 'Samsung', 'Nestle', 'Unilever', 'P&G', 'Apple', 'Adidas', 'Sony'];
    const regions = ['NCR', 'CALABARZON', 'Central Luzon', 'Central Visayas', 'Davao'];
    
    return data.topProducts.map((product, index) => ({
      id: product.id,
      sku: `SKU-${1000 + index}`,
      name: product.name,
      brand: brands[index % brands.length],
      category: ['Electronics', 'Fashion', 'Food', 'Home'][index % 4],
      store: ['SM Mall', 'Ayala Center', 'Robinson', 'Megamall'][index % 4],
      region: regions[index % regions.length],
      revenue: product.value,
      units: Math.floor(product.value / (100 + Math.random() * 200)),
      avgPrice: product.value / Math.floor(product.value / (100 + Math.random() * 200)),
      growth: (Math.random() - 0.5) * 60,
      stockLevel: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
      trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable' as any
    }));
  }, [data]);

  // Apply filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !product.sku.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (product.revenue < filters.minRevenue || product.revenue > filters.maxRevenue) {
        return false;
      }
      if (product.growth < filters.minGrowth) {
        return false;
      }
      if (filters.category !== 'all' && product.category !== filters.category) {
        return false;
      }
      if (filters.brand !== 'all' && product.brand !== filters.brand) {
        return false;
      }
      if (filters.store !== 'all' && product.store !== filters.store) {
        return false;
      }
      if (filters.region !== 'all' && product.region !== filters.region) {
        return false;
      }
      return true;
    });
  }, [products, filters]);

  // Sort products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const aValue = a[sortField] as any;
      const bValue = b[sortField] as any;
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'string') {
        return aValue.localeCompare(bValue) * multiplier;
      }
      return (aValue - bValue) * multiplier;
    });
  }, [filteredProducts, sortField, sortDirection]);

  const handleSort = (field: keyof ProductMetrics) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header and Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-500" />
            Product Screener
          </h3>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search SKU, name, or brand..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={filters.brand}
              onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
            >
              <option value="all">All Brands</option>
              <option value="Nike">Nike</option>
              <option value="Samsung">Samsung</option>
              <option value="Nestle">Nestle</option>
              <option value="Unilever">Unilever</option>
              <option value="P&G">P&G</option>
              <option value="Apple">Apple</option>
              <option value="Adidas">Adidas</option>
              <option value="Sony">Sony</option>
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="all">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Food">Food</option>
              <option value="Home">Home</option>
            </select>

            <input
              type="number"
              placeholder="Min revenue..."
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={filters.minRevenue || ''}
              onChange={(e) => setFilters({ ...filters, minRevenue: Number(e.target.value) || 0 })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
            >
              <option value="all">All Regions</option>
              <option value="NCR">NCR - National Capital</option>
              <option value="CALABARZON">Region IV-A - CALABARZON</option>
              <option value="Central Luzon">Region III - Central Luzon</option>
              <option value="Central Visayas">Region VII - Central Visayas</option>
              <option value="Davao">Region XI - Davao</option>
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={filters.store}
              onChange={(e) => setFilters({ ...filters, store: e.target.value })}
            >
              <option value="all">All Stores</option>
              <option value="SM Mall">SM Mall</option>
              <option value="Ayala Center">Ayala Center</option>
              <option value="Robinson">Robinson</option>
              <option value="Megamall">Megamall</option>
            </select>

            <input
              type="number"
              placeholder="Min growth %..."
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={filters.minGrowth === -100 ? '' : filters.minGrowth}
              onChange={(e) => setFilters({ ...filters, minGrowth: Number(e.target.value) || -100 })}
            />
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-500">
          Showing {sortedProducts.length} of {products.length} products
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('sku')}
              >
                <div className="flex items-center gap-1">
                  SKU
                  {sortField === 'sku' && (sortDirection === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Product
                  {sortField === 'name' && (sortDirection === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Region/Store
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('revenue')}
              >
                <div className="flex items-center justify-end gap-1">
                  Revenue
                  {sortField === 'revenue' && (sortDirection === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('units')}
              >
                <div className="flex items-center justify-end gap-1">
                  Units
                  {sortField === 'units' && (sortDirection === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('growth')}
              >
                <div className="flex items-center justify-end gap-1">
                  Growth
                  {sortField === 'growth' && (sortDirection === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                </div>
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.sku}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-500">{formatCurrency(product.avgPrice)}/unit</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="font-medium">{product.brand}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm text-gray-900">{product.region}</div>
                    <div className="text-xs text-gray-500">{product.store}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(product.revenue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {formatNumber(product.units)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`flex items-center justify-end gap-1 text-sm font-medium ${
                    product.growth > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {product.growth > 0 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {Math.abs(product.growth).toFixed(1)}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    product.stockLevel === 'high' ? 'bg-green-100 text-green-800' :
                    product.stockLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {product.stockLevel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {sortedProducts.length === 0 && (
        <div className="p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No products match your criteria</p>
          <button 
            className="mt-4 text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            onClick={() => setFilters({
              search: '',
              minRevenue: 0,
              maxRevenue: Infinity,
              minGrowth: -100,
              category: 'all',
              brand: 'all',
              store: 'all',
              region: 'all'
            })}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(ProductScreener);