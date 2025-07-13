import TransactionTrendsEnhanced from '../TransactionTrendsEnhanced';
import SubstitutionSankey from './SubstitutionSankey';
import GeographicHeatmap from './GeographicHeatmap';
import { Transaction } from '../../utils/mockDataGenerator';

// Example integration showing all new v4.0 components

const DashboardV4Example = () => {
  // Mock data - replace with actual data from your API/database
  const transactions: Transaction[] = [
    // Your transaction data
  ];

  const substitutionData = [
    { originalProduct: 'Coke 1.5L', substitutedProduct: 'Pepsi 1.5L', count: 45, originalBrand: 'Coca-Cola', substitutedBrand: 'Pepsi' },
    { originalProduct: 'Coke 1.5L', substitutedProduct: 'RC Cola 1.5L', count: 23, originalBrand: 'Coca-Cola', substitutedBrand: 'RC' },
    { originalProduct: 'Lucky Me Pancit Canton', substitutedProduct: 'Payless Pancit Canton', count: 67, originalBrand: 'Lucky Me', substitutedBrand: 'Payless' },
    // Add more substitution patterns
  ];

  const regionData = [
    { id: 'ncr', name: 'Metro Manila', value: 2500000, transactions: 45000, customers: 12000, avgBasketSize: 55.56 },
    { id: 'region3', name: 'Central Luzon', value: 1800000, transactions: 32000, customers: 8500, avgBasketSize: 56.25 },
    { id: 'region4a', name: 'CALABARZON', value: 2100000, transactions: 38000, customers: 10000, avgBasketSize: 55.26 },
    // Add more regions
  ];

  // You'll need to provide Philippine GeoJSON data
  const philippinesGeoJson = null; // Load from your data source

  return (
    <div className="space-y-8 p-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Retail Insights Dashboard v4.0</h1>
        <p className="text-blue-100">Enhanced analytics with advanced visualizations</p>
      </div>

      {/* Transaction Trends Section with all new features */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Transaction Analysis</h2>
        <TransactionTrendsEnhanced 
          transactions={transactions}
          filters={{
            weekVsWeekend: 'all',
            // other filters
          }}
        />
      </section>

      {/* Product Substitution Analysis */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Substitution Patterns</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SubstitutionSankey
            substitutions={substitutionData}
            viewMode="product"
          />
          <SubstitutionSankey
            substitutions={substitutionData}
            viewMode="brand"
          />
        </div>
      </section>

      {/* Geographic Analysis */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Regional Performance</h2>
        <GeographicHeatmap
          regionData={regionData}
          geoJson={philippinesGeoJson}
          metric="value"
          mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        />
      </section>

      {/* Feature Summary Card */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-3">v4.0 New Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-800">
          <div>
            <strong>Transaction Trends:</strong>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Week vs Weekend Toggle</li>
              <li>Box Plot Distribution</li>
              <li>Day x Hour Heatmap</li>
            </ul>
          </div>
          <div>
            <strong>Product Analysis:</strong>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Substitution Sankey Flow</li>
              <li>Brand vs Product Views</li>
              <li>Retention Analysis</li>
            </ul>
          </div>
          <div>
            <strong>Geographic Insights:</strong>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Regional Heatmap</li>
              <li>Multi-metric Support</li>
              <li>Interactive Drilldown</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardV4Example;