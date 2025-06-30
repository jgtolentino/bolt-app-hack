import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import ZoomableContainer from './components/ui/ZoomableContainer';

// Analytics Pages
import Overview from './pages/Overview';
import TransactionAnalysis from './pages/TransactionAnalysis';
import ConsumerInsights from './pages/ConsumerInsights';

// Operations Pages  
import ProductAnalysis from './pages/ProductAnalysis';

// Intelligence Pages
import AIAssistant from './pages/AIAssistant';
import Reports from './pages/Reports';

// Maps Pages
import GeographicAnalytics from './pages/GeographicAnalytics';

// Settings & Utilities
import DatabaseValidation from './pages/DatabaseValidation';

function App() {
  return (
    <ZoomableContainer className="h-screen">
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          {/* Home */}
          <Route index element={<Overview />} />
          
          {/* Analytics */}
          <Route path="analytics">
            <Route path="overview" element={<Overview />} />
            <Route path="performance" element={<TransactionAnalysis />} />
            <Route path="sentiment" element={<ConsumerInsights />} />
          </Route>
          
          {/* Operations */}
          <Route path="operations">
            <Route path="logistics" element={<ProductAnalysis />} />
            <Route path="inventory" element={<ProductAnalysis />} />
            <Route path="team" element={<Reports />} />
          </Route>
          
          {/* Intelligence */}
          <Route path="intelligence">
            <Route path="market" element={<Reports />} />
            <Route path="competitor" element={<Reports />} />
            <Route path="predictive" element={<AIAssistant />} />
          </Route>
          
          {/* Maps */}
          <Route path="maps">
            <Route path="coverage" element={<GeographicAnalytics />} />
            <Route path="regions" element={<GeographicAnalytics />} />
          </Route>
          
          {/* Settings */}
          <Route path="settings" element={<DatabaseValidation />} />
        </Route>
      </Routes>
    </ZoomableContainer>
  );
}

export default App;