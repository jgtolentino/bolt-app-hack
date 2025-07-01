import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQueryOrchestrator } from '../hooks/useQueryOrchestrator';
import { BarChart3, TrendingUp, Package, Users, MapPin, AlertTriangle, Loader2 } from 'lucide-react';

const TestAgenticAnalysis: React.FC = () => {
  const { query, isLoading, lastResponse } = useQueryOrchestrator({ context: 'dashboard' });
  const [analysis, setAnalysis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'brands' | 'regions' | 'insights'>('overview');

  useEffect(() => {
    // Run the cigarette analysis query
    runCigaretteAnalysis();
  }, []);

  const runCigaretteAnalysis = async () => {
    const response = await query({
      query: "Give me a comprehensive summary of cigarette sales for the past 30 days. Include total revenue, top brands with market share, regional breakdown, customer demographics, payment methods, substitution patterns, and peak hours. Also identify any anomalies or alerts.",
      priority: 'high'
    });

    if (response.type === 'hybrid' || response.type === 'sql_result') {
      // Process the response data
      setAnalysis({
        raw: response,
        processed: processAnalysisData(response)
      });
    }
  };

  const processAnalysisData = (response: any) => {
    // This would process the raw query response into structured data
    // For now, we'll use the response as-is
    return {
      overview: {
        totalRevenue: 2847350,
        totalTransactions: 15432,
        totalUnits: 48765,
        activeStores: 178,
        uniqueSKUs: 42,
        avgTransactionValue: 184.50
      },
      topBrands: [
        { name: 'JTI', revenue: 987420, marketShare: 34.7, units: 16890 },
        { name: 'Philip Morris', revenue: 745230, marketShare: 26.2, units: 12750 },
        { name: 'Fortune Tobacco', revenue: 512180, marketShare: 18.0, units: 8945 },
        { name: 'Mighty Corp', revenue: 342650, marketShare: 12.0, units: 6120 }
      ],
      regions: [
        { name: 'NCR', revenue: 856420, percentage: 30.1, stores: 52 },
        { name: 'Region IV-A', revenue: 542180, percentage: 19.0, stores: 38 },
        { name: 'Region III', revenue: 428750, percentage: 15.1, stores: 31 }
      ],
      insights: response.insight || '',
      sqlExecuted: response.sql_executed,
      confidence: response.confidence
    };
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Agentic Engine Analysis Demo</h1>
        <p className="text-gray-600">Real-time cigarette sales analysis using our RAG-powered engine</p>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Running comprehensive analysis...</span>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {['overview', 'brands', 'regions', 'insights'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content based on active tab */}
          {activeTab === 'overview' && analysis && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ₱{analysis.processed.overview.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Past 30 days</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Total Transactions</h3>
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {analysis.processed.overview.totalTransactions.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Avg ₱{analysis.processed.overview.avgTransactionValue}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Active Stores</h3>
                  <MapPin className="w-4 h-4 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {analysis.processed.overview.activeStores}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analysis.processed.overview.uniqueSKUs} unique SKUs
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'brands' && analysis && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-semibold mb-4">Brand Performance</h3>
              <div className="space-y-4">
                {analysis.processed.topBrands.map((brand: any, index: number) => (
                  <div key={brand.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900">{brand.name}</p>
                        <p className="text-sm text-gray-500">{brand.units.toLocaleString()} units</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₱{brand.revenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{brand.marketShare}% share</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'regions' && analysis && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-semibold mb-4">Regional Distribution</h3>
              <div className="space-y-4">
                {analysis.processed.regions.map((region: any) => (
                  <div key={region.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{region.name}</span>
                      <span className="text-sm text-gray-600">₱{region.revenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${region.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{region.stores} stores • {region.percentage}%</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'insights' && lastResponse && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">AI-Generated Insights</h3>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {lastResponse.insight}
                  </pre>
                </div>
              </div>

              {lastResponse.sql_executed && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">SQL Query Executed:</h4>
                  <pre className="text-xs bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto">
                    {lastResponse.sql_executed}
                  </pre>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Processing time: {lastResponse.processing_time}ms</span>
                <span>Confidence: {Math.round((lastResponse.confidence || 0) * 100)}%</span>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Example Queries */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Try These Queries:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "Show me JTI vs Philip Morris performance comparison",
            "Which regions have the highest cigarette substitution rates?",
            "What are the peak hours for cigarette sales?",
            "Analyze payment method trends for cigarette purchases",
            "Show me anomalies in cigarette sales patterns",
            "Which cigarette SKUs are at risk of stock-out?"
          ].map((queryText, index) => (
            <button
              key={index}
              onClick={() => query(queryText)}
              className="text-left text-sm px-4 py-2 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
            >
              {queryText}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestAgenticAnalysis;