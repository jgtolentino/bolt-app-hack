#!/usr/bin/env node

/**
 * Test script to verify API connectivity
 */

const API_BASE_URL = 'https://mcp-sqlite-server-1.onrender.com';

console.log('🔍 Testing API Connection to:', API_BASE_URL);
console.log('===============================================\n');

async function testEndpoint(endpoint, description) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`📡 Testing: ${description}`);
  console.log(`   URL: ${url}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(url);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success (${responseTime}ms)`);
      console.log(`   📊 Response: ${Array.isArray(data) ? `Array with ${data.length} items` : 'Object'}`);
      
      // Show sample data
      if (Array.isArray(data) && data.length > 0) {
        console.log(`   📋 Sample:`, JSON.stringify(data[0], null, 2).substring(0, 200) + '...');
      }
    } else {
      console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
}

async function runTests() {
  // Test all endpoints
  await testEndpoint('/health', 'Health Check');
  await testEndpoint('/transactions', 'Transactions');
  await testEndpoint('/stats', 'Statistics');
  await testEndpoint('/filter-options', 'Filter Options');
  await testEndpoint('/hourly-patterns', 'Hourly Patterns');
  await testEndpoint('/geographic', 'Geographic Data');
  await testEndpoint('/substitutions', 'Substitutions');
  
  console.log('===============================================');
  console.log('✅ API connectivity test complete!');
  console.log('\nIf all endpoints returned success, your API is properly configured.');
  console.log('If you see errors, check:');
  console.log('1. Is the API server running?');
  console.log('2. Are the endpoints correct?');
  console.log('3. Is CORS configured properly?');
}

// Run the tests
runTests().catch(console.error);