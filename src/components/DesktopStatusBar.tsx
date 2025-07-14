/**
 * Desktop Status Bar Component
 * Shows offline/online status and sync information
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Database, Check, AlertCircle } from 'lucide-react';

interface DesktopStatusBarProps {
  desktopService: any;
}

export const DesktopStatusBar: React.FC<DesktopStatusBarProps> = ({ desktopService }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [dataSource, setDataSource] = useState<string>('cloud');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Check initial status
    const checkStatus = async () => {
      if (!desktopService) return;
      
      const config = await (window as any).scoutAPI.dal.getConfig();
      setDataSource(config.dataSource);
      setIsOffline(config.offlineMode || config.dataSource === 'local');
      if (config.lastSync) {
        setLastSync(new Date(config.lastSync));
      }
    };

    checkStatus();

    // Listen for menu events
    const handleDataSourceChange = async (event: any, source: string) => {
      setDataSource(source);
      setIsOffline(source === 'local');
      await desktopService.switchDataSource(source);
    };

    const handleSync = async () => {
      setIsSyncing(true);
      setSyncStatus('syncing');
      
      try {
        await desktopService.syncWithCloud();
        setSyncStatus('success');
        setLastSync(new Date());
        
        // Reset status after 3 seconds
        setTimeout(() => setSyncStatus('idle'), 3000);
      } catch (error) {
        console.error('Sync failed:', error);
        setSyncStatus('error');
        
        // Reset status after 5 seconds
        setTimeout(() => setSyncStatus('idle'), 5000);
      } finally {
        setIsSyncing(false);
      }
    };

    // IPC listeners
    if ((window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      
      ipcRenderer.on('menu:data-source', handleDataSourceChange);
      ipcRenderer.on('menu:sync', handleSync);
      
      return () => {
        ipcRenderer.removeAllListeners('menu:data-source');
        ipcRenderer.removeAllListeners('menu:sync');
      };
    }
  }, [desktopService]);

  const formatLastSync = () => {
    if (!lastSync) return 'Never synced';
    
    const now = new Date();
    const diff = now.getTime() - lastSync.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white h-8 flex items-center px-4 text-sm z-50">
      <div className="flex items-center space-x-4 flex-1">
        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          {isOffline ? (
            <>
              <WifiOff className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-400">Offline Mode</span>
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 text-green-400" />
              <span className="text-green-400">Online</span>
            </>
          )}
        </div>

        {/* Data Source */}
        <div className="flex items-center space-x-2 border-l border-gray-700 pl-4">
          <Database className="h-4 w-4" />
          <span className="capitalize">{dataSource === 'local' ? 'Local Cache' : dataSource}</span>
        </div>

        {/* Sync Status */}
        <div className="flex items-center space-x-2 border-l border-gray-700 pl-4">
          {isSyncing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Syncing...</span>
            </>
          ) : syncStatus === 'success' ? (
            <>
              <Check className="h-4 w-4 text-green-400" />
              <span className="text-green-400">Synced</span>
            </>
          ) : syncStatus === 'error' ? (
            <>
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-400">Sync failed</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 text-gray-400" />
              <span className="text-gray-400">{formatLastSync()}</span>
            </>
          )}
        </div>
      </div>

      {/* Platform Info */}
      <div className="text-gray-400 text-xs">
        Scout Desktop v{(window as any).scoutAPI?.platform.version || '1.0.0'}
      </div>
    </div>
  );
};