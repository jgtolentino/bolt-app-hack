import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { testAIIntegration, quickTests } from '../utils/testAI';

const TestAI: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Capture console logs
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      originalLog(...args);
      setLogs(prev => [...prev, `[LOG] ${args.join(' ')}`]);
    };
    
    console.error = (...args) => {
      originalError(...args);
      setLogs(prev => [...prev, `[ERROR] ${args.join(' ')}`]);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  const runTests = async () => {
    setIsRunning(true);
    setLogs([]);
    setResults(null);
    
    try {
      const testResults = await testAIIntegration();
      setResults(testResults);
    } catch (error) {
      setLogs(prev => [...prev, `[FATAL] ${error.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const runQuickTest = async (testName: string) => {
    setLogs([]);
    try {
      await quickTests[testName]();
    } catch (error) {
      setLogs(prev => [...prev, `[ERROR] ${error.message}`]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Integration Test Suite</h1>
          <p className="text-gray-600">Test OpenAI and Anthropic API integrations</p>
        </motion.div>

        {/* Main Test Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Full Test Suite</h2>
            <button
              onClick={runTests}
              disabled={isRunning}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                isRunning
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Running Tests...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Run All Tests</span>
                </>
              )}
            </button>
          </div>

          {results && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Passed</span>
                </div>
                <p className="text-2xl font-bold text-green-800 mt-1">{results.passed}</p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-red-700">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">Failed</span>
                </div>
                <p className="text-2xl font-bold text-red-800 mt-1">{results.failed}</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-blue-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Success Rate</span>
                </div>
                <p className="text-2xl font-bold text-blue-800 mt-1">
                  {results.tests.length > 0 
                    ? Math.round((results.passed / results.tests.length) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Tests */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-6"
        >
          <h2 className="text-xl font-semibold mb-4">Quick Tests</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => runQuickTest('testOpenAI')}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              Test OpenAI
            </button>
            <button
              onClick={() => runQuickTest('testAnthropic')}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              Test Anthropic
            </button>
            <button
              onClick={() => runQuickTest('testCache')}
              className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
            >
              Test Cache
            </button>
            <button
              onClick={() => runQuickTest('clearCache')}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Clear Cache
            </button>
          </div>
        </motion.div>

        {/* Test Results */}
        {results && results.tests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="space-y-3">
              {results.tests.map((test: any, index: number) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    test.status === 'passed' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <span className="font-medium">{test.test}</span>
                  <div className="flex items-center space-x-2">
                    {test.status === 'passed' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={test.status === 'passed' ? 'text-green-700' : 'text-red-700'}>
                      {test.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Console Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900 rounded-lg shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Console Output</h2>
            <button
              onClick={() => setLogs([])}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          <div className="bg-black rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">Console output will appear here...</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`mb-1 ${
                    log.includes('[ERROR]') 
                      ? 'text-red-400' 
                      : log.includes('✅') 
                      ? 'text-green-400'
                      : log.includes('❌')
                      ? 'text-red-400'
                      : 'text-gray-300'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TestAI;