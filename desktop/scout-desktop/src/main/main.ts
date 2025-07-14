/**
 * Scout Desktop - Main Process
 * Unified desktop app with Scout CLI, Pulser, and Claude Code integration
 */

import { app, BrowserWindow, Menu, ipcMain, shell, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';
import path from 'path';
import fs from 'fs-extra';
import { ScoutCLIIntegration } from './integrations/ScoutCLIIntegration';
import { PulserIntegration } from './integrations/PulserIntegration';
import { ClaudeCodeIntegration } from './integrations/ClaudeCodeIntegration';
import { DashboardManager } from './managers/DashboardManager';
import { ProjectManager } from './managers/ProjectManager';
import { TerminalManager } from './managers/TerminalManager';

// Store for persistent settings
const store = new Store({
  schema: {
    windowBounds: {
      type: 'object',
      properties: {
        x: { type: 'number' },
        y: { type: 'number' },
        width: { type: 'number' },
        height: { type: 'number' }
      },
      default: { width: 1400, height: 900 }
    },
    theme: {
      type: 'string',
      default: 'light'
    },
    autoUpdate: {
      type: 'boolean',
      default: true
    },
    integrations: {
      type: 'object',
      properties: {
        scoutCLI: { type: 'boolean', default: true },
        pulser: { type: 'boolean', default: true },
        claudeCode: { type: 'boolean', default: true }
      },
      default: {
        scoutCLI: true,
        pulser: true,
        claudeCode: true
      }
    }
  }
});

class ScoutDesktopApp {
  private mainWindow: BrowserWindow | null = null;
  private scoutCLI: ScoutCLIIntegration;
  private pulser: PulserIntegration;
  private claudeCode: ClaudeCodeIntegration;
  private dashboardManager: DashboardManager;
  private projectManager: ProjectManager;
  private terminalManager: TerminalManager;

  constructor() {
    this.scoutCLI = new ScoutCLIIntegration();
    this.pulser = new PulserIntegration();
    this.claudeCode = new ClaudeCodeIntegration();
    this.dashboardManager = new DashboardManager();
    this.projectManager = new ProjectManager();
    this.terminalManager = new TerminalManager();
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Set app user model ID for Windows
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.scout.desktop');
    }

    // Handle app events
    app.whenReady().then(() => {
      this.createWindow();
      this.setupIPC();
      this.setupMenu();
      this.initializeIntegrations();
      
      if (store.get('autoUpdate')) {
        this.setupAutoUpdater();
      }
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    // Security: Prevent new window creation
    app.on('web-contents-created', (event, contents) => {
      contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
      });
    });
  }

  private createWindow(): void {
    const bounds = store.get('windowBounds') as any;

    this.mainWindow = new BrowserWindow({
      ...bounds,
      minWidth: 1200,
      minHeight: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: path.join(__dirname, '../../assets/icon.png'),
      title: 'Scout Desktop',
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
    });

    // Load the app
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Save window bounds on close
    this.mainWindow.on('close', () => {
      if (this.mainWindow) {
        store.set('windowBounds', this.mainWindow.getBounds());
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupIPC(): void {
    // Dashboard management
    ipcMain.handle('dashboard:list', () => this.dashboardManager.listDashboards());
    ipcMain.handle('dashboard:create', (_, blueprint) => this.dashboardManager.createDashboard(blueprint));
    ipcMain.handle('dashboard:update', (_, id, blueprint) => this.dashboardManager.updateDashboard(id, blueprint));
    ipcMain.handle('dashboard:delete', (_, id) => this.dashboardManager.deleteDashboard(id));
    ipcMain.handle('dashboard:export', (_, id, format) => this.dashboardManager.exportDashboard(id, format));

    // Project management
    ipcMain.handle('project:list', () => this.projectManager.listProjects());
    ipcMain.handle('project:create', (_, config) => this.projectManager.createProject(config));
    ipcMain.handle('project:open', (_, path) => this.projectManager.openProject(path));
    ipcMain.handle('project:import', (_, filePath) => this.projectManager.importProject(filePath));

    // Scout CLI integration
    ipcMain.handle('scout:build', (_, blueprint, options) => this.scoutCLI.build(blueprint, options));
    ipcMain.handle('scout:publish', (_, path, options) => this.scoutCLI.publish(path, options));
    ipcMain.handle('scout:import', (_, type, file, options) => this.scoutCLI.import(type, file, options));
    ipcMain.handle('scout:validate', (_, blueprint) => this.scoutCLI.validate(blueprint));

    // Pulser integration
    ipcMain.handle('pulser:status', () => this.pulser.getStatus());
    ipcMain.handle('pulser:start', (_, config) => this.pulser.start(config));
    ipcMain.handle('pulser:stop', () => this.pulser.stop());
    ipcMain.handle('pulser:execute', (_, command) => this.pulser.executeCommand(command));

    // Claude Code integration
    ipcMain.handle('claude:start', (_, config) => this.claudeCode.start(config));
    ipcMain.handle('claude:execute', (_, code, context) => this.claudeCode.executeCode(code, context));
    ipcMain.handle('claude:analyze', (_, data) => this.claudeCode.analyzeData(data));

    // Terminal management
    ipcMain.handle('terminal:create', (_, config) => this.terminalManager.createTerminal(config));
    ipcMain.handle('terminal:execute', (_, id, command) => this.terminalManager.executeCommand(id, command));
    ipcMain.handle('terminal:destroy', (_, id) => this.terminalManager.destroyTerminal(id));

    // File system operations
    ipcMain.handle('fs:readFile', async (_, filePath) => {
      try {
        return await fs.readFile(filePath, 'utf8');
      } catch (error) {
        throw new Error(`Failed to read file: ${error.message}`);
      }
    });

    ipcMain.handle('fs:writeFile', async (_, filePath, content) => {
      try {
        await fs.writeFile(filePath, content, 'utf8');
        return true;
      } catch (error) {
        throw new Error(`Failed to write file: ${error.message}`);
      }
    });

    ipcMain.handle('fs:selectDirectory', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openDirectory', 'createDirectory']
      });
      return result.canceled ? null : result.filePaths[0];
    });

    ipcMain.handle('fs:selectFile', async (_, filters) => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openFile'],
        filters: filters || [{ name: 'All Files', extensions: ['*'] }]
      });
      return result.canceled ? null : result.filePaths[0];
    });

    // Settings management
    ipcMain.handle('settings:get', (_, key) => store.get(key));
    ipcMain.handle('settings:set', (_, key, value) => store.set(key, value));
    ipcMain.handle('settings:reset', () => store.clear());

    // App control
    ipcMain.handle('app:quit', () => app.quit());
    ipcMain.handle('app:restart', () => {
      app.relaunch();
      app.quit();
    });
    ipcMain.handle('app:version', () => app.getVersion());
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'Scout',
        submenu: [
          {
            label: 'About Scout Desktop',
            click: () => {
              dialog.showMessageBox(this.mainWindow!, {
                type: 'info',
                title: 'About Scout Desktop',
                message: 'Scout Desktop',
                detail: `Version: ${app.getVersion()}\nUnified analytics platform with AI assistance`
              });
            }
          },
          { type: 'separator' },
          {
            label: 'Preferences',
            accelerator: 'CmdOrCtrl+,',
            click: () => {
              this.mainWindow?.webContents.send('navigate', '/settings');
            }
          },
          { type: 'separator' },
          {
            label: 'Quit Scout Desktop',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => app.quit()
          }
        ]
      },
      {
        label: 'File',
        submenu: [
          {
            label: 'New Dashboard',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow?.webContents.send('navigate', '/dashboard/new');
            }
          },
          {
            label: 'Open Project',
            accelerator: 'CmdOrCtrl+O',
            click: async () => {
              const path = await this.selectProjectDirectory();
              if (path) {
                this.projectManager.openProject(path);
              }
            }
          },
          {
            label: 'Import BI File',
            accelerator: 'CmdOrCtrl+I',
            click: () => {
              this.mainWindow?.webContents.send('navigate', '/import');
            }
          },
          { type: 'separator' },
          {
            label: 'Export Dashboard',
            accelerator: 'CmdOrCtrl+E',
            click: () => {
              this.mainWindow?.webContents.send('action', 'export-dashboard');
            }
          }
        ]
      },
      {
        label: 'Tools',
        submenu: [
          {
            label: 'Scout CLI',
            submenu: [
              {
                label: 'Build Dashboard',
                click: () => {
                  this.mainWindow?.webContents.send('action', 'scout-build');
                }
              },
              {
                label: 'Publish to Marketplace',
                click: () => {
                  this.mainWindow?.webContents.send('action', 'scout-publish');
                }
              },
              {
                label: 'Validate Blueprint',
                click: () => {
                  this.mainWindow?.webContents.send('action', 'scout-validate');
                }
              }
            ]
          },
          {
            label: 'Pulser AI',
            submenu: [
              {
                label: 'Start Pulser',
                click: () => {
                  this.pulser.start({});
                }
              },
              {
                label: 'Open Terminal',
                click: () => {
                  this.mainWindow?.webContents.send('navigate', '/terminal');
                }
              }
            ]
          },
          {
            label: 'Claude Code',
            submenu: [
              {
                label: 'Start Session',
                click: () => {
                  this.claudeCode.start({});
                }
              },
              {
                label: 'Code Analysis',
                click: () => {
                  this.mainWindow?.webContents.send('navigate', '/claude-analysis');
                }
              }
            ]
          },
          { type: 'separator' },
          {
            label: 'Developer Tools',
            accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
            click: () => {
              this.mainWindow?.webContents.toggleDevTools();
            }
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              this.mainWindow?.webContents.reload();
            }
          },
          {
            label: 'Force Reload',
            accelerator: 'CmdOrCtrl+Shift+R',
            click: () => {
              this.mainWindow?.webContents.reloadIgnoringCache();
            }
          },
          { type: 'separator' },
          {
            label: 'Actual Size',
            accelerator: 'CmdOrCtrl+0',
            click: () => {
              this.mainWindow?.webContents.setZoomLevel(0);
            }
          },
          {
            label: 'Zoom In',
            accelerator: 'CmdOrCtrl+Plus',
            click: () => {
              const currentZoom = this.mainWindow?.webContents.getZoomLevel() || 0;
              this.mainWindow?.webContents.setZoomLevel(currentZoom + 0.5);
            }
          },
          {
            label: 'Zoom Out',
            accelerator: 'CmdOrCtrl+-',
            click: () => {
              const currentZoom = this.mainWindow?.webContents.getZoomLevel() || 0;
              this.mainWindow?.webContents.setZoomLevel(currentZoom - 0.5);
            }
          },
          { type: 'separator' },
          {
            label: 'Toggle Fullscreen',
            accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
            click: () => {
              const isFullScreen = this.mainWindow?.isFullScreen();
              this.mainWindow?.setFullScreen(!isFullScreen);
            }
          }
        ]
      },
      {
        label: 'Window',
        submenu: [
          {
            label: 'Minimize',
            accelerator: 'CmdOrCtrl+M',
            click: () => {
              this.mainWindow?.minimize();
            }
          },
          {
            label: 'Close',
            accelerator: 'CmdOrCtrl+W',
            click: () => {
              this.mainWindow?.close();
            }
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Documentation',
            click: () => {
              shell.openExternal('https://scout-analytics.com/docs');
            }
          },
          {
            label: 'Scout CLI Guide',
            click: () => {
              shell.openExternal('https://scout-analytics.com/docs/cli');
            }
          },
          {
            label: 'Community Support',
            click: () => {
              shell.openExternal('https://discord.gg/scout-analytics');
            }
          },
          { type: 'separator' },
          {
            label: 'Report Issue',
            click: () => {
              shell.openExternal('https://github.com/scout-analytics/scout-desktop/issues');
            }
          }
        ]
      }
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
      template[0].submenu = [
        {
          label: 'About Scout Desktop',
          role: 'about'
        },
        { type: 'separator' },
        {
          label: 'Services',
          role: 'services',
          submenu: []
        },
        { type: 'separator' },
        {
          label: 'Hide Scout Desktop',
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => app.quit()
        }
      ];

      // Window menu for macOS
      template[4].submenu = [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        },
        { type: 'separator' },
        {
          label: 'Bring All to Front',
          role: 'front'
        }
      ];
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private async initializeIntegrations(): Promise<void> {
    try {
      // Initialize Scout CLI
      if (store.get('integrations.scoutCLI')) {
        await this.scoutCLI.initialize();
      }

      // Initialize Pulser
      if (store.get('integrations.pulser')) {
        await this.pulser.initialize();
      }

      // Initialize Claude Code
      if (store.get('integrations.claudeCode')) {
        await this.claudeCode.initialize();
      }

      console.log('✅ All integrations initialized');
    } catch (error) {
      console.error('❌ Integration initialization failed:', error);
    }
  }

  private setupAutoUpdater(): void {
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-available', () => {
      dialog.showMessageBox(this.mainWindow!, {
        type: 'info',
        title: 'Update Available',
        message: 'A new version of Scout Desktop is available. It will be downloaded in the background.',
        buttons: ['OK']
      });
    });

    autoUpdater.on('update-downloaded', () => {
      dialog.showMessageBox(this.mainWindow!, {
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded. Scout Desktop will restart to apply the update.',
        buttons: ['Restart Now', 'Later']
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    });
  }

  private async selectProjectDirectory(): Promise<string | null> {
    const result = await dialog.showOpenDialog(this.mainWindow!, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Project Directory'
    });

    return result.canceled ? null : result.filePaths[0];
  }
}

// Initialize the app
new ScoutDesktopApp();