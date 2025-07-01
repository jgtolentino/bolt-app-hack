/**
 * AI Integration Test Utilities
 * Run these in the browser console to test AI functionality
 */

import { adsbotService } from '../services/adsbotService';
import { adsBot } from '../services/adsbot-runtime';
import { logCredentialStatus } from '../config/credentials';

export async function testAIIntegration() {
  console.log('🧪 Testing AI Integration...\n');
  
  // Show credential status
  console.log('📊 Credential Status:');
  logCredentialStatus();
  console.log('\n');

  const tests = [];

  try {
    // Test 1: Quick Chat Query (GPT-4)
    console.log('1️⃣ Testing GPT-4 Chat...');
    const chatResult = await adsbotService.askQuestion(
      "What are the top selling products in Philippine sari-sari stores?"
    );
    console.log('✅ Chat Response:', chatResult.substring(0, 150) + '...');
    tests.push({ test: 'GPT-4 Chat', status: 'passed' });
  } catch (error) {
    console.error('❌ Chat Test Failed:', error);
    tests.push({ test: 'GPT-4 Chat', status: 'failed', error });
  }

  try {
    // Test 2: Price Sensitivity (Claude)
    console.log('\n2️⃣ Testing Claude Price Analysis...');
    const priceInsight = await adsbotService.generateInsight('priceSensitivity', {
      avgPrice: 45,
      category: 'beverages',
      region: 'NCR'
    });
    console.log('✅ Price Insight:', priceInsight.substring(0, 150) + '...');
    tests.push({ test: 'Claude Price Analysis', status: 'passed' });
  } catch (error) {
    console.error('❌ Price Analysis Failed:', error);
    tests.push({ test: 'Claude Price Analysis', status: 'failed', error });
  }

  try {
    // Test 3: Substitution Pattern
    console.log('\n3️⃣ Testing Substitution Analysis...');
    const subAnalysis = await adsbotService.analyze('substitution', {
      topSubstitution: { from: 'Coke', to: 'Pepsi', rate: 15 },
      region: 'NCR'
    });
    console.log('✅ Substitution Result:', {
      provider: subAnalysis.provider,
      confidence: subAnalysis.confidence,
      contentPreview: subAnalysis.content.substring(0, 100) + '...'
    });
    tests.push({ test: 'Substitution Analysis', status: 'passed' });
  } catch (error) {
    console.error('❌ Substitution Analysis Failed:', error);
    tests.push({ test: 'Substitution Analysis', status: 'failed', error });
  }

  try {
    // Test 4: Demand Forecast
    console.log('\n4️⃣ Testing Demand Forecast...');
    const forecast = await adsbotService.forecast('demand', {
      sku: 'COKE-1.5L',
      historicalSales: [100, 120, 115, 130, 125]
    });
    console.log('✅ Forecast Result:', {
      provider: forecast.provider,
      hasVisualization: forecast.visualizations?.length > 0,
      hasSuggestions: forecast.suggestions?.length > 0
    });
    tests.push({ test: 'Demand Forecast', status: 'passed' });
  } catch (error) {
    console.error('❌ Forecast Failed:', error);
    tests.push({ test: 'Demand Forecast', status: 'failed', error });
  }

  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  const passed = tests.filter(t => t.status === 'passed').length;
  const failed = tests.filter(t => t.status === 'failed').length;
  console.log(`Total: ${tests.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(0)}%`);

  // Check telemetry
  const telemetry = adsBot.getTelemetry();
  console.log('\n📈 Telemetry:');
  console.log('Recent queries:', telemetry.length);

  return {
    tests,
    passed,
    failed,
    telemetry: telemetry.slice(-5) // Last 5 entries
  };
}

// Quick test functions for console
export const quickTests = {
  // Test OpenAI
  async testOpenAI() {
    console.log('Testing OpenAI...');
    const result = await adsbotService.askQuestion("What's trending in retail?");
    console.log('Response:', result);
    return result;
  },

  // Test Anthropic
  async testAnthropic() {
    console.log('Testing Anthropic...');
    const result = await adsbotService.generateInsight('priceSensitivity', {
      avgPrice: 50,
      category: 'snacks'
    });
    console.log('Response:', result);
    return result;
  },

  // Test cache
  async testCache() {
    console.log('Testing cache...');
    const query = { type: 'insight', templateId: 'peakHourAnalysis', data: { hour: 6 } };
    
    console.time('First call');
    await adsBot.processQuery(query);
    console.timeEnd('First call');
    
    console.time('Second call (cached)');
    const cached = await adsBot.processQuery(query);
    console.timeEnd('Second call (cached)');
    
    console.log('Was cached:', cached.cached);
    return cached;
  },

  // Clear cache
  clearCache() {
    adsBot.clearCache();
    console.log('✅ Cache cleared');
  }
};

// Auto-expose to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).testAI = testAIIntegration;
  (window as any).aiTests = quickTests;
  console.log('🎯 AI Test Functions Available:');
  console.log('   testAI() - Run full test suite');
  console.log('   aiTests.testOpenAI() - Test OpenAI');
  console.log('   aiTests.testAnthropic() - Test Anthropic');
  console.log('   aiTests.testCache() - Test caching');
  console.log('   aiTests.clearCache() - Clear cache');
}