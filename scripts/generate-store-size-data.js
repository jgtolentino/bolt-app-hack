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

async function generateStoreSizeData() {
  console.log('=== STORE SIZE DIMENSION DATA ===\n');

  try {
    // First, let's check if the migration has been applied
    const { data: checkColumn, error: checkError } = await supabase
      .from('geography')
      .select('store_size')
      .limit(1);
    
    if (checkError && checkError.message.includes('column "store_size" does not exist')) {
      console.log('❗ Store size column does not exist yet.');
      console.log('Please run the migration first: 20250629123000_add_store_size_dimension.sql\n');
      return;
    }
    
    // Get all stores with their new size dimension
    const { data: stores, error } = await supabase
      .from('geography')
      .select('*')
      .order('store_type, store_size');
    
    if (error) throw error;
    
    // Group by store type and size
    const storesByTypeAndSize = {};
    stores.forEach(store => {
      const key = `${store.store_type}|${store.store_size || 'Not Set'}`;
      if (!storesByTypeAndSize[key]) {
        storesByTypeAndSize[key] = {
          type: store.store_type,
          size: store.store_size || 'Not Set',
          count: 0,
          stores: []
        };
      }
      storesByTypeAndSize[key].count++;
      storesByTypeAndSize[key].stores.push({
        name: store.store_name,
        region: store.region,
        city: store.city_municipality,
        population: store.population
      });
    });
    
    // Display the distribution
    console.log('📊 STORE DISTRIBUTION BY TYPE AND SIZE:\n');
    
    const storeTypes = ['sari-sari', 'grocery', 'mini-mart', 'convenience'];
    const sizes = ['Micro', 'Small', 'Medium', 'Large', 'Extra Large'];
    
    storeTypes.forEach(type => {
      console.log(`\n🏪 ${type.toUpperCase()} STORES:`);
      let typeTotal = 0;
      
      sizes.forEach(size => {
        const key = `${type}|${size}`;
        if (storesByTypeAndSize[key]) {
          const data = storesByTypeAndSize[key];
          console.log(`  ${size}: ${data.count} stores`);
          typeTotal += data.count;
          
          // Show a few examples
          if (data.count <= 3) {
            data.stores.forEach(s => {
              console.log(`    - ${s.name} (${s.city}, Pop: ${s.population.toLocaleString()})`);
            });
          } else {
            data.stores.slice(0, 2).forEach(s => {
              console.log(`    - ${s.name} (${s.city}, Pop: ${s.population.toLocaleString()})`);
            });
            console.log(`    ... and ${data.count - 2} more`);
          }
        }
      });
      
      console.log(`  Total ${type} stores: ${typeTotal}`);
    });
    
    // Show the new dimension in action
    console.log('\n\n📈 NEW STORE SIZE DIMENSION EXAMPLES:\n');
    
    console.log('Sari-Sari Stores by Size:');
    console.log('- Micro: Serving communities < 10,000 people');
    console.log('- Small: Serving 10,000 - 30,000 people');  
    console.log('- Medium: Serving 30,000 - 60,000 people');
    console.log('- Large: Serving 60,000 - 100,000 people');
    console.log('- Extra Large: Serving > 100,000 people');
    
    console.log('\nOther Store Types:');
    console.log('- Grocery: Large format stores');
    console.log('- Mini-mart: Medium format stores');
    console.log('- Convenience: Small format stores');
    
    // Generate some sample queries
    console.log('\n\n🔍 SAMPLE QUERIES WITH NEW DIMENSION:\n');
    
    // Query 1: Sari-sari stores by size in NCR
    const { data: ncrSariSari, error: ncrError } = await supabase
      .from('geography')
      .select('store_name, store_size, barangay, population')
      .eq('region', 'NCR')
      .eq('store_type', 'sari-sari')
      .order('population', { ascending: false });
    
    if (!ncrError && ncrSariSari) {
      console.log('NCR Sari-Sari Stores by Size:');
      ncrSariSari.forEach(s => {
        console.log(`  ${s.store_name} (${s.store_size}): ${s.barangay}, Pop: ${s.population.toLocaleString()}`);
      });
    }
    
    // Query 2: Store count by size across all types
    console.log('\n\nStore Count by Size (All Types):');
    const sizeCounts = {};
    stores.forEach(store => {
      const size = store.store_size || 'Not Set';
      sizeCounts[size] = (sizeCounts[size] || 0) + 1;
    });
    
    sizes.forEach(size => {
      if (sizeCounts[size]) {
        console.log(`  ${size}: ${sizeCounts[size]} stores`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

generateStoreSizeData();