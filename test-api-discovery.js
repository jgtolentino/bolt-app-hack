#!/usr/bin/env node

/**
 * Discover API endpoints on MCP SQLite Server
 */

const API_BASE_URL = 'https://mcp-sqlite-server-1.onrender.com';

console.log('🔍 Discovering API Endpoints on:', API_BASE_URL);
console.log('===============================================\n');

const possibleEndpoints = [
  '/api',
  '/api/v1',
  '/api/tables',
  '/api/tables/transactions',
  '/api/table/transactions',
  '/api/query',
  '/api/execute',
  '/api/sql',
  '/tables',
  '/tables/transactions',
  '/query',
  '/sql',
  '/execute',
  '/db',
  '/db/query',
  '/db/tables',
  '/database',
  '/sqlite',
  '/sqlite/query'
];

async function testEndpoint(endpoint) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ ${endpoint} - Success`);
        console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 100) + '...');
      } else {
        console.log(`✅ ${endpoint} - Success (non-JSON)`);
      }
      return true;
    } else if (response.status === 405) {
      console.log(`🔶 ${endpoint} - Method Not Allowed (might need POST)`);
      return 'post';
    } else {
      console.log(`❌ ${endpoint} - ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${endpoint} - Error: ${error.message}`);
    return false;
  }
}

async function testPostEndpoint(endpoint, body = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ POST ${endpoint} - Success`);
      console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 100) + '...');
      return true;
    } else {
      console.log(`❌ POST ${endpoint} - ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ POST ${endpoint} - Error: ${error.message}`);
    return false;
  }
}

async function runDiscovery() {
  console.log('Testing GET endpoints...\n');
  
  const needsPost = [];
  
  for (const endpoint of possibleEndpoints) {
    const result = await testEndpoint(endpoint);
    if (result === 'post') {
      needsPost.push(endpoint);
    }
  }
  
  if (needsPost.length > 0) {
    console.log('\nTesting POST endpoints...\n');
    
    for (const endpoint of needsPost) {
      // Try with a simple query
      await testPostEndpoint(endpoint, {
        query: 'SELECT name FROM sqlite_master WHERE type="table"'
      });
    }
  }
  
  console.log('\n===============================================');
  console.log('Discovery complete!');
}

// Run the discovery
runDiscovery().catch(console.error);