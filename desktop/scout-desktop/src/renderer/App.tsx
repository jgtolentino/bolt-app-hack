/**
 * Scout Desktop - Main Renderer App
 * Unified interface for Scout CLI, Pulser, and Claude Code integration
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { TerminalPage } from './pages/TerminalPage';
import { SettingsPage } from './pages/SettingsPage';
import { ImportPage } from './pages/ImportPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ClaudeAnalysisPage } from './pages/ClaudeAnalysisPage';
import { PulserPage } from './pages/PulserPage';
import { ToastProvider } from './components/UI/ToastProvider';
import { ThemeProvider } from './components/Theme/ThemeProvider';
import { AppProvider } from './context/AppContext';
import './styles/globals.css';

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [appStatus, setAppStatus] = useState({
    scoutCLI: false,
    pulser: false,
    claudeCode: false
  });

  useEffect(() => {
    // Initialize app and check integration status
    const initializeApp = async () => {
      try {
        // Check Scout CLI status
        const scoutStatus = await window.electronAPI.scout.getStatus();
        
        // Check Pulser status
        const pulserStatus = await window.electronAPI.pulser.status();
        
        // Check Claude Code status
        const claudeStatus = await window.electronAPI.claude.getStatus();

        setAppStatus({
          scoutCLI: scoutStatus.available,
          pulser: pulserStatus.running,
          claudeCode: claudeStatus.running
        });

        setIsLoading(false);
      } catch (error) {
        console.error('App initialization failed:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Loading Scout Desktop...
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Initializing integrations
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppProvider initialStatus={appStatus}>
      <ThemeProvider>
        <ToastProvider>
          <Router>
            <Layout>
              <Routes>
                {/* Main dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/dashboard/:id" element={<DashboardPage />} />
                <Route path="/dashboard/new" element={<DashboardPage />} />
                
                {/* Project management */}
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectsPage />} />
                
                {/* AI integrations */}
                <Route path="/pulser" element={<PulserPage />} />
                <Route path="/claude-analysis" element={<ClaudeAnalysisPage />} />
                
                {/* Tools */}
                <Route path="/terminal" element={<TerminalPage />} />
                <Route path="/import" element={<ImportPage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                
                {/* Settings */}
                <Route path="/settings" element={<SettingsPage />} />
                
                {/* Catch all */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </Router>
        </ToastProvider>
      </ThemeProvider>
    </AppProvider>
  );
};

export default App;