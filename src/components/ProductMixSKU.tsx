import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Sankey } from 'recharts';
import { Package2, ShoppingCart, TrendingUp, RefreshCw } from 'lucide-react';
import { Transaction } from '../utils/mockDataGenerator';

interface ProductMixSKUProps {
  transactions: Transaction[];
  filters: {
    brand?: string;
    category?: string;
    sku?: string;
    location?: string;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const ProductMixSKU: React.FC<ProductMixSKUProps> = ({ transactions, filters }) => {
  // Apply filters
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(t => {
      if (filters.location && t.barangay !== filters.location && t.region !== filters.location) return false;
      
      // Check if transaction contains filtered items
      const hasFilteredItems = t.items.some(item => {
        if (filters.brand && item.brand !== filters.brand) return false;
        if (filters.category && item.category !== filters.category) return false;
        if (filters.sku && item.sku_id !== filters.sku) return false;
        return true;
      });
      
      return hasFilteredItems;
    });
  }, [transactions, filters]);

  // Calculate category breakdown
  const categoryData = React.useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    filteredTransactions.forEach(t => {
      t.items.forEach(item => {
        if (!filters.brand || item.brand === filters.brand) {
          if (!filters.sku || item.sku_id === filters.sku) {
            const current = categoryMap.get(item.category) || 0;
            categoryMap.set(item.category, current + (item.quantity * item.price));
          }
        }
      });
    });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, filters]);

  // Calculate brand breakdown
  const brandData = React.useMemo(() => {
    const brandMap = new Map<string, number>();
    
    filteredTransactions.forEach(t => {
      t.items.forEach(item => {
        if (!filters.category || item.category === filters.category) {
          if (!filters.sku || item.sku_id === filters.sku) {
            const current = brandMap.get(item.brand) || 0;
            brandMap.set(item.brand, current + (item.quantity * item.price));
          }
        }
      });
    });

    return Array.from(brandMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 brands
  }, [filteredTransactions, filters]);

  // Calculate top SKUs
  const topSKUs = React.useMemo(() => {
    const skuMap = new Map<string, { name: string; quantity: number; value: number; brand: string; category: string }>();
    
    filteredTransactions.forEach(t => {
      t.items.forEach(item => {
        if ((!filters.brand || item.brand === filters.brand) &&
            (!filters.category || item.category === filters.category)) {
          const existing = skuMap.get(item.sku_id) || {
            name: item.product_name,
            quantity: 0,
            value: 0,
            brand: item.brand,
            category: item.category
          };
          
          skuMap.set(item.sku_id, {
            ...existing,
            quantity: existing.quantity + item.quantity,
            value: existing.value + (item.quantity * item.price)
          });
        }
      });
    });

    return Array.from(skuMap.entries())
      .map(([sku, data]) => ({ sku, ...data }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredTransactions, filters]);

  // Calculate basket mix data
  const basketMixData = React.useMemo(() => {
    const coOccurrenceMap = new Map<string, Map<string, number>>();
    
    filteredTransactions.forEach(t => {
      const categories = [...new Set(t.items.map(item => item.category))];
      
      categories.forEach(cat1 => {
        categories.forEach(cat2 => {
          if (cat1 !== cat2) {
            if (!coOccurrenceMap.has(cat1)) {
              coOccurrenceMap.set(cat1, new Map());
            }
            const cat1Map = coOccurrenceMap.get(cat1)!;
            cat1Map.set(cat2, (cat1Map.get(cat2) || 0) + 1);
          }
        });
      });
    });

    const links: any[] = [];
    coOccurrenceMap.forEach((targets, source) => {
      targets.forEach((value, target) => {
        if (value > 5) { // Only show significant relationships
          links.push({ source, target, value });
        }
      });
    });

    return links;
  }, [filteredTransactions]);

  // Calculate substitution patterns
  const substitutionData = React.useMemo(() => {
    const substitutions = filteredTransactions.flatMap(t => 
      t.items.filter(item => item.was_substituted)
    );
    
    const substitutionRate = filteredTransactions.length > 0 
      ? (substitutions.length / filteredTransactions.flatMap(t => t.items).length) * 100 
      : 0;

    const substitutionsByCategory = new Map<string, number>();
    substitutions.forEach(item => {
      substitutionsByCategory.set(item.category, 
        (substitutionsByCategory.get(item.category) || 0) + 1
      );
    });

    return {
      rate: substitutionRate,
      byCategory: Array.from(substitutionsByCategory.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
    };
  }, [filteredTransactions]);

  // Calculate KPIs
  const kpis = React.useMemo(() => {
    const totalItems = filteredTransactions.flatMap(t => t.items);
    const uniqueSKUs = new Set(totalItems.map(item => item.sku_id)).size;
    const totalValue = totalItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const avgBasketSize = filteredTransactions.length > 0 
      ? totalItems.length / filteredTransactions.length 
      : 0;

    return {
      uniqueSKUs,
      totalValue,
      avgBasketSize,
      substitutionRate: substitutionData.rate
    };
  }, [filteredTransactions, substitutionData]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unique SKUs</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.uniqueSKUs}</p>
              <p className="text-sm text-gray-500">Active products</p>
            </div>
            <Package2 className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sales Value</p>
              <p className="text-2xl font-bold text-gray-900">₱{kpis.totalValue.toFixed(2)}</p>
              <p className="text-sm text-gray-500">From filtered products</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Basket Size</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.avgBasketSize.toFixed(1)}</p>
              <p className="text-sm text-gray-500">Items per transaction</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Substitution Rate</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.substitutionRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Of items substituted</p>
            </div>
            <RefreshCw className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `₱${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Brand Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Brands by Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={brandData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `₱${value}`} />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip formatter={(value: number) => `₱${value.toFixed(2)}`} />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top SKUs Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 SKUs</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topSKUs.map((sku, index) => (
                <tr key={sku.sku}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sku.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sku.brand}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sku.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{sku.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">₱{sku.value.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Substitution Patterns */}
      {substitutionData.rate > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Substitutions by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={substitutionData.byCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#F59E0B" name="Substitutions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* AI Insight */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Insight</h3>
        <p className="text-gray-700">
          {categoryData.length > 0 && `${categoryData[0].name} dominates sales at ${((categoryData[0].value / kpis.totalValue) * 100).toFixed(0)}% of revenue. `}
          {kpis.substitutionRate > 10 && `High substitution rate (${kpis.substitutionRate.toFixed(1)}%) suggests stock availability issues or strong store owner influence. `}
          {topSKUs.length > 0 && `"${topSKUs[0].name}" is the top-selling product. `}
          Consider optimizing inventory for high-velocity SKUs and ensuring availability of frequently substituted items.
        </p>
      </div>
    </div>
  );
};

export default ProductMixSKU;