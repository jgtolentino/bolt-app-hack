import { supabase, fetchAllRecords } from '../lib/supabase';

export const runQuickValidation = async () => {
  console.log('🔍 SUQI ANALYTICS DATABASE VALIDATION');
  console.log('=====================================');
  
  try {
    // 1. Basic Counts
    console.log('\n📊 BASIC DATA COUNTS:');
    const [geoCount, orgCount, transCount] = await Promise.all([
      supabase.from('geography').select('*', { count: 'exact', head: true }),
      supabase.from('organization').select('*', { count: 'exact', head: true }),
      supabase.from('transactions').select('*', { count: 'exact', head: true })
    ]);
    
    console.log(`Geography (Stores): ${geoCount.count || 0}`);
    console.log(`Organization (Products): ${orgCount.count || 0}`);
    console.log(`Transactions: ${transCount.count || 0}`);

    // 2. Recent Transactions Sample
    console.log('\n💰 RECENT TRANSACTIONS (Last 5):');
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select(`
        total_amount,
        payment_method,
        datetime,
        geography:geography_id(store_name, region),
        organization:organization_id(brand, sku)
      `)
      .order('datetime', { ascending: false })
      .limit(5);

    recentTransactions?.forEach((t, i) => {
      console.log(`${i + 1}. ₱${t.total_amount} - ${t.payment_method} - ${(t as any).geography?.store_name || 'Unknown'}`);
    });

    // 3. Sales Summary
    console.log('\n📈 SALES SUMMARY (Last 30 days):');
    
    // Using pagination to get all transactions from the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const query = supabase
      .from('transactions')
      .select('total_amount')
      .gte('datetime', thirtyDaysAgo)
      .order('id', { ascending: true });
    
    const salesData = await fetchAllRecords(query);

    if (salesData && salesData.length > 0) {
      const totalSales = salesData.reduce((sum, t) => sum + t.total_amount, 0);
      const avgTransaction = totalSales / salesData.length;
      console.log(`Total Sales: ₱${totalSales.toLocaleString()}`);
      console.log(`Transaction Count: ${salesData.length.toLocaleString()}`);
      console.log(`Average Transaction: ₱${avgTransaction.toFixed(2)}`);
    } else {
      console.log('No transaction data found');
    }

    // 4. Regional Performance
    console.log('\n🌏 TOP REGIONS:');
    const { data: regionData } = await supabase
      .from('v_geographic_performance')
      .select('region, total_sales, total_transactions')
      .order('total_sales', { ascending: false })
      .limit(5);

    regionData?.forEach((region, i) => {
      console.log(`${i + 1}. ${region.region}: ₱${region.total_sales?.toLocaleString() || 0} (${region.total_transactions || 0} transactions)`);
    });

    // 5. Payment Methods
    console.log('\n💳 PAYMENT METHODS:');
    const { data: paymentData } = await supabase
      .from('v_payment_method_analysis')
      .select('payment_method, transaction_count, percentage_of_transactions')
      .order('transaction_count', { ascending: false });

    paymentData?.forEach(method => {
      console.log(`${method.payment_method}: ${method.percentage_of_transactions}% (${method.transaction_count} transactions)`);
    });

    // 6. Top Products
    console.log('\n🏆 TOP PRODUCTS:');
    const { data: productData } = await supabase
      .from('v_product_performance')
      .select('sku, brand, total_sales, transaction_count')
      .order('total_sales', { ascending: false })
      .limit(5);

    productData?.forEach((product, i) => {
      console.log(`${i + 1}. ${product.sku} (${product.brand}): ₱${product.total_sales?.toLocaleString() || 0}`);
    });

    // 7. Check if we're hitting the 1000 record limit
    console.log('\n🔍 CHECKING FOR 1000 RECORD LIMIT:');
    const { data: limitCheck, count } = await supabase
      .from('transactions')
      .select('id', { count: 'exact' })
      .limit(1001);
    
    if (count && count > 1000) {
      console.log(`⚠️ Your database has ${count} transactions, but Supabase free tier limits queries to 1000 records.`);
      console.log('✅ The fetchAllRecords utility has been added to handle pagination automatically.');
    } else if (count) {
      console.log(`✅ Your database has ${count} transactions, which is within the Supabase query limit.`);
    }

    console.log('\n✅ Validation complete! Database appears to be working correctly.');
    
    return {
      success: true,
      summary: {
        stores: geoCount.count || 0,
        products: orgCount.count || 0,
        transactions: transCount.count || 0,
        totalSales: salesData?.reduce((sum, t) => sum + t.total_amount, 0) || 0
      }
    };

  } catch (error) {
    console.error('❌ Validation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Auto-run validation when this module is imported
if (typeof window !== 'undefined') {
  // Only run in browser environment
  setTimeout(() => {
    runQuickValidation();
  }, 2000); // Wait 2 seconds for app to initialize
}