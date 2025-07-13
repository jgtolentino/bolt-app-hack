import React, { useState, useEffect } from 'react';
import { BarChart3, ShoppingBag, Users, Brain, Filter } from 'lucide-react';
import TransactionTrends from './components/TransactionTrends';
import ProductMixSKU from './components/ProductMixSKU';
import ConsumerBehavior from './components/ConsumerBehavior';
import ConsumerProfiling from './components/ConsumerProfiling';
import AIRecommendationPanel from './components/AIRecommendationPanel';
import { sqliteDataService } from './services/sqliteDataService';

function App() {
  const [activeModule, setActiveModule] = useState<'trends' | 'products' | 'behavior' | 'profiling'>('trends');
  const [showFilters, setShowFilters] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters state
  const [filters, setFilters] = useState({
    timeOfDay: '',
    region: '',
    barangay: '',
    weekVsWeekend: 'all' as 'week' | 'weekend' | 'all',
    category: '',
    brand: '',
    sku: '',
    location: '',
    gender: '' as '' | 'male' | 'female',
    ageGroup: ''
  });

  // Load data from Supabase
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await sqliteDataService.getTransactionTrends();
      setTransactions(data);
      
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filters
  const filterOptions = React.useMemo(() => {
    const regions = [...new Set(transactions.map(t => t.store?.region || t.region))];
    const barangays = [...new Set(transactions.map(t => t.store?.barangay || t.barangay))];
    const categories = [...new Set(transactions.flatMap(t => (t.items || []).map((i: any) => i.products?.product_category || i.category)))];
    const brands = [...new Set(transactions.flatMap(t => (t.items || []).map((i: any) => i.products?.brands?.brand_name || i.brand)))];
    const ageGroups = [...new Set(transactions.map(t => t.customer?.age_bracket || t.customer_profile?.age_bracket))];
    
    return { regions, barangays, categories, brands, ageGroups };
  }, [transactions]);

  const modules = [
    { id: 'trends', name: 'Transaction Trends', icon: BarChart3 },
    { id: 'products', name: 'Product Mix & SKU', icon: ShoppingBag },
    { id: 'behavior', name: 'Consumer Behavior', icon: Users },
    { id: 'profiling', name: 'Consumer Profiling', icon: Brain }
  ];

  const getActiveFilters = () => {
    switch (activeModule) {
      case 'trends':
        return { timeOfDay: filters.timeOfDay, region: filters.region, barangay: filters.barangay, 
                 weekVsWeekend: filters.weekVsWeekend, category: filters.category };
      case 'products':
        return { brand: filters.brand, category: filters.category, sku: filters.sku, location: filters.location };
      case 'behavior':
        return { category: filters.category, brand: filters.brand, barangay: filters.barangay };
      case 'profiling':
        return { gender: filters.gender, ageGroup: filters.ageGroup, brand: filters.brand, category: filters.category };
      default:
        return {};
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Scout Dashboard v4.0</h1>
              <span className="ml-3 text-sm text-gray-500">Philippine Sari-Sari Store Analytics</span>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Module Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 transition ${
                    activeModule === module.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{module.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Common Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <select
                  value={filters.region}
                  onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Regions</option>
                  {filterOptions.regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                <select
                  value={filters.barangay}
                  onChange={(e) => setFilters({ ...filters, barangay: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Barangays</option>
                  {filterOptions.barangays.map(barangay => (
                    <option key={barangay} value={barangay}>{barangay}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {filterOptions.categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <select
                  value={filters.brand}
                  onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Brands</option>
                  {filterOptions.brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              {/* Module-specific filters */}
              {activeModule === 'trends' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <select
                    value={filters.weekVsWeekend}
                    onChange={(e) => setFilters({ ...filters, weekVsWeekend: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Days</option>
                    <option value="week">Weekdays</option>
                    <option value="weekend">Weekends</option>
                  </select>
                </div>
              )}

              {activeModule === 'profiling' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={filters.gender}
                      onChange={(e) => setFilters({ ...filters, gender: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Genders</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
                    <select
                      value={filters.ageGroup}
                      onChange={(e) => setFilters({ ...filters, ageGroup: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Ages</option>
                      {filterOptions.ageGroups.map(age => (
                        <option key={age} value={age}>{age}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({
                    timeOfDay: '', region: '', barangay: '', weekVsWeekend: 'all',
                    category: '', brand: '', sku: '', location: '', gender: '', ageGroup: ''
                  })}
                  className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadData}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Module Content (2/3 width) */}
            <div className="lg:col-span-2">
              {activeModule === 'trends' && (
                <TransactionTrends transactions={transactions} filters={getActiveFilters()} />
              )}
              {activeModule === 'products' && (
                <ProductMixSKU transactions={transactions} filters={getActiveFilters()} />
              )}
              {activeModule === 'behavior' && (
                <ConsumerBehavior transactions={transactions} filters={getActiveFilters()} />
              )}
              {activeModule === 'profiling' && (
                <ConsumerProfiling transactions={transactions} filters={getActiveFilters()} />
              )}
            </div>

            {/* AI Recommendations Panel (1/3 width) */}
            <div className="lg:col-span-1">
              <AIRecommendationPanel transactions={transactions} activeModule={activeModule} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;