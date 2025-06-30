import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeSariSariStores() {
  console.log('=== SARI-SARI STORE ANALYSIS ===\n');

  try {
    // Get all sari-sari stores with their characteristics
    const { data: sariStores, error } = await supabase
      .from('geography')
      .select('*')
      .eq('store_type', 'sari-sari')
      .order('store_name');
    
    if (error) throw error;
    
    console.log(`Total sari-sari stores: ${sariStores.length}\n`);
    
    // Analyze by population served
    console.log('📊 POPULATION ANALYSIS:');
    const popRanges = {
      'Micro (< 10,000)': 0,
      'Small (10,000 - 30,000)': 0,
      'Medium (30,000 - 60,000)': 0,
      'Large (60,000 - 100,000)': 0,
      'Extra Large (> 100,000)': 0
    };
    
    sariStores.forEach(store => {
      const pop = store.population;
      if (pop < 10000) popRanges['Micro (< 10,000)']++;
      else if (pop < 30000) popRanges['Small (10,000 - 30,000)']++;
      else if (pop < 60000) popRanges['Medium (30,000 - 60,000)']++;
      else if (pop < 100000) popRanges['Large (60,000 - 100,000)']++;
      else popRanges['Extra Large (> 100,000)']++;
    });
    
    Object.entries(popRanges).forEach(([range, count]) => {
      console.log(`  ${range}: ${count} stores`);
    });
    
    // Analyze by area coverage
    console.log('\n📏 AREA COVERAGE ANALYSIS:');
    const areaRanges = {
      'Tiny (< 20 sq km)': 0,
      'Small (20 - 50 sq km)': 0,
      'Medium (50 - 100 sq km)': 0,
      'Large (100 - 200 sq km)': 0,
      'Huge (> 200 sq km)': 0
    };
    
    sariStores.forEach(store => {
      const area = store.area_sqkm;
      if (area < 20) areaRanges['Tiny (< 20 sq km)']++;
      else if (area < 50) areaRanges['Small (20 - 50 sq km)']++;
      else if (area < 100) areaRanges['Medium (50 - 100 sq km)']++;
      else if (area < 200) areaRanges['Large (100 - 200 sq km)']++;
      else areaRanges['Huge (> 200 sq km)']++;
    });
    
    Object.entries(areaRanges).forEach(([range, count]) => {
      console.log(`  ${range}: ${count} stores`);
    });
    
    // Get sales data for each sari-sari store
    console.log('\n💰 SALES VOLUME ANALYSIS:');
    const storesSales = {};
    
    for (const store of sariStores) {
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('total_amount')
        .eq('geography_id', store.id);
      
      if (!transError && transactions) {
        const totalSales = transactions.reduce((sum, t) => sum + t.total_amount, 0);
        const avgTransaction = transactions.length > 0 ? totalSales / transactions.length : 0;
        storesSales[store.store_name] = {
          totalSales,
          transactionCount: transactions.length,
          avgTransaction,
          population: store.population,
          area: store.area_sqkm,
          region: store.region,
          city: store.city_municipality
        };
      }
    }
    
    // Categorize by sales volume
    const salesRanges = {
      'Micro (< ₱50,000)': [],
      'Small (₱50,000 - ₱100,000)': [],
      'Medium (₱100,000 - ₱200,000)': [],
      'Large (₱200,000 - ₱500,000)': [],
      'Extra Large (> ₱500,000)': []
    };
    
    Object.entries(storesSales).forEach(([storeName, data]) => {
      const sales = data.totalSales;
      if (sales < 50000) salesRanges['Micro (< ₱50,000)'].push({ storeName, ...data });
      else if (sales < 100000) salesRanges['Small (₱50,000 - ₱100,000)'].push({ storeName, ...data });
      else if (sales < 200000) salesRanges['Medium (₱100,000 - ₱200,000)'].push({ storeName, ...data });
      else if (sales < 500000) salesRanges['Large (₱200,000 - ₱500,000)'].push({ storeName, ...data });
      else salesRanges['Extra Large (> ₱500,000)'].push({ storeName, ...data });
    });
    
    Object.entries(salesRanges).forEach(([range, stores]) => {
      console.log(`\n${range}: ${stores.length} stores`);
      if (stores.length > 0 && stores.length <= 3) {
        stores.forEach(s => {
          console.log(`  - ${s.storeName} (${s.region}): ₱${s.totalSales.toFixed(2)}`);
        });
      }
    });
    
    // Create a suggested size classification
    console.log('\n🏪 SUGGESTED SARI-SARI SIZE CLASSIFICATION:');
    console.log('Based on population served and sales volume:\n');
    
    const sizeClassification = {};
    
    Object.entries(storesSales).forEach(([storeName, data]) => {
      let size = 'Micro';
      
      // Classify based on both population and sales
      if (data.population > 100000 || data.totalSales > 500000) {
        size = 'Extra Large';
      } else if (data.population > 60000 || data.totalSales > 200000) {
        size = 'Large';
      } else if (data.population > 30000 || data.totalSales > 100000) {
        size = 'Medium';
      } else if (data.population > 10000 || data.totalSales > 50000) {
        size = 'Small';
      }
      
      if (!sizeClassification[size]) sizeClassification[size] = [];
      sizeClassification[size].push({
        name: storeName,
        region: data.region,
        city: data.city,
        population: data.population,
        sales: data.totalSales
      });
    });
    
    Object.entries(sizeClassification).forEach(([size, stores]) => {
      console.log(`${size} Sari-Sari Stores (${stores.length}):`);
      stores.slice(0, 3).forEach(s => {
        console.log(`  - ${s.name} (${s.city}, Pop: ${s.population.toLocaleString()}, Sales: ₱${s.sales.toFixed(2)})`);
      });
      if (stores.length > 3) console.log(`  ... and ${stores.length - 3} more`);
    });
    
    // Show distribution across regions
    console.log('\n🗺️ REGIONAL DISTRIBUTION:');
    const regionalDist = {};
    sariStores.forEach(store => {
      if (!regionalDist[store.region]) regionalDist[store.region] = 0;
      regionalDist[store.region]++;
    });
    
    Object.entries(regionalDist)
      .sort((a, b) => b[1] - a[1])
      .forEach(([region, count]) => {
        console.log(`  ${region}: ${count} sari-sari stores`);
      });
    
  } catch (error) {
    console.error('Error analyzing sari-sari stores:', error);
  }
}

analyzeSariSariStores();