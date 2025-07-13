import React from 'react';
import { BarChart, Bar, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { Package2, ShoppingCart, TrendingUp, RefreshCw } from 'lucide-react';
import { CHART_COLORS, CHART_CONFIG, formatters } from '../utils/chartConfig';
import SubstitutionSankey from './charts/SubstitutionSankey';
import { sqliteApiService } from '../services/sqliteApiService';

interface ProductMixSKUProps {
  transactions: any[];
  filters: {
    brand?: string;
    category?: string;
    sku?: string;
    location?: string;
  };
}

// Remove this line - using colors from chartConfig instead

const ProductMixSKU: React.FC<ProductMixSKUProps> = ({ transactions, filters }) => {
  const [substitutionApiData, setSubstitutionApiData] = React.useState<any[]>([]);
  
  // Load substitution data
  React.useEffect(() => {
    const loadSubstitutionData = async () => {
      try {
        // Skip API call if using mock data
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
          console.log('Skipping substitution API in mock data mode');
          return;
        }
        const data = await sqliteApiService.getSubstitutionData();
        setSubstitutionApiData(data);
      } catch (error) {
        console.error('Failed to load substitution data:', error);
        // Continue without substitution data
      }
    };
    loadSubstitutionData();
  }, []);

  // Apply filters
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(t => {
      if (filters.location && t.stores?.barangay !== filters.location && t.stores?.region !== filters.location) return false;
      
      // Check if transaction contains filtered items
      const hasFilteredItems = (t.transaction_items || []).some((item: any) => {
        if (filters.brand && item.brand_name !== filters.brand) return false;
        if (filters.category && item.product_category !== filters.category) return false;
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
      (t.transaction_items || []).forEach((item: any) => {
        if (!filters.brand || item.brand_name === filters.brand) {
          if (!filters.sku || item.sku_id === filters.sku) {
            const current = categoryMap.get(item.product_category) || 0;
            categoryMap.set(item.product_category, current + (item.quantity * item.unit_price));
          }
        }
      });
    });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, filters]);

  // Calculate Pareto data for categories
  const categoryParetoData = React.useMemo(() => {
    const totalValue = categoryData.reduce((sum, item) => sum + item.value, 0);
    let cumulativeValue = 0;
    
    return categoryData.map(item => {
      cumulativeValue += item.value;
      return {
        ...item,
        percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
        cumulativePercentage: totalValue > 0 ? (cumulativeValue / totalValue) * 100 : 0
      };
    });
  }, [categoryData]);

  // Calculate brand breakdown
  const brandData = React.useMemo(() => {
    const brandMap = new Map<string, number>();
    
    filteredTransactions.forEach(t => {
      (t.transaction_items || t.items || []).forEach((item: any) => {
        const category = item.products?.product_category || item.category;
        const brand = item.products?.brands?.brand_name || item.brand;
        const price = item.unit_price || item.price;
        
        if (!filters.category || category === filters.category) {
          if (!filters.sku || item.sku_id === filters.sku) {
            const current = brandMap.get(brand) || 0;
            brandMap.set(brand, current + (item.quantity * price));
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
      (t.transaction_items || t.items || []).forEach((item: any) => {
        const brand = item.products?.brands?.brand_name || item.brand;
        const category = item.products?.product_category || item.category;
        const productName = item.products?.product_name || item.product_name;
        const price = item.unit_price || item.price;
        
        if ((!filters.brand || brand === filters.brand) &&
            (!filters.category || category === filters.category)) {
          const existing = skuMap.get(item.sku_id) || {
            name: productName,
            quantity: 0,
            value: 0,
            brand: brand,
            category: category
          };
          
          skuMap.set(item.sku_id, {
            ...existing,
            quantity: existing.quantity + item.quantity,
            value: existing.value + (item.quantity * price)
          });
        }
      });
    });

    return Array.from(skuMap.entries())
      .map(([sku, data]) => ({ sku, ...data }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredTransactions, filters]);


  // Calculate substitution patterns
  const substitutionData = React.useMemo(() => {
    const substitutions = filteredTransactions.flatMap(t => 
      (t.transaction_items || t.items || []).filter((item: any) => item.was_substituted)
    );
    
    const allItems = filteredTransactions.flatMap(t => t.transaction_items || t.items || []);
    const substitutionRate = allItems.length > 0 
      ? (substitutions.length / allItems.length) * 100 
      : 0;

    const substitutionsByCategory = new Map<string, number>();
    substitutions.forEach((item: any) => {
      const category = item.products?.product_category || item.category;
      substitutionsByCategory.set(category, 
        (substitutionsByCategory.get(category) || 0) + 1
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
    const totalItems = filteredTransactions.flatMap(t => t.transaction_items || t.items || []);
    const uniqueSKUs = new Set(totalItems.map((item: any) => item.sku_id)).size;
    const totalValue = totalItems.reduce((sum, item: any) => {
      const price = item.unit_price || item.price;
      return sum + (item.quantity * price);
    }, 0);
    const avgBasketSize = filteredTransactions.length > 0 
      ? totalItems.length / filteredTransactions.length 
      : 0;

    return {
      uniqueSKUs,
      totalValue,
      avgBasketSize,
      substitutionRate: substitutionData.rate || 0
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
        {/* Category Breakdown - Pareto Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category (Pareto Analysis)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart 
              data={categoryParetoData}
              margin={CHART_CONFIG.margin}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis yAxisId="left" tickFormatter={formatters.currency} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'Revenue') return formatters.currency(value);
                  return `${value.toFixed(1)}%`;
                }}
                contentStyle={CHART_CONFIG.tooltip.contentStyle}
              />
              <Bar yAxisId="left" dataKey="value" name="Revenue" fill={CHART_COLORS.primary[0]}>
                <LabelList 
                  dataKey="percentage" 
                  position="top" 
                  formatter={(value: number) => `${value.toFixed(0)}%`}
                  style={{ fontSize: '12px', fontWeight: 600 }}
                />
                {categoryParetoData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS.categories[entry.name as keyof typeof CHART_COLORS.categories] || CHART_COLORS.primary[index % CHART_COLORS.primary.length]} />
                ))}
              </Bar>
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="cumulativePercentage" 
                name="Cumulative %" 
                stroke={CHART_COLORS.danger}
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="mt-2 text-sm text-gray-600 text-center">
            {categoryParetoData.length > 0 && categoryParetoData[0].cumulativePercentage < 80 
              ? `Top ${categoryParetoData.findIndex(c => c.cumulativePercentage >= 80) + 1} categories drive 80% of sales`
              : 'Category distribution is well balanced'}
          </p>
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
              {topSKUs.map((sku) => (
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
      {substitutionData && substitutionData.rate > 0 && substitutionData.byCategory && (
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

      {/* Product Substitution Flow - Sankey Diagram */}
      {substitutionApiData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Substitution Flow</h3>
          <SubstitutionSankey substitutions={substitutionApiData} />
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