#!/usr/bin/env node

/**
 * Test MCP SQLite Server API endpoints
 */

const API_BASE_URL = 'https://mcp-sqlite-server-1.onrender.com';

console.log('🔍 Testing MCP SQLite Server API:', API_BASE_URL);
console.log('===============================================\n');

async function testMCPEndpoint(method, params = {}) {
  console.log(`📡 Testing MCP Method: ${method}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: method,
        params: params,
        id: 1
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success`);
      console.log(`   📊 Response:`, JSON.stringify(data, null, 2).substring(0, 300) + '...');
    } else {
      console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(`   Error: ${text.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
}

async function testRESTEndpoint(endpoint) {
  console.log(`📡 Testing REST Endpoint: ${endpoint}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success`);
      console.log(`   📊 Response:`, Array.isArray(data) ? `Array[${data.length}]` : typeof data);
    } else {
      console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
}

async function runTests() {
  // Test REST endpoints that might exist
  console.log('=== Testing REST Endpoints ===\n');
  await testRESTEndpoint('/api/health');
  await testRESTEndpoint('/api/tables');
  await testRESTEndpoint('/api/query');
  await testRESTEndpoint('/api/transactions');
  
  // Test MCP RPC endpoints
  console.log('\n=== Testing MCP RPC Methods ===\n');
  await testMCPEndpoint('tools/list');
  await testMCPEndpoint('read-query', {
    query: 'SELECT COUNT(*) FROM transactions'
  });
  
  console.log('===============================================');
  console.log('✅ Test complete!');
}

// Run the tests
runTests().catch(console.error);