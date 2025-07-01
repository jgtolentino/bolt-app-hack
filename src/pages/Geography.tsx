import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFilterStore } from '../features/filters/filterStore';
import { useDataStore } from '../stores/dataStore';
import { KpiCard, ChartPanel, RankedList, InsightCard } from '../components/widgets';
import { AIInsightsPanel } from '../components/ai/AIInsightsPanel';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Area, Cell, RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import { 
  MapPin, Globe, TrendingUp, Users, Store, Package,
  Navigation, Activity, DollarSign, Target
} from 'lucide-react';
import GeographicMap from '../components/maps/GeographicMap';
import HeatmapGrid from '../components/charts/HeatmapGrid';
import { fmt } from '../utils/formatters';

const GeographicAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const filters = useFilterStore();
  const { geographicData, storeGeographicData, loading } = useDataStore();
  const [activeTab, setActiveTab] = useState('regional-overview');
  const [mapView, setMapView] = useState('sales');
  const [lastUpdate] = useState(new Date());

  // Mock data for fallback - replace with API calls
  const mockGeographicData = {
    regionalPerformance: [
      { region: 'NCR', sales: 850000, growth: 22.5, stores: 45, population: 13484462, latitude: 14.5995, longitude: 120.9842 },
      { region: 'Region VII', sales: 545000, growth: 18.2, stores: 32, population: 7396898, latitude: 10.3157, longitude: 123.8854 },
      { region: 'Region III', sales: 423000, growth: 15.7, stores: 28, population: 11218177, latitude: 15.4817, longitude: 120.5979 },
      { region: 'Region IV-A', sales: 389000, growth: 14.3, stores: 25, population: 14414774, latitude: 14.2206, longitude: 121.1500 },
      { region: 'Region VI', sales: 312000, growth: 12.8, stores: 22, population: 7536383, latitude: 10.7202, longitude: 122.5621 },
      { region: 'Region V', sales: 278000, growth: 11.2, stores: 20, population: 5796989, latitude: 13.1391, longitude: 123.7437 },
      { region: 'Region XI', sales: 245000, growth: 9.8, stores: 18, population: 4893318, latitude: 7.0731, longitude: 125.6128 },
      { region: 'Region X', sales: 198000, growth: 8.5, stores: 15, population: 4689302, latitude: 8.4542, longitude: 124.6319 }
    ],
    cityPerformance: [
      { city: 'Quezon City', sales: 234000, growth: 28.5, stores: 12 },
      { city: 'Manila', sales: 198000, growth: 24.2, stores: 10 },
      { city: 'Cebu City', sales: 187000, growth: 22.1, stores: 9 },
      { city: 'Davao City', sales: 156000, growth: 19.8, stores: 8 },
      { city: 'Makati', sales: 145000, growth: 18.5, stores: 7 },
      { city: 'Pasig', sales: 132000, growth: 16.2, stores: 6 },
      { city: 'Taguig', sales: 118000, growth: 14.7, stores: 5 },
      { city: 'Cagayan de Oro', sales: 98000, growth: 12.3, stores: 4 }
    ],
    storeMetrics: [
      { metric: 'Store Density', value: 0.43, unit: 'per 10k pop' },
      { metric: 'Avg Store Sales', value: 245000, unit: '₱/month' },
      { metric: 'Coverage Rate', value: 68.5, unit: '%' },
      { metric: 'Expansion Potential', value: 31.5, unit: '%' }
    ]
  };

  // Transform store geographic data for the map component
  const mapData = useMemo(() => {
    if (storeGeographicData && storeGeographicData.length > 0) {
      // Use real store data if available
      return storeGeographicData.map(store => ({
        id: store.id,
        name: store.store_name || store.region,
        region: store.region,
        city_municipality: store.city_municipality,
        barangay: store.barangay,
        latitude: store.latitude,
        longitude: store.longitude,
        sales: store.sales || 0,
        growth: store.growth || 0,
        stores: 1,
        population: store.population || 0
      }));
    } else {
      // Use mock data with proper lat/lng as fallback
      return mockGeographicData.regionalPerformance.map(region => ({
        id: region.region,
        name: region.region,
        region: region.region,
        city_municipality: region.region,
        barangay: '',
        latitude: region.latitude,
        longitude: region.longitude,
        sales: region.sales,
        growth: region.growth,
        stores: region.stores,
        population: region.population
      }));
    }
  }, [storeGeographicData]);

  // KPI Cards
  const kpiCards = useMemo(() => [
    {
      id: 'total-regions',
      label: 'Active Regions',
      value: 18,
      delta: 12.5,
      icon: Globe,
      valueFormat: 'number' as const
    },
    {
      id: 'total-stores',
      label: 'Total Stores',
      value: 234,
      delta: 8.7,
      icon: Store,
      valueFormat: 'number' as const
    },
    {
      id: 'avg-sales-per-region',
      label: 'Avg Sales/Region',
      value: 324500,
      delta: 15.3,
      icon: DollarSign,
      valueFormat: 'currency' as const
    },
    {
      id: 'coverage-rate',
      label: 'Market Coverage',
      value: 68.5,
      delta: 4.2,
      icon: Target,
      valueFormat: 'percentage' as const
    }
  ], []);

  const secondaryKpis = useMemo(() => [
    {
      id: 'ncr-sales',
      label: 'NCR Sales Share',
      value: 28.5,
      delta: 2.1,
      icon: MapPin,
      valueFormat: 'percentage' as const
    },
    {
      id: 'provincial-growth',
      label: 'Provincial Growth',
      value: 18.7,
      delta: 5.4,
      icon: TrendingUp,
      valueFormat: 'percentage' as const
    },
    {
      id: 'urban-rural-split',
      label: 'Urban Sales %',
      value: 72.3,
      delta: -1.2,
      icon: Navigation,
      valueFormat: 'percentage' as const
    },
    {
      id: 'expansion-stores',
      label: 'New Stores (QTD)',
      value: 12,
      delta: 50,
      icon: Activity,
      valueFormat: 'number' as const
    }
  ], []);

  // Transform data for ranked lists
  const topRegions = useMemo(() => {
    return mockGeographicData.regionalPerformance.map(region => ({
      id: region.region,
      label: fmt.region(region.region),
      value: region.sales,
      delta: region.growth,
      metadata: { stores: region.stores }
    }));
  }, []);

  const topCities = useMemo(() => {
    return mockGeographicData.cityPerformance.map(city => ({
      id: city.city,
      label: city.city,
      value: city.sales,
      delta: city.growth,
      metadata: { stores: city.stores }
    }));
  }, []);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('sales') || entry.name.includes('Sales') ? 
                fmt.currencyCompact(entry.value) : fmt.number(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const tabs = [
    { id: 'regional-overview', label: 'Regional Overview', icon: Globe },
    { id: 'city-analysis', label: 'City Analysis', icon: MapPin },
    { id: 'store-density', label: 'Store Density', icon: Store },
    { id: 'expansion', label: 'Expansion Opportunities', icon: Target }
  ];

  // Tab content renderers
  const renderRegionalOverview = () => (
    <>
      {/* Philippines Map */}
      <ChartPanel
        title="Sales Performance by Region"
        subtitle="Click regions to drill down"
        className="col-span-8 md:col-span-12"
        height={400}
        loading={loading}
        updatedAt={lastUpdate}
        chart={
          <GeographicMap
            data={mapData}
            metric={mapView}
            onRegionClick={(region) => console.log('Region clicked:', region)}
          />
        }
        footer={
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setMapView('sales')}
              className={`px-3 py-1 rounded text-sm ${mapView === 'sales' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
            >
              Sales
            </button>
            <button
              onClick={() => setMapView('growth')}
              className={`px-3 py-1 rounded text-sm ${mapView === 'growth' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
            >
              Growth
            </button>
            <button
              onClick={() => setMapView('stores')}
              className={`px-3 py-1 rounded text-sm ${mapView === 'stores' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
            >
              Stores
            </button>
          </div>
        }
      />

      {/* Top Regions List */}
      <RankedList
        title="Top Performing Regions"
        subtitle="By total sales value"
        items={topRegions}
        type="region"
        valueFormat="currency"
        maxItems={8}
        loading={loading}
        className="col-span-4 md:col-span-12"
        updatedAt={lastUpdate}
      />

      {/* Regional Comparison Chart */}
      <ChartPanel
        title="Regional Sales vs Population"
        subtitle="Market penetration analysis"
        className="col-span-12"
        height={300}
        loading={loading}
        updatedAt={lastUpdate}
        chart={
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={mockGeographicData.regionalPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.25} />
              <XAxis dataKey="region" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              
              <Bar yAxisId="left" dataKey="sales" fill="#3B82F6" opacity={0.7} radius={[4, 4, 0, 0]} />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="stores" 
                stroke="#F97316" 
                strokeWidth={3}
                dot={{ fill: '#F97316', strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        }
      />
    </>
  );

  const renderCityAnalysis = () => (
    <>
      {/* City Performance Chart */}
      <ChartPanel
        title="Top Cities by Sales"
        subtitle="Urban market performance"
        className="col-span-8 md:col-span-12"
        height={300}
        loading={loading}
        updatedAt={lastUpdate}
        chart={
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockGeographicData.cityPerformance} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.25} />
              <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis dataKey="city" type="category" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sales" fill="#8B5CF6" radius={[0, 4, 4, 0]}>
                {mockGeographicData.cityPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.growth > 20 ? '#10B981' : '#8B5CF6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        }
      />

      {/* City Rankings */}
      <RankedList
        title="City Rankings"
        subtitle="By sales performance"
        items={topCities}
        type="region"
        valueFormat="currency"
        maxItems={8}
        loading={loading}
        className="col-span-4 md:col-span-12"
        updatedAt={lastUpdate}
      />
    </>
  );

  // AI Insights
  const insights = [
    {
      title: 'NCR Dominance',
      body: 'NCR accounts for 28.5% of total sales despite having only 19% of stores. Consider premium pricing strategy.',
      type: 'trend' as const,
      impact: 'high' as const,
      confidence: 88,
      tags: ['NCR', 'Pricing']
    },
    {
      title: 'Provincial Opportunity',
      body: 'Regions V and XI show 18.7% growth with low store density. Prime targets for expansion.',
      type: 'opportunity' as const,
      impact: 'high' as const,
      tags: ['Expansion', 'Provincial']
    },
    {
      title: 'Urban Saturation Risk',
      body: 'Manila and Makati approaching saturation with 0.8 stores per 10k population. Focus on service quality.',
      type: 'warning' as const,
      impact: 'medium' as const,
      tags: ['Urban', 'Strategy']
    }
  ];

  return (
    <div className="space-y-phi-lg">
      {/* Page Header */}
      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-xl-phi font-bold text-gray-900">Geographic Analytics</h1>
          <p className="text-sm-phi text-gray-600">Regional performance and expansion insights</p>
        </div>
      </motion.div>

      {/* KPI Cards Row 1 */}
      <section className="grid grid-cols-12 gap-phi">
        {kpiCards.map((kpi) => (
          <KpiCard
            key={kpi.id}
            icon={kpi.icon}
            label={kpi.label}
            value={kpi.value}
            delta={kpi.delta}
            valueFormat={kpi.valueFormat}
            loading={loading}
            className="col-span-3 md:col-span-6 sm:col-span-12"
            updatedAt={lastUpdate}
          />
        ))}
      </section>

      {/* KPI Cards Row 2 */}
      <section className="grid grid-cols-12 gap-phi">
        {secondaryKpis.map((kpi) => (
          <KpiCard
            key={kpi.id}
            icon={kpi.icon}
            label={kpi.label}
            value={kpi.value}
            delta={kpi.delta}
            valueFormat={kpi.valueFormat}
            loading={loading}
            className="col-span-3 md:col-span-6 sm:col-span-12"
            updatedAt={lastUpdate}
          />
        ))}
      </section>

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
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Main Content with AI Insights */}
      <div className="grid grid-cols-12 gap-phi-md">
        {/* Tab Content */}
        <motion.div
          key={activeTab}
          className="col-span-8 xl:col-span-9"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-12 gap-phi-md">
            {activeTab === 'regional-overview' && renderRegionalOverview()}
            {activeTab === 'city-analysis' && renderCityAnalysis()}
            {/* Add other tab content as needed */}
          </div>
        </motion.div>

        {/* AI Insights Panel */}
        <motion.div
          className="col-span-4 xl:col-span-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="sticky top-4 space-y-phi">
            <h3 className="text-lg-phi font-semibold text-gray-900">AI Insights</h3>
            {insights.map((insight, index) => (
              <InsightCard
                key={index}
                title={insight.title}
                body={insight.body}
                type={insight.type}
                impact={insight.impact}
                confidence={insight.confidence}
                tags={insight.tags}
                updatedAt={lastUpdate}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GeographicAnalytics;