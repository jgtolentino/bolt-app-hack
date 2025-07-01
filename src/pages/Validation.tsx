import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { DatabaseValidator, ValidationResult } from '../utils/databaseValidator';
import { FilteredDatabaseValidator, FilteredValidationResult } from '../utils/filteredDatabaseValidator';
import { ProAccountValidator, ProValidationResult } from '../utils/proValidation';
import { AIValidator, AIValidationResult } from '../utils/aiValidation';
import { useFilterStore } from '../features/filters/filterStore';
import { Database, CheckCircle, XCircle, AlertCircle, RefreshCcw, Download, Play, BarChart3, Zap, Brain, Pause, Clock, Info, Filter } from 'lucide-react';

const DatabaseValidation: React.FC = () => {
  const filters = useFilterStore(state => state);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [filteredValidationResults, setFilteredValidationResults] = useState<FilteredValidationResult[]>([]);
  const [proResults, setProResults] = useState<ProValidationResult[]>([]);
  const [aiResults, setAiResults] = useState<AIValidationResult[]>([]);
  const [generationProgress, setGenerationProgress] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastValidated, setLastValidated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'validation' | 'filtered-validation' | 'generation' | 'pro-features' | 'ai-validation'>('filtered-validation');
  const [generationCount, setGenerationCount] = useState<number>(10000);
  const [batchSize, setBatchSize] = useState<number>(1000);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationStats, setGenerationStats] = useState<any | null>(null);
  const [monitorInterval, setMonitorInterval] = useState<any>(null);

  useEffect(() => {
    runValidation();
    runFilteredValidation();
    return () => {
      if (monitorInterval) {
        clearInterval(monitorInterval);
      }
    };
  }, []);

  useEffect(() => {
    if (isGenerating) {
      // Set up monitoring interval
      const interval = setInterval(async () => {
        try {
          await checkGenerationProgress();
        } catch (error) {
          console.error('Error checking progress:', error);
        }
      }, 5000); // Check every 5 seconds
      
      setMonitorInterval(interval);
    } else {
      // Clear interval when not generating
      if (monitorInterval) {
        clearInterval(monitorInterval);
        setMonitorInterval(null);
      }
    }
    
    return () => {
      if (monitorInterval) {
        clearInterval(monitorInterval);
      }
    };
  }, [isGenerating]);

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

  const runFilteredValidation = async () => {
    setIsLoading(true);
    try {
      const results = await FilteredDatabaseValidator.runFilteredValidation(filters);
      setFilteredValidationResults(results);
      setLastValidated(new Date());
    } catch (error) {
      console.error('Filtered validation failed:', error);
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

  const runAIValidation = async () => {
    setIsLoading(true);
    try {
      const results = await AIValidator.runFullAIValidation();
      setAiResults(results);
    } catch (error) {
      console.error('AI validation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTransactions = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    try {
      // Use the efficient transaction generation function
      const { data, error } = await supabase.rpc('generate_efficient_transactions', {
        target_count: generationCount,
        max_batch_size: batchSize
      });
      
      if (error) throw error;
      
      console.log('Generation result:', data);
      
      // Start monitoring progress
      await checkGenerationProgress();
      
    } catch (error: any) {
      console.error('Generation failed:', error);
      setGenerationError(error.message || 'Transaction generation failed');
      setIsGenerating(false);
    }
  };

  const checkGenerationProgress = async () => {
    try {
      // Get transaction stats
      const { data, error } = await supabase.rpc('get_transaction_stats');
      
      if (error) throw error;
      
      setGenerationStats(data);
      
      // Calculate progress percentage
      const totalCount = data?.total_count || 0;
      const targetPercentage = Math.min(100, Math.round((totalCount / 750000) * 100));
      
      setGenerationProgress({
        data: {
          total_transactions: totalCount,
          target_percentage: targetPercentage,
          transactions_today: data?.today_count || 0,
          avg_per_hour: data?.avg_per_hour || 0
        }
      });
      
      // Stop monitoring when complete
      if (targetPercentage >= 100 || !isGenerating) {
        setIsGenerating(false);
      }
    } catch (error: any) {
      console.error('Error checking progress:', error);
      setGenerationError(error.message || 'Error checking generation progress');
      setIsGenerating(false);
    }
  };

  const stopGeneration = async () => {
    setIsGenerating(false);
    setGenerationError('Generation stopped by user');
    
    try {
      // Call a function to stop generation if available
      // This would need to be implemented on the database side
      const { error } = await supabase.rpc('stop_transaction_generation');
      if (error) throw error;
    } catch (error) {
      console.warn('Could not explicitly stop generation:', error);
    }
  };

  const downloadReport = () => {
    const report = DatabaseValidator.formatValidationResults(validationResults);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suqi-analytics-validation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadFilteredReport = () => {
    const report = FilteredDatabaseValidator.generateValidationReport(filteredValidationResults);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filtered-validation-report-${new Date().toISOString().split('T')[0]}.txt`;
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

  const downloadAIReport = () => {
    const report = AIValidator.generateAIReport(aiResults);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-validation-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatNumber = (value: number) => value?.toLocaleString() || '0';
  const formatCurrency = (value: number) => `₱${value?.toLocaleString() || '0'}`;

  const tabs = [
    { id: 'filtered-validation', label: 'Current Filter Validation', icon: Filter },
    { id: 'validation', label: 'Full Data Validation', icon: Database },
    { id: 'generation', label: 'Transaction Generation', icon: Zap },
    { id: 'pro-features', label: 'Pro Features', icon: BarChart3 },
    { id: 'ai-validation', label: 'AI Validation', icon: Brain }
  ];

  return (
    <div className="space-y-6">
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
            Comprehensive validation, Pro plan features, and transaction generation
          </p>
          {lastValidated && (
            <p className="text-sm text-gray-500 mt-1">
              Last validated: {lastValidated.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (activeTab === 'filtered-validation') {
                runFilteredValidation();
              } else {
                runValidation();
              }
            }}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Validating...' : 'Refresh'}</span>
          </button>
          {(validationResults.length > 0 || filteredValidationResults.length > 0) && (
            <button
              onClick={activeTab === 'filtered-validation' ? downloadFilteredReport : downloadReport}
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
        {activeTab === 'filtered-validation' && (
          <div className="space-y-6">
            {/* Current Filter Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Current Filter Context</span>
              </h3>
              <div className="text-sm text-blue-800">
                <p>Date Range: {filters.date_from || 'Last 30 days'} to {filters.date_to || 'Today'}</p>
                {filters.region && <p>Region: {filters.region}</p>}
                {filters.city_municipality && <p>City: {filters.city_municipality}</p>}
                {filters.brand && <p>Brand: {filters.brand}</p>}
                {filters.category && <p>Category: {filters.category}</p>}
                {!filters.date_from && !filters.date_to && (
                  <p className="mt-2 font-medium">Expected: 1000 transactions for last 30 days</p>
                )}
              </div>
            </div>

            {/* Filtered Validation Results */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredValidationResults.map((result, index) => (
                <motion.div
                  key={result.section}
                  className="chart-container"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      {result.validationStatus === 'pass' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : result.validationStatus === 'warning' ? (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span>{result.section}</span>
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      result.validationStatus === 'pass' ? 'bg-green-100 text-green-800' :
                      result.validationStatus === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {result.validationStatus.toUpperCase()}
                    </span>
                  </div>

                  {/* Validation Messages */}
                  {result.validationMessages.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Validation Results:</h4>
                      <ul className="space-y-1">
                        {result.validationMessages.map((msg, i) => (
                          <li key={i} className={`text-sm flex items-start ${
                            msg.startsWith('✓') ? 'text-green-700' :
                            msg.includes('mismatch') || msg.includes('Expected') ? 'text-yellow-700' :
                            'text-gray-700'
                          }`}>
                            <span>{msg}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

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
                      {result.section.includes('KPI Metrics') && result.data[0] && (
                        <>
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
                        </>
                      )}

                      {/* Regional Performance */}
                      {result.section.includes('Regional Performance') && (
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
                      {result.section.includes('Payment Methods') && (
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
                      {result.section.includes('Top Products') && (
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
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Filtered Validation Summary */}
            {filteredValidationResults.length > 0 && (
              <motion.div
                className="chart-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtered Validation Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {filteredValidationResults.filter(r => r.validationStatus === 'pass').length}
                    </div>
                    <div className="text-sm text-green-700">Passed</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {filteredValidationResults.filter(r => r.validationStatus === 'warning').length}
                    </div>
                    <div className="text-sm text-yellow-700">Warnings</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {filteredValidationResults.filter(r => r.validationStatus === 'fail').length}
                    </div>
                    <div className="text-sm text-red-700">Failed</div>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={downloadFilteredReport}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Filtered Report</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}

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
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="text-sm text-blue-600">Total Sales (All Time)</div>
                            <div className="text-xl font-bold text-blue-900">
                              {formatCurrency(result.data[0].total_sales)}
                            </div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="text-sm text-green-600">Total Transactions</div>
                            <div className="text-xl font-bold text-green-900">
                              {formatNumber(result.data[0].transaction_count)}
                            </div>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <div className="text-sm text-purple-600">Avg Basket Value</div>
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
                        <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-yellow-800 font-medium">Last 30 Days Performance</div>
                              <div className="text-xs text-yellow-600 mt-1">
                                Sales: {formatCurrency(result.data[0].recent_sales)} | 
                                Transactions: {formatNumber(result.data[0].recent_count)} | 
                                Growth: {result.data[0].growth_rate.toFixed(1)}%
                              </div>
                            </div>
                            <Info className="w-4 h-4 text-yellow-600" />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Data Counts */}
                    {result.section === 'Data Counts' && result.data[0] && (
                      <>
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
                        {result.data[0].date_range && (
                          <div className="mt-2 text-xs text-gray-600 text-center bg-gray-100 p-2 rounded">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Data Range: {result.data[0].date_range.days_covered} days
                            {result.data[0].date_range.first_date && result.data[0].date_range.last_date && (
                              <span className="ml-2">
                                ({new Date(result.data[0].date_range.first_date).toLocaleDateString()} - 
                                {new Date(result.data[0].date_range.last_date).toLocaleDateString()})
                              </span>
                            )}
                          </div>
                        )}
                      </>
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
                <h3 className="text-lg font-semibold text-gray-900">Transaction Generation</h3>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Transactions</label>
                      <select 
                        value={generationCount}
                        onChange={(e) => setGenerationCount(parseInt(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        disabled={isGenerating}
                      >
                        <option value={100}>100 Transactions</option>
                        <option value={1000}>1,000 Transactions</option>
                        <option value={5000}>5,000 Transactions</option>
                        <option value={10000}>10,000 Transactions</option>
                        <option value={50000}>50,000 Transactions</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Batch Size</label>
                      <select 
                        value={batchSize}
                        onChange={(e) => setBatchSize(parseInt(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        disabled={isGenerating}
                      >
                        <option value={100}>100 per batch</option>
                        <option value={500}>500 per batch</option>
                        <option value={1000}>1,000 per batch</option>
                        <option value={2000}>2,000 per batch</option>
                      </select>
                    </div>
                  </div>
                  {isGenerating ? (
                    <button
                      onClick={stopGeneration}
                      className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Stop Generation</span>
                    </button>
                  ) : (
                    <button
                      onClick={generateTransactions}
                      disabled={isGenerating}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50"
                    >
                      <Play className={`w-4 h-4 ${isGenerating ? 'animate-pulse' : ''}`} />
                      <span>{isGenerating ? 'Generating...' : 'Start Generation'}</span>
                    </button>
                  )}
                </div>
              </div>

              {generationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{generationError}</p>
                  <p className="text-red-700 text-xs mt-1">
                    Try generating a smaller batch of transactions or using a smaller batch size to avoid timeout issues.
                  </p>
                </div>
              )}

              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">🚀 Efficient Transaction Generation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Features:</h5>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Adaptive batch sizing to prevent timeouts</li>
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
                
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      For large datasets (50K+), generation will continue in the background even if you navigate away. 
                      Check back later to see progress.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Monitoring */}
            {(generationProgress || isGenerating) && (
              <div className="chart-container">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generation Progress</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-bold text-2xl text-primary-600">
                      {generationProgress?.data?.target_percentage || 0}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress?.data?.target_percentage || 0}%` }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">
                        {formatNumber(generationProgress?.data?.total_transactions || 0)}
                      </div>
                      <div className="text-blue-700">Total Transactions</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">750,000</div>
                      <div className="text-green-700">Target</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-xl font-bold text-purple-600">
                        {formatNumber(generationProgress?.data?.transactions_today || 0)}
                      </div>
                      <div className="text-purple-700">Today</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-xl font-bold text-orange-600">
                        {formatNumber(generationProgress?.data?.avg_per_hour || 0)}
                      </div>
                      <div className="text-orange-700">Per Hour</div>
                    </div>
                  </div>
                  
                  {isGenerating && (
                    <div className="flex items-center justify-center space-x-2 p-3 bg-blue-50 rounded-lg">
                      <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                      <span className="text-blue-800">Generation in progress... This may take some time for large datasets.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Transaction Statistics */}
            {generationStats && (
              <div className="chart-container">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Statistics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Payment Method Distribution */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Payment Method Distribution</h4>
                    <div className="space-y-2">
                      {generationStats.by_payment_method && Object.entries(generationStats.by_payment_method).map(([method, count]: [string, any]) => (
                        <div key={method} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">{method}</span>
                          <div className="text-right">
                            <span className="text-gray-600">{formatNumber(count)} transactions</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Regional Distribution */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Regional Distribution</h4>
                    <div className="space-y-2">
                      {generationStats.by_region && Object.entries(generationStats.by_region).map(([region, count]: [string, any]) => (
                        <div key={region} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">{region}</span>
                          <div className="text-right">
                            <span className="text-gray-600">{formatNumber(count)} transactions</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Earliest Transaction</div>
                    <div className="font-medium">
                      {generationStats.earliest_transaction ? new Date(generationStats.earliest_transaction).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Latest Transaction</div>
                    <div className="font-medium">
                      {generationStats.latest_transaction ? new Date(generationStats.latest_transaction).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Average Transaction Value</div>
                    <div className="font-medium">
                      {formatCurrency(generationStats.avg_transaction_value || 0)}
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

        {activeTab === 'ai-validation' && (
          <div className="space-y-6">
            {/* AI Validation Control */}
            <div className="chart-container">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>AI-Powered Data Validation</span>
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={runAIValidation}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                  >
                    <Brain className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
                    <span>{isLoading ? 'Analyzing...' : 'Run AI Analysis'}</span>
                  </button>
                  {aiResults.length > 0 && (
                    <button
                      onClick={downloadAIReport}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      <Download className="w-4 h-4" />
                      <span>AI Report</span>
                    </button>
                  )}
                </div>
              </div>

              {aiResults.length === 0 ? (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">AI-Powered Analytics</h4>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Use advanced AI to analyze data quality, detect anomalies, validate business rules, 
                    and predict future trends in your retail data.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-purple-600 font-semibold">Data Quality</div>
                      <div className="text-sm text-gray-600">AI-driven analysis</div>
                    </div>
                    <div className="p-4 bg-pink-50 rounded-lg">
                      <div className="text-pink-600 font-semibold">Anomaly Detection</div>
                      <div className="text-sm text-gray-600">Pattern recognition</div>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-lg">
                      <div className="text-indigo-600 font-semibold">Business Rules</div>
                      <div className="text-sm text-gray-600">Automated validation</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-blue-600 font-semibold">Trend Prediction</div>
                      <div className="text-sm text-gray-600">Forecast analytics</div>
                    </div>
                  </div>
                  <button
                    onClick={runAIValidation}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600"
                  >
                    Start AI Analysis
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* AI Results */}
                  {aiResults.map((result, index) => (
                    <motion.div
                      key={result.section}
                      className="bg-white rounded-lg shadow-sm border p-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                          {result.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                          {result.status === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
                          {result.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                          <span>{result.section}</span>
                        </h4>
                        {result.score !== undefined && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">AI Score:</span>
                            <span className={`font-bold ${
                              result.score > 80 ? 'text-green-600' : 
                              result.score > 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {result.score}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Insights */}
                      {result.insights && result.insights.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">🔍 AI Insights</h5>
                          <ul className="space-y-1">
                            {result.insights.map((insight, i) => (
                              <li key={i} className="text-sm text-gray-600 flex items-start">
                                <span className="mr-2">•</span>
                                <span>{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommendations */}
                      {result.recommendations && result.recommendations.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">💡 Recommendations</h5>
                          <ul className="space-y-1">
                            {result.recommendations.map((rec, i) => (
                              <li key={i} className="text-sm text-gray-600 flex items-start">
                                <span className="mr-2">→</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Anomalies */}
                      {result.anomalies && result.anomalies.length > 0 && (
                        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                          <h5 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Anomalies Detected</h5>
                          <div className="space-y-2">
                            {result.anomalies.slice(0, 3).map((anomaly, i) => (
                              <div key={i} className="text-sm text-yellow-700">
                                Transaction {anomaly.transaction?.id}: {anomaly.type} 
                                (₱{formatNumber(anomaly.transaction?.total_amount || 0)})
                              </div>
                            ))}
                            {result.anomalies.length > 3 && (
                              <div className="text-sm text-yellow-600 italic">
                                ...and {result.anomalies.length - 3} more anomalies
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Execution Time */}
                      {result.executionTime && (
                        <div className="mt-4 text-xs text-gray-500">
                          Analysis completed in {result.executionTime}ms
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* AI Summary */}
                  <div className="chart-container bg-gradient-to-r from-purple-50 to-pink-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-green-600">
                          {aiResults.filter(r => r.status === 'success').length}
                        </div>
                        <div className="text-sm text-gray-600">Passed Checks</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-yellow-600">
                          {aiResults.filter(r => r.status === 'warning').length}
                        </div>
                        <div className="text-sm text-gray-600">Warnings</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round(aiResults.reduce((sum, r) => sum + (r.score || 0), 0) / aiResults.filter(r => r.score).length)}%
                        </div>
                        <div className="text-sm text-gray-600">Avg AI Score</div>
                      </div>
                    </div>
                  </div>
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