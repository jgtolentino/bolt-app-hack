#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Environment validation
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function validateDataCompleteness() {
  console.log('🔍 Running Data Quality Validation');
  console.log('==================================\n');

  let hasErrors = false;
  const validationResults = {
    transactions: 0,
    stores: 0,
    products: 0,
    transactionItems: 0,
    regions: 0
  };

  try {
    // Check core tables exist and have data
    console.log('📊 Checking core tables...');

    // Transactions table
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true });

    if (transError) {
      console.error('❌ Error accessing transactions table:', transError.message);
      hasErrors = true;
    } else {
      const count = transactions?.length || 0;
      validationResults.transactions = count;
      if (count === 0) {
        console.warn('⚠️  Transactions table is empty');
        hasErrors = true;
      } else {
        console.log(`✅ Transactions: ${count.toLocaleString()} records`);
      }
    }

    // Stores table
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id', { count: 'exact', head: true });

    if (storesError) {
      console.error('❌ Error accessing stores table:', storesError.message);
      hasErrors = true;
    } else {
      const count = stores?.length || 0;
      validationResults.stores = count;
      if (count === 0) {
        console.warn('⚠️  Stores table is empty');
        hasErrors = true;
      } else {
        console.log(`✅ Stores: ${count.toLocaleString()} records`);
      }
    }

    // Products table
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });

    if (productsError) {
      console.error('❌ Error accessing products table:', productsError.message);
      hasErrors = true;
    } else {
      const count = products?.length || 0;
      validationResults.products = count;
      if (count === 0) {
        console.warn('⚠️  Products table is empty');
        hasErrors = true;
      } else {
        console.log(`✅ Products: ${count.toLocaleString()} records`);
      }
    }

    // Transaction items table
    const { data: transactionItems, error: itemsError } = await supabase
      .from('transaction_items')
      .select('id', { count: 'exact', head: true });

    if (itemsError) {
      console.error('❌ Error accessing transaction_items table:', itemsError.message);
      hasErrors = true;
    } else {
      const count = transactionItems?.length || 0;
      validationResults.transactionItems = count;
      if (count === 0) {
        console.warn('⚠️  Transaction items table is empty');
        hasErrors = true;
      } else {
        console.log(`✅ Transaction Items: ${count.toLocaleString()} records`);
      }
    }

    // Check geographic coverage
    console.log('\n🗺️  Checking geographic coverage...');
    
    const { data: regionData, error: regionError } = await supabase
      .from('stores')
      .select('region')
      .not('region', 'is', null);

    if (regionError) {
      console.error('❌ Error checking regional data:', regionError.message);
      hasErrors = true;
    } else {
      const uniqueRegions = new Set(regionData?.map(s => s.region) || []);
      validationResults.regions = uniqueRegions.size;
      
      if (uniqueRegions.size === 0) {
        console.warn('⚠️  No regional data found');
        hasErrors = true;
      } else if (uniqueRegions.size < 5) {
        console.warn(`⚠️  Limited regional coverage: ${uniqueRegions.size} regions`);
      } else {
        console.log(`✅ Regional Coverage: ${uniqueRegions.size} regions`);
      }
    }

    // Data quality checks
    console.log('\n💰 Running data quality checks...');

    // Check for future dates
    const { data: futureTrans, error: futureError } = await supabase
      .from('transactions')
      .select('id')
      .gt('timestamp', new Date().toISOString())
      .limit(1);

    if (futureError) {
      console.warn('⚠️  Could not check for future transactions:', futureError.message);
    } else if (futureTrans && futureTrans.length > 0) {
      console.warn('⚠️  Found transactions with future dates');
    } else {
      console.log('✅ No future-dated transactions found');
    }

    // Check for negative values
    const { data: negativeValues, error: negativeError } = await supabase
      .from('transactions')
      .select('id')
      .lt('transaction_value', 0)
      .limit(1);

    if (negativeError) {
      console.warn('⚠️  Could not check for negative values:', negativeError.message);
    } else if (negativeValues && negativeValues.length > 0) {
      console.warn('⚠️  Found transactions with negative values');
    } else {
      console.log('✅ No negative transaction values found');
    }

    // Summary
    console.log('\n📋 Validation Summary');
    console.log('====================');
    console.log(`Transactions: ${validationResults.transactions.toLocaleString()}`);
    console.log(`Stores: ${validationResults.stores.toLocaleString()}`);
    console.log(`Products: ${validationResults.products.toLocaleString()}`);
    console.log(`Transaction Items: ${validationResults.transactionItems.toLocaleString()}`);
    console.log(`Regions Covered: ${validationResults.regions}`);

    if (hasErrors) {
      console.log('\n❌ Data validation failed');
      console.log('\nRecommended actions:');
      console.log('1. Run: npm run generate:synthetic -- 50000');
      console.log('2. Check database connectivity');
      console.log('3. Verify table schemas are up to date');
      process.exit(1);
    } else {
      console.log('\n✅ All data quality checks passed');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Unexpected error during validation:', error.message);
    process.exit(1);
  }
}

// Run validation
validateDataCompleteness();