/**
 * Application Menu - Desktop menu bar
 */

import { Menu, MenuItemConstructorOptions, app, BrowserWindow, shell } from 'electron';
import Store from 'electron-store';

export function createMainMenu(
  app: Electron.App,
  mainWindow: BrowserWindow | null,
  store: Store
): Menu {
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    } as MenuItemConstructorOptions] : []),

    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'Import CSV...',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow?.webContents.send('menu:import-csv');
          }
        },
        {
          label: 'Export Dashboard...',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow?.webContents.send('menu:export-dashboard');
          }
        },
        { type: 'separator' },
        {
          label: 'Sync with Cloud',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu:sync');
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },

    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startSpeaking' },
              { role: 'stopSpeaking' }
            ]
          }
        ] as MenuItemConstructorOptions[] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ] as MenuItemConstructorOptions[])
      ]
    },

    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },

    // Data menu
    {
      label: 'Data',
      submenu: [
        {
          label: 'Data Source',
          submenu: [
            {
              label: 'Local Cache',
              type: 'radio',
              checked: store.get('dataSource') === 'local',
              click: () => {
                mainWindow?.webContents.send('menu:data-source', 'local');
              }
            },
            {
              label: 'Cloud DAL',
              type: 'radio',
              checked: store.get('dataSource') === 'cloud',
              click: () => {
                mainWindow?.webContents.send('menu:data-source', 'cloud');
              }
            },
            {
              label: 'Custom URL...',
              type: 'radio',
              checked: store.get('dataSource') === 'custom',
              click: () => {
                mainWindow?.webContents.send('menu:data-source', 'custom');
              }
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'Clear Local Cache',
          click: () => {
            mainWindow?.webContents.send('menu:clear-cache');
          }
        }
      ]
    },

    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] as MenuItemConstructorOptions[] : [
          { role: 'close' }
        ] as MenuItemConstructorOptions[])
      ]
    },

    // Help menu
    {
      role: 'help',
      submenu: [
        {
          label: 'Scout Analytics Help',
          click: () => {
            shell.openExternal('https://docs.scout.ai/desktop');
          }
        },
        {
          label: 'Keyboard Shortcuts',
          click: () => {
            mainWindow?.webContents.send('menu:show-shortcuts');
          }
        },
        { type: 'separator' },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/scout-analytics/desktop/issues');
          }
        },
        { type: 'separator' },
        {
          label: 'About Scout Analytics',
          click: () => {
            mainWindow?.webContents.send('menu:about');
          }
        }
      ]
    }
  ];

  return Menu.buildFromTemplate(template);
}