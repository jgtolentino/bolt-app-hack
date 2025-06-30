import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import AuthenticatedApp from './components/AuthenticatedApp';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={() => window.location.href = '/'} />
        } 
      />
      <Route 
        path="/*" 
        element={
          isAuthenticated ? <AuthenticatedApp /> : <Navigate to="/login" replace />
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;