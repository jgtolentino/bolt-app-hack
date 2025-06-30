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
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkViewsAndFunctions() {
  console.log('🔍 Checking views and functions...\n');

  // Check views
  const views = [
    'v_geographic_performance',
    'v_product_performance',
    'v_seasonal_trends',
    'v_clean_transactions'
  ];

  console.log('📊 Checking views:');
  for (const view of views) {
    try {
      const { count, error } = await supabase
        .from(view)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${view}: ${error.message}`);
      } else {
        console.log(`✅ ${view}: ${count || 0} records`);
      }
    } catch (err) {
      console.log(`❌ ${view}: ${err.message}`);
    }
  }

  // Check RPC functions
  console.log('\n🔧 Checking RPC functions:');
  const functions = [
    { name: 'get_seasonal_trends', params: { year_filter: 2024 } },
    { name: 'get_geographic_performance', params: {} },
    { name: 'get_product_performance', params: {} }
  ];

  for (const func of functions) {
    try {
      const { data, error } = await supabase.rpc(func.name, func.params);
      
      if (error) {
        console.log(`❌ ${func.name}: ${error.message}`);
      } else {
        console.log(`✅ ${func.name}: ${data?.length || 0} records`);
      }
    } catch (err) {
      console.log(`❌ ${func.name}: ${err.message}`);
    }
  }

  // Check tables
  console.log('\n📋 Checking base tables:');
  const tables = [
    'transactions',
    'organizations',
    'geography',
    'products',
    'product_categories'
  ];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count || 0} records`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  console.log('\n✨ Check complete!');
}

checkViewsAndFunctions().catch(console.error);