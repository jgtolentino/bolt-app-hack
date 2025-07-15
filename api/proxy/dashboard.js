/**
 * Vercel Serverless Function - Dashboard Metrics Proxy
 * Proxies dashboard metrics requests to TBWA Unified Platform
 */

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    console.log('📊 Dashboard Proxy - Request received');
    
    // Try TBWA Unified Platform
    const tbwaUrl = `${API_CONFIG.tbwaApiUrl}/api/insights/dashboard`;
    console.log('🔍 Trying TBWA Unified Platform:', tbwaUrl);
    
    const response = await fetchWithTimeout(tbwaUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    let data;
    if (response.ok) {
      data = await response.json();
      console.log('✅ TBWA Unified Platform dashboard data received');
    } else {
      console.warn('⚠️ TBWA API unavailable, using mock data');
      data = generateMockDashboard();
    }

    res.status(200).json({
      success: true,
      source: response.ok ? 'tbwa-unified' : 'mock',
      timestamp: new Date().toISOString(),
      ...data
    });

  } catch (error) {
    console.error('❌ Dashboard Proxy Error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      ...generateMockDashboard()
    });
  }
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

function generateMockDashboard() {
  return {
    metrics: {
      activeCampaigns: 847,
      totalHandshakes: 125430,
      employeeUtilization: 87.5,
      paletteEffectiveness: 89.3,
      quarterlyRevenue: 12400000,
      clientSatisfaction: 94.2
    },
    topPerformers: {
      campaigns: [
        { name: 'Summer Sizzle 2024', roi: 423 },
        { name: 'Metro Fresh Launch', roi: 387 }
      ],
      regions: [
        { name: 'NCR', effectiveness: 92.3 },
        { name: 'Cebu', effectiveness: 89.7 }
      ]
    },
    alerts: [
      {
        type: 'opportunity',
        message: 'Palette optimization can increase Mindanao ROI by 22%',
        priority: 'high'
      }
    ]
  };
}