#!/usr/bin/env node

/**
 * AI Integration Test Script
 * Tests AdsBot with real OpenAI and Anthropic APIs
 */

import { adsbotService } from './src/services/adsbotService.js';
import { adsBot } from './src/services/adsbot-runtime.js';
import { logCredentialStatus } from './src/config/credentials.js';

console.log('🧪 AI Integration Test Suite');
console.log('============================\n');

// Test results collector
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

async function runTest(name, testFn) {
  console.log(`\n📋 Testing: ${name}`);
  console.log('-'.repeat(40));
  
  try {
    const startTime = Date.now();
    const result = await testFn();
    const duration = Date.now() - startTime;
    
    console.log(`✅ PASSED (${duration}ms)`);
    console.log('Response:', JSON.stringify(result, null, 2).substring(0, 200) + '...');
    
    results.passed++;
    results.tests.push({ name, status: 'passed', duration, result });
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'failed', error: error.message });
  }
}

async function main() {
  // Show credential status
  console.log('📊 Credential Status Check:');
  logCredentialStatus();
  console.log('\n');

  // Test 1: Basic OpenAI Chat
  await runTest('OpenAI Chat Query', async () => {
    return await adsbotService.askQuestion(
      "What are the top 3 selling products in a typical sari-sari store?"
    );
  });

  // Test 2: Claude Insight Generation
  await runTest('Claude Price Sensitivity Insight', async () => {
    return await adsbotService.generateInsight('priceSensitivity', {
      avgPrice: 45,
      category: 'beverages',
      priceRange: { min: 35, max: 55 }
    });
  });

  // Test 3: Substitution Analysis (Complex)
  await runTest('Substitution Pattern Analysis', async () => {
    return await adsbotService.analyze('substitution', {
      topSubstitutions: [
        { from: 'Coke', to: 'Pepsi', rate: 15 },
        { from: 'Milo', to: 'Ovaltine', rate: 12 }
      ],
      stockoutRate: 8.5
    });
  });

  // Test 4: Demand Forecast
  await runTest('7-Day Demand Forecast', async () => {
    return await adsbotService.forecast('demand', {
      sku: 'COKE-1.5L',
      historicalSales: [120, 115, 130, 125, 140, 135, 145],
      seasonality: 'normal',
      dayOfWeek: 'Monday'
    });
  });

  // Test 5: Real-time Alert
  await runTest('Stock-out Alert Generation', async () => {
    return await adsbotService.createAlert('stockout', {
      sku: 'MILO-300ML',
      currentStock: 5,
      dailyVelocity: 3,
      daysRemaining: 1.67
    }, 'urgent');
  });

  // Test 6: Demographic Analysis
  await runTest('Customer Demographics Insight', async () => {
    const response = await adsBot.processQuery({
      id: 'test_demographic',
      type: 'demographic',
      templateId: 'genderPreference',
      data: {
        maleCustomers: 450,
        femaleCustomers: 550,
        avgBasketMale: 180,
        avgBasketFemale: 215
      },
      filters: { region: 'NCR' },
      timestamp: new Date().toISOString()
    });
    return response;
  });

  // Test 7: Cache Performance
  await runTest('Cache Hit Test', async () => {
    // First call - should cache
    await adsbotService.generateInsight('peakHourAnalysis', {
      peakHour: '6PM',
      volume: 32
    });
    
    // Second call - should hit cache
    const startTime = Date.now();
    const result = await adsbotService.generateInsight('peakHourAnalysis', {
      peakHour: '6PM',
      volume: 32
    });
    const duration = Date.now() - startTime;
    
    return {
      content: result,
      cacheHit: duration < 50, // Cache hits should be < 50ms
      duration
    };
  });

  // Test 8: Fallback Provider
  await runTest('Provider Fallback Test', async () => {
    // Force a provider that might fail to test fallback
    const response = await adsBot.processQuery({
      id: 'test_fallback',
      type: 'analysis',
      text: 'Test fallback mechanism',
      complexity: 'high',
      timestamp: new Date().toISOString()
    });
    
    return {
      provider: response.provider,
      content: response.content.substring(0, 100),
      cached: response.cached
    };
  });

  // Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  // Telemetry
  console.log('\n📈 AI Service Telemetry:');
  const telemetry = adsBot.getTelemetry();
  const recentQueries = telemetry.filter(([key]) => key.includes('query_success'));
  console.log(`Total AI Queries: ${recentQueries.length}`);
  
  // Cache stats
  const cacheHits = telemetry.filter(([key]) => key.includes('cache_hit')).length;
  console.log(`Cache Hits: ${cacheHits}`);
  console.log(`Cache Hit Rate: ${recentQueries.length > 0 ? ((cacheHits / recentQueries.length) * 100).toFixed(1) : 0}%`);

  // Provider usage
  const providers = {};
  results.tests.forEach(test => {
    if (test.result?.provider) {
      const providerName = test.result.provider.name || 'unknown';
      providers[providerName] = (providers[providerName] || 0) + 1;
    }
  });
  console.log('\n🤖 Provider Usage:');
  Object.entries(providers).forEach(([provider, count]) => {
    console.log(`  ${provider}: ${count} calls`);
  });

  console.log('\n✨ Test complete!');
}

// Run tests
main().catch(console.error);