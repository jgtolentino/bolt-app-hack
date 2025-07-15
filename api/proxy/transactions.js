/**
 * Vercel Serverless Function - Transaction Proxy
 * Proxies transaction requests to TBWA Unified Platform or MCP SQLite Server
 */

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Configuration
const API_CONFIG = {
  // Primary: TBWA Unified Platform
  tbwaApiUrl: process.env.TBWA_UNIFIED_API_URL || 'http://localhost:3000',
  
  // Fallback: MCP SQLite Server
  mcpApiUrl: process.env.MCP_SQLITE_API_URL || 'https://mcp-sqlite-server-1.onrender.com',
  
  // Request timeout
  timeout: 15000
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  try {
    console.log('🚀 Transaction Proxy - Request received:', req.method, req.query);
    
    let data = null;
    let source = 'unknown';

    // Try TBWA Unified Platform first
    try {
      const tbwaUrl = `${API_CONFIG.tbwaApiUrl}/api/scout/transactions${buildQueryString(req.query)}`;
      console.log('🔍 Trying TBWA Unified Platform:', tbwaUrl);
      
      const tbwaResponse = await fetchWithTimeout(tbwaUrl, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (tbwaResponse.ok) {
        data = await tbwaResponse.json();
        source = 'tbwa-unified';
        console.log('✅ TBWA Unified Platform responded:', data?.length || 'unknown', 'items');
      } else {
        throw new Error(`TBWA API returned ${tbwaResponse.status}`);
      }
    } catch (tbwaError) {
      console.warn('⚠️ TBWA Unified Platform unavailable:', tbwaError.message);
      
      // Fallback to MCP SQLite Server
      try {
        const mcpUrl = `${API_CONFIG.mcpApiUrl}/transactions${buildQueryString(req.query)}`;
        console.log('🔍 Trying MCP SQLite Server:', mcpUrl);
        
        const mcpResponse = await fetchWithTimeout(mcpUrl, {
          method: req.method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (mcpResponse.ok) {
          data = await mcpResponse.json();
          source = 'mcp-sqlite';
          console.log('✅ MCP SQLite Server responded:', data?.length || 'unknown', 'items');
        } else {
          throw new Error(`MCP API returned ${mcpResponse.status}`);
        }
      } catch (mcpError) {
        console.warn('⚠️ MCP SQLite Server unavailable:', mcpError.message);
        
        // Final fallback: mock data
        data = generateMockTransactions();
        source = 'mock';
        console.log('📊 Using mock transaction data');
      }
    }

    // Transform data to ensure consistent format
    const transformedData = transformTransactionData(data);

    // Return response with metadata
    res.status(200).json({
      success: true,
      source,
      timestamp: new Date().toISOString(),
      count: Array.isArray(transformedData) ? transformedData.length : 0,
      data: transformedData
    });

  } catch (error) {
    console.error('❌ Transaction Proxy Error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      data: generateMockTransactions() // Always provide fallback data
    });
  }
}

// Utility functions
function buildQueryString(query) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  return params.toString() ? `?${params.toString()}` : '';
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_CONFIG.timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

function transformTransactionData(data) {
  if (!data) return [];
  
  // Handle different response formats
  let transactions = data;
  if (data.data) transactions = data.data;
  if (data.transactions) transactions = data.transactions;
  
  if (!Array.isArray(transactions)) {
    console.warn('Invalid transaction data format, using empty array');
    return [];
  }
  
  return transactions.map(t => ({
    id: t.id || Math.random().toString(36),
    timestamp: new Date(t.timestamp || Date.now()),
    transaction_value: Number(t.transaction_value || t.amount || 0),
    final_amount: Number(t.final_amount || t.transaction_value || t.amount || 0),
    store_id: t.store_id || 'unknown',
    customer_id: t.customer_id || 'unknown',
    region: t.region || 'NCR',
    location: t.location || 'Unknown Location',
    category: t.category || t.product_category || 'General',
    payment_method: t.payment_method || 'Cash',
    ...t
  }));
}

function generateMockTransactions() {
  return [
    {
      id: '1',
      timestamp: new Date(),
      transaction_value: 2500,
      final_amount: 2500,
      store_id: 'store001',
      customer_id: 'cust001',
      region: 'NCR',
      location: 'SM Mall of Asia',
      category: 'Electronics',
      payment_method: 'Cash'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 3600000),
      transaction_value: 1800,
      final_amount: 1800,
      store_id: 'store002',
      customer_id: 'cust002',
      region: 'Visayas',
      location: 'Ayala Center Cebu',
      category: 'Fashion',
      payment_method: 'GCash'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 7200000),
      transaction_value: 3200,
      final_amount: 3200,
      store_id: 'store003',
      customer_id: 'cust003',
      region: 'NCR',
      location: 'Greenbelt Makati',
      category: 'Food & Beverage',
      payment_method: 'Credit Card'
    }
  ];
}