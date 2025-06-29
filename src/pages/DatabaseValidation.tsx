import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DatabaseValidator, ValidationResult } from '../utils/databaseValidator';
import { ProAccountValidator, ProValidationResult } from '../utils/proValidation';
import { Database, CheckCircle, XCircle, AlertCircle, RefreshCcw, Download, Play, BarChart3, Zap } from 'lucide-react';

const DatabaseValidation: React.FC = () => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [proResults, setProResults] = useState<ProValidationResult[]>([]);
  const [generationProgress, setGenerationProgress] = useState<ProValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastValidated, setLastValidated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'validation' | 'generation' | 'pro-features'>('validation');

  const runValidation = async () => {
    setIsLoading(true);
    try {
      const results = await DatabaseValidator.runFullValidation();
      setValidationResults(results);
      setLastValidated(new Date());
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runProValidation = async () => {
    setIsLoading(true);
    try {
      const results = await ProAccountValidator.runFullProValidation();
      setProResults(results);
    } catch (error) {
      console.error('Pro validation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generate750KTransactions = async () => {
    setIsGenerating(true);
    try {
      const result = await ProAccountValidator.generate750KTransactions();
      console.log('Generation result:', result);
      
      // Start monitoring progress
      const progressInterval = setInterval(async () => {
        const progress = await ProAccountValidator.monitorGenerationProgress();
        setGenerationProgress(progress);
        
        // Stop monitoring when complete
        if (progress.data?.target_percentage >= 100) {
          clearInterval(progressInterval);
          setIsGenerating(false);
        }
      }, 5000); // Check every 5 seconds
      
    } catch (error) {
      console.error('Generation failed:', error);
      setIsGenerating(false);
    }
  };

  const downloadReport = () => {
    const report = DatabaseValidator.formatValidationResults(validationResults);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suki-analytics-validation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadProReport = () => {
    const report = ProAccountValidator.generateProReport(proResults);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supabase-pro-validation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    runValidation();
  }, []);

  const formatNumber = (value: number) => value?.toLocaleString() || '0';
  const formatCurrency = (value: number) => `₱${value?.toLocaleString() || '0'}`;

  const tabs = [
    { id: 'validation', label: 'Data Validation', icon: Database },
    { id: 'generation', label: '750K Generation', icon: Zap },
    { id: 'pro-features', label: 'Pro Features', icon: BarChart3 }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Database className="w-6 h-6" />
            <span>Database Validation & Management</span>
          </h1>
          <p className="text-gray-600">
            Comprehensive validation, Pro plan features, and 750K transaction generation
          </p>
          {lastValidated && (
            <p className="text-sm text-gray-500 mt-1">
              Last validated: {lastValidated.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={runValidation}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Validating...' : 'Refresh'}</span>
          </button>
          {validationResults.length > 0 && (
            <button
              onClick={downloadReport}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Download className="w-4 h-4" />
              <span>Download Report</span>
            </button>
          )}
        </div>
      </motion.div>

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
            onClick={() => setActiveTab(tab.id as any)}
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
        {activeTab === 'validation' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {validationResults.map((result, index) => (
              <motion.div
                key={result.section}
                className="chart-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    {result.error ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : result.data.length > 0 ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                    <span>{result.section}</span>
                  </h3>
                </div>

                {result.error ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">Error: {result.error}</p>
                  </div>
                ) : result.data.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">No data found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* KPI Metrics */}
                    {result.section === 'KPI Metrics' && result.data[0] && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-sm text-blue-600">Total Sales</div>
                          <div className="text-xl font-bold text-blue-900">
                            {formatCurrency(result.data[0].total_sales)}
                          </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-sm text-green-600">Transactions</div>
                          <div className="text-xl font-bold text-green-900">
                            {formatNumber(result.data[0].transaction_count)}
                          </div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="text-sm text-purple-600">Avg Basket</div>
                          <div className="text-xl font-bold text-purple-900">
                            {formatCurrency(result.data[0].avg_basket)}
                          </div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <div className="text-sm text-orange-600">Active Outlets</div>
                          <div className="text-xl font-bold text-orange-900">
                            {formatNumber(result.data[0].active_outlets)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Data Counts */}
                    {result.section === 'Data Counts' && result.data[0] && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatNumber(result.data[0].geography_count)}
                          </div>
                          <div className="text-sm text-gray-600">Stores</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatNumber(result.data[0].organization_count)}
                          </div>
                          <div className="text-sm text-gray-600">Products</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatNumber(result.data[0].transaction_count)}
                          </div>
                          <div className="text-sm text-gray-600">Transactions</div>
                        </div>
                      </div>
                    )}

                    {/* Regional Performance */}
                    {result.section === 'Regional Performance' && (
                      <div className="space-y-2">
                        {result.data.slice(0, 5).map((region, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="font-medium">{region.region}</span>
                            <span className="text-green-600 font-bold">
                              {formatCurrency(region.total_sales)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Payment Methods */}
                    {result.section === 'Payment Methods' && (
                      <div className="space-y-2">
                        {result.data.map((method, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="font-medium">{method.payment_method}</span>
                            <div className="text-right">
                              <div className="font-bold">{method.percentage_of_transactions}%</div>
                              <div className="text-sm text-gray-600">
                                {formatNumber(method.transaction_count)} transactions
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Top Products */}
                    {result.section === 'Top Products' && (
                      <div className="space-y-2">
                        {result.data.slice(0, 5).map((product, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <div className="font-medium">{product.sku}</div>
                              <div className="text-sm text-gray-600">{product.brand}</div>
                            </div>
                            <span className="text-green-600 font-bold">
                              {formatCurrency(product.total_sales)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recent Transactions */}
                    {result.section === 'Recent Transactions' && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600 mb-2">
                          Latest {result.data.length} transactions
                        </div>
                        {result.data.slice(0, 3).map((transaction, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                            <div>
                              <div className="font-medium">
                                {formatCurrency(transaction.total_amount)}
                              </div>
                              <div className="text-gray-600">
                                {(transaction as any).geography?.store_name || 'Unknown Store'}
                              </div>
                            </div>
                            <div className="text-right text-gray-600">
                              <div>{transaction.payment_method}</div>
                              <div>{new Date(transaction.datetime).toLocaleDateString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'generation' && (
          <div className="space-y-6">
            {/* Generation Control */}
            <div className="chart-container">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">750K Transaction Generation</h3>
                <button
                  onClick={generate750KTransactions}
                  disabled={isGenerating}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50"
                >
                  <Play className={`w-4 h-4 ${isGenerating ? 'animate-pulse' : ''}`} />
                  <span>{isGenerating ? 'Generating...' : 'Start Generation'}</span>
                </button>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">🚀 Batched Generation Process</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Features:</h5>
                    <ul className="space-y-1 text-gray-700">
                      <li>• 75 batches of 10,000 transactions each</li>
                      <li>• Realistic Philippine retail patterns</li>
                      <li>• Regional economic modifiers</li>
                      <li>• Seasonal and hourly patterns</li>
                      <li>• Proper payment method distribution</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Benefits:</h5>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Avoids timeout issues</li>
                      <li>• Progress monitoring</li>
                      <li>• Error recovery</li>
                      <li>• Pro plan optimization</li>
                      <li>• Production-ready performance</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Monitoring */}
            {generationProgress && (
              <div className="chart-container">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generation Progress</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-bold text-2xl text-primary-600">
                      {generationProgress.data?.target_percentage || 0}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress.data?.target_percentage || 0}%` }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">
                        {formatNumber(generationProgress.data?.total_transactions || 0)}
                      </div>
                      <div className="text-blue-700">Total Transactions</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">750,000</div>
                      <div className="text-green-700">Target</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-xl font-bold text-purple-600">
                        {formatNumber(generationProgress.data?.transactions_today || 0)}
                      </div>
                      <div className="text-purple-700">Today</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-xl font-bold text-orange-600">
                        {formatNumber(generationProgress.data?.avg_per_hour || 0)}
                      </div>
                      <div className="text-orange-700">Per Hour</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pro-features' && (
          <div className="space-y-6">
            <div className="chart-container">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Supabase Pro Plan Validation</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={runProValidation}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    <BarChart3 className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Validate Pro Features</span>
                  </button>
                  {proResults.length > 0 && (
                    <button
                      onClick={downloadProReport}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      <Download className="w-4 h-4" />
                      <span>Pro Report</span>
                    </button>
                  )}
                </div>
              </div>

              {proResults.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Pro Plan Features</h4>
                  <p className="text-gray-600 mb-4">
                    Validate your Supabase Pro account capabilities and performance
                  </p>
                  <button
                    onClick={runProValidation}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Run Pro Validation
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {proResults.map((result, index) => (
                    <div key={result.section} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{result.section}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          result.status === 'success' ? 'bg-green-100 text-green-800' :
                          result.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {result.status}
                        </span>
                      </div>
                      
                      {result.message && (
                        <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                      )}
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        {result.recordCount !== undefined && (
                          <div>Records: {formatNumber(result.recordCount)}</div>
                        )}
                        {result.executionTime !== undefined && (
                          <div>Execution: {result.executionTime}ms</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Summary */}
      {validationResults.length > 0 && activeTab === 'validation' && (
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {validationResults.filter(r => !r.error && r.data.length > 0).length}
              </div>
              <div className="text-sm text-green-700">Passed</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {validationResults.filter(r => !r.error && r.data.length === 0).length}
              </div>
              <div className="text-sm text-yellow-700">No Data</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {validationResults.filter(r => r.error).length}
              </div>
              <div className="text-sm text-red-700">Errors</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DatabaseValidation;