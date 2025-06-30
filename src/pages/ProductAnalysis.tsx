import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFilterStore } from '../stores/filterStore';
import { useDataStore } from '../stores/dataStore';
import { AIInsightsPanel } from '../components/ai/AIInsightsPanel';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ComposedChart, Area
} from 'recharts';
import {
  Package, TrendingUp, Star, MapPin, Users, Filter,
  ArrowUp, ArrowDown, Eye, MoreHorizontal, Download, RefreshCcw
} from 'lucide-react';
import TreemapChartOptimized from '../components/charts/TreemapChartOptimized';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';
import SubstitutionPatternsChart from '../components/charts/SubstitutionPatternsChart';

const ProductAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const { client, category, brand, sku, region, city_municipality, barangay, setFilter, filters } = useFilterStore();
  const { substitutionPatternsData, loadSubstitutionPatterns } = useDataStore();
  const [activeTab, setActiveTab] = useState('category-performance');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load substitution patterns data when component mounts
  useEffect(() => {
    loadSubstitutionPatterns();
  }, []);

  // Mock data - replace with API calls
  const [productData, setProductData] = useState({
    categoryPerformance: [
      { category: 'Beverages', sales: 450000, growth: 28.5, margin: 35.2, transactions: 2340 },
      { category: 'Snacks', sales: 380000, growth: 22.1, margin: 42.8, transactions: 2140 },
      { category: 'Dairy', sales: 290000, growth: 15.7, margin: 28.5, transactions: 1650 },
      { category: 'Personal Care', sales: 180000, growth: 12.3, margin: 45.1, transactions: 890 },
      { category: 'Home Care', sales: 145000, growth: 8.9, margin: 38.7, transactions: 720 },
      { category: 'Food', sales: 125000, growth: 18.2, margin: 32.4, transactions: 680 }
    ],
    brandComparison: [
      { brand: 'Coca-Cola', sales: 180000, market_share: 15.2, growth: 12.5, satisfaction: 4.2 },
      { brand: 'Oishi', sales: 145000, market_share: 12.3, growth: 28.7, satisfaction: 4.1 },
      { brand: 'Alaska', sales: 125000, market_share: 10.6, growth: 15.2, satisfaction: 4.3 },
      { brand: 'Powerade', sales: 110000, market_share: 9.3, growth: 35.8, satisfaction: 4.0 },
      { brand: 'Del Monte', sales: 95000, market_share: 8.1, growth: 18.9, satisfaction: 4.2 },
      { brand: 'Bear Brand', sales: 88000, market_share: 7.4, growth: 22.1, satisfaction: 4.4 }
    ],
    topSKUs: [
      { sku: 'Coca-Cola 355ml', sales: 180000, units: 3200, growth: 12.5, margin: 28.5, category: 'Beverages' },
      { sku: 'Oishi Prawn Crackers 60g', sales: 145000, units: 2800, growth: 28.7, margin: 35.2, category: 'Snacks' },
      { sku: 'Alaska Evap Milk 410ml', sales: 125000, units: 2100, growth: 15.2, margin: 22.8, category: 'Dairy' },
      { sku: 'Powerade 500ml Blue', sales: 110000, units: 1900, growth: 35.8, margin: 32.1, category: 'Beverages' },
      { sku: 'Del Monte Pineapple Juice 1L', sales: 95000, units: 1600, growth: 18.9, margin: 28.7, category: 'Food' },
      { sku: 'Bear Brand Milk 300ml', sales: 88000, units: 1450, growth: 22.1, margin: 25.4, category: 'Dairy' },
      { sku: 'Oishi Pillows Chocolate 38g', sales: 82000, units: 1380, growth: 24.5, margin: 38.9, category: 'Snacks' },
      { sku: 'Surf Powder 1kg', sales: 75000, units: 1200, growth: 8.9, margin: 35.7, category: 'Home Care' }
    ],
    productMix: [
      { name: 'Beverages', value: 450000, category: 'Beverages' },
      { name: 'Snacks', value: 380000, category: 'Snacks' },
      { name: 'Dairy', value: 290000, category: 'Dairy' },
      { name: 'Personal Care', value: 180000, category: 'Personal Care' },
      { name: 'Home Care', value: 145000, category: 'Home Care' },
      { name: 'Food', value: 125000, category: 'Food' }
    ],
    geographicSpread: [
      { region: 'NCR', beverages: 180000, snacks: 150000, dairy: 120000, total: 450000 },
      { region: 'Region VII', beverages: 95000, snacks: 80000, dairy: 65000, total: 240000 },
      { region: 'Region III', beverages: 78000, snacks: 68000, dairy: 52000, total: 198000 },
      { region: 'Region IV-A', beverages: 72000, snacks: 58000, dairy: 48000, total: 178000 },
      { region: 'Region VI', beverages: 45000, snacks: 38000, dairy: 32000, total: 115000 }
    ],
    substitutionPatterns: [
      { source: 'Coca-Cola 355ml', target: 'Pepsi 355ml', value: 450, percentage: 65 },
      { source: 'Coca-Cola 355ml', target: 'Royal 355ml', value: 120, percentage: 18 },
      { source: 'Coca-Cola 355ml', target: 'Sprite 355ml', value: 80, percentage: 12 },
      { source: 'Oishi Prawn Crackers', target: 'Jack n Jill Piattos', value: 320, percentage: 48 },
      { source: 'Oishi Prawn Crackers', target: 'Nova Chips', value: 180, percentage: 27 },
      { source: 'Alaska Evap Milk', target: 'Bear Brand Milk', value: 280, percentage: 42 },
      { source: 'Alaska Evap Milk', target: 'Nestle Evap Milk', value: 210, percentage: 32 },
      { source: 'Palmolive Shampoo', target: 'Head & Shoulders', value: 150, percentage: 38 },
      { source: 'Palmolive Shampoo', target: 'Pantene', value: 120, percentage: 30 },
      { source: 'Surf Powder', target: 'Tide Powder', value: 200, percentage: 45 },
      { source: 'Surf Powder', target: 'Ariel Powder', value: 180, percentage: 40 },
      { source: 'Lucky Me Pancit Canton', target: 'Nissin Pancit Canton', value: 350, percentage: 58 }
    ]
  });

  const tabs = [
    { id: 'category-performance', label: 'Category Performance', icon: Package },
    { id: 'brand-comparison', label: 'Brand Comparison', icon: Star },
    { id: 'sku-deep-dive', label: 'SKU Deep Dive', icon: Eye },
    { id: 'product-mix', label: 'Product Mix', icon: TrendingUp }
  ];

  const formatCurrency = (value: number) => `₱${(value / 1000).toFixed(0)}K`;
  const formatNumber = (value: number) => value.toLocaleString();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('sales') || entry.name.includes('value') ? 
                formatCurrency(entry.value) : entry.name.includes('growth') ? 
                `${entry.value}%` : formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderCategoryPerformance = () => (
    <div className="space-y-6">
      {/* Category Overview Chart */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Category Performance Overview</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select className="text-sm border-0 bg-transparent focus:ring-0">
              <option>Sales Volume</option>
              <option>Growth Rate</option>
              <option>Margin</option>
            </select>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={productData.categoryPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
            <XAxis dataKey="category" tick={{ fill: '#6B7280', fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: '#6B7280', fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6B7280', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            
            <Bar yAxisId="left" dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} opacity={0.7} />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="growth" 
              stroke="#14B8A6" 
              strokeWidth={3}
              dot={{ fill: '#14B8A6', strokeWidth: 2, r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Category Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {productData.categoryPerformance.map((categoryItem, index) => (
          <motion.div
            key={categoryItem.category}
            className="metric-card cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => {
              setFilter('category', categoryItem.category);
              navigate('/geography');
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">{categoryItem.category}</h4>
              <div className={`text-sm font-medium ${
                categoryItem.growth > 20 ? 'text-green-600' : 
                categoryItem.growth > 10 ? 'text-blue-600' : 'text-gray-600'
              }`}>
                <ArrowUp className="w-3 h-3 inline mr-1" />
                {categoryItem.growth}%
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sales</span>
                <span className="font-medium">{formatCurrency(categoryItem.sales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Margin</span>
                <span className="font-medium">{categoryItem.margin}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Transactions</span>
                <span className="font-medium">{formatNumber(categoryItem.transactions)}</span>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Click to analyze by location</span>
                <MoreHorizontal className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Substitution Patterns Chart */}
      <SubstitutionPatternsChart 
        data={substitutionPatternsData.length > 0 ? substitutionPatternsData : productData.substitutionPatterns}
        title="Brand Substitution Patterns"
        height={400}
      />
    </div>
  );

  const renderBrandComparison = () => (
    <div className="space-y-6">
      {/* Brand Performance Chart */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Brand Performance Comparison</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Market Share vs Growth</span>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart data={productData.brandComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
            <XAxis 
              dataKey="market_share" 
              tick={{ fill: '#6B7280', fontSize: 11 }}
              label={{ value: 'Market Share (%)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              dataKey="growth" 
              tick={{ fill: '#6B7280', fontSize: 11 }}
              label={{ value: 'Growth Rate (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg p-3 shadow-lg">
                      <p className="font-medium text-gray-900">{data.brand}</p>
                      <p className="text-sm text-gray-600">Sales: {formatCurrency(data.sales)}</p>
                      <p className="text-sm text-gray-600">Market Share: {data.market_share}%</p>
                      <p className="text-sm text-gray-600">Growth: {data.growth}%</p>
                      <p className="text-sm text-gray-600">Satisfaction: {data.satisfaction}/5</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter dataKey="sales" fill="#3B82F6" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Brand Ranking Table */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Brand Rankings</h3>
          <button className="text-sm text-primary-600 hover:text-primary-800">
            View All Brands →
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Brand</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Sales</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Market Share</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Growth</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Satisfaction</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {productData.brandComparison.map((brandItem, index) => (
                <tr key={brandItem.brand} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{brandItem.brand}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-medium">{formatCurrency(brandItem.sales)}</td>
                  <td className="py-3 px-4 text-right">{brandItem.market_share}%</td>
                  <td className="py-3 px-4 text-right">
                    <div className={`flex items-center justify-end ${
                      brandItem.growth > 25 ? 'text-green-600' : 
                      brandItem.growth > 15 ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      <ArrowUp className="w-3 h-3 mr-1" />
                      {brandItem.growth}%
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end">
                      <span className="mr-1">{brandItem.satisfaction}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(brandItem.satisfaction) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => {
                        setFilter('brand', brandItem.brand);
                        navigate('/geography');
                      }}
                      className="text-primary-600 hover:text-primary-800 text-sm"
                    >
                      Analyze
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SKU Substitution Patterns */}
      <SubstitutionPatternsChart 
        data={substitutionPatternsData.length > 0 ? substitutionPatternsData : productData.substitutionPatterns}
        title="SKU Substitution Patterns"
        height={400}
      />
    </div>
  );

  const renderSKUDeepDive = () => (
    <div className="space-y-6">
      {/* SKU Performance Table */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Performing SKUs</h3>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search SKUs..."
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select className="text-sm border border-gray-300 rounded-md px-2 py-1">
              <option>All Categories</option>
              <option>Beverages</option>
              <option>Snacks</option>
              <option>Dairy</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">SKU</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Category</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Sales</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Units</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Growth</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Margin</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {productData.topSKUs.map((skuItem, index) => (
                <tr 
                  key={skuItem.sku} 
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    selectedProducts.includes(skuItem.sku) ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <input 
                      type="checkbox" 
                      className="rounded"
                      checked={selectedProducts.includes(skuItem.sku)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([...selectedProducts, skuItem.sku]);
                        } else {
                          setSelectedProducts(selectedProducts.filter(p => p !== skuItem.sku));
                        }
                      }}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{skuItem.sku}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {skuItem.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium">{formatCurrency(skuItem.sales)}</td>
                  <td className="py-3 px-4 text-right">{formatNumber(skuItem.units)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className={`flex items-center justify-end ${
                      skuItem.growth > 25 ? 'text-green-600' : 
                      skuItem.growth > 15 ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      <ArrowUp className="w-3 h-3 mr-1" />
                      {skuItem.growth}%
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">{skuItem.margin}%</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => {
                          setFilter('sku', skuItem.sku);
                          navigate('/geography');
                        }}
                        className="text-primary-600 hover:text-primary-800 text-sm"
                      >
                        <MapPin className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setFilter('sku', skuItem.sku);
                          navigate('/consumers');
                        }}
                        className="text-secondary-600 hover:text-secondary-800 text-sm"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {selectedProducts.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedProducts.length} SKUs selected
              </span>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                  Compare Selected
                </button>
                <button 
                  onClick={() => setSelectedProducts([])}
                  className="px-3 py-1 text-blue-600 text-sm hover:text-blue-800"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Substitution Patterns */}
      <SubstitutionPatternsChart 
        data={substitutionPatternsData.length > 0 ? substitutionPatternsData : productData.substitutionPatterns}
        title="Product Substitution Patterns"
        height={400}
      />
    </div>
  );

  const renderProductMix = () => (
    <div className="space-y-6">
      {/* Product Mix Treemap */}
      <div>
        <TreemapChartOptimized 
          data={productData.productMix}
          title="Product Mix Visualization"
          height={500}
          showHierarchy={true}
          onSegmentClick={(data) => {
            console.log('Segment clicked:', data);
            // Add navigation or drill-down logic here
          }}
        />
        
        <div className="text-center text-sm text-gray-600 mt-4">
          Click on segments to drill down into subcategories
        </div>
      </div>

      {/* Alternative Horizontal Bar Chart */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Category Performance Comparison</h3>
          <span className="text-sm text-gray-600">Ranked by Sales Volume</span>
        </div>
        
        <HorizontalBarChart 
          data={productData.productMix}
          title=""
          height={300}
          sortDescending={true}
        />
      </div>

      {/* Substitution Patterns */}
      <SubstitutionPatternsChart 
        data={substitutionPatternsData.length > 0 ? substitutionPatternsData : productData.substitutionPatterns}
        title="Product Substitution Patterns"
        height={400}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Analysis</h1>
          <p className="text-gray-600">
            Comprehensive insights into product performance and opportunities
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="filter-button flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button className="filter-button flex items-center space-x-2">
            <RefreshCcw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Product Hierarchy Breadcrumb */}
      {(client || category || brand || sku) && (
        <motion.div
          className="flex items-center space-x-2 text-sm bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg p-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-gray-600">Current Selection:</span>
          {client && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              🏢 {client}
            </span>
          )}
          {category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              📦 {category}
            </span>
          )}
          {brand && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              🏷️ {brand}
            </span>
          )}
          {sku && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              📋 {sku}
            </span>
          )}
        </motion.div>
      )}

      {/* Tab Navigation */}
      <motion.div
        className="flex space-x-1 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg p-1 overflow-x-auto"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <tab.icon className="w-4 h-4 flex-shrink-0" />
            <span>{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Main Content with AI Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Tab Content */}
        <motion.div
          key={activeTab}
          className="xl:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'category-performance' && renderCategoryPerformance()}
          {activeTab === 'brand-comparison' && renderBrandComparison()}
          {activeTab === 'sku-deep-dive' && renderSKUDeepDive()}
          {activeTab === 'product-mix' && renderProductMix()}
        </motion.div>

        {/* AI Insights Panel */}
        <motion.div
          className="xl:col-span-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <AIInsightsPanel 
            context="products" 
            data={{
              ...productData,
              substitutionPatterns: substitutionPatternsData.length > 0 ? substitutionPatternsData : productData.substitutionPatterns
            }}
            filters={filters}
            className="sticky top-4"
          />
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        className="flex flex-wrap gap-3 justify-center pt-6 border-t border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <button
          onClick={() => navigate('/geography')}
          className="filter-button flex items-center space-x-2"
        >
          <MapPin className="w-4 h-4" />
          <span>Geographic Analysis</span>
        </button>
        <button
          onClick={() => navigate('/consumers')}
          className="filter-button flex items-center space-x-2"
        >
          <Users className="w-4 h-4" />
          <span>Customer Segments</span>
        </button>
        <button
          onClick={() => navigate('/transactions')}
          className="filter-button flex items-center space-x-2"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Transaction Analysis</span>
        </button>
        <button
          onClick={() => navigate('/ai-assistant')}
          className="filter-button flex items-center space-x-2"
        >
          <Eye className="w-4 h-4" />
          <span>AI Insights</span>
        </button>
      </motion.div>
    </div>
  );
};

export default ProductAnalysis;