import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLegacyData() {
  console.log('🔍 Checking legacy tables...\n');

  try {
    // Check geography (legacy stores table)
    const { count: geographyCount } = await supabase
      .from('geography')
      .select('*', { count: 'exact', head: true });
    console.log(`📍 Geography (stores): ${geographyCount || 0}`);

    // Check organization (legacy products table)
    const { count: organizationCount } = await supabase
      .from('organization')
      .select('*', { count: 'exact', head: true });
    console.log(`📦 Organization (products): ${organizationCount || 0}`);

    // Get sample geography data
    if (geographyCount > 0) {
      const { data: geoSample } = await supabase
        .from('geography')
        .select('region, city_municipality, store_name')
        .limit(5);
      console.log('\n📍 Sample stores:');
      geoSample?.forEach(g => console.log(`  - ${g.store_name} (${g.city_municipality}, ${g.region})`));
    }

    // Get sample organization data
    if (organizationCount > 0) {
      const { data: orgSample } = await supabase
        .from('organization')
        .select('sku_name, brand, category')
        .limit(5);
      console.log('\n📦 Sample products:');
      orgSample?.forEach(o => console.log(`  - ${o.sku_name} (${o.brand}, ${o.category})`));
    }

    // Get transaction date range
    const { data: transactionSample } = await supabase
      .from('transactions')
      .select('transaction_time, geography_id, organization_id')
      .order('transaction_time', { ascending: false })
      .limit(5);
    
    console.log('\n📊 Recent transactions:');
    transactionSample?.forEach(t => {
      console.log(`  - ${new Date(t.transaction_time).toLocaleString()} (Store: ${t.geography_id}, Product: ${t.organization_id})`);
    });

    // Check regions in geography
    const { data: regions } = await supabase
      .from('geography')
      .select('region')
      .order('region');
    
    const uniqueRegions = [...new Set(regions?.map(r => r.region) || [])];
    console.log(`\n🌏 Regions (${uniqueRegions.length}): ${uniqueRegions.slice(0, 10).join(', ')}${uniqueRegions.length > 10 ? '...' : ''}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

checkLegacyData();