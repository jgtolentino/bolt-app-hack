import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkRegionalCoverage() {
  console.log('🔍 Checking Regional Coverage in Scout Dashboard\n');

  try {
    // 1. Check current distribution
    console.log('📊 Current Regional Distribution:');
    console.log('================================\n');

    const { data: distribution, error: distError } = await supabase
      .from('v_regional_distribution')
      .select('*')
      .order('region');

    if (distError) {
      // If view doesn't exist, do manual check
      const { data: manualDist } = await supabase.rpc('text', {
        query: `
          SELECT 
            s.region,
            COUNT(DISTINCT s.id) as store_count,
            COUNT(DISTINCT t.id) as transaction_count,
            COALESCE(SUM(t.total_amount), 0) as total_sales
          FROM stores s
          LEFT JOIN transactions t ON s.id = t.store_id
          GROUP BY s.region
          ORDER BY s.region
        `
      });

      if (manualDist) {
        displayDistribution(manualDist);
      }
    } else if (distribution) {
      displayDistribution(distribution);
    }

    // 2. Check first 1000 transactions
    console.log('\n\n📈 First 1000 Transactions by Region:');
    console.log('=====================================\n');

    const { data: first1000 } = await supabase
      .from('transactions')
      .select(`
        id,
        stores!inner(region)
      `)
      .order('created_at', { ascending: true })
      .limit(1000);

    if (first1000) {
      const regionCounts = {};
      first1000.forEach(t => {
        const region = t.stores.region;
        regionCounts[region] = (regionCounts[region] || 0) + 1;
      });

      const sortedRegions = Object.entries(regionCounts)
        .sort(([a], [b]) => a.localeCompare(b));

      sortedRegions.forEach(([region, count]) => {
        const percentage = ((count / 1000) * 100).toFixed(1);
        const bar = '█'.repeat(Math.floor(count / 20));
        console.log(`${region.padEnd(15)} ${String(count).padStart(4)} (${percentage}%) ${bar}`);
      });

      // Check missing regions
      const allRegions = [
        'NCR', 'Region I', 'Region II', 'Region III', 'Region IV-A', 'Region IV-B',
        'Region V', 'Region VI', 'Region VII', 'Region VIII', 'Region IX', 'Region X',
        'Region XI', 'Region XII', 'Region XIII', 'CAR', 'CARAGA', 'BARMM'
      ];

      const missingRegions = allRegions.filter(r => !regionCounts[r]);
      
      if (missingRegions.length > 0) {
        console.log('\n⚠️  Missing Regions in First 1000:');
        missingRegions.forEach(r => console.log(`   - ${r}`));
      } else {
        console.log('\n✅ All regions represented in first 1000 transactions!');
      }
    }

    // 3. Check if we need to ensure coverage
    console.log('\n\n🔧 Checking Store Coverage:');
    console.log('==========================\n');

    const { data: storeCoverage } = await supabase.rpc('ensure_regional_coverage');
    
    if (storeCoverage) {
      console.log('Region          | Stores');
      console.log('----------------|--------');
      storeCoverage.forEach(({ region, stores_created }) => {
        console.log(`${region.padEnd(15)} | ${stores_created}`);
      });
    }

    // 4. Provide recommendations
    console.log('\n\n💡 Recommendations:');
    console.log('==================\n');

    console.log('1. To create a representative sample:');
    console.log('   node scripts/create-representative-sample.js\n');

    console.log('2. To reorder existing transactions:');
    console.log('   Run in Supabase SQL Editor:');
    console.log('   SELECT reorder_for_regional_representation();\n');

    console.log('3. To query with regional representation:');
    console.log('   SELECT * FROM get_representative_transactions(1000);\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

function displayDistribution(data) {
  if (!data || data.length === 0) {
    console.log('No data found');
    return;
  }

  // Calculate totals
  const totals = data.reduce((acc, row) => ({
    stores: acc.stores + (row.store_count || 0),
    transactions: acc.transactions + (row.transaction_count || 0),
    sales: acc.sales + parseFloat(row.total_sales || 0)
  }), { stores: 0, transactions: 0, sales: 0 });

  // Display header
  console.log('Region          | Stores | Transactions |    Sales    | % Trans | % Sales');
  console.log('----------------|--------|--------------|-------------|---------|--------');

  // Display each region
  data.forEach(row => {
    const transPercent = totals.transactions > 0 
      ? ((row.transaction_count / totals.transactions) * 100).toFixed(1)
      : '0.0';
    const salesPercent = totals.sales > 0
      ? ((parseFloat(row.total_sales) / totals.sales) * 100).toFixed(1)
      : '0.0';

    console.log(
      `${(row.region || 'Unknown').padEnd(15)} | ` +
      `${String(row.store_count || 0).padStart(6)} | ` +
      `${String(row.transaction_count || 0).padStart(12)} | ` +
      `${formatCurrency(row.total_sales || 0).padStart(11)} | ` +
      `${transPercent.padStart(6)}% | ` +
      `${salesPercent.padStart(6)}%`
    );
  });

  // Display totals
  console.log('----------------|--------|--------------|-------------|---------|--------');
  console.log(
    `${'TOTAL'.padEnd(15)} | ` +
    `${String(totals.stores).padStart(6)} | ` +
    `${String(totals.transactions).padStart(12)} | ` +
    `${formatCurrency(totals.sales).padStart(11)} | ` +
    `${' 100.0'.padStart(6)}% | ` +
    `${' 100.0'.padStart(6)}%`
  );
}

function formatCurrency(amount) {
  return '₱' + parseFloat(amount).toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

// Run the check
checkRegionalCoverage();