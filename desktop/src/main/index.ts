/**
 * Scout Analytics Desktop - Main Process
 * Implements PRD requirements for offline analytics
 */

import { app, BrowserWindow, ipcMain, Menu, dialog, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';
import log from 'electron-log';
import path from 'path';
import { DataService } from './services/dataService';
import { createMainMenu } from './menu';
import { setupSecurityHeaders } from './security';

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Initialize persistent storage
const store = new Store({
  name: 'scout-config',
  defaults: {
    dataSource: 'cloud',
    apiBaseUrl: 'https://api.scout.ai',
    lastSyncTimestamp: null,
    offlineMode: false
  }
});

let mainWindow: BrowserWindow | null = null;
let dataService: DataService;

// Security: Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  // Create main window with security best practices
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, '../../assets/icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#f9fafb'
  });

  // Set up security headers
  setupSecurityHeaders(mainWindow);

  // Load the app
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  } else {
    // Development mode - load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Set up menu
  const menu = createMainMenu(app, mainWindow, store);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(async () => {
  log.info('Scout Analytics Desktop starting...');
  
  // Initialize data service
  dataService = new DataService(store);
  await dataService.initialize();

  createWindow();

  // Check for updates
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for DAL operations
ipcMain.handle('dal:query', async (event, sql: string, params?: any[]) => {
  try {
    log.info('DAL query:', sql.substring(0, 100));
    return await dataService.query(sql, params);
  } catch (error) {
    log.error('DAL query error:', error);
    throw error;
  }
});

ipcMain.handle('dal:getConfig', async () => {
  return {
    dataSource: store.get('dataSource'),
    apiBaseUrl: store.get('apiBaseUrl'),
    offlineMode: store.get('offlineMode'),
    lastSync: store.get('lastSyncTimestamp')
  };
});

ipcMain.handle('dal:setDataSource', async (event, config: any) => {
  store.set('dataSource', config.dataSource);
  store.set('apiBaseUrl', config.apiBaseUrl);
  
  // Reinitialize data service with new config
  await dataService.switchDataSource(config);
  
  return { success: true };
});

ipcMain.handle('dal:sync', async () => {
  try {
    const result = await dataService.syncWithCloud();
    store.set('lastSyncTimestamp', new Date().toISOString());
    return result;
  } catch (error) {
    log.error('Sync error:', error);
    throw error;
  }
});

// File import handlers
ipcMain.handle('import:csv', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return await dataService.importCSV(result.filePaths[0]);
  }
  
  return null;
});

// Auto-updater events
autoUpdater.on('update-available', () => {
  log.info('Update available');
  if (mainWindow) {
    mainWindow.webContents.send('update:available');
  }
});

autoUpdater.on('update-downloaded', () => {
  log.info('Update downloaded');
  if (mainWindow) {
    mainWindow.webContents.send('update:ready');
  }
});

ipcMain.handle('update:install', () => {
  autoUpdater.quitAndInstall();
});

// Analytics events
ipcMain.handle('analytics:track', (event, eventName: string, properties?: any) => {
  log.info('Analytics event:', eventName, properties);
  // TODO: Send to PostHog when configured
  
  // For now, just log locally
  if (eventName === 'desktop_start') {
    log.info('Desktop app started', {
      version: app.getVersion(),
      platform: process.platform,
      dataSource: store.get('dataSource')
    });
  }
});

// Handle certificate errors in development
if (!app.isPackaged) {
  app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
  });
}