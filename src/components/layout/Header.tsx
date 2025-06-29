import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Settings, Search, HelpCircle, Database, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { AuthButton } from '../auth/AuthButton';
import { testSupabaseConnection } from '../../lib/supabase';
import { useDataStore } from '../../stores/dataStore';

const Header: React.FC = () => {
  const { useRealData, setUseRealData } = useDataStore();
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Test Supabase connection on component mount
    const checkConnection = async () => {
      const isConnected = await testSupabaseConnection();
      setSupabaseConnected(isConnected);
    };
    
    checkConnection();
  }, []);

  return (
    <motion.header 
      className="h-16 bg-white/40 backdrop-blur-md border-b border-white/20 flex items-center justify-between px-6"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo and Title */}
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 text-shadow">Suki Analytics</h1>
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
            className="w-full pl-10 pr-4 py-2 bg-white/60 backdrop-blur-sm border border-white/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3">
        <motion.button
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <HelpCircle className="w-5 h-5" />
        </motion.button>
        
        <motion.button
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors relative"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-error-500 rounded-full animate-pulse"></span>
        </motion.button>
        
        <motion.button
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Settings className="w-5 h-5" />
        </motion.button>
        
        {/* Supabase Auth Integration */}
        <div className="pl-3 border-l border-white/30">
          <AuthButton />
        </div>
      </div>
    </motion.header>
  );
};

export default Header;