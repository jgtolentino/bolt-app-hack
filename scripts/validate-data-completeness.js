#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tables that must have data
const REQUIRED_TABLES = [
  { name: 'transactions', minCount: 1000 },
  { name: 'geography', minCount: 10 },
  { name: 'organization', minCount: 10 },
  { name: 'customer_segments', minCount: 5 },
  { name: 'ai_insights', minCount: 5 }
];

// Validation checks
const validationChecks = {
  async checkTableCounts() {
    console.log('📊 Checking table record counts...\n');
    let allPassed = true;
    
    for (const table of REQUIRED_TABLES) {
      try {
        const { count, error } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`❌ ${table.name}: Error - ${error.message}`);
          allPassed = false;
          continue;
        }
        
        if (count === null || count < table.minCount) {
          console.error(`❌ ${table.name}: ${count || 0} records (minimum required: ${table.minCount})`);
          allPassed = false;
        } else {
          console.log(`✅ ${table.name}: ${count} records`);
        }
      } catch (err) {
        console.error(`❌ ${table.name}: Failed to check - ${err.message}`);
        allPassed = false;
      }
    }
    
    return allPassed;
  },

  async checkTransactionQuality() {
    console.log('\n💰 Checking transaction data quality...\n');
    let allPassed = true;
    
    try {
      // Check for anomalous transactions
      const { data: stats } = await supabase
        .from('v_transaction_thresholds')
        .select('*')
        .single();
      
      if (stats) {
        console.log(`  P99 threshold: ₱${stats.p99_threshold?.toFixed(2) || 'N/A'}`);
        console.log(`  Max value: ₱${stats.max_value?.toFixed(2) || 'N/A'}`);
        console.log(`  Outliers above P99: ${stats.outlier_count || 0}`);
        
        // Warn if too many outliers
        if (stats.outlier_count > stats.total_transactions * 0.02) {
          console.warn(`⚠️  High outlier rate: ${((stats.outlier_count / stats.total_transactions) * 100).toFixed(2)}%`);
        }
      }
      
      // Check for transactions above reasonable limit
      const { count: highValueCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .gt('total_amount', 10000);
      
      if (highValueCount > 0) {
        console.warn(`⚠️  ${highValueCount} transactions exceed ₱10,000 limit`);
      }
      
      // Check payment method distribution
      const { data: paymentMethods } = await supabase
        .from('transactions')
        .select('payment_method')
        .limit(1000);
      
      if (paymentMethods) {
        const uniqueMethods = new Set(paymentMethods.map(t => t.payment_method));
        console.log(`  Payment methods in use: ${Array.from(uniqueMethods).join(', ')}`);
        
        if (uniqueMethods.size < 2) {
          console.warn('⚠️  Low payment method diversity');
        }
      }
      
    } catch (err) {
      console.error('❌ Failed to check transaction quality:', err.message);
      allPassed = false;
    }
    
    return allPassed;
  },

  async checkGeographicCoverage() {
    console.log('\n🗺️  Checking geographic coverage...\n');
    let allPassed = true;
    
    try {
      // Check region coverage
      const { data: regions } = await supabase
        .from('geography')
        .select('region')
        .order('region');
      
      const uniqueRegions = new Set(regions?.map(g => g.region) || []);
      console.log(`  Regions covered: ${uniqueRegions.size}/18`);
      
      if (uniqueRegions.size < 10) {
        console.error('❌ Insufficient regional coverage');
        allPassed = false;
      }
      
      // Check store type distribution
      const { data: storeTypes } = await supabase
        .from('geography')
        .select('store_type');
      
      const uniqueStoreTypes = new Set(storeTypes?.map(g => g.store_type) || []);
      console.log(`  Store types: ${Array.from(uniqueStoreTypes).join(', ')}`);
      
      if (uniqueStoreTypes.size < 3) {
        console.warn('⚠️  Low store type diversity');
      }
      
    } catch (err) {
      console.error('❌ Failed to check geographic coverage:', err.message);
      allPassed = false;
    }
    
    return allPassed;
  },

  async checkProductDiversity() {
    console.log('\n📦 Checking product diversity...\n');
    let allPassed = true;
    
    try {
      // Check category coverage
      const { data: categories } = await supabase
        .from('organization')
        .select('category');
      
      const uniqueCategories = new Set(categories?.map(o => o.category) || []);
      console.log(`  Categories: ${uniqueCategories.size}`);
      
      if (uniqueCategories.size < 5) {
        console.error('❌ Insufficient product categories');
        allPassed = false;
      }
      
      // Check brand diversity
      const { data: brands } = await supabase
        .from('organization')
        .select('brand');
      
      const uniqueBrands = new Set(brands?.map(o => o.brand) || []);
      console.log(`  Brands: ${uniqueBrands.size}`);
      
      if (uniqueBrands.size < 20) {
        console.warn('⚠️  Low brand diversity');
      }
      
    } catch (err) {
      console.error('❌ Failed to check product diversity:', err.message);
      allPassed = false;
    }
    
    return allPassed;
  }
};

// Main validation function
async function validateDataCompleteness() {
  console.log('🔍 Philippine Retail Data Validation\n');
  console.log('=' .repeat(50) + '\n');
  
  let overallSuccess = true;
  
  // Run all validation checks
  const tableCheck = await validationChecks.checkTableCounts();
  const transactionCheck = await validationChecks.checkTransactionQuality();
  const geoCheck = await validationChecks.checkGeographicCoverage();
  const productCheck = await validationChecks.checkProductDiversity();
  
  overallSuccess = tableCheck && transactionCheck && geoCheck && productCheck;
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('\n📋 VALIDATION SUMMARY\n');
  
  console.log(`  Table completeness: ${tableCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Transaction quality: ${transactionCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Geographic coverage: ${geoCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Product diversity: ${productCheck ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n' + '=' .repeat(50) + '\n');
  
  if (overallSuccess) {
    console.log('✅ All validation checks passed!');
    process.exit(0);
  } else {
    console.log('❌ Some validation checks failed. Please review the issues above.');
    process.exit(1);
  }
}

// Run validation
validateDataCompleteness().catch(err => {
  console.error('❌ Validation script error:', err);
  process.exit(1);
});