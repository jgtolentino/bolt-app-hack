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
const Overview = lazy(() => import('../pages/Overview'));
const Transactions = lazy(() => import('../pages/Transactions'));
const Products = lazy(() => import('../pages/Products'));
const Consumers = lazy(() => import('../pages/Consumers'));
const Geography = lazy(() => import('../pages/Geography'));
const AIAssistant = lazy(() => import('../pages/AIAssistant'));
const Validation = lazy(() => import('../pages/Validation'));
const QueryBuilder = lazy(() => import('../pages/QueryBuilder'));

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
                  <Route path="/" element={<Overview />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/consumers" element={<Consumers />} />
                  <Route path="/geography" element={<Geography />} />
                  <Route path="/ai-assistant" element={<AIAssistant />} />
                  <Route path="/validation" element={<Validation />} />
                  <Route path="/query-builder" element={<QueryBuilder />} />
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