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
const DashboardOverview = lazy(() => import('../pages/DashboardOverview'));
const OptimizedDashboard = lazy(() => import('../pages/OptimizedDashboard'));
const TransactionAnalysis = lazy(() => import('../pages/TransactionAnalysis'));
const ProductAnalysis = lazy(() => import('../pages/ProductAnalysis'));
const ConsumerInsights = lazy(() => import('../pages/ConsumerInsights'));
const GeographicAnalytics = lazy(() => import('../pages/GeographicAnalytics'));
const AIAssistant = lazy(() => import('../pages/AIAssistant'));
const Reports = lazy(() => import('../pages/Reports'));
const DatabaseValidation = lazy(() => import('../pages/DatabaseValidation'));
const CruipDashboard = lazy(() => import('../pages/CruipDashboard'));
const WidgetShowcase = lazy(() => import('../pages/WidgetShowcase'));
const CommandCenter = lazy(() => import('../pages/CommandCenter'));

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
                  <Route path="/" element={<OptimizedDashboard />} />
                  <Route path="/command-center" element={<CommandCenter />} />
                  <Route path="/products" element={<ProductAnalysis />} />
                  <Route path="/consumers" element={<ConsumerInsights />} />
                  <Route path="/geography" element={<GeographicAnalytics />} />
                  <Route path="/validation" element={<DatabaseValidation />} />
                  {/* Legacy routes redirect to dashboard */}
                  <Route path="/overview" element={<Navigate to="/" replace />} />
                  <Route path="/transactions" element={<Navigate to="/" replace />} />
                  <Route path="/ai-assistant" element={<Navigate to="/command-center" replace />} />
                  <Route path="/reports" element={<Navigate to="/command-center" replace />} />
                  <Route path="/widgets" element={<Navigate to="/" replace />} />
                  <Route path="/cruip" element={<Navigate to="/" replace />} />
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