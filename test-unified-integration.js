/**
 * Test script to verify TBWA Unified Platform integration
 * Tests both local development and production proxy endpoints
 */

const API_ENDPOINTS = {
  // Local TBWA Unified Platform (development)
  local: {
    transactions: 'http://localhost:3000/api/scout/transactions',
    handshakes: 'http://localhost:3000/api/scout/handshakes',
    dashboard: 'http://localhost:3000/api/insights/dashboard',
    health: 'http://localhost:3000/health'
  },
  
  // Vercel proxy endpoints (production) - TBWA Unified Platform only
  proxy: {
    transactions: 'https://bolt-app-hack.vercel.app/api/proxy/transactions',
    handshakes: 'https://bolt-app-hack.vercel.app/api/proxy/handshakes',
    dashboard: 'https://bolt-app-hack.vercel.app/api/proxy/dashboard'
  }
};

async function testEndpoint(name, url) {
  console.log(`\n🧪 Testing ${name}: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${name} - Success:`, {
        status: response.status,
        dataType: Array.isArray(data) ? `array[${data.length}]` : typeof data,
        hasData: data ? 'yes' : 'no',
        source: data.source || 'unknown'
      });
      
      // Show sample data structure
      if (Array.isArray(data) && data.length > 0) {
        console.log(`   Sample item keys:`, Object.keys(data[0]));
      } else if (data && typeof data === 'object') {
        console.log(`   Response keys:`, Object.keys(data));
      }
      
      return { success: true, data };
    } else {
      console.log(`❌ ${name} - HTTP Error:`, response.status, response.statusText);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.log(`❌ ${name} - Network Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 TBWA Unified Platform Integration Test');
  console.log('=========================================');
  
  const results = {
    local: {},
    proxy: {}
  };
  
  // Test local endpoints (if running)
  console.log('\n📍 Testing Local TBWA Unified Platform (SQLite-free)...');
  for (const [name, url] of Object.entries(API_ENDPOINTS.local)) {
    results.local[name] = await testEndpoint(`Local ${name}`, url);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }
  
  // Test proxy endpoints
  console.log('\n🌐 Testing Vercel Proxy Endpoints (TBWA Unified only)...');
  for (const [name, url] of Object.entries(API_ENDPOINTS.proxy)) {
    results.proxy[name] = await testEndpoint(`Proxy ${name}`, url);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  
  const localSuccessCount = Object.values(results.local).filter(r => r.success).length;
  const proxySuccessCount = Object.values(results.proxy).filter(r => r.success).length;
  
  console.log(`Local endpoints: ${localSuccessCount}/${Object.keys(API_ENDPOINTS.local).length} successful`);
  console.log(`Proxy endpoints: ${proxySuccessCount}/${Object.keys(API_ENDPOINTS.proxy).length} successful`);
  
  if (localSuccessCount > 0) {
    console.log('\n✅ Local TBWA Unified Platform is running and accessible!');
  } else {
    console.log('\n⚠️  Local TBWA Unified Platform not available (expected in production)');
  }
  
  if (proxySuccessCount > 0) {
    console.log('✅ Vercel proxy endpoints are working!');
  } else {
    console.log('❌ Vercel proxy endpoints need fixing');
  }
  
  // Integration status
  if (localSuccessCount > 0 || proxySuccessCount > 0) {
    console.log('\n🎉 Integration Status: SUCCESS');
    console.log('The bolt-app-hack repository can now connect to TBWA Unified Platform!');
  } else {
    console.log('\n🔧 Integration Status: NEEDS WORK');
    console.log('Check API endpoints and ensure services are running.');
  }
}

// Check if running in Node.js
if (typeof window === 'undefined') {
  // Node.js environment - use native fetch (Node 18+)
  if (!globalThis.fetch) {
    console.error('❌ fetch is not available. Please use Node.js 18+ or install node-fetch');
    process.exit(1);
  }
  
  runTests().catch(console.error);
} else {
  // Browser environment
  console.log('Running in browser - call runTests() to start');
  window.runTests = runTests;
}