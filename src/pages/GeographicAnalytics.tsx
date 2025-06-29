import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFilterStore } from '../stores/filterStore';
import { useDataStore } from '../stores/dataStore';
import { AIInsightsPanel } from '../components/ai/AIInsightsPanel';
import GeographicMap from '../components/maps/GeographicMap';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ComposedChart, Area
} from 'recharts';
import {
  MapPin, TrendingUp, Building, Users, Zap, Eye, Settings,
  Download, RefreshCcw, Filter, Search, Grid, List, Map as MapIcon
} from 'lucide-react';

const GeographicAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { region, city_municipality, barangay, setFilter, filters } = useFilterStore();
  const { geographicData, loadGeographicData } = useDataStore();
  const [activeTab, setActiveTab] = useState('regional-performance');
  const [viewMode, setViewMode] = useState<'map' | 'grid' | 'list'>('map');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Mock data - replace with API calls
  const [geoData, setGeoData] = useState({
    regionalPerformance: [
      { region: 'NCR', sales: 850000, growth: 15.2, stores: 45, population: 13500000, density: 62.96 },
      { region: 'Region VII', sales: 380000, growth: 22.1, stores: 18, population: 8200000, density: 46.34 },
      { region: 'Region III', sales: 320000, growth: 18.5, stores: 15, population: 12400000, density: 25.81 },
      { region: 'Region IV-A', sales: 290000, growth: 8.9, stores: 12, population: 16200000, density: 17.90 },
      { region: 'Region VI', sales: 220000, growth: 12.8, stores: 8, population: 7800000, density: 28.21 },
      { region: 'Region XI', sales: 180000, growth: 25.4, stores: 6, population: 5400000, density: 33.33 }
    ],
    cityComparison: [
      { city: 'Manila', region: 'NCR', sales: 420000, growth: 12.5, rank: 1, market_share: 18.2 },
      { city: 'Quezon City', region: 'NCR', sales: 280000, growth: 18.7, rank: 2, market_share: 12.1 },
      { city: 'Cebu City', region: 'Region VII', sales: 180000, growth: 28.9, rank: 3, market_share: 7.8 },
      { city: 'Davao City', region: 'Region XI', sales: 120000, growth: 32.1, rank: 4, market_share: 5.2 },
      { city: 'Caloocan', region: 'NCR', sales: 95000, growth: 8.9, rank: 5, market_share: 4.1 },
      { city: 'Angeles City', region: 'Region III', sales: 85000, growth: 22.3, rank: 6, market_share: 3.7 }
    ],
    barangayAnalysis: [
      { barangay: 'Tondo', city: 'Manila', sales: 85000, density: 'High', stores: 8, population: 628903 },
      { barangay: 'Bagumbayan', city: 'Quezon City', sales: 42000, density: 'Medium', stores: 3, population: 45312 },
      { barangay: 'Lahug', city: 'Cebu City', sales: 38000, density: 'High', stores: 4, population: 89123 },
      { barangay: 'Bangkal', city: 'Davao City', sales: 28000, density: 'Medium', stores: 2, population: 78901 },
      { barangay: 'Grace Park', city: 'Caloocan', sales: 25000, density: 'High', stores: 3, population: 89456 },
      { barangay: 'Belen', city: 'Angeles City', sales: 22000, density: 'Low', stores: 2, population: 45678 }
    ],
    marketPenetration: [
      { region: 'NCR', penetration: 78.5, potential: 2.1, competition: 'High' },
      { region: 'Region VII', penetration: 45.2, potential: 4.8, competition: 'Medium' },
      { region: 'Region III', penetration: 38.7, potential: 3.2, competition: 'Medium' },
      { region: 'Region IV-A', penetration: 28.9, potential: 5.1, competition: 'Low' },
      { region: 'Region VI', penetration: 35.4, potential: 2.8, competition: 'Medium' },
      { region: 'Region XI', penetration: 52.1, potential: 6.2, competition: 'Low' }
    ]
  });

  useEffect(() => {
    loadGeographicData();
  }, [region, city_municipality, barangay]);

  const tabs = [
    { id: 'regional-performance', label: 'Regional Performance', icon: Building },
    { id: 'city-comparison', label: 'City Comparison', icon: MapPin },
    { id: 'barangay-analysis', label: 'Barangay Analysis', icon: Grid },
    { id: 'location-intelligence', label: 'Location Intelligence', icon: Zap }
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
                formatCurrency(entry.value) : entry.name.includes('growth') || entry.name.includes('penetration') ? 
                `${entry.value}%` : formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getContextDescription = () => {
    const activeFilters = [];
    if (region) activeFilters.push(`Region: ${region}`);
    if (city_municipality) activeFilters.push(`City: ${city_municipality}`);
    if (barangay) activeFilters.push(`Barangay: ${barangay}`);
    
    if (activeFilters.length === 0) return 'All data (no filters applied)';
    return activeFilters.join(', ');
  };

  const renderRegionalPerformance = () => (
    <div className="space-y-6">
      {/* Regional Overview Chart */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Regional Performance Overview</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Sales vs Growth Rate</span>
            <select className="text-sm border-0 bg-transparent focus:ring-0">
              <option>All Regions</option>
              <option>Top Performers</option>
              <option>Growth Leaders</option>
            </select>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={geoData.regionalPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
            <XAxis dataKey="region" tick={{ fill: '#6B7280', fontSize: 11 }} />
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

      {/* Regional Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {geoData.regionalPerformance.map((regionItem, index) => (
          <motion.div
            key={regionItem.region}
            className="metric-card cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => {
              setFilter('region', regionItem.region);
              setSelectedRegion(regionItem.region);
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">{regionItem.region}</h4>
              <div className={`text-sm font-medium ${
                regionItem.growth > 20 ? 'text-green-600' : 
                regionItem.growth > 15 ? 'text-blue-600' : 'text-gray-600'
              }`}>
                +{regionItem.growth}%
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sales</span>
                <span className="font-medium">{formatCurrency(regionItem.sales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Stores</span>
                <span className="font-medium">{regionItem.stores}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Population</span>
                <span className="font-medium">{(regionItem.population / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Density</span>
                <span className="font-medium">{regionItem.density}/km²</span>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Click to drill down</span>
                <Eye className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Market Penetration Analysis */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Market Penetration vs Growth Potential</h3>
          <span className="text-sm text-gray-600">Bubble size = Market potential</span>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart data={geoData.marketPenetration}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
            <XAxis 
              dataKey="penetration" 
              tick={{ fill: '#6B7280', fontSize: 11 }}
              label={{ value: 'Market Penetration (%)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              dataKey="potential" 
              tick={{ fill: '#6B7280', fontSize: 11 }}
              label={{ value: 'Growth Potential', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg p-3 shadow-lg">
                      <p className="font-medium text-gray-900">{data.region}</p>
                      <p className="text-sm text-gray-600">Penetration: {data.penetration}%</p>
                      <p className="text-sm text-gray-600">Potential: {data.potential}</p>
                      <p className="text-sm text-gray-600">Competition: {data.competition}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter dataKey="potential" fill="#3B82F6" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderCityComparison = () => (
    <div className="space-y-6">
      {/* City Performance Chart */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Cities</h3>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search cities..."
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select className="text-sm border border-gray-300 rounded-md px-2 py-1">
              <option>All Regions</option>
              <option>NCR</option>
              <option>Region VII</option>
              <option>Region III</option>
            </select>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={geoData.cityComparison} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
            <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 12 }} />
            <YAxis dataKey="city" type="category" tick={{ fill: '#6B7280', fontSize: 11 }} width={100} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="sales" fill="#3B82F6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* City Ranking Table */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">City Performance Rankings</h3>
          <button className="text-sm text-primary-600 hover:text-primary-800">
            View All Cities →
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">City</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Region</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Sales</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Growth</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Market Share</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {geoData.cityComparison.map((city) => (
                <tr key={city.city} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {city.rank}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{city.city}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {city.region}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium">{formatCurrency(city.sales)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className={`flex items-center justify-end ${
                      city.growth > 25 ? 'text-green-600' : 
                      city.growth > 15 ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {city.growth}%
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">{city.market_share}%</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => {
                        setFilter('city_municipality', city.city);
                        navigate('/products');
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
    </div>
  );

  const renderBarangayAnalysis = () => (
    <div className="space-y-6">
      {/* Barangay Performance */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Barangay Performance Analysis</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Micro-location insights</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {geoData.barangayAnalysis.map((barangayItem, index) => (
            <motion.div
              key={barangayItem.barangay}
              className="metric-card cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setFilter('barangay', barangayItem.barangay);
                navigate('/consumers');
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{barangayItem.barangay}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  barangayItem.density === 'High' ? 'bg-red-100 text-red-800' :
                  barangayItem.density === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {barangayItem.density} Density
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">City</span>
                  <span className="font-medium">{barangayItem.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Sales</span>
                  
                  <span className="font-medium">{formatCurrency(barangayItem.sales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Stores</span>
                  <span className="font-medium">{barangayItem.stores}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Population</span>
                  <span className="font-medium">{formatNumber(barangayItem.population)}</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Click for consumer insights</span>
                  <Users className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Density Analysis */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Population Density vs Sales Performance</h3>
          <span className="text-sm text-gray-600">Opportunity identification</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="font-medium text-red-800">High Density Areas</span>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-red-600">3</div>
              <div className="text-sm text-red-700">Barangays</div>
              <div className="text-xs text-red-600">Avg Sales: ₱49K</div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="font-medium text-yellow-800">Medium Density Areas</span>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-yellow-600">2</div>
              <div className="text-sm text-yellow-700">Barangays</div>
              <div className="text-xs text-yellow-600">Avg Sales: ₱35K</div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium text-green-800">Low Density Areas</span>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">1</div>
              <div className="text-sm text-green-700">Barangays</div>
              <div className="text-xs text-green-600">Avg Sales: ₱22K</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLocationIntelligence = () => (
    <div className="space-y-6">
      {/* AI-Powered Insights */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Location Intelligence Insights</h3>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-600">AI-Powered Analysis</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Growth Opportunity</span>
              </div>
              <h4 className="font-semibold text-blue-900 mb-1">Region XI Expansion</h4>
              <p className="text-sm text-blue-700 mb-2">
                Davao region shows 25.4% growth with low competition. Recommended for immediate expansion.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600">Confidence: 92%</span>
                <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                  View Details
                </button>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Site Selection</span>
              </div>
              <h4 className="font-semibold text-green-900 mb-1">Optimal Locations</h4>
              <p className="text-sm text-green-700 mb-2">
                3 high-potential barangays identified in Cebu City for new store placement.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600">ROI Projection: 180%</span>
                <button className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                  View Map
                </button>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-800">Demographics</span>
              </div>
              <h4 className="font-semibold text-purple-900 mb-1">Target Segments</h4>
              <p className="text-sm text-purple-700 mb-2">
                Young professionals (25-35) dominate NCR sales. Tailor product mix accordingly.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-600">Segment Size: 2.3M</span>
                <button className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                  Analyze
                </button>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Building className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-800">Competition Analysis</span>
              </div>
              <h4 className="font-semibold text-orange-900 mb-1">Market Gaps</h4>
              <p className="text-sm text-orange-700 mb-2">
                Low competitor density in Region IV-A presents untapped market opportunity.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-orange-600">Competition Index: 2.1</span>
                <button className="text-xs bg-orange-600 text-white px-2 py-1 rounded">
                  Strategy
                </button>
              </div>
            </div>
            
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Eye className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">Risk Assessment</span>
              </div>
              <h4 className="font-semibold text-red-900 mb-1">Market Saturation</h4>
              <p className="text-sm text-red-700 mb-2">
                NCR showing signs of saturation. Consider premium positioning or new formats.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-red-600">Risk Level: Medium</span>
                <button className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                  Mitigate
                </button>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Settings className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-800">Optimization</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Store Performance</h4>
              <p className="text-sm text-gray-700 mb-2">
                5 underperforming locations identified. Recommend operational improvements.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Improvement Potential: 35%</span>
                <button className="text-xs bg-gray-600 text-white px-2 py-1 rounded">
                  Optimize
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Predictive Analytics */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Predictive Location Analytics</h3>
          <span className="text-sm text-gray-600">6-month forecast</span>
        </div>
        
        <div className="bg-white/50 rounded-lg p-6">
          <div className="text-center text-gray-600">
            <div className="text-4xl mb-4">🔮</div>
            <h4 className="text-lg font-medium mb-2">Advanced Predictive Analytics</h4>
            <p className="text-sm mb-4">
              AI-powered location forecasting, site selection optimization,<br />
              and market expansion recommendations coming soon.
            </p>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Enable Predictive Analytics
            </button>
          </div>
        </div>
      </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Geographic Analytics</h1>
          <p className="text-gray-600">
            Location-based insights and market intelligence
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { mode: 'map', icon: MapIcon, label: 'Map' },
              { mode: 'grid', icon: Grid, label: 'Grid' },
              { mode: 'list', icon: List, label: 'List' }
            ].map((item) => (
              <button
                key={item.mode}
                onClick={() => setViewMode(item.mode as any)}
                className={`flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === item.mode
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
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

      {/* Geographic Context */}
      {(region || city_municipality || barangay) && (
        <motion.div
          className="flex items-center space-x-2 text-sm bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg p-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-gray-600">Current Location:</span>
          {region && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              📍 {region}
            </span>
          )}
          {city_municipality && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              🏘️ {city_municipality}
            </span>
          )}
          {barangay && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              🏠 {barangay}
            </span>
          )}
        </motion.div>
      )}

      {/* Main Content with AI Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Map View */}
        {viewMode === 'map' && (
          <motion.div
            className="xl:col-span-3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <GeographicMap data={geographicData} height={500} />
          </motion.div>
        )}

        {/* AI Insights Panel */}
        <motion.div
          className="xl:col-span-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <AIInsightsPanel 
            context="geography" 
            data={geoData}
            filters={filters}
            className="sticky top-4"
          />
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <motion.div
        className="flex space-x-1 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg p-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'regional-performance' && renderRegionalPerformance()}
        {activeTab === 'city-comparison' && renderCityComparison()}
        {activeTab === 'barangay-analysis' && renderBarangayAnalysis()}
        {activeTab === 'location-intelligence' && renderLocationIntelligence()}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="flex flex-wrap gap-3 justify-center pt-6 border-t border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <button
          onClick={() => navigate('/products')}
          className="filter-button flex items-center space-x-2"
        >
          <Building className="w-4 h-4" />
          <span>Product Analysis</span>
        </button>
        <button
          onClick={() => navigate('/consumers')}
          className="filter-button flex items-center space-x-2"
        >
          <Users className="w-4 h-4" />
          <span>Demographics</span>
        </button>
        <button
          onClick={() => navigate('/transactions')}
          className="filter-button flex items-center space-x-2"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Transaction Patterns</span>
        </button>
        <button
          onClick={() => navigate('/ai-assistant')}
          className="filter-button flex items-center space-x-2"
        >
          <Zap className="w-4 h-4" />
          <span>AI Insights</span>
        </button>
      </motion.div>
    </div>
  );
};

export default GeographicAnalytics;