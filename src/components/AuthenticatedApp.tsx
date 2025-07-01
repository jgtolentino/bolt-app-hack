import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import GlobalFilters from './filters/GlobalFilters';
import ZoomableContainer from './ui/ZoomableContainer';
import PerformanceMonitor from './PerformanceMonitor';
import { Loader2 } from 'lucide-react';

// Lazy load pages for better performance
const ExecutiveOverview = lazy(() => import('../pages/ExecutiveOverview'));
const TransactionTiming = lazy(() => import('../pages/TransactionTiming'));
const ProductSKU = lazy(() => import('../pages/ProductSKU'));
const ConsumerPatterns = lazy(() => import('../pages/ConsumerPatterns'));
const BrandSwitching = lazy(() => import('../pages/BrandSwitching'));
const Demographics = lazy(() => import('../pages/Demographics'));
const AIChat = lazy(() => import('../pages/AIChat'));
const SavedQueries = lazy(() => import('../pages/SavedQueries'));
const Validation = lazy(() => import('../pages/Validation'));
const TestAI = lazy(() => import('../pages/TestAI'));
const AlertsAnomalies = lazy(() => import('../pages/AlertsAnomalies'));
const TestAgenticAnalysis = lazy(() => import('../pages/TestAgenticAnalysis'));
const ForecastingDashboard = lazy(() => import('../pages/ForecastingDashboard'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
  </div>
);

function AuthenticatedApp() {
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  const [useOptimizedDashboard, setUseOptimizedDashboard] = useState(true);

  useEffect(() => {
    // Toggle performance monitor with Shift+P
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'P') {
        setShowPerformanceMonitor(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="h-screen">
      <div className="flex h-full bg-gray-50">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header />
          
          {/* Global Filters - Unified Top Panel */}
          <div className="px-6 py-3 border-b border-gray-200 bg-white shadow-sm">
            <div className="max-w-7xl mx-auto">
              <GlobalFilters />
            </div>
          </div>
          
          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<ExecutiveOverview />} />
                  <Route path="/transaction-timing" element={<TransactionTiming />} />
                  <Route path="/product-sku" element={<ProductSKU />} />
                  <Route path="/consumer-patterns" element={<ConsumerPatterns />} />
                  <Route path="/brand-switching" element={<BrandSwitching />} />
                  <Route path="/demographics" element={<Demographics />} />
                  <Route path="/ai-chat" element={<AIChat />} />
                  <Route path="/saved-queries" element={<SavedQueries />} />
                  <Route path="/validation" element={<Validation />} />
                  <Route path="/alerts-anomalies" element={<AlertsAnomalies />} />
                  <Route path="/forecasting" element={<ForecastingDashboard />} />
                  <Route path="/test-ai" element={<TestAI />} />
                  <Route path="/test-agentic" element={<TestAgenticAnalysis />} />
                  {/* Redirect any unknown routes to overview */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </motion.div>
          </main>
        </div>
      </div>
      
      {/* Performance Monitor */}
      <PerformanceMonitor show={showPerformanceMonitor} />
    </div>
  );
}

export default AuthenticatedApp;