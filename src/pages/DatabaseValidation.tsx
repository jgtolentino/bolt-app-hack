import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DatabaseValidator, ValidationResult } from '../utils/databaseValidator';
import { Database, CheckCircle, XCircle, AlertCircle, RefreshCcw, Download } from 'lucide-react';

const DatabaseValidation: React.FC = () => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastValidated, setLastValidated] = useState<Date | null>(null);

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

  useEffect(() => {
    runValidation();
  }, []);

  const formatNumber = (value: number) => value?.toLocaleString() || '0';
  const formatCurrency = (value: number) => `₱${value?.toLocaleString() || '0'}`;

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
            <span>Database Validation</span>
          </h1>
          <p className="text-gray-600">
            Real-time validation of Supabase data integrity and dashboard metrics
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

      {/* Validation Results */}
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

      {/* Summary */}
      {validationResults.length > 0 && (
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