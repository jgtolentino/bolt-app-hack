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
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Payment methods with Philippine-specific distribution
const paymentMethods = [
  { method: 'Cash', weight: 0.65 },        // 65% cash (Philippines is cash-heavy)
  { method: 'GCash', weight: 0.20 },       // 20% GCash (popular e-wallet)
  { method: 'Utang/Lista', weight: 0.12 }, // 12% Store credit (common in sari-sari)
  { method: 'Credit Card', weight: 0.03 }  // 3% Credit Card
];

// Time patterns for different store types
const storeTypePatterns = {
  'sari-sari': {
    peakHours: [7, 8, 9, 17, 18, 19], // Morning and evening peaks
    openHour: 6,
    closeHour: 21
  },
  'grocery': {
    peakHours: [10, 11, 14, 15, 16, 17, 18],
    openHour: 8,
    closeHour: 20
  },
  'mini-mart': {
    peakHours: [8, 9, 12, 13, 17, 18, 19],
    openHour: 7,
    closeHour: 22
  },
  'convenience': {
    peakHours: [7, 8, 9, 12, 17, 18, 19, 20, 21],
    openHour: 0,
    closeHour: 24 // 24 hours
  }
};

// Seasonal factors for Philippines
const seasonalFactors = {
  1: 0.9,   // January - Post-holiday slowdown
  2: 0.85,  // February
  3: 0.95,  // March - Graduation season starts
  4: 1.0,   // April - Summer break
  5: 1.1,   // May - Peak summer
  6: 0.9,   // June - Back to school prep
  7: 0.85,  // July - Rainy season
  8: 0.9,   // August
  9: 1.05,  // September - Ber months start
  10: 1.1,  // October - Early Christmas shopping
  11: 1.2,  // November - Christmas shopping intensifies
  12: 1.3   // December - Peak season
};

function getRandomPaymentMethod() {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const pm of paymentMethods) {
    cumulative += pm.weight;
    if (rand <= cumulative) {
      return pm.method;
    }
  }
  
  return 'Cash'; // Default fallback
}

function generateTransactionTime(date, storeType) {
  const pattern = storeTypePatterns[storeType] || storeTypePatterns['sari-sari'];
  
  // 70% chance for peak hours
  let hour;
  if (Math.random() < 0.7 && pattern.peakHours.length > 0) {
    hour = pattern.peakHours[Math.floor(Math.random() * pattern.peakHours.length)];
  } else {
    // Random hour within operating hours
    const openHours = [];
    for (let h = pattern.openHour; h < pattern.closeHour; h++) {
      openHours.push(h);
    }
    hour = openHours[Math.floor(Math.random() * openHours.length)];
  }
  
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);
  
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, second);
}

async function generateComplete3000Records() {
  console.log('🚀 Starting generation of 3000 comprehensive records...\n');
  
  try {
    // First, apply the store size migration
    console.log('📋 Checking store size dimension...');
    const { data: checkSize, error: sizeError } = await supabase
      .from('geography')
      .select('store_size')
      .limit(1);
    
    if (sizeError && sizeError.message.includes('column "store_size" does not exist')) {
      console.log('⚠️  Store size column does not exist. Please run the migration first.');
      console.log('Migration file: supabase/migrations/20250629123000_add_store_size_dimension.sql\n');
      return;
    }
    
    // Get all geography and organization data
    console.log('📍 Loading geography data...');
    const { data: geography, error: geoError } = await supabase
      .from('geography')
      .select('*')
      .order('id');
    
    if (geoError) throw geoError;
    console.log(`✓ Loaded ${geography.length} stores`);
    
    console.log('📦 Loading product data...');
    const { data: products, error: prodError } = await supabase
      .from('organization')
      .select('*')
      .order('id');
    
    if (prodError) throw prodError;
    console.log(`✓ Loaded ${products.length} products\n`);
    
    // Group stores by region and type
    const storesByRegion = {};
    const storesByType = {};
    
    geography.forEach(store => {
      if (!storesByRegion[store.region]) storesByRegion[store.region] = [];
      storesByRegion[store.region].push(store);
      
      if (!storesByType[store.store_type]) storesByType[store.store_type] = [];
      storesByType[store.store_type].push(store);
    });
    
    // Group products by category and brand
    const productsByCategory = {};
    const productsByBrand = {};
    
    products.forEach(product => {
      if (!productsByCategory[product.category]) productsByCategory[product.category] = [];
      productsByCategory[product.category].push(product);
      
      if (!productsByBrand[product.brand]) productsByBrand[product.brand] = [];
      productsByBrand[product.brand].push(product);
    });
    
    console.log('🎯 Starting transaction generation...\n');
    
    const batchSize = 100;
    const totalRecords = 3000;
    let recordsGenerated = 0;
    
    // Ensure coverage in first batch
    const ensureCoverage = true;
    const regionsCovered = new Set();
    const brandsCovered = new Set();
    const categoriesCovered = new Set();
    const storeTypesCovered = new Set();
    const paymentMethodsCovered = new Set();
    
    // Generate records in batches
    while (recordsGenerated < totalRecords) {
      const transactions = [];
      const currentBatchSize = Math.min(batchSize, totalRecords - recordsGenerated);
      
      for (let i = 0; i < currentBatchSize; i++) {
        // For first 500 records, ensure all dimensions are covered
        let store, product;
        
        if (recordsGenerated < 500 && ensureCoverage) {
          // Pick uncovered dimensions first
          const uncoveredRegions = Object.keys(storesByRegion).filter(r => !regionsCovered.has(r));
          const uncoveredBrands = Object.keys(productsByBrand).filter(b => !brandsCovered.has(b));
          const uncoveredCategories = Object.keys(productsByCategory).filter(c => !categoriesCovered.has(c));
          const uncoveredStoreTypes = Object.keys(storesByType).filter(t => !storeTypesCovered.has(t));
          
          // Prioritize uncovered dimensions
          if (uncoveredRegions.length > 0) {
            const region = uncoveredRegions[0];
            store = storesByRegion[region][Math.floor(Math.random() * storesByRegion[region].length)];
            regionsCovered.add(region);
          } else {
            store = geography[Math.floor(Math.random() * geography.length)];
          }
          
          if (uncoveredBrands.length > 0) {
            const brand = uncoveredBrands[0];
            product = productsByBrand[brand][Math.floor(Math.random() * productsByBrand[brand].length)];
            brandsCovered.add(brand);
          } else if (uncoveredCategories.length > 0) {
            const category = uncoveredCategories[0];
            product = productsByCategory[category][Math.floor(Math.random() * productsByCategory[category].length)];
            categoriesCovered.add(category);
          } else {
            product = products[Math.floor(Math.random() * products.length)];
          }
          
          storeTypesCovered.add(store.store_type);
          categoriesCovered.add(product.category);
          brandsCovered.add(product.brand);
          
        } else {
          // Random selection with weighted distribution
          store = geography[Math.floor(Math.random() * geography.length)];
          product = products[Math.floor(Math.random() * products.length)];
        }
        
        // Generate date (spread across the year)
        const dayOfYear = Math.floor(Math.random() * 365);
        const transactionDate = new Date(2025, 0, 1);
        transactionDate.setDate(transactionDate.getDate() + dayOfYear);
        
        // Generate time based on store type
        const transactionTime = generateTransactionTime(transactionDate, store.store_type);
        
        // Calculate quantity based on product type and store type
        let quantity;
        if (store.store_type === 'sari-sari') {
          // Smaller quantities for sari-sari stores
          quantity = Math.floor(Math.random() * 3) + 1;
        } else if (product.category === 'Beverages' || product.category === 'Snacks') {
          quantity = Math.floor(Math.random() * 5) + 1;
        } else {
          quantity = Math.floor(Math.random() * 3) + 1;
        }
        
        // Apply seasonal factor
        const month = transactionTime.getMonth() + 1;
        const seasonalFactor = seasonalFactors[month] || 1.0;
        quantity = Math.max(1, Math.round(quantity * seasonalFactor));
        
        // Calculate total amount
        const baseAmount = product.unit_price * quantity;
        const discount = Math.random() < 0.1 ? Math.random() * 0.1 : 0; // 10% chance of up to 10% discount
        const totalAmount = Number((baseAmount * (1 - discount)).toFixed(2));
        
        // Select payment method
        let paymentMethod;
        if (recordsGenerated < 500) {
          const uncoveredPayments = paymentMethods.map(p => p.method).filter(m => !paymentMethodsCovered.has(m));
          paymentMethod = uncoveredPayments.length > 0 ? uncoveredPayments[0] : getRandomPaymentMethod();
        } else {
          paymentMethod = getRandomPaymentMethod();
        }
        
        if (recordsGenerated < 500) {
          paymentMethodsCovered.add(paymentMethod);
        }
        
        transactions.push({
          datetime: transactionTime.toISOString(),
          geography_id: store.id,
          organization_id: product.id,
          quantity: quantity,
          unit_price: product.unit_price,
          total_amount: totalAmount,
          payment_method: paymentMethod
        });
      }
      
      // Insert batch
      const { error: insertError } = await supabase
        .from('transactions')
        .insert(transactions);
      
      if (insertError) throw insertError;
      
      recordsGenerated += currentBatchSize;
      const progress = ((recordsGenerated / totalRecords) * 100).toFixed(1);
      console.log(`✓ Generated ${recordsGenerated}/${totalRecords} records (${progress}%)`);
    }
    
    // Verify coverage
    console.log('\n📊 Coverage Report:');
    console.log(`✓ Regions covered: ${regionsCovered.size}/${Object.keys(storesByRegion).length}`);
    console.log(`✓ Brands covered: ${brandsCovered.size}/${Object.keys(productsByBrand).length}`);
    console.log(`✓ Categories covered: ${categoriesCovered.size}/${Object.keys(productsByCategory).length}`);
    console.log(`✓ Store types covered: ${storeTypesCovered.size}/${Object.keys(storesByType).length}`);
    console.log(`✓ Payment methods covered: ${paymentMethodsCovered.size}/${paymentMethods.length}`);
    
    // Get final stats
    const { count: finalCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n✅ Generation complete! Total transactions in database: ${finalCount}`);
    
    // Show sample of payment method distribution
    const { data: paymentDist } = await supabase
      .from('transactions')
      .select('payment_method')
      .limit(1000);
    
    if (paymentDist) {
      const pmCounts = {};
      paymentDist.forEach(t => {
        pmCounts[t.payment_method] = (pmCounts[t.payment_method] || 0) + 1;
      });
      
      console.log('\n💳 Payment Method Distribution (sample):');
      Object.entries(pmCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([method, count]) => {
          const pct = ((count / paymentDist.length) * 100).toFixed(1);
          console.log(`  ${method}: ${count} (${pct}%)`);
        });
    }
    
  } catch (error) {
    console.error('❌ Error generating records:', error);
  }
}

// Run the generation
generateComplete3000Records();