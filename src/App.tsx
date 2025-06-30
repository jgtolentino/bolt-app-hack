import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import GlobalFilters from './components/filters/GlobalFilters';
import ZoomableContainer from './components/ui/ZoomableContainer';
import PerformanceMonitor from './components/PerformanceMonitor';
import { Loader2 } from 'lucide-react';

// Lazy load pages for better performance
const DashboardOverview = lazy(() => import('./pages/DashboardOverview'));
const OptimizedDashboard = lazy(() => import('./pages/OptimizedDashboard'));
const TransactionAnalysis = lazy(() => import('./pages/TransactionAnalysis'));
const ProductAnalysis = lazy(() => import('./pages/ProductAnalysis'));
const ConsumerInsights = lazy(() => import('./pages/ConsumerInsights'));
const GeographicAnalytics = lazy(() => import('./pages/GeographicAnalytics'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Reports = lazy(() => import('./pages/Reports'));
const DatabaseValidation = lazy(() => import('./pages/DatabaseValidation'));
const CruipDashboard = lazy(() => import('./pages/CruipDashboard'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
  </div>
);

function App() {
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
    <ZoomableContainer className="h-screen">
      <div className="flex h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header />
          
          {/* Global Filters */}
          <div className="px-6 py-4 border-b border-white/20 bg-white/30 backdrop-blur-sm">
            <GlobalFilters />
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
                  <Route path="/" element={useOptimizedDashboard ? <OptimizedDashboard /> : <DashboardOverview />} />
                  <Route path="/overview" element={<Navigate to="/" replace />} />
                  <Route path="/cruip" element={<CruipDashboard />} />
                  <Route path="/transactions" element={<TransactionAnalysis />} />
                  <Route path="/products" element={<ProductAnalysis />} />
                  <Route path="/consumers" element={<ConsumerInsights />} />
                  <Route path="/geography" element={<GeographicAnalytics />} />
                  <Route path="/ai-assistant" element={<AIAssistant />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/validation" element={<DatabaseValidation />} />
                </Routes>
              </Suspense>
            </motion.div>
          </main>
        </div>
      </div>
      
      {/* Performance Monitor */}
      <PerformanceMonitor show={showPerformanceMonitor} />
    </ZoomableContainer>
  );
}

export default App;