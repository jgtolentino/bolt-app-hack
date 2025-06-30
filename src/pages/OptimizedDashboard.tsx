import React, { Suspense, lazy, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  ShoppingCart, 
  Receipt, 
  Package,
  MapPin,
  RefreshCw,
  Calendar,
  Store,
  Users,
  DollarSign,
  Loader2
} from 'lucide-react';
import { useDashboardData, dateRanges } from '../hooks/useOptimizedData';
import { useFilterStore } from '../stores/filterStore';
import { KpiCard, ChartPanel, RankedList, InsightCard } from '../components/widgets';
import { fmt } from '../utils/formatters';

// Lazy load heavy components
const SalesTrendChart = lazy(() => import('../components/charts/SalesTrendChart'));
const TransactionVolumeChart = lazy(() => import('../components/charts/TransactionVolumeChart'));
const LocationHeatmap = lazy(() => import('../components/charts/LocationHeatmap'));
const ProductCombosNetwork = lazy(() => import('../components/charts/ProductCombosNetwork'));

// Chart loading wrapper
const ChartLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
  </div>
);

// Main Dashboard Component
const OptimizedDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('last7Days');
  const { region, city_municipality } = useFilterStore();
  const [lastUpdate] = useState(new Date());
  
  // Get date range
  const dateFilter = useMemo(() => {
    return dateRanges[dateRange as keyof typeof dateRanges]();
  }, [dateRange]);

  // Fetch dashboard data
  const { 
    data, 
    isLoading, 
    isFetching, 
    error, 
    refetch 
  } = useDashboardData({
    ...dateFilter,
    region: region || undefined,
    storeId: city_municipality || undefined
  });

  // Primary KPI Cards (most important 4)
  const primaryKpis = useMemo(() => [
    {
      id: 'total-sales',
      label: 'Total Sales',
      value: data?.kpiMetrics?.totalSales?.value || 0,
      delta: data?.kpiMetrics?.totalSales?.change || 0,
      icon: DollarSign,
      valueFormat: 'currency' as const
    },
    {
      id: 'transactions',
      label: 'Transactions',
      value: data?.kpiMetrics?.totalTransactions?.value || 0,
      delta: data?.kpiMetrics?.totalTransactions?.change || 0,
      icon: Receipt,
      valueFormat: 'number' as const
    },
    {
      id: 'avg-basket',
      label: 'Avg Basket Size',
      value: data?.kpiMetrics?.avgBasketSize?.value || 0,
      delta: data?.kpiMetrics?.avgBasketSize?.change || 0,
      icon: ShoppingCart,
      valueFormat: 'currency' as const
    },
    {
      id: 'conversion',
      label: 'Conversion Rate',
      value: data?.kpiMetrics?.conversionRate?.value || 68.5,
      delta: data?.kpiMetrics?.conversionRate?.change || 2.1,
      icon: TrendingUp,
      valueFormat: 'percentage' as const
    }
  ], [data]);

  // Transform data for RankedList
  const topProductsData = useMemo(() => {
    return (data?.topProducts || []).map((product: any) => ({
      id: product.product_id || product.product_name,
      label: product.product_name,
      value: product.total_revenue,
      delta: product.growth_rate,
      metadata: {
        category: product.category_name,
        units: product.total_units_sold
      }
    }));
  }, [data?.topProducts]);

  const topRegionsData = useMemo(() => {
    return (data?.regionalPerformance || []).map((region: any) => ({
      id: region.region,
      label: fmt.region(region.region),
      value: region.total_sales,
      delta: region.growth_rate,
      metadata: {
        stores: region.store_count,
        transactions: region.transaction_count
      }
    }));
  }, [data?.regionalPerformance]);

  // AI Insights
  const insights = useMemo(() => [
    {
      title: 'Sales Spike Detected',
      body: 'Sales increased by 28% in NCR region during lunch hours. Consider increasing inventory for popular items.',
      type: 'trend' as const,
      impact: 'high' as const,
      confidence: 85,
      tags: ['NCR', 'Peak Hours']
    },
    {
      title: 'Low Stock Alert',
      body: 'Coca-Cola 355ml and Oishi Prawn Crackers are running low across 5 stores. Restock recommended.',
      type: 'warning' as const,
      impact: 'medium' as const,
      tags: ['Inventory', 'Beverages', 'Snacks']
    }
  ], []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl-phi font-bold text-gray-900">Command Center</h1>
              <p className="text-sm-phi text-gray-500 mt-1">
                Real-time insights and performance metrics
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Date Range Selector */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7Days">Last 7 Days</option>
                <option value="last30Days">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Golden Ratio spacing */}
      <div className="p-phi-lg space-y-phi-lg">
        {/* KPI Cards Row - 4 cards in grid */}
        <section className="grid grid-cols-12 gap-phi" data-testid="kpi-row">
          {primaryKpis.map((kpi) => (
            <KpiCard
              key={kpi.id}
              icon={kpi.icon}
              label={kpi.label}
              value={kpi.value}
              delta={kpi.delta}
              valueFormat={kpi.valueFormat}
              loading={isLoading}
              className="col-span-3 md:col-span-6 sm:col-span-12"
              updatedAt={lastUpdate}
            />
          ))}
        </section>

        {/* Main Charts Section */}
        <section className="grid grid-cols-12 gap-phi-md">
          {/* Main Trend Chart - Full width */}
          <ChartPanel
            title="Sales Trend (24 hr)"
            subtitle="Hourly sales performance with moving average"
            className="col-span-12"
            height={400}
            loading={isLoading}
            updatedAt={lastUpdate}
            onRefresh={() => refetch()}
            chart={
              <Suspense fallback={<ChartLoader />}>
                <SalesTrendChart 
                  data={data?.salesTrend || []} 
                  loading={isLoading}
                />
              </Suspense>
            }
          />
        </section>

        {/* Secondary Section: Transaction Volume (8 cols) + Top Products (4 cols) */}
        <section className="grid grid-cols-12 gap-phi-md">
          {/* Transaction Volume - 8/12 columns */}
          <ChartPanel
            title="Transaction Volume Pattern"
            subtitle="Hourly distribution of customer transactions"
            className="col-span-8 md:col-span-12"
            height={320}
            loading={isLoading}
            updatedAt={lastUpdate}
            chart={
              <Suspense fallback={<ChartLoader />}>
                <TransactionVolumeChart 
                  data={data?.transactionVolume || []} 
                  loading={isLoading}
                />
              </Suspense>
            }
          />

          {/* Top Products List - 4/12 columns */}
          <RankedList
            title="Top Products"
            items={topProductsData}
            type="product"
            valueFormat="currency"
            maxItems={5}
            loading={isLoading}
            className="col-span-4 md:col-span-12"
            updatedAt={lastUpdate}
          />
        </section>

        {/* Tertiary Section: Map (7 cols) + Regions (5 cols) - Inverse Golden Ratio */}
        <section className="grid grid-cols-12 gap-phi-md">
          {/* Location Heatmap - 7/12 columns */}
          <ChartPanel
            title="Store Performance Heatmap"
            subtitle="Geographic distribution of sales"
            className="col-span-7 md:col-span-12"
            height={350}
            loading={isLoading}
            updatedAt={lastUpdate}
            chart={
              <Suspense fallback={<ChartLoader />}>
                <LocationHeatmap 
                  data={data?.storePerformance || []} 
                  loading={isLoading}
                />
              </Suspense>
            }
          />

          {/* Regional Performance - 5/12 columns */}
          <RankedList
            title="Regional Performance"
            subtitle="Sales by Philippine regions"
            items={topRegionsData}
            type="region"
            valueFormat="currency"
            maxItems={6}
            loading={isLoading}
            className="col-span-5 md:col-span-12"
            updatedAt={lastUpdate}
          />
        </section>

        {/* AI Insights Section: Full Width with Nested Golden Ratio */}
        <section className="grid grid-cols-12 gap-phi-md">
          {/* Product Combos - 8/12 columns */}
          <ChartPanel
            title="Product Purchase Patterns"
            subtitle="Frequently bought together combinations"
            className="col-span-8 md:col-span-12"
            height={400}
            loading={isLoading}
            updatedAt={lastUpdate}
            chart={
              <Suspense fallback={<ChartLoader />}>
                <ProductCombosNetwork 
                  data={data?.productCombos || []} 
                  loading={isLoading}
                />
              </Suspense>
            }
          />

          {/* AI Insights Rail - 4/12 columns */}
          <div className="col-span-4 md:col-span-12 space-y-phi">
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
                actionLabel="View Details"
                onAction={() => console.log('View insight:', insight.title)}
              />
            ))}
          </div>
        </section>

        {/* Quick Stats Bar - Full Width */}
        <section className="grid grid-cols-12 gap-4 p-phi-md bg-white rounded-xl shadow-sm">
          <div className="col-span-3 md:col-span-6 sm:col-span-12 text-center">
            <p className="text-sm-phi text-gray-600">Active Stores</p>
            <p className="text-lg-phi font-bold text-gray-900">234</p>
          </div>
          <div className="col-span-3 md:col-span-6 sm:col-span-12 text-center">
            <p className="text-sm-phi text-gray-600">Active SKUs</p>
            <p className="text-lg-phi font-bold text-gray-900">1,876</p>
          </div>
          <div className="col-span-3 md:col-span-6 sm:col-span-12 text-center">
            <p className="text-sm-phi text-gray-600">Total Customers</p>
            <p className="text-lg-phi font-bold text-gray-900">5,234</p>
          </div>
          <div className="col-span-3 md:col-span-6 sm:col-span-12 text-center">
            <p className="text-sm-phi text-gray-600">Inventory Turnover</p>
            <p className="text-lg-phi font-bold text-gray-900">4.2x</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OptimizedDashboard;