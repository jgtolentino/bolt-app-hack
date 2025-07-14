# Data Service Switching Guide

This guide explains how to switch between different data services for the Scout Dashboard.

## Current Issue

The dashboard was experiencing:
- **404 errors** on `/api/proxy/transactions`
- **Timeout errors** after 10 seconds
- **TypeError**: `timestamp.getHours is not a function` (due to string timestamps)

## Solution Implemented

### 1. **Created API Service Module** (`src/services/apiService.ts`)
- Centralized API configuration
- Automatic timestamp conversion (string → Date)
- Built-in error handling and retry logic
- Mock data fallback support

### 2. **Environment Variable Configuration**
- Created `.env.local` for environment-specific settings
- Configurable API endpoints
- Adjustable timeout values
- Toggle between direct API and proxy modes

### 3. **Enhanced Error Handling**
- Loading states in UI
- Error messages with fallback notification
- Graceful degradation to mock data

## How to Switch Data Services

### Option 1: Direct Connection to MCP SQLite Server

```env
# .env.local
VITE_API_BASE_URL=https://mcp-sqlite-server-1.onrender.com
VITE_USE_DIRECT_API=true
VITE_API_TIMEOUT=30000
```

**Note**: The current MCP SQLite Server appears to have an empty database. The app will automatically fall back to mock data until the database is populated.

### Option 2: Use Vercel Proxy (for CORS issues)

```env
# .env.local
VITE_API_BASE_URL=/api/proxy
VITE_USE_DIRECT_API=false
VITE_API_TIMEOUT=30000
```

### Option 3: Custom API Endpoint

```env
# .env.local
VITE_API_BASE_URL=https://your-custom-api.com
VITE_USE_DIRECT_API=true
VITE_API_TIMEOUT=30000
```

### Option 4: Mock Data Only (Development)

```env
# .env.local
VITE_USE_MOCK_FALLBACK=true
# Leave VITE_API_BASE_URL empty to force mock data
```

## API Service Features

### Automatic Date Conversion
```typescript
// Timestamps are automatically converted from strings to Date objects
const transformTimestamp = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(item => ({
      ...item,
      timestamp: typeof item.timestamp === 'string' 
        ? new Date(item.timestamp) 
        : item.timestamp || new Date()
    }));
  }
  return data;
};
```

### Error Handling with Fallback
```typescript
try {
  // Try to fetch from API
  return await apiService.getTransactions(filters);
} catch (error) {
  // Fall back to mock data if enabled
  if (API_CONFIG.useMockFallback) {
    const mockData = generateMockData(1000);
    return mockData;
  }
  throw error;
}
```

### Loading States
The app now shows:
- Loading spinner while fetching data
- Error messages if API fails
- Notification when using mock data

## Testing the Configuration

1. **Check API Connection**:
   ```bash
   # Test if the API is accessible
   curl https://mcp-sqlite-server.onrender.com/api/health
   ```

2. **Run the App**:
   ```bash
   npm run dev
   ```

3. **Check Browser Console**:
   - Look for "🔧 API Service initialized" message
   - Check for "📡 API Request" logs
   - Verify no timestamp errors

4. **Verify Data Loading**:
   - Should see loading spinner briefly
   - Data should populate charts
   - No TypeError about getHours()

## Troubleshooting

### CORS Errors
If you see CORS errors when using direct connection:
1. Switch to proxy mode by setting `VITE_USE_DIRECT_API=false`
2. Or add CORS headers to your API server

### Timeout Errors
If requests are timing out:
1. Increase `VITE_API_TIMEOUT` (e.g., to 60000 for 60 seconds)
2. Check if the API server is running
3. Verify network connectivity

### Date Parsing Errors
The system now automatically handles date parsing, but if issues persist:
1. Check the API response format
2. Ensure timestamps are ISO 8601 strings
3. The service will use current date as fallback

## Deployment

When deploying to Vercel:

1. **Set Environment Variables** in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add the same variables from `.env.local`
   - Redeploy

2. **Update API Routes** (if using proxy):
   - Ensure `/api/proxy/*` routes exist
   - Check Vercel Functions logs for errors

3. **Monitor Performance**:
   - Use Vercel Analytics to track API response times
   - Monitor error rates in production

## Summary

The data service is now:
- ✅ Configurable via environment variables
- ✅ Handles timestamp conversion automatically
- ✅ Falls back to mock data gracefully
- ✅ Shows loading and error states
- ✅ Supports multiple API endpoints
- ✅ Has extended timeout (30s vs 10s)

To switch services, simply update the `.env.local` file and restart the development server.