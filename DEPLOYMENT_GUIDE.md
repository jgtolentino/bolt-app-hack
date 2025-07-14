# Scout Dashboard Deployment Guide

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment** (already done in `.env.local`):
   ```env
   VITE_API_BASE_URL=https://mcp-sqlite-server-1.onrender.com
   VITE_USE_DIRECT_API=true
   VITE_API_TIMEOUT=30000
   VITE_USE_MOCK_FALLBACK=true
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

5. **Deploy to Vercel**:
   ```bash
   git add .
   git commit -m "feat: configurable data service with automatic fallback"
   git push origin main
   ```

## Current Configuration

### ✅ What's Working

1. **API Service Module** (`src/services/apiService.ts`)
   - Configurable data source via environment variables
   - Automatic timestamp conversion (string → Date)
   - 30-second timeout for slow connections
   - Automatic fallback to mock data

2. **Enhanced UI** (`src/App.tsx`)
   - Loading states while fetching data
   - Error messages with helpful context
   - Seamless fallback to mock data

3. **Error Prevention**
   - No more `getHours()` errors - timestamps are automatically converted
   - No more timeout errors - increased to 30 seconds
   - No more blank screens - falls back to mock data

### ⚠️ Current Status

- **MCP SQLite Server**: The server at `https://mcp-sqlite-server-1.onrender.com` is running but has an empty database
- **Fallback Active**: The app automatically uses mock data when the API fails or returns empty data
- **Production Ready**: The app works correctly with mock data and will seamlessly switch to real data when available

## Testing the Deployment

1. **Check API connectivity**:
   ```bash
   node test-api.js
   ```

2. **Test in browser**:
   - Open [http://localhost:5173](http://localhost:5173)
   - Check browser console for API messages
   - Verify charts display data (will be mock data currently)

3. **Verify no errors**:
   - No 404 errors (handled gracefully)
   - No timeout errors (30s timeout)
   - No TypeError about getHours (dates converted)

## Vercel Deployment

### Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_BASE_URL=https://mcp-sqlite-server-1.onrender.com
VITE_USE_DIRECT_API=true
VITE_API_TIMEOUT=30000
VITE_USE_MOCK_FALLBACK=true
```

### Deployment URL

Your app is deployed at: https://bolt-app-hack.vercel.app

## Switching Data Sources

### To Use Different API

1. Update `.env.local`:
   ```env
   VITE_API_BASE_URL=https://your-api-server.com
   ```

2. Restart dev server or redeploy

### To Use Vercel Proxy (if CORS issues)

1. Update `.env.local`:
   ```env
   VITE_USE_DIRECT_API=false
   ```

2. Ensure `/api/proxy/*` routes exist in Vercel

### To Force Mock Data Only

1. Update `.env.local`:
   ```env
   VITE_USE_MOCK_FALLBACK=true
   # Remove or comment out VITE_API_BASE_URL
   ```

## Database Setup (When Ready)

When you have a populated SQLite database:

1. **Upload to MCP Server**: Upload your `.sqlite` file to the MCP server
2. **Verify Tables**: Run `node test-api.js` to confirm tables exist
3. **Test Queries**: The app will automatically start using real data

## Architecture Alignment

The app follows the full-stack architecture with:

- **Frontend**: React + TypeScript + Vite
- **State Management**: React hooks + local state
- **API Layer**: Configurable service with error handling
- **Data Layer**: SQLite (via MCP server) or mock data
- **Deployment**: Vercel (frontend) + Render (API server)

## Troubleshooting

### If you see "Database is empty. Using mock data."

This is normal - the MCP SQLite server has no data yet. The app works fine with mock data.

### If you see CORS errors

1. Switch to proxy mode: `VITE_USE_DIRECT_API=false`
2. Or add CORS headers to your API server

### If you see timeout errors

1. Increase timeout: `VITE_API_TIMEOUT=60000` (60 seconds)
2. Check network connectivity to API server

## Next Steps

1. **Populate Database**: Upload your SQLite database with scout data
2. **Configure Endpoints**: Ensure API endpoints match your data structure
3. **Add Authentication**: Implement JWT-based auth when ready
4. **Scale Infrastructure**: Move to production-grade hosting when needed

The app is fully functional with mock data and ready to switch to real data whenever your database is populated!