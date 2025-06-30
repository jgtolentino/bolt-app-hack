import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDataCounts() {
  console.log('🔍 Checking actual data in Supabase...\n');

  try {
    // Check transactions
    const { count: transactionCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    console.log(`📊 Transactions: ${transactionCount || 0}`);

    // Check stores
    const { count: storeCount } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true });
    console.log(`🏪 Stores: ${storeCount || 0}`);

    // Check products
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    console.log(`📦 Products: ${productCount || 0}`);

    // Check transaction_items
    const { count: itemCount } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true });
    console.log(`🛒 Transaction Items: ${itemCount || 0}`);

    // Check clients
    const { count: clientCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });
    console.log(`🏢 Clients: ${clientCount || 0}`);

    // Check brands
    const { count: brandCount } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true });
    console.log(`🏷️ Brands: ${brandCount || 0}`);

    // Get date range of transactions
    if (transactionCount > 0) {
      const { data: dateRange } = await supabase
        .from('transactions')
        .select('transaction_time')
        .order('transaction_time', { ascending: true })
        .limit(1);
      
      const { data: latestDate } = await supabase
        .from('transactions')
        .select('transaction_time')
        .order('transaction_time', { ascending: false })
        .limit(1);

      if (dateRange && latestDate) {
        console.log(`\n📅 Date Range: ${new Date(dateRange[0].transaction_time).toLocaleDateString()} to ${new Date(latestDate[0].transaction_time).toLocaleDateString()}`);
      }
    }

    // Check regions
    const { data: regions } = await supabase
      .from('stores')
      .select('region')
      .order('region');
    
    const uniqueRegions = [...new Set(regions?.map(r => r.region) || [])];
    console.log(`\n🌏 Regions (${uniqueRegions.length}): ${uniqueRegions.join(', ')}`);

  } catch (error) {
    console.error('Error checking data:', error);
  }
}

checkDataCounts();