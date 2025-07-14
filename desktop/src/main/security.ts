/**
 * Security Configuration
 * PRD NFR: OWASP Desktop Top-10 compliance
 */

import { BrowserWindow, session } from 'electron';

export function setupSecurityHeaders(mainWindow: BrowserWindow) {
  // Set Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "font-src 'self'",
          "img-src 'self' data: https:",
          "connect-src 'self' https://api.scout.ai https://mcp-sqlite-server-1.onrender.com"
        ].join('; ')
      }
    });
  });

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://') && !url.startsWith('http://localhost')) {
      event.preventDefault();
    }
  });

  // Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Disable remote module
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    // Deny all permission requests
    callback(false);
  });
}