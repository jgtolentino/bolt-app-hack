/**
 * Vercel Serverless Function - Handshake Events Proxy
 * Proxies handshake event requests to TBWA Unified Platform
 */

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Configuration
const API_CONFIG = {
  tbwaApiUrl: process.env.TBWA_UNIFIED_API_URL || 'http://localhost:3000',
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
    console.log('🤝 Handshake Proxy - Request received:', req.method, req.query);
    
    // Try TBWA Unified Platform
    const tbwaUrl = `${API_CONFIG.tbwaApiUrl}/api/scout/handshakes${buildQueryString(req.query)}`;
    console.log('🔍 Trying TBWA Unified Platform:', tbwaUrl);
    
    const response = await fetchWithTimeout(tbwaUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    let data;
    if (response.ok) {
      data = await response.json();
      console.log('✅ TBWA Unified Platform responded:', data?.length || 'unknown', 'handshakes');
    } else {
      console.warn('⚠️ TBWA API unavailable, using mock data');
      data = generateMockHandshakes();
    }

    // Transform data to ensure consistent format
    const transformedData = transformHandshakeData(data);

    res.status(200).json({
      success: true,
      source: response.ok ? 'tbwa-unified' : 'mock',
      timestamp: new Date().toISOString(),
      count: Array.isArray(transformedData) ? transformedData.length : 0,
      data: transformedData
    });

  } catch (error) {
    console.error('❌ Handshake Proxy Error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      data: generateMockHandshakes()
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
    throw error;
  }
}

function transformHandshakeData(data) {
  if (!data) return [];
  
  let handshakes = Array.isArray(data) ? data : data.data || data.handshakes || [];
  
  return handshakes.map(h => ({
    id: h.id || Math.random().toString(36),
    timestamp: new Date(h.timestamp || Date.now()),
    location: h.location || 'Unknown Location',
    region: h.region || 'NCR',
    transaction_value: Number(h.transaction_value || h.amount || 0),
    product_category: h.product_category || h.category || 'General',
    campaign_ids: h.campaign_ids || [],
    customer_demographic: h.customer_demographic || {},
    ...h
  }));
}

function generateMockHandshakes() {
  return [
    {
      id: '1',
      timestamp: new Date(),
      location: 'SM Mall of Asia',
      region: 'NCR',
      transaction_value: 2500,
      product_category: 'Electronics',
      campaign_ids: ['camp123', 'camp456'],
      customer_demographic: { age_group: '25-35', gender: 'F' }
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 3600000),
      location: 'Ayala Center Cebu',
      region: 'Visayas',
      transaction_value: 1800,
      product_category: 'Fashion',
      campaign_ids: ['camp123'],
      customer_demographic: { age_group: '18-25', gender: 'M' }
    }
  ];
}