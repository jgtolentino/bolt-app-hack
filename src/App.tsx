import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import GlobalFilters from './components/filters/GlobalFilters';
import ZoomableContainer from './components/ui/ZoomableContainer';
import Overview from './pages/Overview';
import DashboardOverview from './pages/DashboardOverview';
import TransactionAnalysis from './pages/TransactionAnalysis';
import ProductAnalysis from './pages/ProductAnalysis';
import ConsumerInsights from './pages/ConsumerInsights';
import GeographicAnalytics from './pages/GeographicAnalytics';
import AIAssistant from './pages/AIAssistant';
import Reports from './pages/Reports';
import DatabaseValidation from './pages/DatabaseValidation';

function App() {
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
              <Routes>
                <Route path="/" element={<DashboardOverview />} />
                <Route path="/overview" element={<Overview />} />
                <Route path="/transactions" element={<TransactionAnalysis />} />
                <Route path="/products" element={<ProductAnalysis />} />
                <Route path="/consumers" element={<ConsumerInsights />} />
                <Route path="/geography" element={<GeographicAnalytics />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/validation" element={<DatabaseValidation />} />
              </Routes>
            </motion.div>
          </main>
        </div>
      </div>
    </ZoomableContainer>
  );
}

export default App;