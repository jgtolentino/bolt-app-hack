import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Settings, Search, HelpCircle, Database, Wifi, WifiOff, AlertCircle, LogOut, User } from 'lucide-react';
import { AuthButton } from '../auth/AuthButton';
import { testSupabaseConnection } from '../../lib/supabase';
import { useDataStore } from '../../stores/dataStore';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { useRealData, setUseRealData } = useDataStore();
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Test Supabase connection on component mount
    const checkConnection = async () => {
      const isConnected = await testSupabaseConnection();
      setSupabaseConnected(isConnected);
    };
    
    checkConnection();
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Logo and Title */}
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">R</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Retail Intelligence</h1>
          <div className="flex items-center space-x-2">
            <p className="text-xs text-gray-600">TBWA\SMP Retail Intelligence</p>
            <div className="flex items-center space-x-2">
              {/* Supabase Connection Status */}
              <div className={`px-2 py-0.5 text-xs rounded-full flex items-center space-x-1 ${
                supabaseConnected === true ? 'bg-green-100 text-green-800' :
                supabaseConnected === false ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {supabaseConnected === true ? (
                  <>
                    <Database className="w-3 h-3" />
                    <span>Supabase Connected</span>
                  </>
                ) : supabaseConnected === false ? (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    <span>Connection Failed</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3 h-3 animate-pulse" />
                    <span>Connecting...</span>
                  </>
                )}
              </div>
              
              {/* Real/Mock Data Toggle */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setUseRealData(!useRealData)}
                  className={`flex items-center space-x-1 px-2 py-0.5 text-xs rounded-full transition-colors ${
                    useRealData 
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                      : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                  }`}
                  title={useRealData ? 'Switch to Mock Data' : 'Switch to Real Data'}
                >
                  {useRealData ? (
                    <>
                      <Wifi className="w-3 h-3" />
                      <span>Real Data</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3" />
                      <span>Mock Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search products, locations, insights..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3">
        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>
        
        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
        </button>
        
        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        
        {/* User Menu */}
        <div className="pl-3 border-l border-gray-300 flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <User className="w-4 h-4" />
            <span className="font-medium">{user || 'User'}</span>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;