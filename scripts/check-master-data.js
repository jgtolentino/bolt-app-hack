import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMasterData() {
  console.log('🔍 CHECKING MASTER DATA TABLES\n');
  
  try {
    // Check Geography (Stores) Master Data
    console.log('📍 GEOGRAPHY (STORES) MASTER DATA:');
    const { data: geography, count: geoCount } = await supabase
      .from('geography')
      .select('*', { count: 'exact' })
      .order('region');
    
    console.log(`Total stores: ${geoCount}`);
    
    // Group by region
    const storesByRegion = {};
    geography.forEach(store => {
      if (!storesByRegion[store.region]) {
        storesByRegion[store.region] = 0;
      }
      storesByRegion[store.region]++;
    });
    
    console.log('\nStores by region:');
    Object.entries(storesByRegion)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([region, count]) => {
        console.log(`  ${region}: ${count} stores`);
      });
    
    // Check Organization (Products) Master Data
    console.log('\n\n📦 ORGANIZATION (PRODUCTS) MASTER DATA:');
    const { data: products, count: prodCount } = await supabase
      .from('organization')
      .select('*', { count: 'exact' })
      .order('category, brand');
    
    console.log(`Total products: ${prodCount}`);
    
    // Group by category
    const productsByCategory = {};
    products.forEach(product => {
      if (!productsByCategory[product.category]) {
        productsByCategory[product.category] = [];
      }
      productsByCategory[product.category].push(product);
    });
    
    console.log('\nProducts by category:');
    Object.entries(productsByCategory).forEach(([category, prods]) => {
      console.log(`\n${category} (${prods.length} products):`);
      const brands = [...new Set(prods.map(p => p.brand))];
      console.log(`  Brands: ${brands.join(', ')}`);
    });
    
    // Check for store_size column
    console.log('\n\n🏪 STORE SIZE DIMENSION:');
    if (geography[0].store_size !== undefined) {
      console.log('✅ Store size column exists');
      
      const sizeDistribution = {};
      geography.forEach(store => {
        const size = store.store_size || 'Not Set';
        if (!sizeDistribution[size]) {
          sizeDistribution[size] = 0;
        }
        sizeDistribution[size]++;
      });
      
      console.log('\nStore size distribution:');
      Object.entries(sizeDistribution).forEach(([size, count]) => {
        console.log(`  ${size}: ${count} stores`);
      });
    } else {
      console.log('❌ Store size column does not exist');
      console.log('Run migration: 20250629123000_add_store_size_dimension.sql');
    }
    
    // Check other master tables
    console.log('\n\n📊 OTHER MASTER TABLES:');
    const tables = ['customer_segments', 'ai_insights', 'substitution_patterns'];
    
    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      console.log(`${table}: ${count || 0} records`);
    }
    
    console.log('\n✅ Master data check complete!');
    
  } catch (error) {
    console.error('Error checking master data:', error);
  }
}

checkMasterData();