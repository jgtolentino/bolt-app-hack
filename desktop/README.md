# Scout Analytics Desktop

Native desktop application for Scout Analytics built with Electron. Provides offline exploration, direct database import, and sub-second data slicing via embedded SQLite cache.

## 📋 PRD Implementation Status

Based on PRD-SA-DESKTOP-v1.0:

### ✅ Implemented Features

1. **F-1: Desktop Shell** - Electron app with secure BrowserWindow
2. **F-2: SQLite Cache** - Embedded database with sync capability  
3. **F-3: DAL Switcher** - Switch between Local/Cloud/Custom data sources
4. **F-4: CSV Import** - Drag-drop CSV import (via file dialog)
5. **F-5: Auto-update** - electron-updater integration ready
6. **F-6: Security** - Context isolation, CSP headers, secure preload

### 🚧 Pending Features

- ODBC connector (F-7)
- Excel/Parquet import
- Offline badge UI polish
- Windows code signing
- macOS notarization

## 🚀 Quick Start

### Development

```bash
# Install dependencies
cd desktop
npm install

# Build the main process
npm run build:main

# Run in development
npm run dev
```

### Building

```bash
# Build for current platform
npm run dist

# Build for specific platforms
npm run dist:mac
npm run dist:win
npm run dist:linux
```

## 🏗️ Architecture

```
desktop/
├── src/
│   ├── main/           # Main process (Electron)
│   │   ├── index.ts    # App entry point
│   │   ├── services/   # Data service, sync
│   │   ├── menu.ts     # Application menu
│   │   ├── security.ts # Security configuration
│   │   └── preload.ts  # Preload script
│   └── renderer/       # Renderer integration
│       └── desktopIntegration.ts
├── assets/             # Icons and resources
├── release/            # Built applications
└── package.json
```

## 🔧 Configuration

### Data Sources

The app supports three data source modes:

1. **Local Cache** - SQLite database stored in user data directory
2. **Cloud DAL** - Connect to Scout cloud API
3. **Custom URL** - Connect to custom API endpoint

Switch via: `Data → Data Source` menu

### User Data Location

- **Windows**: `%APPDATA%/scout-analytics/`
- **macOS**: `~/Library/Application Support/scout-analytics/`
- **Linux**: `~/.config/scout-analytics/`

## 🔒 Security

- **Context Isolation**: Enabled for all windows
- **Node Integration**: Disabled in renderer
- **CSP Headers**: Strict content security policy
- **Preload Script**: Secure bridge for IPC
- **Auto-update**: Delta updates with signature verification

## 📊 Analytics Events

The desktop app tracks these events (per PRD):

- `desktop_start` - App launch
- `sync_ok` - Successful sync
- `sync_fail` - Sync failure
- `import_csv` - CSV import
- `crash` - App crash (via Sentry)

## 🧪 Testing

```bash
# Run tests
npm test

# Test packaging without publishing
npm run pack
```

## 📦 Distribution

### Code Signing

1. **Windows**: Requires `.pfx` certificate
2. **macOS**: Requires Developer ID certificate + notarization

### Auto-update

1. Configure GitHub releases in `package.json`
2. Set `GH_TOKEN` environment variable
3. Updates check on app start

## 🎯 Performance Targets

Per PRD requirements:

- **First chart render**: <3s for 100k rows ✅
- **Crash-free sessions**: >99% (monitoring via Sentry)
- **Offline mode**: Instant with cached data ✅

## 🐛 Troubleshooting

### "Cannot find module" errors

```bash
# Rebuild native modules
npm run postinstall
```

### White screen on launch

Check DevTools console (View → Toggle Developer Tools)

### Database locked errors

Ensure only one instance is running (single instance lock enabled)

## 📚 Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder](https://www.electron.build/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [Scout Analytics Web](https://github.com/scout-analytics/web)

## 📄 License

Proprietary - Scout Analytics © 2025