/**
 * Preload Script - Secure bridge between renderer and main process
 * PRD Requirement: NFR Security - contextIsolation
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected APIs to the renderer process
contextBridge.exposeInMainWorld('scoutAPI', {
  // DAL operations
  dal: {
    query: (sql: string, params?: any[]) => 
      ipcRenderer.invoke('dal:query', sql, params),
    
    getConfig: () => 
      ipcRenderer.invoke('dal:getConfig'),
    
    setDataSource: (config: any) => 
      ipcRenderer.invoke('dal:setDataSource', config),
    
    sync: () => 
      ipcRenderer.invoke('dal:sync')
  },

  // File operations
  import: {
    csv: () => 
      ipcRenderer.invoke('import:csv')
  },

  // Updates
  update: {
    onAvailable: (callback: () => void) => {
      ipcRenderer.on('update:available', callback);
    },
    
    onReady: (callback: () => void) => {
      ipcRenderer.on('update:ready', callback);
    },
    
    install: () => 
      ipcRenderer.invoke('update:install')
  },

  // Analytics
  analytics: {
    track: (event: string, properties?: any) => 
      ipcRenderer.invoke('analytics:track', event, properties)
  },

  // Platform info
  platform: {
    type: process.platform,
    version: process.versions.electron,
    isPackaged: () => ipcRenderer.invoke('app:isPackaged')
  }
});

// TypeScript declarations for window.scoutAPI
declare global {
  interface Window {
    scoutAPI: {
      dal: {
        query: (sql: string, params?: any[]) => Promise<any>;
        getConfig: () => Promise<any>;
        setDataSource: (config: any) => Promise<any>;
        sync: () => Promise<any>;
      };
      import: {
        csv: () => Promise<any>;
      };
      update: {
        onAvailable: (callback: () => void) => void;
        onReady: (callback: () => void) => void;
        install: () => Promise<void>;
      };
      analytics: {
        track: (event: string, properties?: any) => Promise<void>;
      };
      platform: {
        type: string;
        version: string;
        isPackaged: () => Promise<boolean>;
      };
    };
  }
}